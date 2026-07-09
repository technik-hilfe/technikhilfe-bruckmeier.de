const canvas = document.querySelector(".ambient-canvas");
const ctx = canvas.getContext("2d");
const cursorCanvas = document.querySelector(".cursor-pixel-canvas");
const cursorCtx = cursorCanvas.getContext("2d");
const enableCursorTrail = false;
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const mobileCalmQuery = window.matchMedia("(max-width: 900px), (hover: none), (pointer: coarse)");
const isMobileCalm = () => mobileCalmQuery.matches || window.innerWidth <= 900;
const canUseHoverMotion = window.matchMedia("(hover: hover) and (pointer: fine)").matches && window.innerWidth > 900;
document.body.classList.add("is-loading");
let width = 0;
let height = 0;
let pageHeight = 0;
let particles = [];
let cursorPixels = [];
let pointerX = window.innerWidth / 2;
let pointerY = window.innerHeight / 2;
let hasPointer = false;
const root = document.documentElement;
const showcase = document.querySelector(".scroll-showcase");
const showcaseSticky = document.querySelector(".showcase-sticky");

function updateMotionMode() {
  document.body.classList.toggle("is-mobile-calm", isMobileCalm());
}

updateMotionMode();

if ("scrollRestoration" in history) {
  history.scrollRestoration = "manual";
}

if (window.location.hash) {
  history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
}

window.scrollTo(0, 0);
requestAnimationFrame(() => window.scrollTo(0, 0));

