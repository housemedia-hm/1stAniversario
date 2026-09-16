document.body.classList.add("is-loading");

const loader = document.querySelector(".loader");
const loaderCount = document.querySelector(".loader__count");
const hero = document.querySelector(".hero");
const story = document.querySelector(".story");
const visuals = [...document.querySelectorAll(".visual")];
const passages = [...document.querySelectorAll(".passage")];
const progressBar = document.querySelector(".reading-progress span");
const finale = document.querySelector(".finale");
const finaleGuide = document.querySelector(".finale__guide");
const finaleCopy = document.querySelector(".finale__copy");
const heart = document.querySelector(".heart-mark");
const heartPath = heart?.querySelector("path");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
const easeOutCubic = (value) => 1 - Math.pow(1 - value, 3);

const passageWords = passages.map((passage) => {
  const paragraph = passage.querySelector(".letter");
  const words = paragraph.textContent.trim().split(/\s+/);
  paragraph.innerHTML = words.map((word) => `<span class="word">${word}</span>`).join(" ");
  return [...paragraph.querySelectorAll(".word")];
});

let activePassage = -1;
let ticking = false;

const setActivePassage = (index) => {
  if (index === activePassage || index < 0) return;
  activePassage = index;

  const passage = passages[index];
  const imageIndex = Number(passage.dataset.image || 0);
  const copyOnRight = passage.querySelector(".passage__copy--right");
  story.dataset.side = copyOnRight ? "right" : "left";

  visuals.forEach((visual, visualIndex) => {
    visual.classList.toggle("visual--active", visualIndex === imageIndex);
  });
};

const updateNarrative = () => {
  ticking = false;
  const viewportHeight = window.innerHeight;
  const maxScroll = document.documentElement.scrollHeight - viewportHeight;
  const pageProgress = maxScroll > 0 ? window.scrollY / maxScroll : 0;
  progressBar.style.transform = `scaleX(${pageProgress})`;

  if (hero) {
    const heroProgress = clamp(window.scrollY / Math.max(hero.offsetHeight, 1));
    hero.style.setProperty("--hero-ink-y", `${heroProgress * 5.5}rem`);
  }

  let nearestIndex = -1;
  let nearestDistance = Infinity;

  passages.forEach((passage, index) => {
    const rect = passage.getBoundingClientRect();
    const center = rect.top + rect.height / 2;
    const distance = Math.abs(center - viewportHeight * .52);

    if (distance < nearestDistance && rect.bottom > 0 && rect.top < viewportHeight) {
      nearestDistance = distance;
      nearestIndex = index;
    }

    const enter = clamp((viewportHeight * .9 - rect.top) / (viewportHeight * .62));
    const leave = clamp((rect.bottom - viewportHeight * .08) / (viewportHeight * .52));
    const focus = Math.min(enter, leave);
    const easedFocus = easeOutCubic(focus);
    const copy = passage.querySelector(".passage__copy");

    copy.style.setProperty("--copy-opacity", String(.12 + easedFocus * .88));
    copy.style.setProperty("--copy-y", `${(1 - easedFocus) * 2.4}rem`);
    copy.style.setProperty("--copy-scale", String(.972 + easedFocus * .028));
    copy.style.setProperty("--copy-blur", `${(1 - easedFocus) * 5}px`);

    const words = passageWords[index];
    words.forEach((word, wordIndex) => {
      const wordStart = (wordIndex / Math.max(words.length - 1, 1)) * .54;
      const reveal = clamp((enter - wordStart) / .26);
      const easedReveal = easeOutCubic(reveal);
      word.style.opacity = String(.13 + easedReveal * .87);
      word.style.transform = `translate3d(0, ${(1 - easedReveal) * .48}em, 0)`;
      word.style.filter = `blur(${(1 - easedReveal) * 2.6}px)`;
    });
  });

  setActivePassage(nearestIndex);

  if (activePassage >= 0) {
    const activeRect = passages[activePassage].getBoundingClientRect();
    const activeImageIndex = Number(passages[activePassage].dataset.image || 0);
    const local = clamp((viewportHeight - activeRect.top) / (activeRect.height + viewportHeight));
    const activeVisual = visuals[activeImageIndex];
    activeVisual?.style.setProperty("--image-scale", String(1.1 - local * .055));
    activeVisual?.style.setProperty("--image-y", `${(local - .5) * 2.6}%`);
  }

  if (finale && heartPath && heart) {
    const rect = finale.getBoundingClientRect();
    const scrollableDistance = Math.max(finale.offsetHeight - viewportHeight, 1);
    const local = clamp(-rect.top / scrollableDistance);

    heartPath.style.strokeDashoffset = String(1 - local);
    heart.classList.toggle("is-signed", local > .9);

    if (finaleGuide) finaleGuide.style.opacity = String(clamp(1 - local * 2.1));
    if (finaleCopy) {
      const finalReveal = easeOutCubic(clamp((local - .8) / .2));
      finaleCopy.style.setProperty("--final-opacity", String(finalReveal));
      finaleCopy.style.setProperty("--final-y", `${(1 - finalReveal) * 2.2}rem`);
    }
  }
};

const requestUpdate = () => {
  if (ticking) return;
  ticking = true;
  window.requestAnimationFrame(updateNarrative);
};

window.addEventListener("scroll", requestUpdate, { passive: true });
window.addEventListener("resize", requestUpdate);

const finishLoading = () => {
  loader.classList.add("loader--done");
  document.body.classList.remove("is-loading");
  document.body.classList.add("is-ready");
  requestUpdate();
};

const animateLoader = (startTime) => {
  const duration = reducedMotion ? 180 : 2450;

  const frame = (time) => {
    const progress = clamp((time - startTime) / duration);
    const day = Math.round(1 + easeOutCubic(progress) * 364);
    if (loaderCount) loaderCount.textContent = String(day).padStart(3, "0");

    if (progress < 1) {
      window.requestAnimationFrame(frame);
    } else {
      window.setTimeout(finishLoading, reducedMotion ? 40 : 240);
    }
  };

  window.requestAnimationFrame(frame);
};

window.requestAnimationFrame((time) => animateLoader(time));
updateNarrative();
