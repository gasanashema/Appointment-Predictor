/* Health Sphere Frontend Simulation
   ------------------------------------------------------------
   Sections:
   - DOM Utilities
   - DOM Elements
   - Top Navigation Logic
   - Header Logic
   - Prediction Logic
   - Storage Logic
   - Chart Logic
   - Animations
   - Page Init
*/

// -----------------------------
// DOM Utilities
// -----------------------------
const qs = (sel, root = document) => root.querySelector(sel);
const qsa = (sel, root = document) => Array.from(root.querySelectorAll(sel));
const clamp = (min, v, max) => Math.min(max, Math.max(min, v));

function safeJsonParse(value) {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function formatDateISO(d) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

// -----------------------------
// DOM Elements
// -----------------------------
const appRoot = qs("#hsApp");
const topNavMount = qs("#hsTopNavMount");
const headerMount = qs("#hsHeaderMount");
const contentRoot = qs("#hsContent");

// -----------------------------
// Top Navigation Logic
// -----------------------------
let mobileMenuOpen = false;

function iconSvg(name) {
  if (name === "dashboard") {
    return `
      <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M4 10.5L12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" />
      </svg>
    `;
  }
  if (name === "input") {
    return `
      <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M7 4h10a2 2 0 0 1 2 2v14a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V6a2 2 0 0 1 2-2Z" stroke="currentColor" stroke-width="1.8" />
        <path d="M8 8h8M8 12h8M8 16h6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
      </svg>
    `;
  }
  if (name === "predictions") {
    return `
      <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M4 6.5A2.5 2.5 0 0 1 6.5 4H20v14.5A2.5 2.5 0 0 1 17.5 21H6.5A2.5 2.5 0 0 1 4 18.5V6.5Z" stroke="currentColor" stroke-width="1.8" />
        <path d="M8 9h8M8 13h5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
      </svg>
    `;
  }
  if (name === "charts") {
    return `
      <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M5 19V9M10 19V5M15 19v-7M20 19v-3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
        <path d="M4 19h17" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
      </svg>
    `;
  }
  if (name === "logout") {
    return `
      <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M10 7V6a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-7a2 2 0 0 1-2-2v-1" stroke="currentColor" stroke-width="1.8" />
        <path d="M4 12h10M7 9l-3 3 3 3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
    `;
  }
  return "";
}

const navItems = [
  { href: "./index.html", label: "Dashboard", icon: "dashboard" },
  { href: "./input.html", label: "Input", icon: "input" },
  { href: "./predictions.html", label: "Predictions", icon: "predictions" },
  { href: "./charts.html", label: "Charts", icon: "charts" },
  { href: "./logout.html", label: "Logout", icon: "logout" },
];

function setMobileMenuOpen(open) {
  mobileMenuOpen = open;

  const dropdown = qs("#hsNavDropdown");
  const toggle = qs("#hsNavToggle");
  if (!dropdown || !toggle) return;

  toggle.setAttribute("aria-expanded", open ? "true" : "false");

  if (open) {
    dropdown.classList.remove("max-h-0");
    dropdown.classList.add("max-h-96");
    dropdown.classList.add("pb-4");
  } else {
    dropdown.classList.add("max-h-0");
    dropdown.classList.remove("max-h-96");
    dropdown.classList.remove("pb-4");
  }
}

function renderTopNav(activePathname) {
  if (!topNavMount) return;

  const linkClass = (isActive) =>
    isActive
      ? "px-3 py-1 rounded-lg bg-emerald-500 text-white font-medium"
      : "px-3 py-1 rounded-lg hover:bg-emerald-500/30 transition duration-300 text-white font-medium";

  const desktopLinks = navItems
    .map((it) => {
      const isActive = activePathname.endsWith(it.href.replace("./", ""));
      return `<a data-hs-nav href="${it.href}" class="${linkClass(isActive)}">${it.label}</a>`;
    })
    .join("");

  const mobileLinks = navItems
    .map((it) => {
      const isActive = activePathname.endsWith(it.href.replace("./", ""));
      return `
        <a data-hs-nav href="${it.href}" class="flex items-center justify-between ${linkClass(isActive)}">
          <span>${it.label}</span>
          <span class="opacity-90">${iconSvg(it.icon)}</span>
        </a>
      `;
    })
    .join("");

  topNavMount.innerHTML = `
    <!-- Top Navigation (shared) -->
    <nav id="topNav" class="bg-gradient-to-r from-teal-700 to-emerald-600 text-white shadow">
      <div class="h-16 px-8 flex items-center justify-between gap-6">
        <div class="flex items-center gap-3 min-w-0">
          <img src="./assets/logo.png" alt="Health Sphere logo" class="h-10 w-10 object-contain" />
          <div class="leading-tight min-w-0">
            <div class="text-base font-semibold truncate">Health Sphere</div>
            <div class="text-xs text-white/80 truncate">AUCA Innovation Center</div>
          </div>
        </div>

        <div class="hidden lg:flex items-center gap-6">
          ${desktopLinks}
        </div>

        <button
          id="hsNavToggle"
          class="lg:hidden p-2 rounded-lg hover:bg-emerald-500/30 transition duration-300"
          type="button"
          aria-label="Open menu"
          aria-expanded="false"
        >
          <svg class="h-6 w-6" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
          </svg>
        </button>
      </div>

      <div id="hsNavDropdown" class="lg:hidden px-8 overflow-hidden max-h-0 transition-all duration-300">
        <div class="pt-3 space-y-2">
          ${mobileLinks}
        </div>
      </div>
    </nav>
  `;

  const toggle = qs("#hsNavToggle");
  toggle?.addEventListener("click", () => setMobileMenuOpen(!mobileMenuOpen));

  qsa("[data-hs-nav]").forEach((a) => {
    a.addEventListener("click", () => {
      if (window.matchMedia("(max-width: 1023px)").matches) setMobileMenuOpen(false);
    });
  });

  const mq = window.matchMedia("(min-width: 1024px)");
  const onResize = () => {
    if (mq.matches) setMobileMenuOpen(false);
  };
  if (mq.addEventListener) mq.addEventListener("change", onResize);
  else mq.addListener(onResize);
}

// -----------------------------
// Header Logic
// -----------------------------
function renderHeader(titleText) {
  if (!headerMount) return;
  headerMount.innerHTML = `
    <!-- Header (shared) -->
    <header class="bg-gradient-to-r from-teal-600 to-emerald-500 text-white shadow">
      <div class="p-6">
        <h1 class="text-2xl font-semibold">${titleText}</h1>
      </div>
    </header>
  `;
}

// -----------------------------
// Storage Logic
// -----------------------------
const STORAGE_KEY = "healthSphere:lastPrediction";

function loadLastPrediction() {
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? safeJsonParse(raw) : null;
}

function saveLastPrediction(payload) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

// -----------------------------
// Prediction Logic
// -----------------------------
function readPredictionInputs(root = document) {
  const ageEl = qs("#hsAge", root);
  const genderEl = qs("#hsGender", root);
  const smsEl = qs("#hsSms", root);
  const dayEl = qs("#hsApptDay", root);

  const ageRaw = ageEl?.value ? Number(ageEl.value) : NaN;
  const age = Number.isFinite(ageRaw) ? ageRaw : 30;
  const gender = genderEl?.value || "Male";
  const smsReceived = (smsEl?.value || "Yes").toLowerCase() === "yes";
  const appointmentDay = dayEl?.value || formatDateISO(new Date());

  return { age, gender, smsReceived, appointmentDay };
}

function computePrediction({ age, smsReceived }) {
  let score = 0.6;
  if (smsReceived) score += 0.15;
  if (age < 25) score -= 0.06;
  if (age >= 60) score -= 0.04;

  const jitter = (Math.random() - 0.5) * 0.14;
  score = clamp(0.05, score + jitter, 0.95);

  const attend = score >= 0.5;
  const confidence = Math.round(score * 100);

  const accuracy = Math.round(clamp(70, confidence + (Math.random() * 10 - 5), 95));
  const precision = Math.round(clamp(65, confidence - 3 + (Math.random() * 10 - 5), 95));
  const recall = Math.round(clamp(65, confidence + 2 + (Math.random() * 10 - 5), 95));

  const attendedPct = Math.round(score * 100);
  const noShowPct = 100 - attendedPct;

  const base = 35 + Math.round((attendedPct / 100) * 30);
  const bars = {
    Mon: clamp(15, base + Math.round(Math.random() * 18 - 9), 85),
    Tue: clamp(15, base + Math.round(Math.random() * 18 - 9), 85),
    Wed: clamp(15, base + Math.round(Math.random() * 18 - 9), 85),
    Thu: clamp(15, base + Math.round(Math.random() * 18 - 9), 85),
    Fri: clamp(15, base + Math.round(Math.random() * 18 - 9), 85),
  };

  return {
    result: attend ? "Likely to Attend" : "Likely No-Show",
    confidence,
    metrics: { accuracy, precision, recall },
    charts: { attendedPct, noShowPct, bars },
  };
}

function setButtonLoading(btn, loading) {
  if (!btn) return;
  btn.disabled = loading;
  btn.setAttribute("aria-disabled", loading ? "true" : "false");
  btn.setAttribute("aria-busy", loading ? "true" : "false");

  const label = btn.querySelector("[data-hs-btn-label]");
  const spinner = btn.querySelector("[data-hs-btn-spinner]");
  if (label) label.classList.toggle("opacity-0", loading);
  if (spinner) spinner.classList.toggle("hidden", !loading);
}

function runPredictFlow({ onApply, onSavedText } = {}) {
  const btn = qs("#hsPredictBtn");
  if (!btn) return;

  btn.addEventListener("click", () => {
    const inputs = readPredictionInputs();

    setButtonLoading(btn, true);

    window.setTimeout(() => {
      const pred = computePrediction(inputs);
      const payload = {
        createdAt: new Date().toISOString(),
        inputs,
        ...pred,
      };

      saveLastPrediction(payload);
      onApply?.(payload);

      if (typeof onSavedText === "function") onSavedText(payload);

      setButtonLoading(btn, false);
    }, 1500);
  });
}

// -----------------------------
// Chart Logic
// -----------------------------
function renderPie(attendedPct, noShowPct) {
  const pie = qs("#hsPie");
  const tAttend = qs("#hsPieAttend");
  const tNoShow = qs("#hsPieNoShow");
  if (!pie) return;

  pie.style.background = `conic-gradient(#22c55e 0 ${attendedPct}%, #ef4444 ${attendedPct}% 100%)`;
  if (tAttend) tAttend.textContent = `${attendedPct}%`;
  if (tNoShow) tNoShow.textContent = `${noShowPct}%`;
}

function renderBars(valuesByDay, { animate = true } = {}) {
  const bars = qsa("[data-hs-bar]");
  if (!bars.length) return;

  bars.forEach((bar) => {
    const day = bar.getAttribute("data-hs-bar");
    const v = valuesByDay?.[day];
    const pct = typeof v === "number" ? clamp(10, v, 90) : 50;

    if (animate) bar.style.height = "0%";
    bar.style.transition = "height 700ms ease";
    bar.dataset.targetHeight = `${pct}%`;
  });

  if (animate) {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        bars.forEach((bar) => {
          bar.style.height = bar.dataset.targetHeight || "50%";
        });
      });
    });
  } else {
    bars.forEach((bar) => {
      bar.style.height = bar.dataset.targetHeight || "50%";
    });
  }
}

