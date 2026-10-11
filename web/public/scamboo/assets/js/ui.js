/* Call protection prototype: shared UI (top bar, tab bar, icons, BM/EN, toasts) */
(function () {
  const svg = (p, w) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${w || 2}" stroke-linecap="round" stroke-linejoin="round">${p}</svg>`;
  const I = {
    shield: svg('<path d="M12 3 4.5 6v5.5c0 4.6 3.2 8.4 7.5 9.5 4.3-1.1 7.5-4.9 7.5-9.5V6z"/><path d="m8.8 12 2.2 2.2 4.4-4.4"/>'),
    shieldAlert: svg('<path d="M12 3 4.5 6v5.5c0 4.6 3.2 8.4 7.5 9.5 4.3-1.1 7.5-4.9 7.5-9.5V6z"/><path d="M12 8v4.5M12 16h.01"/>'),
    home: svg('<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/>'),
    phone: svg('<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z"/>'),
    clock: svg('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),
    family: svg('<circle cx="9" cy="7" r="3"/><path d="M3 21v-1a6 6 0 0 1 12 0v1"/><circle cx="17.5" cy="9.5" r="2.5"/><path d="M15.5 21v-.5a4.5 4.5 0 0 1 6-4.2"/>'),
    gear: svg('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>'),
    bot: svg('<rect x="4" y="8" width="16" height="12" rx="4"/><path d="M12 4v4M9 14h.01M15 14h.01M9.5 17.5h5"/>'),
    mic: svg('<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>'),
    micOff: svg('<path d="m3 3 18 18M9 9v2a3 3 0 0 0 5.1 2.1M15 10V6a3 3 0 0 0-5.7-1.3M19 11a7 7 0 0 1-1.1 3.8M5 11a7 7 0 0 0 11 5.7M12 18v3"/>'),
    keypad: svg('<path d="M6 5h.01M12 5h.01M18 5h.01M6 11h.01M12 11h.01M18 11h.01M6 17h.01M12 17h.01M18 17h.01"/>', 3),
    speaker: svg('<path d="M11 5 6 9H3v6h3l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14"/>'),
    bank: svg('<path d="M3 10 12 4l9 6M5 10v8M9.5 10v8M14.5 10v8M19 10v8M3 20h18"/>'),
    siren: svg('<path d="M7 18v-6a5 5 0 0 1 10 0v6M5 21h14M12 3v2M4.2 6.2l1.4 1.4M19.8 6.2l-1.4 1.4"/><rect x="5" y="18" width="14" height="3" rx="1"/>'),
    smile: svg('<circle cx="12" cy="12" r="9"/><path d="M8.5 14a4 4 0 0 0 7 0M9 9.5h.01M15 9.5h.01"/>', 2.2),
    check: svg('<path d="m5 12.5 4.5 4.5L19 7.5"/>', 3),
    bolt: svg('<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>'),
    eye: svg('<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>'),
    lock: svg('<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>'),
    flag: svg('<path d="M5 21V4M5 4h11l-2 4 2 4H5"/>'),
    snow: svg('<path d="M12 2v20M4.9 4.9l14.2 14.2M2 12h20M4.9 19.1 19.1 4.9"/>'),
    chevron: svg('<path d="m9 6 6 6-6 6"/>'),
    share: svg('<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4"/>'),
    back: svg('<path d="m15 6-6 6 6 6"/>'),
    users: svg('<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.5a3.5 3.5 0 0 1 0 7M21.5 20a6.5 6.5 0 0 0-4-6"/>'),
    lifebuoy: svg('<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3.5"/><path d="m5.6 5.6 3.9 3.9M14.5 14.5l3.9 3.9M18.4 5.6l-3.9 3.9M9.5 14.5l-3.9 3.9"/>'),
    bell: svg('<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.9 1.9 0 0 0 3.4 0"/>'),
    chart: svg('<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>'),
    globe: svg('<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>'),
    chevronDown: svg('<path d="m6 9 6 6 6-6"/>', 2.5),
    alert: svg('<path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/>'),
    search: svg('<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>'),
    vibrate: svg('<rect x="7" y="4" width="10" height="16" rx="2"/><path d="M3 8v8M21 8v8"/>'),
    spark: svg('<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6"/>'),
  };

  const S = () => Store.settings();
  const L = () => (S().lang === "en" ? 1 : 0);
  const t = pair => (Array.isArray(pair) ? pair[L()] : pair);

  const ELDER = () => S().role !== "guardian";

  // Accessibility preferences apply before anything renders (no flash of small text).
  function applyPrefs() {
    const s = S(), h = document.documentElement;
    h.dataset.size = s.size || "m";
    h.dataset.contrast = s.contrast || "normal";
    h.lang = s.lang === "en" ? "en" : "ms";
  }
  applyPrefs();

  // Elder mode: 3 big tabs. Guardian mode: dashboard, alerts, settings.
  const TABS = {
    elder: [
      { id: "home", href: "index.html", icon: "home", label: ["Utama", "Home"] },
      { id: "history", href: "history.html", icon: "clock", label: ["Sejarah", "History"] },
      { id: "help", href: "help.html", icon: "lifebuoy", label: ["Bantuan", "Help"] },
    ],
    guardian: [
      { id: "guardian", href: "guardian.html", icon: "chart", label: ["Ringkasan", "Overview"] },
      { id: "history", href: "history.html", icon: "bell", label: ["Amaran", "Alerts"] },
      { id: "settings", href: "settings.html", icon: "gear", label: ["Tetapan", "Settings"] },
    ],
  };
  const SIZES = ["m", "l", "xl"];

  function mount(active, opts) {
    opts = opts || {};
    const s = S();
    if (!s.onboarded && !opts.skipOnboarding) { location.replace("onboarding.html"); return; }
    splash();
    const app = document.querySelector(".app");
    const elder = ELDER();
    const mode = s.mode === "jaga_penuh" ? "Jaga Penuh" : "Standard";
    const who = elder ? { ini: "MR", name: "Mak Rosnah" } : { ini: "AM", name: "Amir" };
    const top = document.createElement("header");
    top.className = "topbar";
    top.innerHTML = `
      <div class="brand"><span class="mark"><img src="assets/brand/ghost-96.png" alt=""></span>
        <div><b class="wm" aria-label="ScamBoo">Scam<em>Boo</em></b>
        <small><i class="live-dot"></i>${t(["Aktif", "On"])} · ${mode}</small></div></div>
      <div class="top-actions">
        ${s.readAloud ? `<button class="icon-btn" id="readBtn" aria-label="${t(["Baca skrin ini", "Read this screen aloud"])}">${I.speaker}</button>` : ""}
        <button class="icon-btn" id="sizeBtn" aria-label="${t(["Saiz tulisan", "Text size"])}"><span class="aa">A<small>A</small></span></button>
        <button class="who-chip" id="whoBtn" aria-label="${t(["Tukar pengguna", "Switch user"])}"><span>${who.ini}</span>${I.chevronDown}</button>
      </div>`;
    app.prepend(top);
    const tabs = TABS[elder ? "elder" : "guardian"];
    const bar = document.createElement("nav");
    bar.className = "tabbar";
    bar.style.gridTemplateColumns = `repeat(${tabs.length}, 1fr)`;
    bar.setAttribute("aria-label", t(["Menu utama", "Main menu"]));
    bar.innerHTML = tabs.map(x => `<a class="tab ${x.id === active ? "active" : ""}" href="${x.href}" ${x.id === active ? 'aria-current="page"' : ""}>
      <span class="tab-ico">${I[x.icon]}</span>${t(x.label)}</a>`).join("");
    app.appendChild(bar);

    const sizeBtn = document.getElementById("sizeBtn");
    sizeBtn.onclick = () => {
      const next = SIZES[(SIZES.indexOf(S().size) + 1) % SIZES.length];
      Store.set({ size: next }); applyPrefs();
      toast(t([["Tulisan biasa", "Tulisan besar", "Tulisan paling besar"], ["Normal text", "Large text", "Largest text"]])[SIZES.indexOf(next)]);
    };
    const readBtn = document.getElementById("readBtn");
    if (readBtn) readBtn.onclick = readPage;
    document.getElementById("whoBtn").onclick = openWhoSheet;
    applyText();
  }

  function openWhoSheet() {
    const elder = ELDER();
    const wrap = document.createElement("div");
    wrap.className = "sheet-wrap";
    wrap.innerHTML = `<div class="sheet" role="dialog" aria-modal="true" aria-label="${t(["Tukar pengguna", "Switch user"])}"><div class="grab"></div>
      <h2 style="font-size:1.4rem">${t(["Siapa yang guna sekarang?", "Who is using the app?"])}</h2>
      <div class="who-grid">
        <button class="who-tile ${elder ? "on" : ""}" data-role="elder"><span class="avatar av-teal">MR</span><b>Mak Rosnah</b><small>${t(["Paparan mudah", "Simple view"])}</small></button>
        <button class="who-tile ${elder ? "" : "on"}" data-role="guardian"><span class="avatar av-violet">AM</span><b>Amir</b><small>Guardian</small></button>
      </div>
      <div class="row" style="margin-top:14px;gap:10px">
        <button class="btn btn-outline grow" id="langSwap">${I.globe}${S().lang === "en" ? "Bahasa Malaysia" : "English"}</button>
        <button class="btn btn-ghost" id="whoClose">${t(["Tutup", "Close"])}</button>
      </div>
      <a class="btn btn-ghost btn-block" href="settings.html">${I.gear}${t(["Tetapan senang dibaca", "Easy-to-read settings"])}</a></div>`;
    document.body.appendChild(wrap);
    trapFocus(wrap.querySelector(".sheet"));
    wrap.querySelectorAll(".who-tile").forEach(b => b.onclick = () => {
      Store.set({ role: b.dataset.role });
      location.href = b.dataset.role === "guardian" ? "guardian.html" : "index.html";
    });
    wrap.querySelector("#langSwap").onclick = () => { Store.set({ lang: S().lang === "en" ? "bm" : "en" }); location.reload(); };
    wrap.querySelector("#whoClose").onclick = () => wrap.remove();
    wrap.addEventListener("click", e => { if (e.target === wrap) wrap.remove(); });
  }

  // Keep keyboard / switch-access focus inside an open sheet.
  function trapFocus(box) {
    const els = () => [...box.querySelectorAll("button, a[href], input, textarea, select")].filter(x => !x.disabled);
    const first = els()[0]; if (first && first.focus) first.focus();
    box.addEventListener("keydown", e => {
      if (e.key !== "Tab") return;
      const list = els(); if (!list.length) return;
      const a = list[0], z = list[list.length - 1];
      if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); }
      else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); }
    });
  }

  // ---------- speech (shared by read-aloud, in-call whispers and the AI decoy) ----------
  function speak(text, o) {
    o = o || {};
    if (!("speechSynthesis" in window) || !text) return Promise.resolve();
    return new Promise(res => {
      const u = new SpeechSynthesisUtterance(text);
      const en = o.lang === "en" || (!o.lang && S().lang === "en");
      u.lang = en ? "en-GB" : "ms-MY"; u.rate = o.rate || 0.9; u.pitch = o.pitch || 1; u.volume = o.volume == null ? 1 : o.volume;
      const vs = speechSynthesis.getVoices();
      const v = en ? vs.find(x => /^en/i.test(x.lang)) : (vs.find(x => /^ms/i.test(x.lang)) || vs.find(x => /^id/i.test(x.lang)));
      if (v) u.voice = v;
      u.onend = u.onerror = () => res();
      if (!o.queue) speechSynthesis.cancel();
      speechSynthesis.speak(u);
      setTimeout(res, Math.min(15000, 1500 + text.length * 90));
    });
  }
  function readPage() {
    const parts = [];
    const h = document.querySelector("main h1"); if (h) parts.push(h.textContent);
    document.querySelectorAll("[data-read]").forEach(el => { if (el.offsetParent !== null || !el.closest(".hidden")) parts.push(el.textContent); });
    speak(parts.join(". ").replace(/\s+/g, " ").trim());
    toast(t(["🔊 Membaca skrin…", "🔊 Reading the screen…"]));
  }
  if ("speechSynthesis" in window) { try { speechSynthesis.getVoices(); } catch (e) { /* ignore */ } }

  // Elements with data-bm / data-en swap text by language.
  function applyText(root) {
    (root || document).querySelectorAll("[data-bm]").forEach(el => { el.innerHTML = L() ? el.dataset.en : el.dataset.bm; });
    (root || document).querySelectorAll("[data-icon]").forEach(el => { el.innerHTML = I[el.dataset.icon] || ""; });
    (root || document).querySelectorAll("[data-ph-bm]").forEach(el => { el.placeholder = L() ? el.dataset.phEn : el.dataset.phBm; });
  }

  let toastTimer;
  function toast(msg) {
    let el = document.querySelector(".toast");
    if (!el) { el = document.createElement("div"); el.className = "toast"; el.setAttribute("role", "status"); document.body.appendChild(el); }
    el.textContent = msg; el.classList.add("show");
    clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove("show"), 2200);
  }

  // Elders see plain words; the guardian sees the risk level.
  const tierBadge = tier => ELDER() ? ({
    HIGH: `<span class="badge b-red">${t(["Penipuan", "Scam"])}</span>`,
    MEDIUM: `<span class="badge b-orange">${t(["Hati-hati", "Careful"])}</span>`,
    NOT_SURE: `<span class="badge b-grey">${t(["Tak pasti", "Not sure"])}</span>`,
    LOW: `<span class="badge b-green">${t(["Selamat", "Safe"])}</span>`,
  }[tier]) : ({
    HIGH: `<span class="badge b-red">● ${t(["Risiko tinggi", "High risk"])}</span>`,
    MEDIUM: `<span class="badge b-orange">● ${t(["Risiko sederhana", "Medium risk"])}</span>`,
    NOT_SURE: `<span class="badge b-grey">● ${t(["Tak pasti", "Not sure"])}</span>`,
    LOW: `<span class="badge b-green">● ${t(["Selamat", "Safe"])}</span>`,
  }[tier]);

  if ("serviceWorker" in navigator && window.isSecureContext) {
    window.addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => { /* offline cache optional */ }));
  }
  const standalone = () => (window.matchMedia && matchMedia("(display-mode: standalone)").matches) || navigator.standalone === true;

  // Launch splash: once per session when opened as an installed app (or with ?splash for the pitch).
  function splash() {
    const forced = /[?&]splash\b/.test(location.search);
    let seen = false;
    try { seen = sessionStorage.getItem("boo_splash") === "1"; } catch (e) { /* storage blocked */ }
    if (!forced && (seen || !standalone())) return;
    try { sessionStorage.setItem("boo_splash", "1"); } catch (e) { /* storage blocked */ }
    const el = document.createElement("div");
    el.className = "splash"; el.setAttribute("aria-hidden", "true");
    el.innerHTML = '<img src="assets/brand/logo.png" alt="">';
    document.body.appendChild(el);
    const hide = () => { el.classList.add("out"); setTimeout(() => el.remove(), 400); };
    el.onclick = hide;
    setTimeout(hide, 1100);
  }

  // Family invite: native share sheet, or WhatsApp as a fallback. Only ever runs on a tap.
  function shareInvite() {
    const url = location.origin + location.pathname.replace(/[^/]*$/, "") + "index.html";
    const text = t(["Saya guna ScamBoo untuk elak panggilan penipuan. Ia beri amaran sebelum kita rugi duit, dan boleh jawab penipu untuk kita. Jom pasang:",
                    "I use ScamBoo to stop scam calls. It warns you before you lose money, and can answer scammers for you. Install it here:"]);
    if (navigator.share) {
      navigator.share({ title: "ScamBoo", text, url }).catch(() => { /* user cancelled */ });
      return "share";
    }
    window.open("https://wa.me/?text=" + encodeURIComponent(text + " " + url), "_blank", "noopener");
    return "whatsapp";
  }

  window.UI = { I, mount, t, L, applyText, applyPrefs, toast, tierBadge, standalone, splash, shareInvite, speak, readPage, trapFocus, elder: ELDER };
})();
