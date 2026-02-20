/* Health Sphere Frontend Simulation
   ------------------------------------------------------------
   Sections:
   - DOM Utilities
   - DOM Elements
   - Authentication Logic
   - Top Navigation Logic
   - Header Logic
   - Prediction Logic
   - Storage Logic
   - Chart Logic
   - Admin Logic
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
// Path Helpers
// -----------------------------
// Compute base path relative to the project root, so links always work
// regardless of which subfolder the current page is in.
function getBasePath() {
  const pathname = location.pathname || "";
  if (pathname.includes("/user/") || pathname.includes("/admin/")) {
    return "../";
  }
  return "./";
}

// -----------------------------
// Authentication Logic
// -----------------------------
const AUTH_ROLE_KEY = "healthSphere:role";
const AUTH_EMAIL_KEY = "healthSphere:email";

function getAuthRole() {
  return localStorage.getItem(AUTH_ROLE_KEY) || null;
}

function setAuthRole(role) {
  if (role) {
    localStorage.setItem(AUTH_ROLE_KEY, role);
  } else {
    localStorage.removeItem(AUTH_ROLE_KEY);
    localStorage.removeItem(AUTH_EMAIL_KEY);
  }
}

function setAuthEmail(email) {
  if (email) {
    localStorage.setItem(AUTH_EMAIL_KEY, email);
  } else {
    localStorage.removeItem(AUTH_EMAIL_KEY);
  }
}

function requireAuth(expectedRole = null) {
  const role = getAuthRole();
  const pathname = location.pathname || "";
  const isLoginPage = pathname.includes("login.html");
  const isLandingPage = pathname.includes("landing.html");
  const base = getBasePath();

  if (!role && !isLoginPage && !isLandingPage) {
    location.href = base + "login.html";
    return false;
  }

  if (role && expectedRole && role !== expectedRole) {
    if (role === "admin" && pathname.includes("/user/")) {
      location.href = base + "admin/admin-dashboard.html";
      return false;
    }
    if (role === "user" && pathname.includes("/admin/")) {
      location.href = base + "user/index.html";
      return false;
    }
  }

  return true;
}

function logout() {
  setAuthRole(null);
  setAuthEmail(null);
  const base = getBasePath();
  location.href = base + "landing.html";
}

function initLogin() {
  const form = qs("#hsLoginForm");
  const btn = qs("#hsLoginBtn");
  const emailInput = qs("#hsLoginEmail");
  const passwordInput = qs("#hsLoginPassword");
  const roleUserBtn = qs("#hsRoleUser");
  const roleAdminBtn = qs("#hsRoleAdmin");

  let selectedRole = "user";

  const setButtonLoading = (loading) => {
    if (!btn) return;
    btn.disabled = loading;
    const label = qs("[data-hs-btn-label]", btn);
    const spinner = qs("[data-hs-btn-spinner]", btn);
    if (label) label.classList.toggle("opacity-0", loading);
    if (spinner) spinner.classList.toggle("hidden", !loading);
  };

  const updateRoleButtons = () => {
    if (selectedRole === "user") {
      roleUserBtn?.classList.remove("border-slate-300", "bg-white", "text-slate-700", "hover:bg-slate-50");
      roleUserBtn?.classList.add("border-emerald-500", "bg-emerald-500", "text-white");
      roleAdminBtn?.classList.remove("border-emerald-500", "bg-emerald-500", "text-white");
      roleAdminBtn?.classList.add("border-slate-300", "bg-white", "text-slate-700", "hover:bg-slate-50");
    } else {
      roleAdminBtn?.classList.remove("border-slate-300", "bg-white", "text-slate-700", "hover:bg-slate-50");
      roleAdminBtn?.classList.add("border-emerald-500", "bg-emerald-500", "text-white");
      roleUserBtn?.classList.remove("border-emerald-500", "bg-emerald-500", "text-white");
      roleUserBtn?.classList.add("border-slate-300", "bg-white", "text-slate-700", "hover:bg-slate-50");
    }
  };

  roleUserBtn?.addEventListener("click", () => {
    selectedRole = "user";
    updateRoleButtons();
  });

  roleAdminBtn?.addEventListener("click", () => {
    selectedRole = "admin";
    updateRoleButtons();
  });

  updateRoleButtons();

  form?.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = emailInput?.value || "";
    const password = passwordInput?.value || "";

    if (!email || !password) return;

    setButtonLoading(true);

    window.setTimeout(() => {
      setAuthRole(selectedRole);
      setAuthEmail(email);

      if (selectedRole === "user") {
        location.href = "./user/index.html";
      } else {
        location.href = "./admin/admin-dashboard.html";
      }
    }, 1000);
  });

  const anims = qsa("[data-hs-anim]");
  anims.forEach((el, idx) => {
    el.classList.add("hs-fade");
    window.setTimeout(() => el.classList.add("hs-in"), 100 + idx * 100);
  });
}

// -----------------------------
// Register Logic
// -----------------------------
function initRegister() {
  const form = qs("#hsRegisterForm");
  const btn = qs("#hsRegisterBtn");

  const showError = (msg) => {
    let err = qs("#hsRegisterError");
    if (!err) {
      err = document.createElement("p");
      err.id = "hsRegisterError";
      err.className = "text-sm text-red-600 text-center";
      form.insertBefore(err, btn);
    }
    err.textContent = msg;
  };

  const clearError = () => {
    const err = qs("#hsRegisterError");
    if (err) err.textContent = "";
  };

  form?.addEventListener("submit", (e) => {
    e.preventDefault();
    clearError();

    const name = qs("#hsRegisterName")?.value.trim() || "";
    const email = qs("#hsRegisterEmail")?.value.trim() || "";
    const password = qs("#hsRegisterPassword")?.value || "";
    const confirmPassword = qs("#hsRegisterConfirmPassword")?.value || "";
    const accountType = qs("#accountType")?.value || "";

    if (!name || !email || !password || !confirmPassword || !accountType) {
      showError("Please fill in all fields.");
      return;
    }

    if (password !== confirmPassword) {
      showError("Passwords do not match.");
      return;
    }

    if (password.length < 6) {
      showError("Password must be at least 6 characters.");
      return;
    }

    // Save user to localStorage users list
    const usersKey = "healthSphere:users";
    const users = JSON.parse(localStorage.getItem(usersKey) || "[]");

    if (users.find((u) => u.email === email)) {
      showError("An account with this email already exists.");
      return;
    }

    btn.disabled = true;
    btn.textContent = "Creating Account…";

    window.setTimeout(() => {
      const newUser = {
        id: Date.now(),
        name,
        email,
        role: accountType,
        status: "Active",
        joined: new Date().toISOString().split("T")[0],
      };
      users.push(newUser);
      localStorage.setItem(usersKey, JSON.stringify(users));

      // Log them in
      setAuthRole(accountType === "admin" ? "admin" : "user");
      setAuthEmail(email);

      if (accountType === "admin") {
        location.href = "./admin/admin-dashboard.html";
      } else {
        location.href = "./user/index.html";
      }
    }, 800);
  });
}

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
  { page: "user/index.html", label: "Dashboard", icon: "dashboard" },
  { page: "user/input.html", label: "Input", icon: "input" },
  { page: "user/predictions.html", label: "Predictions", icon: "predictions" },
  { page: "user/charts.html", label: "Charts", icon: "charts" },
  { page: "#logout", label: "Logout", icon: "logout", action: "logout" },
];

const adminNavItems = [
  { page: "admin/admin-dashboard.html", label: "Dashboard", icon: "dashboard" },
  { page: "admin/admin-users.html", label: "Users", icon: "input" },
  { page: "admin/admin-predictions.html", label: "Predictions", icon: "predictions" },
  { page: "admin/admin-analytics.html", label: "Analytics", icon: "charts" },
  { page: "user/index.html", label: "User View", icon: "dashboard" },
  { page: "#logout", label: "Logout", icon: "logout", action: "logout" },
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

  const fullPath = location.pathname || "";
  const isAdmin = fullPath.includes("/admin/");
  const isUser = fullPath.includes("/user/");
  const items = isAdmin ? adminNavItems : navItems;
  const base = getBasePath();
  const logoPath = base + "assets/logo.png";
  const subtitle = isAdmin ? "Admin Panel" : "AUCA Innovation Center";

  const linkClass = (isActive) =>
    isActive
      ? "px-3 py-1 rounded-lg bg-emerald-500 text-white font-medium"
      : "px-3 py-1 rounded-lg hover:bg-emerald-500/30 transition duration-300 text-white font-medium";

  const buildHref = (it) => {
    if (it.action === "logout") return "#";
    return base + it.page;
  };

  const isActive = (it) => {
    if (it.action === "logout") return false;
    return fullPath.endsWith(it.page);
  };

  const desktopLinks = items
    .map((it) => {
      if (it.action === "logout") {
        return `<button data-hs-nav-action="logout" class="${linkClass(false)} cursor-pointer">${it.label}</button>`;
      }
      return `<a data-hs-nav href="${buildHref(it)}" class="${linkClass(isActive(it))}">${it.label}</a>`;
    })
    .join("");

  const mobileLinks = items
    .map((it) => {
      if (it.action === "logout") {
        return `
          <button data-hs-nav-action="logout" class="flex items-center justify-between w-full ${linkClass(false)} cursor-pointer">
            <span>${it.label}</span>
            <span class="opacity-90">${iconSvg(it.icon)}</span>
          </button>
        `;
      }
      return `
        <a data-hs-nav href="${buildHref(it)}" class="flex items-center justify-between ${linkClass(isActive(it))}">
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
          <img src="${logoPath}" alt="Health Sphere logo" class="h-10 w-10 object-contain" />
          <div class="leading-tight min-w-0">
            <div class="text-base font-semibold truncate">Health Sphere</div>
            <div class="text-xs text-white/80 truncate">${subtitle}</div>
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
    a.addEventListener("click", (e) => {
      e.preventDefault();
      const href = a.getAttribute("href");
      if (window.matchMedia("(max-width: 1023px)").matches) setMobileMenuOpen(false);
      fadeOutThenNavigate(href);
    });
  });

  qsa("[data-hs-nav-action='logout']").forEach((btn) => {
    btn.addEventListener("click", () => {
      logout();
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
      const all = loadAllPredictions();
      if (!all.find((p) => p.createdAt === payload.createdAt)) {
        all.push(payload);
        saveAllPredictions(all);
      }
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
// Admin Logic
// -----------------------------
const ADMIN_STORAGE_KEY = "healthSphere:allPredictions";
const ADMIN_USERS_KEY = "healthSphere:users";

function loadAllPredictions() {
  const raw = localStorage.getItem(ADMIN_STORAGE_KEY);
  if (raw) {
    const parsed = safeJsonParse(raw);
    if (Array.isArray(parsed)) return parsed;
  }
  const last = loadLastPrediction();
  return last ? [last] : [];
}

function saveAllPredictions(predictions) {
  localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(predictions));
}

function generatePatientName(age, gender) {
  const firstNames = ["John", "Jane", "Michael", "Sarah", "David", "Emily", "Robert", "Jessica", "William", "Amanda"];
  const lastNames = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez"];
  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
  return `${firstName} ${lastName}`;
}

function animateCounter(el, target, suffix = "") {
  if (!el) return;
  const duration = 1500;
  const start = 0;
  const startTime = performance.now();

  const update = (currentTime) => {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const easeOut = 1 - Math.pow(1 - progress, 3);
    const current = Math.round(start + (target - start) * easeOut);
    el.textContent = `${current}${suffix}`;
    if (progress < 1) requestAnimationFrame(update);
  };
  requestAnimationFrame(update);
}

function showToast(message, type = "success") {
  const container = qs("#hsToastContainer");
  if (!container) return;

  const bg = type === "success" ? "bg-emerald-500" : type === "error" ? "bg-red-500" : "bg-slate-600";
  const toast = document.createElement("div");
  toast.className = `hs-toast ${bg} text-white px-4 py-3 rounded-lg shadow-lg text-sm font-medium min-w-[200px]`;
  toast.textContent = message;
  container.appendChild(toast);

  requestAnimationFrame(() => toast.classList.add("hs-show"));

  window.setTimeout(() => {
    toast.classList.remove("hs-show");
    window.setTimeout(() => toast.remove(), 300);
  }, 3000);
}

function openModal(title, message, onConfirm) {
  const modal = qs("#hsConfirmModal");
  const titleEl = qs("#hsModalTitle");
  const msgEl = qs("#hsModalMessage");
  const cancelBtn = qs("#hsModalCancel");
  const confirmBtn = qs("#hsModalConfirm");

  if (!modal || !titleEl || !msgEl || !cancelBtn || !confirmBtn) return;

  titleEl.textContent = title;
  msgEl.textContent = message;
  modal.classList.add("hs-open");

  const close = () => {
    modal.classList.remove("hs-open");
    cancelBtn.onclick = null;
    confirmBtn.onclick = null;
  };

  cancelBtn.onclick = close;
  confirmBtn.onclick = () => {
    onConfirm?.();
    close();
  };
}

function exportToCSV(data, filename) {
  if (!data.length) {
    showToast("No data to export", "error");
    return;
  }

  const headers = Object.keys(data[0]);
  const rows = [headers.join(",")];
  data.forEach((row) => {
    rows.push(headers.map((h) => `"${String(row[h] || "").replace(/"/g, '""')}"`).join(","));
  });

  const csv = rows.join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  showToast("CSV exported successfully", "success");
}

function initAdminDashboard() {
  const predictions = loadAllPredictions();
  const patients = new Set(predictions.map((p) => `${p.inputs.age}-${p.inputs.gender}`)).size;
  const totalPredictions = predictions.length;
  const attendCount = predictions.filter((p) => p.result === "Likely to Attend").length;
  const attendanceRate = totalPredictions > 0 ? Math.round((attendCount / totalPredictions) * 100) : 0;
  const noShowRate = 100 - attendanceRate;

  animateCounter(qs("#hsMetricPatients"), patients);
  animateCounter(qs("#hsMetricPredictions"), totalPredictions);
  animateCounter(qs("#hsMetricAttendance"), attendanceRate, "%");
  animateCounter(qs("#hsMetricNoShow"), noShowRate, "%");

  const empty = qs("#hsPredictionsEmpty");
  const table = qs("#hsPredictionsTable");
  const tbody = qs("#hsPredictionsTbody");

  if (predictions.length === 0) {
    empty?.classList.remove("hidden");
    table?.classList.add("hidden");
  } else {
    empty?.classList.add("hidden");
    table?.classList.remove("hidden");
    if (tbody) {
      tbody.innerHTML = predictions
        .slice(-10)
        .reverse()
        .map((p) => {
          const name = generatePatientName(p.inputs.age, p.inputs.gender);
          const date = p.createdAt ? new Date(p.createdAt).toLocaleDateString() : new Date().toLocaleDateString();
          return `
            <tr class="hover:bg-slate-50">
              <td class="px-4 py-3 text-slate-700">${name}</td>
              <td class="px-4 py-3 text-slate-700">${p.inputs.age}</td>
              <td class="px-4 py-3 text-slate-700">${p.inputs.smsReceived ? "Yes" : "No"}</td>
              <td class="px-4 py-3 text-slate-700">${p.result}</td>
              <td class="px-4 py-3 text-slate-700">${p.confidence}%</td>
              <td class="px-4 py-3 text-slate-700">${date}</td>
            </tr>
          `;
        })
        .join("");
    }
  }

  qs("#hsExportBtn")?.addEventListener("click", () => {
    const csvData = predictions.map((p) => ({
      "Patient Name": generatePatientName(p.inputs.age, p.inputs.gender),
      Age: p.inputs.age,
      Gender: p.inputs.gender,
      "SMS Received": p.inputs.smsReceived ? "Yes" : "No",
      "Appointment Day": p.inputs.appointmentDay,
      Prediction: p.result,
      Confidence: `${p.confidence}%`,
      Date: p.createdAt ? new Date(p.createdAt).toLocaleDateString() : new Date().toLocaleDateString(),
    }));
    exportToCSV(csvData, `health-sphere-predictions-${formatDateISO(new Date())}.csv`);
  });
}

function initAdminUsers() {
  let users = JSON.parse(localStorage.getItem(ADMIN_USERS_KEY) || "[]");
  if (users.length === 0) {
    users = [
      { id: 1, name: "Dr. Sarah Johnson", email: "sarah.johnson@hospital.com", role: "Admin", status: "Active" },
      { id: 2, name: "Dr. Michael Chen", email: "michael.chen@hospital.com", role: "Doctor", status: "Active" },
      { id: 3, name: "Emily Rodriguez", email: "emily.rodriguez@hospital.com", role: "Nurse", status: "Active" },
      { id: 4, name: "Robert Williams", email: "robert.williams@hospital.com", role: "Staff", status: "Suspended" },
      { id: 5, name: "Jessica Martinez", email: "jessica.martinez@hospital.com", role: "Doctor", status: "Active" },
    ];
    localStorage.setItem(ADMIN_USERS_KEY, JSON.stringify(users));
  }

  const renderUsers = () => {
    const tbody = qs("#hsUsersTbody");
    if (!tbody) return;
    tbody.innerHTML = users
      .map((u) => {
        const statusColor = u.status === "Active" ? "text-emerald-700 bg-emerald-50" : "text-red-700 bg-red-50";
        const suspendText = u.status === "Active" ? "Suspend" : "Activate";
        return `
          <tr class="hover:bg-slate-50">
            <td class="px-4 py-3 text-slate-700 font-medium">${u.name}</td>
            <td class="px-4 py-3 text-slate-700">${u.email}</td>
            <td class="px-4 py-3 text-slate-700">${u.role}</td>
            <td class="px-4 py-3">
              <span class="px-2 py-1 rounded text-xs font-semibold ${statusColor}">${u.status}</span>
            </td>
            <td class="px-4 py-3">
              <div class="flex gap-2">
                <button
                  data-user-action="toggle"
                  data-user-id="${u.id}"
                  class="h-8 px-3 rounded text-xs font-semibold text-white bg-gradient-to-r from-orange-400 to-orange-500 hover:brightness-105 transition"
                  type="button"
                >
                  ${suspendText}
                </button>
                <button
                  data-user-action="delete"
                  data-user-id="${u.id}"
                  class="h-8 px-3 rounded text-xs font-semibold text-white bg-red-500 hover:bg-red-600 transition"
                  type="button"
                >
                  Delete
                </button>
              </div>
            </td>
          </tr>
        `;
      })
      .join("");
  };

  renderUsers();

  document.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-user-action]");
    if (!btn) return;
    const action = btn.dataset.userAction;
    const userId = Number(btn.dataset.userId);
    const user = users.find((u) => u.id === userId);
    if (!user) return;

    if (action === "toggle") {
      user.status = user.status === "Active" ? "Suspended" : "Active";
      localStorage.setItem(ADMIN_USERS_KEY, JSON.stringify(users));
      renderUsers();
      showToast(`User ${user.status === "Active" ? "activated" : "suspended"}`, "success");
    } else if (action === "delete") {
      openModal("Delete User", `Are you sure you want to delete ${user.name}? This action cannot be undone.`, () => {
        users = users.filter((u) => u.id !== userId);
        localStorage.setItem(ADMIN_USERS_KEY, JSON.stringify(users));
        renderUsers();
        showToast("User deleted", "success");
      });
    }
  });
}

function initAdminPredictions() {
  let allPredictions = loadAllPredictions();

  const renderTable = (filtered) => {
    const empty = qs("#hsPredictionsEmpty");
    const table = qs("#hsPredictionsTable");
    const tbody = qs("#hsPredictionsTbody");

    if (filtered.length === 0) {
      empty?.classList.remove("hidden");
      table?.classList.add("hidden");
    } else {
      empty?.classList.add("hidden");
      table?.classList.remove("hidden");
      if (tbody) {
        tbody.innerHTML = filtered
          .map((p) => {
            const name = generatePatientName(p.inputs.age, p.inputs.gender);
            const date = p.createdAt ? new Date(p.createdAt).toLocaleDateString() : new Date().toLocaleDateString();
            return `
              <tr class="hover:bg-slate-50">
                <td class="px-4 py-3 text-slate-700">${name}</td>
                <td class="px-4 py-3 text-slate-700">${p.inputs.age}</td>
                <td class="px-4 py-3 text-slate-700">${p.inputs.gender}</td>
                <td class="px-4 py-3 text-slate-700">${p.inputs.smsReceived ? "Yes" : "No"}</td>
                <td class="px-4 py-3 text-slate-700">${p.result}</td>
                <td class="px-4 py-3 text-slate-700">${p.confidence}%</td>
                <td class="px-4 py-3 text-slate-700">${date}</td>
              </tr>
            `;
          })
          .join("");
      }
    }
  };

  const filter = () => {
    const search = (qs("#hsSearchInput")?.value || "").toLowerCase();
    const filterVal = qs("#hsFilterSelect")?.value || "all";

    let filtered = allPredictions.filter((p) => {
      const name = generatePatientName(p.inputs.age, p.inputs.gender).toLowerCase();
      const matchesSearch = !search || name.includes(search);
      const matchesFilter =
        filterVal === "all" ||
        (filterVal === "attend" && p.result === "Likely to Attend") ||
        (filterVal === "no-show" && p.result === "Likely No-Show");
      return matchesSearch && matchesFilter;
    });

    renderTable(filtered);
  };

  qs("#hsSearchInput")?.addEventListener("input", filter);
  qs("#hsFilterSelect")?.addEventListener("change", filter);
  renderTable(allPredictions);
}

function initAdminAnalytics() {
  const predictions = loadAllPredictions();
  if (predictions.length === 0) return;

  const attendCount = predictions.filter((p) => p.result === "Likely to Attend").length;
  const noShowCount = predictions.length - attendCount;
  const attendPct = predictions.length > 0 ? Math.round((attendCount / predictions.length) * 100) : 0;
  const noShowPct = 100 - attendPct;

  const attendBar = qs("#hsBarAttend");
  const noShowBar = qs("#hsBarNoShow");
  const attendLabel = qs("#hsBarAttendLabel");
  const noShowLabel = qs("#hsBarNoShowLabel");

  if (attendBar) {
    attendBar.style.height = "0%";
    attendBar.style.transition = "height 800ms ease";
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        attendBar.style.height = `${attendPct}%`;
        if (attendLabel) attendLabel.textContent = `${attendPct}%`;
      });
    });
  }
  if (noShowBar) {
    noShowBar.style.height = "0%";
    noShowBar.style.transition = "height 800ms ease";
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        noShowBar.style.height = `${noShowPct}%`;
        if (noShowLabel) noShowLabel.textContent = `${noShowPct}%`;
      });
    });
  }

  const dayBars = qsa("[data-hs-day-bar]");
  if (dayBars.length) {
    const dayCounts = { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0 };
    predictions.forEach((p) => {
      const day = new Date(p.createdAt || Date.now()).getDay();
      const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const dayName = dayNames[day];
      if (dayCounts[dayName] !== undefined) dayCounts[dayName]++;
    });
    const max = Math.max(...Object.values(dayCounts), 1);
    dayBars.forEach((bar) => {
      const day = bar.getAttribute("data-hs-day-bar");
      const count = dayCounts[day] || 0;
      const pct = Math.round((count / max) * 100);
      bar.style.height = "0%";
      bar.style.transition = "height 800ms ease";
      bar.dataset.targetHeight = `${pct}%`;
    });
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        dayBars.forEach((bar) => {
          bar.style.height = bar.dataset.targetHeight || "0%";
        });
      });
    });
  }

  const confBars = qsa("[data-hs-conf-bar]");
  if (confBars.length) {
    const ranges = { "50-60": 0, "60-70": 0, "70-80": 0, "80-90": 0, "90-100": 0 };
    predictions.forEach((p) => {
      const conf = p.confidence || 0;
      if (conf >= 50 && conf < 60) ranges["50-60"]++;
      else if (conf >= 60 && conf < 70) ranges["60-70"]++;
      else if (conf >= 70 && conf < 80) ranges["70-80"]++;
      else if (conf >= 80 && conf < 90) ranges["80-90"]++;
      else if (conf >= 90) ranges["90-100"]++;
    });
    const max = Math.max(...Object.values(ranges), 1);
    confBars.forEach((bar) => {
      const range = bar.getAttribute("data-hs-conf-bar");
      const count = ranges[range] || 0;
      const pct = Math.round((count / max) * 100);
      bar.style.height = "0%";
      bar.style.transition = "height 800ms ease";
      bar.dataset.targetHeight = `${pct}%`;
    });
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        confBars.forEach((bar) => {
          bar.style.height = bar.dataset.targetHeight || "0%";
        });
      });
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

function fadeOutThenNavigate(href) {
  if (!contentRoot) { location.href = href; return; }
  contentRoot.style.transition = "opacity 200ms ease, transform 200ms ease";
  contentRoot.style.opacity = "0";
  contentRoot.style.transform = "translateY(-6px)";
  window.setTimeout(() => { location.href = href; }, 210);
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
  const fullPath = location.pathname || "";

  const isAdminPage = fullPath.includes("admin/");
  const expectedRole = isAdminPage ? "admin" : fullPath.includes("user/") ? "user" : null;

  if (expectedRole && !requireAuth(expectedRole)) {
    return;
  }

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
  const pathname = location.pathname || "";
  const isLoginPage = pathname.includes("login.html");
  const isLandingPage = pathname.includes("landing.html");

  if (isLoginPage) {
    initLogin();
    return;
  }

  const isRegisterPage = pathname.includes("register.html");
  if (isRegisterPage) {
    initRegister();
    return;
  }

  if (isLandingPage) {
    return;
  }

  if (!appRoot) return;
  initLayout();
  animateCards();

  const page = appRoot.dataset.page || "";
  if (page === "dashboard") initDashboard();
  if (page === "input") initInput();
  if (page === "predictions") initPredictions();
  if (page === "charts") initCharts();
  if (page === "logout") { logout(); return; }
  if (page === "admin-dashboard") initAdminDashboard();
  if (page === "admin-users") initAdminUsers();
  if (page === "admin-predictions") initAdminPredictions();
  if (page === "admin-analytics") initAdminAnalytics();
}

document.addEventListener("DOMContentLoaded", initApp);