// -----------------------------
// Animations
// -----------------------------
function fadeInContent() {
  if (!contentRoot) return;
  contentRoot.classList.add("hs-fade");
  requestAnimationFrame(() => {
    requestAnimationFrame(() => contentRoot.classList.add("hs-in"));
  });
}

function animateCards() {
  qsa("[data-hs-anim]").forEach((el, idx) => {
    el.classList.add("hs-fade");
    window.setTimeout(() => el.classList.add("hs-in"), 70 + idx * 40);
  });
}

// -----------------------------
// Page Init
// -----------------------------
function initLayout() {
  const pageTitle = appRoot?.dataset?.title || "Health Sphere";
  const pathname = (location.pathname || "").split("/").pop() || "index.html";

  renderTopNav(pathname);
  renderHeader(pageTitle);

  setMobileMenuOpen(false);
  fadeInContent();
}

function initDashboard() {
  const dayEl = qs("#hsApptDay");
  if (dayEl && !dayEl.value) dayEl.value = formatDateISO(new Date());

  const fadeOnce = (el) => {
    if (!el) return;
    el.classList.remove("hs-in");
    el.classList.add("hs-fade");
    requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add("hs-in")));
  };

  const apply = (payload) => {
    const banner = qs("#hsResultText");
    const acc = qs("#hsMetricAccuracy");
    const pre = qs("#hsMetricPrecision");
    const rec = qs("#hsMetricRecall");

    if (banner) banner.textContent = payload.result;
    if (acc) acc.textContent = `${payload.metrics.accuracy}%`;
    if (pre) pre.textContent = `${payload.metrics.precision}%`;
    if (rec) rec.textContent = `${payload.metrics.recall}%`;

    renderPie(payload.charts.attendedPct, payload.charts.noShowPct);
    renderBars(payload.charts.bars, { animate: true });

    fadeOnce(qs("#hsResultText")?.closest("section"));
    qsa("[id^=hsMetric]").forEach((n) => fadeOnce(n.closest("div")));
  };

  const existing = loadLastPrediction();
  if (existing) {
    apply(existing);
  } else {
    const inputs = readPredictionInputs();
    apply({ inputs, ...computePrediction(inputs) });
  }

  runPredictFlow({ onApply: apply });
}