function resizeCanvas() {
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  width = window.innerWidth;
  height = window.innerHeight;
  pageHeight = Math.max(
    height,
    document.documentElement.scrollHeight,
    document.body.scrollHeight
  );
  canvas.width = Math.floor(width * ratio);
  canvas.height = Math.floor(pageHeight * ratio);
  cursorCanvas.width = Math.floor(width * ratio);
  cursorCanvas.height = Math.floor(height * ratio);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${pageHeight}px`;
  cursorCanvas.style.width = `${width}px`;
  cursorCanvas.style.height = `${height}px`;
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  cursorCtx.setTransform(ratio, 0, 0, ratio, 0, 0);
  if (isMobileCalm()) {
    particles = [];
    ctx.clearRect(0, 0, width, pageHeight);
    cursorCtx.clearRect(0, 0, width, height);
    return;
  }
  particles = Array.from({ length: Math.min(160, Math.floor((width * pageHeight) / 64000)) }, () => ({
    x: Math.random() * width,
    y: Math.random() * pageHeight,
    r: Math.random() * 2.4 + 0.9,
    vx: (Math.random() - 0.5) * 0.5,
    vy: (Math.random() - 0.5) * 0.5,
    hue: Math.random() > 0.78 ? "wine" : "paper"
  }));
}

function drawNetwork() {
  if (isMobileCalm()) {
    ctx.clearRect(0, 0, width, pageHeight);
    return;
  }

  ctx.clearRect(0, 0, width, pageHeight);
  const pointerDocY = pointerY + window.scrollY;
  for (const p of particles) {
    const pointerDistance = Math.hypot(pointerX - p.x, pointerDocY - p.y);
    if (pointerDistance < 210) {
      p.vx += (p.x - pointerX) * 0.00085;
      p.vy += (p.y - pointerDocY) * 0.00085;
    }
    p.vx *= 0.994;
    p.vy *= 0.994;
    p.x += p.vx;
    p.y += p.vy;
    if (p.x < -20) p.x = width + 20;
    if (p.x > width + 20) p.x = -20;
    if (p.y < -20) p.y = pageHeight + 20;
    if (p.y > pageHeight + 20) p.y = -20;
  }

  for (let i = 0; i < particles.length; i += 1) {
    for (let j = i + 1; j < particles.length; j += 1) {
      const a = particles[i];
      const b = particles[j];
      const dx = a.x - b.x;
      const dy = a.y - b.y;
      const dist = Math.hypot(dx, dy);
      if (dist < 150) {
        ctx.strokeStyle = `rgba(139, 23, 54, ${0.2 * (1 - dist / 150)})`;
        ctx.lineWidth = 1.15;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
    }
  }

  for (const p of particles) {
    ctx.fillStyle = p.hue === "wine" ? "rgba(139, 23, 54, 0.62)" : "rgba(23, 16, 18, 0.32)";
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fill();
  }

  if (!reduceMotion) requestAnimationFrame(drawNetwork);
}

function pushCursorPixel(multiplier = 1) {
  if (!enableCursorTrail) return;
  if (cursorPixels.length >= 42) return;

  cursorPixels.push({
    x: pointerX + (Math.random() - 0.5) * 20,
    y: pointerY + (Math.random() - 0.5) * 20,
    vx: (Math.random() - 0.5) * 2.8 * multiplier,
    vy: (Math.random() - 0.5) * 2.8 * multiplier,
    size: Math.random() * 1.4 + 1.5,
    life: 0.58 + Math.random() * 0.42,
    spin: (Math.random() - 0.5) * 0.24,
    wine: Math.random() > 0.55
  });
}

function drawCursorTrail() {
  if (!enableCursorTrail) {
    cursorCtx.clearRect(0, 0, width, height);
    return;
  }

  cursorCtx.clearRect(0, 0, width, height);

  if (hasPointer) {
    while (cursorPixels.length < 22) pushCursorPixel(0.65);
  }

  for (let i = cursorPixels.length - 1; i >= 0; i -= 1) {
    const pixel = cursorPixels[i];
    const pull = Math.max(0, 1 - Math.hypot(pointerX - pixel.x, pointerY - pixel.y) / 74);
    pixel.vx += (pointerX - pixel.x) * 0.007 * pull + (Math.random() - 0.5) * 0.13;
    pixel.vy += (pointerY - pixel.y) * 0.007 * pull + (Math.random() - 0.5) * 0.13;
    pixel.vx *= 0.86;
    pixel.vy *= 0.86;
    pixel.x += pixel.vx;
    pixel.y += pixel.vy;
    pixel.life -= hasPointer ? 0.012 + Math.random() * 0.006 : 0.035;

    if (pixel.life <= 0 || Math.hypot(pointerX - pixel.x, pointerY - pixel.y) > 125) {
      cursorPixels.splice(i, 1);
      continue;
    }

    const alpha = Math.max(0, Math.min(1, pixel.life));
    cursorCtx.save();
    cursorCtx.globalAlpha = alpha * 0.52;
    cursorCtx.translate(pixel.x, pixel.y);
    cursorCtx.fillStyle = pixel.wine ? "rgba(139, 23, 54, 0.48)" : "rgba(24, 17, 20, 0.28)";
    cursorCtx.beginPath();
    cursorCtx.arc(0, 0, pixel.size, 0, Math.PI * 2);
    cursorCtx.fill();
    cursorCtx.restore();
  }

  if (!reduceMotion) requestAnimationFrame(drawCursorTrail);
}

resizeCanvas();
if (!isMobileCalm()) drawNetwork();
if (enableCursorTrail) drawCursorTrail();
window.addEventListener("resize", () => {
  updateMotionMode();
  resizeCanvas();
  if (!reduceMotion && !isMobileCalm() && particles.length) requestAnimationFrame(drawNetwork);
});

function updateScrollMotion() {
  const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
  const scrollProgress = window.scrollY / maxScroll;
  root.style.setProperty("--scroll", scrollProgress.toFixed(4));

  if (showcase && showcaseSticky) {
    const rect = showcase.getBoundingClientRect();
    const travel = Math.max(1, rect.height - window.innerHeight);
    const raw = (0 - rect.top) / travel;
    const progress = Math.min(1, Math.max(0, raw));
    showcaseSticky.style.setProperty("--showcase-progress", progress.toFixed(4));
  }
}

updateScrollMotion();
window.addEventListener("scroll", updateScrollMotion, { passive: true });
window.addEventListener("resize", updateScrollMotion);

window.addEventListener("load", () => {
  const percent = document.querySelector("[data-boot-percent]");
  const duration = reduceMotion ? 120 : 980;
  const start = performance.now();

  function tickBoot(now) {
    const progress = Math.min(1, (now - start) / duration);
    const eased = 1 - Math.pow(1 - progress, 3);
    if (percent) percent.textContent = String(Math.round(eased * 100));

    if (progress < 1) {
      window.requestAnimationFrame(tickBoot);
      return;
    }

    if (percent) percent.textContent = "100";
    document.querySelector(".boot-loader")?.classList.add("is-hidden");
    document.body.classList.remove("is-loading");
  }

  window.requestAnimationFrame(tickBoot);
});

window.addEventListener("pointermove", event => {
  pointerX = event.clientX;
  pointerY = event.clientY;
  hasPointer = true;
  if (!isMobileCalm()) document.body.classList.add("has-pointer");
  document.documentElement.style.setProperty("--mx", `${pointerX}px`);
  document.documentElement.style.setProperty("--my", `${pointerY}px`);

  if (enableCursorTrail && !reduceMotion) {
    const burst = Math.min(4, 42 - cursorPixels.length);
    for (let i = 0; i < burst; i += 1) pushCursorPixel(1.15);
  }
});

const observer = new IntersectionObserver(
  entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) entry.target.classList.add("is-visible");
    });
  },
  { threshold: 0.12 }
);

document.querySelectorAll(".reveal").forEach((el, index) => {
  el.style.transitionDelay = `${Math.min(index * 35, 180)}ms`;
  observer.observe(el);
});

const heroTitle = document.querySelector(".hero-title");
if (heroTitle && !reduceMotion) {
  window.setInterval(() => {
    heroTitle.classList.add("is-glitching");
    window.setTimeout(() => heroTitle.classList.remove("is-glitching"), 620);
  }, 5200);
}

const feedLine = document.querySelector("[data-feed-line]");
const feedMessages = [
  "scan /router...",
  "repair /notebook...",
  "setup /smartphone...",
  "deploy /website...",
  "secure /backup..."
];
let feedIndex = 0;
if (feedLine && !reduceMotion) {
  window.setInterval(() => {
    feedIndex = (feedIndex + 1) % feedMessages.length;
    feedLine.textContent = feedMessages[feedIndex];
  }, 1400);
}

const heroStage = document.querySelector(".hero-stage");
if (heroStage && !reduceMotion && canUseHoverMotion) {
  window.addEventListener("pointermove", event => {
    const rect = heroStage.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    heroStage.style.transform = `rotateX(${y * -5}deg) rotateY(${x * 7}deg)`;
  });

  heroStage.addEventListener("pointerleave", () => {
    heroStage.style.transform = "";
  });
}

document.querySelectorAll(".magnetic").forEach(button => {
  button.addEventListener("pointermove", event => {
    if (reduceMotion || !canUseHoverMotion) return;
    const rect = button.getBoundingClientRect();
    const x = event.clientX - rect.left - rect.width / 2;
    const y = event.clientY - rect.top - rect.height / 2;
    button.style.transform = `translate(${x * 0.12}px, ${y * 0.18}px)`;
  });

  button.addEventListener("pointerleave", () => {
    button.style.transform = "";
  });
});

document.querySelectorAll(".service-card").forEach(card => {
  card.addEventListener("pointermove", event => {
    if (reduceMotion || !canUseHoverMotion) return;
    const rect = card.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width - 0.5) * 8;
    const y = ((event.clientY - rect.top) / rect.height - 0.5) * -8;
    card.style.transform = `perspective(800px) rotateX(${y}deg) rotateY(${x}deg) translateY(-6px)`;
  });

  card.addEventListener("pointerleave", () => {
    card.style.transform = "";
  });
});

const proximityTargets = Array.from(
  document.querySelectorAll(".service-card, .motion-panel, .impact-item, .price-card, .contact-method, .profile-card, .legal-card, .support-pack")
);
let proximityFrame = 0;

function updateProximityEffects() {
  proximityFrame = 0;
  if (reduceMotion || !canUseHoverMotion) return;

  proximityTargets.forEach(target => {
    const rect = target.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const dx = pointerX - centerX;
    const dy = pointerY - centerY;
    const distance = Math.hypot(dx, dy);
    const range = Math.max(190, Math.min(330, rect.width * 0.82));
    const strength = Math.max(0, 1 - distance / range);

    if (strength <= 0) {
      target.classList.remove("is-near");
      target.style.removeProperty("--proximity");
      target.style.removeProperty("--px");
      target.style.removeProperty("--py");
      target.style.removeProperty("--near-transform");
      if (!target.matches(":hover")) target.style.transform = "";
      return;
    }

    const localX = Math.min(100, Math.max(0, ((pointerX - rect.left) / rect.width) * 100));
    const localY = Math.min(100, Math.max(0, ((pointerY - rect.top) / rect.height) * 100));
    const pullX = (dx / range) * 14 * strength;
    const pullY = (dy / range) * 12 * strength;
    const rotateY = (dx / range) * 7 * strength;
    const rotateX = (dy / range) * -6 * strength;
    const lift = 10 * strength;

    target.classList.add("is-near");
    target.style.setProperty("--proximity", strength.toFixed(3));
    target.style.setProperty("--px", `${localX.toFixed(1)}%`);
    target.style.setProperty("--py", `${localY.toFixed(1)}%`);
    const nearTransform = `perspective(900px) translate3d(${pullX.toFixed(2)}px, ${(pullY - lift).toFixed(2)}px, 0) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) scale(${(1 + strength * 0.025).toFixed(3)})`;
    target.style.setProperty("--near-transform", nearTransform);
    target.style.transform = nearTransform;
  });
}

if (canUseHoverMotion) {
  window.addEventListener("pointermove", () => {
    if (!proximityFrame) proximityFrame = window.requestAnimationFrame(updateProximityEffects);
  });

  window.addEventListener("scroll", () => {
    if (!proximityFrame) proximityFrame = window.requestAnimationFrame(updateProximityEffects);
  }, { passive: true });
}

const sketchPad = document.querySelector(".sketch-pad");
const supportPack = document.querySelector(".support-pack");
document.body.classList.add("has-progress-sketches");

const sketchStates = new Map();
const sketchConfigs = new Map();

if (sketchPad) {
  sketchConfigs.set(sketchPad, {
    activeClass: "is-sketching",
    lines: [
      [".line-head-left", 0.02, 0.14],
      [".line-face-left", 0.12, 0.20],
      [".line-head-right", 0.18, 0.30],
      [".line-face-right", 0.28, 0.36],
      [".line-body-left", 0.34, 0.48],
      [".line-body-right", 0.44, 0.58],
      [".line-shoulder-left", 0.56, 0.68],
      [".line-shoulder-right", 0.66, 0.78],
      [".line-detail-left", 0.76, 0.88],
      [".line-detail-right", 0.84, 0.96],
      [".line-spark", 0.94, 1]
    ],
    pencil: ".sketch-pencil",
    pencilPoints: [
      [30, 27, -20],
      [42, 27, -6],
      [65, 27, 12],
      [77, 28, 22],
      [28, 84, -24],
      [72, 84, 22],
      [32, 69, -10],
      [69, 69, 10],
      [32, 87, 0],
      [69, 87, 0],
      [50, 33, -8]
    ],
    pencilStops: [
      [0.02, 30, 27, -20],
      [0.20, 42, 28, -6],
      [0.36, 77, 28, 18],
      [0.48, 28, 84, -24],
      [0.58, 72, 84, 22],
      [0.68, 32, 69, -10],
      [0.78, 69, 69, 10],
      [0.88, 32, 87, 0],
      [0.96, 69, 87, 0],
      [1, 50, 33, -8]
    ],
    drawSpeed: 0.30,
    eraseSpeed: 0.74,
    dash: 720
  });
}

if (supportPack) {
  sketchConfigs.set(supportPack, {
    activeClass: "is-pack-sketching",
    lines: [
      [".net-monitor", 0.02, 0.20],
      [".net-phone", 0.20, 0.36],
      [".net-wifi-one", 0.34, 0.52],
      [".net-wifi-two", 0.44, 0.60],
      [".net-wifi-dot", 0.52, 0.66],
      [".net-router", 0.58, 0.84],
      [".net-router-details", 0.74, 1]
    ],
    pencil: ".network-pencil",
    pencilPoints: [
      [23, 20, -22],
      [35, 19, -10],
      [72, 20, 14],
      [51, 57, -26],
      [50, 64, -14],
      [50, 70, 4],
      [24, 79, 10],
      [74, 80, 8],
      [67, 70, -18]
    ],
    pencilStops: [
      [0.02, 23, 20, -22],
      [0.20, 35, 20, -10],
      [0.36, 74, 20, 14],
      [0.52, 51, 57, -26],
      [0.60, 50, 64, -14],
      [0.66, 50, 70, 4],
      [0.84, 24, 79, 10],
      [1, 67, 70, -18]
    ],
    drawSpeed: 0.20,
    eraseSpeed: 0.64,
    dash: 900
  });
}
let sketchFrame = 0;
let lastSketchTime = performance.now();

function isPointerInsideElement(element, pad = 0) {
  if (!element) return false;
  const rect = element.getBoundingClientRect();
  return (
    pointerX >= rect.left - pad &&
    pointerX <= rect.right + pad &&
    pointerY >= rect.top - pad &&
    pointerY <= rect.bottom + pad
  );
}

function clamp01(value) {
  return Math.min(1, Math.max(0, value));
}

function easeSketch(value) {
  return value * value * (3 - 2 * value);
}

function setSketchTarget(element, isInside) {
  const config = sketchConfigs.get(element);
  if (!config) return;
  const state = sketchStates.get(element) || { progress: 0, target: 0 };
  state.target = isInside ? 1 : 0;
  sketchStates.set(element, state);

  element.classList.toggle(config.activeClass, isInside || state.progress > 0.002);
  element.classList.toggle("is-erasing", !isInside && state.progress > 0.002);

  if (!sketchFrame) {
    lastSketchTime = performance.now();
    sketchFrame = window.requestAnimationFrame(updateProgressSketches);
  }
}

function interpolatePencil(points, progress) {
  const scaled = clamp01(progress) * (points.length - 1);
  const index = Math.min(points.length - 2, Math.floor(scaled));
  const local = easeSketch(scaled - index);
  const from = points[index];
  const to = points[index + 1];
  return [
    from[0] + (to[0] - from[0]) * local,
    from[1] + (to[1] - from[1]) * local,
    from[2] + (to[2] - from[2]) * local
  ];
}

function interpolateSketchTool(config, progress) {
  if (!config.pencilStops) return interpolatePencil(config.pencilPoints, progress);
  const stops = config.pencilStops;
  const value = clamp01(progress);
  if (value <= stops[0][0]) return [stops[0][1], stops[0][2], stops[0][3]];

  for (let i = 0; i < stops.length - 1; i++) {
    const from = stops[i];
    const to = stops[i + 1];
    if (value <= to[0]) {
      const local = easeSketch(clamp01((value - from[0]) / (to[0] - from[0])));
      return [
        from[1] + (to[1] - from[1]) * local,
        from[2] + (to[2] - from[2]) * local,
        from[3] + (to[3] - from[3]) * local
      ];
    }
  }

  const last = stops[stops.length - 1];
  return [last[1], last[2], last[3]];
}

function renderSketch(element, progress, isDrawing) {
  const config = sketchConfigs.get(element);
  if (!config) return;

  config.lines.forEach(([selector, start, end]) => {
    element.querySelectorAll(selector).forEach(line => {
      const local = easeSketch(clamp01((progress - start) / (end - start)));
      const dash = Number(line.dataset.dashLength || config.dash);
      line.style.strokeDasharray = String(dash);
      line.style.strokeDashoffset = String(dash * (1 - local));
      line.style.opacity = local > 0.01 ? String(Math.min(1, local * 1.8)) : "0";
    });
  });

  const pencil = element.querySelector(config.pencil);
  if (pencil) {
    if (!isDrawing || progress <= 0.002 || progress >= 0.998) {
      pencil.style.opacity = "0";
    } else {
      const [x, y, rotate] = interpolateSketchTool(config, progress);
      pencil.style.opacity = "1";
      pencil.style.left = `${x}%`;
      pencil.style.top = `${y}%`;
      pencil.style.transform = `translate(-50%, -50%) rotate(${rotate}deg)`;
    }
  }

  const [eraserX, eraserY, eraserRotate] = interpolateSketchTool(config, progress);
  element.style.setProperty("--eraser-x", `${eraserX}%`);
  element.style.setProperty("--eraser-y", `${eraserY}%`);
  element.style.setProperty("--eraser-rotate", `${eraserRotate + 16}deg`);
}

function updateProgressSketches(now) {
  const delta = Math.min(0.05, Math.max(0, (now - lastSketchTime) / 1000));
  lastSketchTime = now;
  let hasActiveSketch = false;

  sketchConfigs.forEach((config, element) => {
    const state = sketchStates.get(element) || { progress: 0, target: 0 };
    const speed = state.target > state.progress ? config.drawSpeed : config.eraseSpeed;
    const direction = Math.sign(state.target - state.progress);
    state.progress = clamp01(state.progress + direction * speed * delta);

    if (Math.abs(state.target - state.progress) < 0.002) {
      state.progress = state.target;
    }

    renderSketch(element, state.progress, state.target > state.progress);
    element.classList.toggle(config.activeClass, state.target > 0 || state.progress > 0.002);
    element.classList.toggle("is-erasing", state.target === 0 && state.progress > 0.002);

    sketchStates.set(element, state);
    if (state.progress > 0 || state.target > 0) hasActiveSketch = true;
  });

  if (hasActiveSketch) {
    sketchFrame = window.requestAnimationFrame(updateProgressSketches);
    return;
  }

  sketchFrame = 0;
}

function startMobileSketch(element) {
  if (!isMobileCalm()) return;
  const config = sketchConfigs.get(element);
  if (!config) return;

  const current = sketchStates.get(element);
  const state = {
    progress: current?.progress && current.progress > 0.98 ? 1 : current?.progress || 0,
    target: 1
  };

  sketchStates.set(element, state);
  renderSketch(element, state.progress, state.progress < 0.998);
  element.classList.add(config.activeClass);
  element.classList.remove("is-erasing");

  if (!sketchFrame) {
    lastSketchTime = performance.now();
    sketchFrame = window.requestAnimationFrame(updateProgressSketches);
  }
}

let mobileSketchObserver;

function setupMobileSketchObserver() {
  if (mobileSketchObserver) mobileSketchObserver.disconnect();
  if (!isMobileCalm()) return;

  mobileSketchObserver = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        startMobileSketch(entry.target);
        mobileSketchObserver.unobserve(entry.target);
      });
    },
    { threshold: 0.28, rootMargin: "0px 0px -10% 0px" }
  );

  sketchConfigs.forEach((config, element) => {
    const state = sketchStates.get(element);
    if (state?.progress >= 0.998) return;
    renderSketch(element, state?.progress || 0, false);
    mobileSketchObserver.observe(element);
  });
}

setupMobileSketchObserver();
mobileCalmQuery.addEventListener("change", setupMobileSketchObserver);

function updateSketchPadHover() {
  if (reduceMotion || !canUseHoverMotion) return;

  if (sketchPad) {
    setSketchTarget(sketchPad, isPointerInsideElement(sketchPad, 10));
  }

  if (supportPack) {
    setSketchTarget(supportPack, isPointerInsideElement(supportPack, 14));
  }
}

if (canUseHoverMotion) {
  window.addEventListener("pointermove", () => {
    window.requestAnimationFrame(updateSketchPadHover);
  });

  window.addEventListener("scroll", () => {
    window.requestAnimationFrame(updateSketchPadHover);
  }, { passive: true });
}

if (sketchPad) {
  sketchPad.addEventListener("pointerenter", event => {
    if (!canUseHoverMotion) return;
    pointerX = event.clientX;
    pointerY = event.clientY;
    setSketchTarget(sketchPad, true);
  });

  sketchPad.addEventListener("pointerleave", event => {
    if (!canUseHoverMotion) return;
    pointerX = event.clientX;
    pointerY = event.clientY;
    setSketchTarget(sketchPad, false);
  });
}

if (supportPack) {
  supportPack.addEventListener("pointerenter", event => {
    if (!canUseHoverMotion) return;
    pointerX = event.clientX;
    pointerY = event.clientY;
    setSketchTarget(supportPack, true);
  });

  supportPack.addEventListener("pointerleave", event => {
    if (!canUseHoverMotion) return;
    pointerX = event.clientX;
    pointerY = event.clientY;
    setSketchTarget(supportPack, false);
  });
}
