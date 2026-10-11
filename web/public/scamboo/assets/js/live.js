/* ScamBoo ↔ team server adapter. Our screens only talk to this file; it talks to the team's
   /api/test route (web/src/app/api/test/route.ts), configured in lab-config.js.
   Never holds GPU keys and never calls a GPU directly. */
(function () {
  const CFG = window.SCAMBOO_LAB || { base: null };
  const q = new URLSearchParams(location.search).get("lab");
  const BASE = q !== null ? q.replace(/\/$/, "") : CFG.base;
  const API = (BASE || "") + (CFG.api || "/api/test");
  const D = CFG.defaults || {};
  const TIMEOUT = 25000;
  const KEY_STORE = "scamboo_access_key";

  // Signal IDs from web/src/lib/risk.ts, in plain words for the cards.
  const LABELS = {
    authority: ["Mengaku pihak berkuasa", "Claims to be an authority"],
    urgency: ["Desak bertindak segera", "Pushes you to act now"],
    secrecy: ["Suruh rahsiakan", "Tells you to keep it secret"],
    credentials: ["Minta PIN / kata laluan", "Asks for a PIN / password"],
    otp: ["Minta TAC / OTP", "Asks for a TAC / OTP"],
    transfer: ["Minta pindah duit", "Asks you to move money"],
    remote_app: ["Suruh pasang aplikasi kawalan jauh", "Asks you to install a remote-control app"],
  };
  const ASK = /^(otp|credentials|transfer)$/;          // caller asked for a code or money
  const HARD = /^(otp|credentials|transfer|secrecy|remote_app)$/;  // money is about to move

  const accessKey = {
    get() { try { return localStorage.getItem(KEY_STORE) || ""; } catch (e) { return ""; } },
    set(v) { try { v ? localStorage.setItem(KEY_STORE, v) : localStorage.removeItem(KEY_STORE); } catch (e) { /* storage blocked */ } },
  };

  async function req(url, body) {
    const ctl = typeof AbortController !== "undefined" ? new AbortController() : null;
    const timer = ctl && setTimeout(() => ctl.abort(), TIMEOUT);
    const t0 = Date.now();
    try {
      const headers = { "Content-Type": "application/json" };
      const k = accessKey.get(); if (k) headers["x-scamboo-key"] = k;
      const r = await fetch(url, { method: body === undefined ? "GET" : "POST", headers, cache: "no-store",
        body: body === undefined ? undefined : JSON.stringify(body), signal: ctl ? ctl.signal : undefined });
      const out = await r.json().catch(() => ({}));
      if (!r.ok) {
        const err = new Error(out.error || `HTTP ${r.status}`);
        err.status = r.status; throw err;
      }
      return { out, ms: Date.now() - t0 };
    } catch (e) {
      const err = e.name === "AbortError" ? new Error("timed out") : e;
      err.service = err.service || (body && body.kind === "agent" ? "Qwen C2" : body ? "Qwen C1" : "server");
      throw err;
    } finally { if (timer) clearTimeout(timer); }
  }

  // ---------- settings: shared lab settings if configured, else the repo defaults ----------
  let settings = { riskPrompt: D.riskPrompt, victimPrompt: D.victimPrompt, callerPrompt: D.callerPrompt, weights: D.weights || {}, threshold: D.threshold || 50 };
  let revision = "default", poller = null;
  async function loadSettings() {
    if (CFG.settingsUrl) {
      const { out } = await req(CFG.settingsUrl);
      const s = out.settings || out;
      settings = Object.assign({}, settings, s, { weights: Object.assign({}, settings.weights, s.weights || {}) });
      revision = out.revision != null ? out.revision : revision;
    }
    return { settings, revision };
  }
  function pollSettings(on) {
    clearInterval(poller);
    if (on && CFG.settingsUrl) poller = setInterval(() => loadSettings().catch(() => {}), 3000);
  }

  // ---------- transcript ----------
  const plain = s => String(s || "").replace(/<[^>]+>/g, "").replace(/&lt;/g, "<");
  const WHO = { caller: "Caller", user: "Recipient", ai: "Recipient (AI agent)" };
  const transcript = turns => turns.map(x => `${WHO[x.who] || x.who}: ${plain(x.text)}`).join("\n");

  // ---------- risk (Qwen C1 through the server) ----------
  let lastMode = null;
  async function risk(turns) {
    await loadSettings().catch(() => {});
    const weights = {};
    Object.keys(LABELS).forEach(id => { weights[id] = Math.max(0, Math.min(100, Math.round(Number(settings.weights[id]) || 0))); });
    const threshold = Math.max(1, Math.min(100, Math.round(Number(settings.threshold) || 50)));
    const { out, ms } = await req(API, { kind: "risk", transcript: transcript(turns), prompt: settings.riskPrompt, weights, threshold });
    lastMode = out.mode || null;
    const evidence = (out.findings || []).map(f => ({ id: f.id, quote: f.evidence || "", label: (LABELS[f.id] || [f.id])[0],
      labelEn: (LABELS[f.id] || [f.id, f.id])[1], weight: weights[f.id] || 0 }));
    const ids = evidence.map(e => e.id);
    return {
      score: Number(out.score) || 0, threshold: Number(out.threshold) || threshold, crossed: !!out.intervene,
      evidence, hard: ids.filter(id => HARD.test(id)), asked: ids.some(id => ASK.test(id)),
      category: ids.includes("authority") ? ["Mengaku polis / bank (mungkin palsu)", "Claims to be police / a bank (possibly fake)"] : null,
      revision, mode: out.mode, ms,
    };
  }

  // ---------- agent lines (Qwen C2 through the server) ----------
  async function agent(turns, audience) {
    await loadSettings().catch(() => {});
    const prompt = audience === "victim" ? settings.victimPrompt : settings.callerPrompt;
    const { out, ms } = await req(API, { kind: "agent", transcript: transcript(turns), prompt, audience: audience === "victim" ? "victim" : "caller" });
    lastMode = out.mode || lastMode;
    const text = plain(out.text || "").replace(/<think>[\s\S]*?<\/think>/g, "").trim();
    return { text, ms, mode: out.mode };
  }

  // ---------- voices: server TTS when a route exists, else the phone's own voice ----------
  let current = null;
  async function say(text, engine, lang) {
    if (!CFG.tts) {
      if (window.UI && UI.speak) await UI.speak(text, { lang: lang === "en" ? "en" : "ms", rate: 0.95 });
      return { device: true };
    }
    const r = await fetch((BASE || "") + CFG.tts, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text, engine, language: lang || "ms" }) });
    if (!r.ok) { const e = new Error(`HTTP ${r.status}`); e.service = engine; throw e; }
    const blob = await r.blob();
    if (current) { try { current.pause(); } catch (e) { /* ignore */ } }
    if (typeof Audio === "undefined" || !URL.createObjectURL) return { played: false };
    const a = new Audio(URL.createObjectURL(blob)); current = a;
    await new Promise(res => { a.onended = res; a.onerror = res; const p = a.play(); if (p && p.catch) p.catch(res); });
    return { played: true };
  }

  // ---------- readiness: the server route answers GET {c1, c2} ----------
  let status = null, readyP = null;
  function ready() {
    if (!readyP) readyP = BASE === null || BASE === undefined ? Promise.resolve(false)
      : req(API).then(({ out }) => { status = out; return loadSettings().catch(() => {}).then(() => true); }, () => false);
    return readyP;
  }
  // "live" = real Qwen; "mock" = the server's built-in examples (no GPU configured there)
  const mode = () => lastMode || (status ? (status.c1 ? "live" : "mock") : null);

  window.Live = { ready, configured: () => BASE !== null && BASE !== undefined, base: () => BASE, api: API,
                  loadSettings, pollSettings, risk, agent, say, accessKey, mode, status: () => status,
                  settings: () => settings, revision: () => revision, LABELS, voiceRoute: () => !!CFG.tts };
})();