function initInput() {
  const dayEl = qs("#hsApptDay");
  if (dayEl && !dayEl.value) dayEl.value = formatDateISO(new Date());

  const status = qs("#hsInputStatus");
  const setStatus = (payload) => {
    if (!status) return;
    status.innerHTML = `
      Saved locally. You can view it on
      <a href="./predictions.html" class="font-semibold text-emerald-700 hover:underline">Predictions</a>.
    `;
  };

  runPredictFlow({ onSavedText: setStatus });
}

function initPredictions() {
  const empty = qs("#hsEmptyState");
  const filled = qs("#hsPredictionView");

  const payload = loadLastPrediction();
  if (!payload) {
    empty?.classList.remove("hidden");
    filled?.classList.add("hidden");
    return;
  }

  empty?.classList.add("hidden");
  filled?.classList.remove("hidden");

  const banner = qs("#hsResultText");
  const age = qs("#hsPredAge");
  const gender = qs("#hsPredGender");
  const sms = qs("#hsPredSms");
  const day = qs("#hsPredDay");
  const final = qs("#hsPredFinal");
  const conf = qs("#hsConfidenceValue");
  const acc = qs("#hsMetricAccuracy");
  const pre = qs("#hsMetricPrecision");
  const rec = qs("#hsMetricRecall");

  if (banner) banner.textContent = payload.result;
  if (age) age.textContent = String(payload.inputs.age);
  if (gender) gender.textContent = payload.inputs.gender;
  if (sms) sms.textContent = payload.inputs.smsReceived ? "Yes" : "No";
  if (day) day.textContent = payload.inputs.appointmentDay;
  if (final) final.textContent = payload.result;
  if (conf) conf.textContent = `${payload.confidence}%`;
  if (acc) acc.textContent = `${payload.metrics.accuracy}%`;
  if (pre) pre.textContent = `${payload.metrics.precision}%`;
  if (rec) rec.textContent = `${payload.metrics.recall}%`;
}

function initCharts() {
  const empty = qs("#hsEmptyState");
  const view = qs("#hsChartsView");

  const payload = loadLastPrediction();
  if (!payload) {
    empty?.classList.remove("hidden");
    view?.classList.add("hidden");
    return;
  }

  empty?.classList.add("hidden");
  view?.classList.remove("hidden");

  renderPie(payload.charts.attendedPct, payload.charts.noShowPct);
  renderBars(payload.charts.bars, { animate: true });

  const trendBars = qsa("[data-hs-trend]");
  if (trendBars.length) {
    trendBars.forEach((bar) => {
      const v = clamp(10, 20 + Math.random() * 70, 90);
      bar.style.height = "0%";
      bar.style.transition = "height 800ms ease";
      bar.dataset.targetHeight = `${v}%`;
    });
    requestAnimationFrame(() => {
      requestAnimationFrame(() => trendBars.forEach((bar) => (bar.style.height = bar.dataset.targetHeight || "45%")));
    });
  }
}

function initApp() {
  if (!appRoot) return;
  initLayout();
  animateCards();

  const page = appRoot.dataset.page || "";
  if (page === "dashboard") initDashboard();
  if (page === "input") initInput();
  if (page === "predictions") initPredictions();
  if (page === "charts") initCharts();
}

document.addEventListener("DOMContentLoaded", initApp);

