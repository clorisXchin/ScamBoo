/* Call protection prototype: the scripted "Insp. Lee" demo call.
   Lines, tiers and reasons mirror what the real model produced on this script
   (ScamShield-AI/modules/stt_simulator.py DEMO_CALLS + explainer output). */
(function () {
  const { I, t, L } = UI;
  const $ = id => document.getElementById(id);
  const S = Store.settings();
  const JAGA = S.mode === "jaga_penuh";
  // Elders see words, not percentages. Guardians and judges (call.html?judge) also see the number.
  const SHOW_PCT = !UI.elder() || /judge/.test(location.search);
  const COUNT = Number(S.countdown) || 0;

  // ---------- script (t = seconds into the call) ----------
  const TURNS = [
    { t: 3, who: "caller", text: "Hello puan, saya call dari Pos Laju pasal satu bungkusan atas nama puan.", risk: 23, tier: "LOW" },
    { t: 7, who: "caller", text: "Bungkusan tu ada <mark>barang terlarang</mark>, dokumen tak lengkap.", risk: JAGA ? 59 : 74, tier: "MEDIUM", alert: "MED" },
    { t: 11, who: "user", text: "Bungkusan apa? Saya tak hantar apa-apa pun." },
    { t: 16, who: "caller", text: "Kalau macam tu saya <mark>sambungkan puan kepada Inspektor Lee</mark> dari Bukit Aman.", risk: 97, tier: "HIGH", alert: "HIGH" },
    { t: 21, who: "caller", text: "Puan, ini Inspektor Lee. IC puan <mark>terlibat dalam kes pengubahan wang haram</mark>.", risk: 99, tier: "HIGH" },
    { t: 25, who: "user", text: "Ya Allah, saya tak buat apa-apa encik." },
    { t: 29, who: "caller", text: "Ini kes sulit, <mark>jangan bagitau sesiapa</mark> termasuk anak puan. Ada waran tangkap.", risk: 100, tier: "HIGH" },
    { t: 34, who: "caller", text: "Untuk bersihkan nama puan, <mark>bagi saya nombor TAC</mark> yang baru sampai sekarang juga.", risk: 100, tier: "HIGH", alert: "TAC", ask: true },
    { t: 39, who: "caller", text: "Lepas tu <mark>pindahkan duit ke akaun selamat</mark> Maybank 5621 4408 9913.", risk: 100, tier: "HIGH", evidence: ["Maybank", "5621-4408-9913"] },
  ];
  const DECOY = [
    "Hello? Ya encik, saya dengar. Sekejap ya, saya tengah cari cermin mata.",
    "Maaf encik, telefon saya ni perlahan sikit. Encik dari balai mana tadi?",
    "Oh begitu. Kalau saya nak pindah duit, akaun bank mana ya encik? Nombor akaun berapa?",
    "Sekejap, saya tulis dulu. Nama pemegang akaun tu siapa encik?",
    "Saya kena pergi bank dulu sebab saya tak pandai guna app. Encik boleh tunggu?",
    "Baik encik, terima kasih. Saya letak dulu ya.",
  ];
  const CARDS = {
    MED: {
      cls: "med", lvl: ["RISIKO SEDERHANA", "MEDIUM RISK"], words: ["Hati-hati", "Be careful"], pct: JAGA ? 59 : 74,
      type: ["Kurier / bungkusan (mungkin jadi polis palsu)", "Courier / parcel (may become fake police)"],
      reasons: [
        [["Tuduh anda terlibat kes", "Accuses you of something"], "Bungkusan tu ada barang terlarang, dokumen tak lengkap."],
        [["Isu bungkusan / kastam", "Parcel / customs issue"], "saya call dari Pos Laju pasal satu bungkusan atas nama puan"],
        [["Nombor tidak dikenali, bukan kenalan", "Unknown number, not a saved contact"], null],
      ],
      next: [["Biasanya disambung kepada 'polis' palsu", "Often handed to a fake police officer"], 41],
      advice: ["Jangan kongsi IC atau maklumat bank. Dengar baik-baik.", "Don't share your IC or bank details. Listen carefully."],
      conf: ["sederhana", "medium"],
    },
    HIGH: {
      cls: "high", lvl: ["RISIKO TINGGI", "HIGH RISK"], words: ["Ini mungkin penipuan", "This may be a scam"], pct: 97,
      type: ["Polis palsu (Macau scam)", "Fake police (Macau scam)"],
      reasons: [
        [["Sambung ke 'pegawai' lain", "Passes you to another 'officer'"], "saya sambungkan puan kepada Inspektor Lee dari Bukit Aman"],
        [["Tuduh anda terlibat kes", "Accuses you of something"], "Bungkusan tu ada barang terlarang"],
        [["Mengaku pihak berkuasa", "Claims to be an authority"], "Inspektor Lee dari Bukit Aman"],
      ],
      next: [["'Pegawai' kedua biasanya minta duit", "The second 'officer' usually asks for money"], 78],
      advice: ["Biar AI bercakap untuk anda. Jangan beri TAC.", "Let the AI talk for you. Don't share your TAC."],
      conf: ["tinggi", "high"],
    },
    TAC: {
      cls: "high", lvl: ["RISIKO TINGGI · DIA MINTA TAC", "HIGH RISK · ASKING FOR TAC"], words: ["Jangan beri TAC!", "Don't give your TAC!"], pct: 100,
      type: ["Polis palsu (Macau scam)", "Fake police (Macau scam)"],
      reasons: [
        [["Minta TAC / pindah duit", "Asks for TAC / a transfer"], "bagi saya nombor TAC yang baru sampai sekarang juga"],
        [["Suruh rahsiakan", "Tells you to keep it secret"], "jangan bagitau sesiapa termasuk anak puan"],
        [["Tuduh anda terlibat kes", "Accuses you of a crime"], "IC puan terlibat dalam kes pengubahan wang haram"],
      ],
      next: [["Sedang minta TAC sekarang", "Asking for your TAC right now"], 100],
      advice: ["Polis tak pernah minta TAC. Serahkan kepada AI atau letak telefon.", "Police never ask for a TAC. Hand over to the AI or hang up."],
      conf: ["tinggi", "high"],
    },
  };

  // ---------- state ----------
  const st = { phase: "incoming", i: 0, clock: 0, route: null, firstWarn: null, ask: null, alerts: 0,
               evidence: [], decoy: 0, events: [], timeline: [], speed: 1, timer: null, tick: null, countdown: null, shared: [],
               heard: [], live: false, lastAlertScore: 0, seenIds: new Set(), tacCard: false, liveNote: null };
  // Live mode: the lab's real models (Qwen C1/C2, Fish, Chatterbox) replace the scripted values. See live.js / lab-config.js.
  const LIVE = window.Live;
  const liveReady = LIVE ? LIVE.ready().then(ok => { st.live = ok; paintMode(); return ok; }) : Promise.resolve(false);
  function paintMode() {
    const el = $("modePill"); if (!el) return;
    el.className = "mode-pill " + (st.live ? "on" : "");
    const m = st.live && LIVE.mode();
    el.textContent = !st.live ? t(["Mod reka bentuk", "Design mode"])
      : st.liveNote ? t(["LIVE · sebahagian guna skrip", "LIVE · partly scripted"])
      : m === "mock" ? t(["Contoh pelayan (tiada GPU)", "Server examples (no GPU)"]) : "LIVE · Qwen";
    el.title = st.liveNote || "";
  }
  function liveFail(e) {
    st.liveNote = e.message;
    UI.toast(t([`Perkhidmatan ${e.service || "AI"} tidak tersedia, guna skrip untuk langkah ini`, `${e.service || "AI"} unavailable, using the script for this step`]));
    paintMode();
  }
  const STEP_MS = () => 2300 / st.speed;
  const log = (bm, en) => st.events.push({ t: st.clock, text: [bm, en] });

  // ---------- voice ----------
  // The AI decoy always speaks Malay to the caller.
  const speak = text => (S.voice ? UI.speak(text, { lang: "ms", rate: 0.92 }) : Promise.resolve());

  // In-call whisper: she holds the phone to her ear and can't see the screen, so the warning is
  // spoken softly into the call audio and the phone vibrates.
  const WHISPER = {
    MED: ["Mak, hati-hati. Panggilan ini nampak mencurigakan.", "Careful. This call looks suspicious."],
    HIGH: ["Amaran. Ini mungkin penipuan. Jangan beri TAC. Tekan butang besar untuk biar AI bercakap.", "Warning. This may be a scam. Don't give your TAC. Press the big button to let the AI talk."],
    TAC: ["Jangan beri TAC. Polis tak pernah minta TAC.", "Don't give your TAC. Police never ask for it."],
  };
  function whisper(kind) {
    if (!S.voice) return;
    try { if (navigator.vibrate) navigator.vibrate([300, 150, 300, 150, 600]); } catch (e) { /* not supported */ }
    UI.speak(t(WHISPER[kind]), { rate: 0.95 });
    st.whispered = kind;
    const slot = $("whisperSlot");
    if (slot) slot.innerHTML = `<div class="whisper">${I.speaker}<span>${t(["Amaran dibisikkan ke telinga anda + getaran", "Warning whispered in your ear + vibration"])}</span></div>`;
  }

  // ---------- rendering helpers ----------
  const fmt = s => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
  function setRisk(risk, tier) {
    const bar = $("bar"); if (!bar) return;
    bar.style.width = Math.max(4, risk) + "%";
    bar.style.background = tier === "HIGH" ? "var(--red)" : tier === "MEDIUM" ? "var(--orange)" : "var(--green)";
    $("riskLbl").textContent = st.liveScore
      ? (SHOW_PCT ? `${t(["Skor", "Score"])} ${st.liveScore.score} / ${st.liveScore.threshold}` : t({ HIGH: ["Bahaya", "Danger"], MEDIUM: ["Hati-hati", "Careful"], LOW: ["Nampak normal", "Looks normal"] }[tier]))
      : `${t(["Risiko", "Risk"])} ${Math.round(risk)}%`;
    $("riskChip").innerHTML = tier === "LOW" ? `<span class="normal-chip">✓ ${t(["Nampak normal", "Looks normal"])}</span>`
      : tier === "MEDIUM" ? `<span class="badge b-orange">● ${t(["Sederhana", "Medium"])}</span>` : `<span class="badge b-red">● ${t(["Tinggi", "High"])}</span>`;
  }
  function bubble(who, html) {
    const box = $("transcript"); if (!box) return;
    const name = { caller: t(["Pemanggil", "Caller"]), user: "Mak Rosnah", ai: '<img class="boo-sm" src="assets/brand/ghost-96.png" alt=""> Boo (AI)' }[who];
    const d = document.createElement("div");
    d.className = `bub bub-${who}`;
    d.innerHTML = `<small>${name}</small>${html}`;
    box.appendChild(d);
    while (box.children.length > 4) box.removeChild(box.firstChild);
  }

  // ---------- screens ----------
  const root = $("root");
  function callShell(extra) {
    document.querySelector(".app").classList.add("call-app");
    return `
      <div class="call-top"><span class="prot-pill">${I.shield}${t(["Perlindungan aktif", "Protection on"])}</span>
        <span class="mode-pill" id="modePill"></span></div>
      <div class="caller"><div class="ava">👮</div><h2>+60 3-2266 xxxx</h2>
        <div class="num">${t(["Nombor tidak dikenali · Kuala Lumpur", "Unknown number · Kuala Lumpur"])}</div>
        <div class="timer" id="timer">${fmt(st.clock)}</div></div>
      ${extra || ""}`;
  }

  function showIncoming() {
    st.phase = "incoming";
    root.innerHTML = callShell(`
      <div class="guard-note">${I.shield}<div><b>${t(["Kami akan dengar panggilan ini", "We'll listen to this call"])}</b><br>
        <span style="opacity:.8;font-size:14px">${t(["Nombor tidak dikenali. Analisis berlaku dalam telefon anda.", "Unknown number. Analysis stays on your phone."])}</span></div></div>
      <div class="answer-row">
        <button class="rb rb-red" id="decline"><span>${I.phone}</span>${t(["Tolak", "Decline"])}</button>
        <button class="rb rb-green" id="answer"><span>${I.phone}</span>${t(["Jawab", "Answer"])}</button>
      </div>`);
    $("timer").textContent = t(["Panggilan masuk…", "Incoming call…"]);
    paintMode();
    $("answer").onclick = startCall;
    $("decline").onclick = () => { location.href = "index.html"; };
  }

  function showLive() {
    root.innerHTML = callShell(`
      <div class="meter"><div class="meter-top"><span id="riskLbl"></span><span id="riskChip"></span></div><div class="bar"><i id="bar"></i></div></div>
      <div id="whisperSlot"></div>
      <div class="transcript" id="transcript" aria-live="polite"></div>
      ${st.live && st.route !== "ai" ? `<form class="typed" id="typed"><input id="typedIn" autocomplete="off" placeholder="${t(["Taip ayat pemanggil…", "Type what the caller says…"])}" aria-label="${t(["Ayat pemanggil", "Caller's words"])}"><button class="btn btn-sm btn-light" type="submit">${t(["Hantar", "Send"])}</button></form>` : ""}
      <div id="checking"></div>
      <div id="aiZone"></div>
      <div class="controls">
        <div class="ctl"><span>${st.route === "ai" ? I.micOff : I.mic}</span>${st.route === "ai" ? t(["Senyap", "Muted"]) : t(["Mikrofon", "Mic"])}</div>
        <div class="ctl"><span>${I.keypad}</span>${t(["Pad kekunci", "Keypad"])}</div>
        <div class="ctl"><span>${I.speaker}</span>${t(["Pembesar suara", "Speaker"])}</div>
      </div>
      <button class="end-call" id="endBtn" aria-label="End call">${I.phone}</button>`);
    $("endBtn").onclick = () => endCall(st.route === "ai" ? "ai" : "user");
    paintMode();
    if ($("typed")) $("typed").onsubmit = e => {
      e.preventDefault();
      const v = $("typedIn").value.trim(); if (!v) return;
      $("typedIn").value = "";
      TURNS.splice(st.i, 0, { t: Math.round(st.clock) + 1, who: "caller", text: v.replace(/</g, "&lt;"), typed: true });
      clearTimeout(st.timer); nextTurn();
    };
    const last = st.timeline[st.timeline.length - 1];
    setRisk(last ? last.risk : 0, last ? last.tier : "LOW");
    if (st.route === "ai") renderAiZone();
  }

  function renderAiZone() {
    $("aiZone").innerHTML = `
      <div class="ai-panel"><h3><img class="boo boo-calm" id="booImg" src="assets/brand/ghost-96.png" alt=""> ${t(["Boo (AI) bercakap untuk anda", "Boo (AI) is talking for you"])}</h3>
        <p>${t(["Suara anda dimatikan. Penipu kini bercakap dengan hantu kami. Boo tak akan kongsi maklumat sebenar.", "You're muted. The scammer is now talking to our ghost. Boo never shares real details."])}</p>
        <div class="wave idle" id="wave"><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div>
        <p class="tiny" id="voiceNote" style="color:rgba(255,255,255,.75)"></p></div>
      <div id="guideSlot"></div>
      <div class="evidence" id="evBox"><b>${t(["Bukti dikumpul", "Evidence captured"])}</b>
        <div id="evList">${st.evidence.map(e => `<span class="ev">${e}</span>`).join("") || `<span class="tiny" style="color:rgba(255,255,255,.6)">${t(["Menunggu…", "Waiting…"])}</span>`}</div></div>
      <div id="warnedSlot"></div>`;
    if (st.ask !== null) renderWarned();
  }

  function renderWarned() {
    const slot = $("warnedSlot"); if (!slot || st.firstWarn === null) return;
    const secs = st.ask - st.firstWarn;
    slot.innerHTML = `<div class="warned"><div class="big">${secs} ${t(["saat", "seconds"])}</div>
      <p>${t(["Diberi amaran lebih awal sebelum dia minta TAC", "warned before he asked for the TAC"])}</p></div>`;
  }

  // ---------- flow ----------
  function startCall() {
    st.phase = "live"; st.clock = 0;
    if (st.live) LIVE.pollSettings(true);  // lab prompt/threshold edits apply mid-call
    log("Perlindungan aktif: AI mula mendengar", "Protection on: the AI started listening");
    showLive();
    // The call clock runs ~4.5 call-seconds per turn step, so the timer matches the script's timestamps.
    st.tick = setInterval(() => {
      if (st.phase !== "live") return;
      const next = TURNS[st.i] ? TURNS[st.i].t : st.clock + 1;
      st.clock = Math.min(next, st.clock + 0.25 * 4.5 / (STEP_MS() / 1000));
      const el = $("timer"); if (el) el.textContent = fmt(st.clock);
    }, 250);
    schedule();
  }
  function schedule() { clearTimeout(st.timer); st.timer = setTimeout(nextTurn, STEP_MS()); }

  async function nextTurn() {
    if (st.phase !== "live") return;
    if (st.i >= TURNS.length) { if (st.route === "ai") await aiReply(true); endCall(st.route === "ai" ? "ai" : "caller"); return; }
    const turn = TURNS[st.i++];
    st.clock = Math.max(st.clock, turn.t);
    if (turn.who === "user" && st.route === "ai") { schedule(); return; } // muted after hand-over
    bubble(turn.who, turn.text);
    st.heard.push({ who: turn.who, text: turn.text, t: turn.t });
    if (st.live && turn.who === "caller" && st.route !== "ai") {
      const opened = await liveRisk(turn);
      if (opened === true) return;            // a live alert is showing
      if (opened === false) { schedule(); return; }
      // null = the lab failed: fall through to the scripted values for this step
    }
    if (turn.typed) { schedule(); return; }
    if (turn.risk !== undefined) {
      st.timeline.push({ t: turn.t, risk: turn.risk, tier: turn.tier });
      setRisk(turn.risk, turn.tier);
    }
    if (turn.ask && st.ask === null) { st.ask = turn.t + 1; log("Pemanggil minta TAC", "The caller asked for the TAC"); }
    if (turn.evidence && st.route === "ai") addEvidence(turn.evidence);

    // Alerts
    if (turn.alert && st.route !== "ai") {
      const kind = turn.alert;
      const show = st.alerts === 0 || kind === "TAC" || (kind === "HIGH" && st.alerts < 2);
      if (show) { st.alerts++; if (st.firstWarn === null) st.firstWarn = turn.t + 3; return openAlert(kind); }  // scored on the next 5 s chunk, like the real app
    }
    if (turn.who === "caller" && st.route === "ai") { await aiReply(); }
    if (st.route === "ai" && turn.ask) renderWarned();
    schedule();
  }

  // Real C1 analysis on everything heard so far. Returns true if an alert opened, false if not, null on failure.
  async function liveRisk(turn) {
    const chk = $("checking");
    if (chk) chk.innerHTML = `<div class="checking"><img class="boo-sm boo-talk" src="assets/brand/ghost-96.png" alt=""> ${t(["Boo sedang menyemak…", "Boo is checking…"])}</div>`;
    let r;
    try { r = await LIVE.risk(st.heard); }
    catch (e) { liveFail(e); return null; }
    finally { const c = $("checking"); if (c) c.innerHTML = ""; }
    if (st.phase !== "live") return false;
    const ratio = r.threshold > 0 ? r.score / r.threshold : 0;
    // hard = money is about to move (OTP/TAC, PIN, transfer, secrecy, remote access) -> second alert.
    // asked = the caller actually asked for a code or money -> starts the "warned N s before" clock + TAC card.
    const newHard = r.hard.some(id => !st.seenIds.has(id));
    const asked = r.asked;
    const tier = r.crossed ? (r.hard.length || ratio >= 1.5 ? "HIGH" : "MEDIUM") : "LOW";
    st.liveScore = r;
    const bar = Math.min(100, Math.round(ratio * 65));
    st.timeline.push({ t: turn.t, risk: bar, tier, score: r.score, threshold: r.threshold });
    setRisk(bar, tier);
    const who = r.mode === "mock" ? "Pelayan (contoh)" : "Qwen C1";
    log(`${who}: skor ${r.score} / ambang ${r.threshold}${r.evidence.length ? " · " + r.evidence.map(e => e.id).join(", ") : ""} (${r.ms} ms)`,
        `${r.mode === "mock" ? "Server (examples)" : "Qwen C1"}: score ${r.score} / threshold ${r.threshold}${r.evidence.length ? " · " + r.evidence.map(e => e.id).join(", ") : ""} (${r.ms} ms)`);
    paintMode();
    if (asked && st.ask === null) { st.ask = turn.t + 1; log("Pemanggil minta kod/duit (Qwen C1)", "The caller asked for a code/money (Qwen C1)"); }
    const fresh = r.evidence.filter(e => !st.seenIds.has(e.id));
    r.evidence.forEach(e => st.seenIds.add(e.id));
    if (!r.crossed) return false;
    const first = st.alerts === 0;
    const rising = r.score >= st.lastAlertScore * 1.3 && r.score > st.lastAlertScore;
    if (!first && !newHard && !rising) return false;
    if (st.alerts >= 3) return false;
    st.alerts++; st.lastAlertScore = r.score;
    if (st.firstWarn === null) st.firstWarn = turn.t + 1;
    const kind = asked && st.ask !== null && !st.tacCard ? "TAC" : first && tier !== "HIGH" ? "MED" : "HIGH";
    if (kind === "TAC") st.tacCard = true;
    openAlert(liveCard(r, kind, fresh), turn.t + 1);
    return true;
  }

  function liveCard(r, kind, fresh) {
    const base = CARDS[kind];
    // newest evidence first, then the heaviest
    const isNew = e => (fresh || []).includes(e);
    const ev = r.evidence.filter(e => e.quote || e.label).sort((a, b) => (isNew(b) - isNew(a)) || (b.weight - a.weight)).slice(0, 3);
    const src = r.mode === "mock" ? ["contoh pelayan, tiada GPU", "server examples, no GPU"] : ["Qwen C1", "Qwen C1"];
    return Object.assign({}, base, {
      kindKey: kind, live: true,
      type: r.category || base.type,
      reasons: ev.length ? ev.map(e => [[e.label || e.id, e.labelEn || e.label || e.id], e.quote ? String(e.quote).replace(/</g, "&lt;") : null]) : base.reasons,
      pctLine: [`Skor berwajaran ${r.score} / ambang ${r.threshold} (belum ditentukur) · ${src[0]}`,
                `Weighted score ${r.score} / threshold ${r.threshold} (uncalibrated) · ${src[1]}`],
    });
  }

  function addEvidence(list) {
    list.forEach(e => { if (!st.evidence.includes(e)) { st.evidence.push(e); log(`Bukti dikumpul: ${e}`, `Evidence captured: ${e}`); } });
    const el = $("evList"); if (el) el.innerHTML = st.evidence.map(e => `<span class="ev">${e}</span>`).join("");
  }

  async function aiReply(final) {
    let line = final ? DECOY[DECOY.length - 1] : DECOY[Math.min(st.decoy, DECOY.length - 2)];
    let fish = false;
    if (st.live && !final) {
      try { line = (await LIVE.agent(st.heard, "caller")).text || line; fish = true; }
      catch (e) { liveFail(e); }
    }
    if (!final) st.decoy++;
    bubble("ai", line);
    st.heard.push({ who: "ai", text: line, t: Math.round(st.clock) });
    const w = $("wave"), b = $("booImg");
    if (w) w.classList.remove("idle");
    if (b) b.className = "boo boo-talk";   // Boo glows while it talks to the scammer
    if (fish) {
      const note = $("voiceNote");
      if (note) note.textContent = LIVE.voiceRoute() ? t(["Pemanggil dengar suara Boo (Fish)", "The caller hears Boo's voice (Fish)"])
                                                     : t(["Suara peranti (Fish belum disambung)", "Device voice (Fish not connected yet)"]);
      try { await LIVE.say(line, "fish", "ms"); } catch (e) { liveFail(e); await speak(line); }
    } else await speak(line);
    if (w) w.classList.add("idle");
    if (b) b.className = "boo boo-calm";
  }

  // ---------- alert sheet ----------
  function openAlert(kindOrCard, detectedAt) {
    st.phase = "alert";
    const c = typeof kindOrCard === "string" ? CARDS[kindOrCard] : kindOrCard;
    const kind = typeof kindOrCard === "string" ? kindOrCard : c.kindKey;
    const second = st.alerts > 1;
    const wrap = document.createElement("div");
    wrap.className = "sheet-wrap"; wrap.id = "sheet";
    const reasons = c.reasons.map((r, n) => `<div class="reason"><span class="n">${n + 1}</span><div><b>${t(r[0])}</b>${r[1] ? `<q>${r[1]}</q>` : ""}</div></div>`).join("");
    const auto = JAGA && COUNT > 0 && kind !== "MED";
    const buttons = second || kind === "TAC" ? `
        <button class="btn btn-danger btn-block count-btn" id="bHand" style="min-height:64px">${auto ? `<span class="fill" style="animation-duration:${COUNT}s"></span>` : ""}${I.bot}<span>${t(["Serahkan kepada AI", "Hand over to AI"])}${auto ? ` <span id="cd">(${COUNT})</span>` : ""}</span></button>
        ${auto ? `<button class="btn btn-outline btn-block cancel-btn" id="bCancel">${t(["Batal, saya nak teruskan sendiri", "Cancel, I'll carry on myself"])}</button>` : ""}
        <div class="btn-grid" style="margin-top:18px">
          <button class="btn btn-outline" id="bEnd">${t(["Tamatkan", "End call"])}</button>
          <button class="btn btn-outline" id="bFam">${t(["Amaran keluarga", "Alert family"])}</button>
        </div>
        <button class="btn btn-ghost btn-block" id="bFine" style="margin-top:4px">${t(["Semua okay, teruskan", "Everything's fine, continue"])}</button>`
      : `
        <button class="btn btn-primary btn-block" id="bHand" style="min-height:64px">${I.bot}<span>${t(["Ya, serahkan kepada AI", "Yes, hand over to AI"])}</span></button>
        <button class="btn btn-outline btn-block" id="bCont" style="margin-top:18px">${t(["Teruskan, saya dengar dulu", "Continue, I'll keep listening"])}</button>`;
    wrap.innerHTML = `<div class="sheet" role="alertdialog" aria-modal="true" aria-live="assertive" aria-label="${t(c.words)}"><div class="grab"></div>
      <div class="risk-card ${c.cls}"><div class="ring"></div>
        <div class="lvl"><img class="boo-peek boo-alert" src="assets/brand/ghost-96.png" alt=""> ${second && kind !== "TAC" ? t(["AMARAN KEDUA · ", "SECOND ALERT · "]) : ""}${t(c.lvl)}</div>
        <div class="boo-said">${t(["Boo nampak sesuatu…", "Boo spotted something…"])}</div><div class="words">${t(c.words)}</div><div class="type">${t(c.type)}</div>
        ${SHOW_PCT ? `<div class="pct-small">${c.live ? t(c.pctLine) : `${t(["Tahap risiko", "Risk level"])}: ${c.pct}%`}</div>` : ""}</div>
      ${S.voice ? `<p class="tiny" style="margin-top:8px">🔊 ${t(["Amaran ini juga dibisikkan ke telinga anda", "This warning is also whispered in your ear"])}</p>` : ""}
      <div class="why"><h4>${t(["Kenapa", "Why"])}</h4>${reasons}</div>
      ${c.live ? "" : `<div class="next-box">${I.bolt}<div>${t(["Seterusnya", "What comes next"])}: <b>${t(c.next[0])}</b> (${c.next[1]}%)</div></div>`}
      <div class="advice">💡 ${t(c.advice)}</div>
      <div class="conf"><span>${t(["Keyakinan", "Confidence"])}: ${t(c.conf)}</span><span>${t(["Dikesan pada saat ke-", "Detected at "])}${detectedAt || TURNS[st.i - 1].t + 3}${L() ? " s" : ""}</span></div>
      <div style="margin-top:14px">${buttons}</div></div>`;
    document.body.appendChild(wrap);
    UI.trapFocus(wrap.querySelector(".sheet"));
    whisper(kind);
    const lvlTxt = c.live ? `${c.lvl[0]} (${st.liveScore.score}/${st.liveScore.threshold})` : `${c.lvl[0]} ${c.pct}%`;
    log(`${second ? "Amaran kedua" : "Amaran pertama"}: ${lvlTxt}`, `${second ? "Second alert" : "First alert"}: ${c.live ? `${c.lvl[1]} (${st.liveScore.score}/${st.liveScore.threshold})` : `${c.lvl[1]} ${c.pct}%`}`);
    const close = () => { clearInterval(st.countdown); wrap.remove(); };
    $("bHand").onclick = () => { close(); handOver(); };
    if ($("bCont")) $("bCont").onclick = () => { close(); st.route = "continue"; log("Anda teruskan; AI terus memantau", "You continued; the AI kept watching"); resume(); };
    if ($("bFine")) $("bFine").onclick = () => { close(); st.route = "continue"; log("Anda tanda 'Semua okay' (masih dipantau)", "You marked 'Everything's fine' (still watched)"); resume(); };
    if ($("bEnd")) $("bEnd").onclick = () => { close(); endCall("user"); };
    if ($("bFam")) $("bFam").onclick = () => { log("Amaran senyap dihantar kepada Amir", "Silent alert sent to Amir"); UI.toast(t(["📲 Amir dimaklumkan secara senyap", "📲 Amir was alerted silently"])); };
    const stopCount = () => {
      if (!st.countdown) return;
      clearInterval(st.countdown); st.countdown = null;
      const f = wrap.querySelector(".fill"); if (f) f.remove();
      const cd = $("cd"); if (cd) cd.remove();
      const cb = $("bCancel"); if (cb) cb.remove();
      log("Kiraan detik dibatalkan oleh pengguna", "Countdown cancelled by the user");
    };
    if ($("bCancel")) $("bCancel").onclick = stopCount;
    if (auto) {
      // Touching anything on the sheet pauses the auto hand-over (WCAG 2.2.1: timing adjustable).
      wrap.querySelector(".sheet").addEventListener("pointerdown", e => { if (!e.target.closest("#bHand")) stopCount(); });
      let n = COUNT;
      st.countdown = setInterval(() => {
        n--; const cd = $("cd"); if (cd) cd.textContent = `(${n})`;
        if (n <= 0) { log("Tiada jawapan dalam 5 saat: AI ambil alih (Jaga Penuh)", "No answer in 5 s: the AI took over (Jaga Penuh)"); close(); handOver(); }
      }, 1000);
    }
  }
  function resume() { st.phase = "live"; showLive(); schedule(); }

  async function handOver() {
    st.route = "ai"; st.phase = "live";
    log("Panggilan diserahkan kepada AI", "Call handed over to the AI");
    showLive();
    if (st.live) guidance();
    await aiReply();
    schedule();
  }

  // Calm guidance for the protected person (Qwen C2 with the victim prompt, spoken by Chatterbox).
  async function guidance() {
    try {
      const g = await LIVE.agent(st.heard, "victim");
      const slot = $("guideSlot");
      if (slot && g.text) slot.innerHTML = `<div class="whisper">${I.speaker}<span><b>${t(["Boo kepada anda", "Boo to you"])}:</b> ${g.text.replace(/</g, "&lt;")}</span></div>`;
      log(`Panduan untuk anda: ${g.text}`, `Guidance for you: ${g.text}`);
      if (g.text) await LIVE.say(g.text, "chatterbox", L() ? "en" : "ms");
    } catch (e) { liveFail(e); }
  }

  function endCall(by) {
    st.phase = "ended"; clearTimeout(st.timer); clearInterval(st.tick);
    if ("speechSynthesis" in window) speechSynthesis.cancel();
    if (LIVE) LIVE.pollSettings(false);
    log(by === "ai" ? "AI tamatkan panggilan dengan sopan" : by === "user" ? "Anda tamatkan panggilan" : "Panggilan tamat",
        by === "ai" ? "The AI ended the call politely" : by === "user" ? "You ended the call" : "The call ended");
    document.querySelector(".app").classList.remove("call-app");
    showAfter();
  }

  const homeLink = () => `<a class="home-link" href="index.html">${I.back}${t(["Utama", "Home"])}</a>`;

  // ---------- after-call check ----------
  function showAfter() {
    st.phase = "after";
    const opts = [["IC", "IC number"], ["No. akaun / kad", "Bank account / card"], ["TAC / OTP", "TAC / OTP"], ["Nama penuh", "Full name"], ["Dah transfer duit", "Already transferred money"]];
    root.innerHTML = `<main class="page">
      ${homeLink()}
      <span class="badge b-teal" style="margin-top:12px">${t(["Panggilan tamat", "Call ended"])} · ${fmt(st.clock)}</span>
      <h1 class="page-title" style="margin-top:10px">${t(["Semakan selepas panggilan", "After-call check"])}</h1>
      <p class="page-sub">${t(["Ada kongsi apa-apa yang berisiko? Tekan yang berkenaan.", "Did you share anything risky? Tap any that apply."])}</p>
      <div class="section" id="checks">${opts.map((o, n) => `<button class="check" data-n="${n}"><span class="box"></span>${t(o)}</button>`).join("")}</div>
      ${st.route === "ai" ? `<div class="warned light" style="margin:4px 0 0">👻 ${t(["Boo (AI) yang bercakap. Tiada maklumat sebenar dikongsi.", "Boo (AI) did the talking. No real details were shared."])}</div>` : ""}
      <div class="section"><div class="section-head"><h3>${t(["Langkah seterusnya", "What to do now"])}</h3></div><div id="acts"></div></div>
      <button class="btn btn-navy btn-block" id="toSummary">${t(["Lihat ringkasan", "See summary"])} ${I.chevron}</button>
    </main>`;
    const renderActs = () => {
      const money = st.shared.some(n => n === 1 || n === 2 || n === 4);
      const A = {
        bank: ["act-red", I.bank, ["Telefon bank saya", "Call my bank"], ["Sekat akaun & kad sekarang", "Block your account & card now"]],
        nsrc: [money ? "act-red" : "act-navy", I.siren, ["Talian 997 (NSRC)", "997 scam hotline (NSRC)"], ["Laporkan dalam masa 24 jam", "Report within 24 hours"]],
        fam: ["act-plain", I.family, ["Maklumkan Amir", "Tell Amir"], ["Kenalan kecemasan anda", "Your emergency contact"]],
        safe: ["act-plain", I.smile, ["Saya selamat", "I'm safe"], ["Tiada apa dikongsi", "Nothing was shared"]],
      };
      const order = money ? ["bank", "nsrc", "fam"] : ["fam", "nsrc", "safe"];
      $("acts").innerHTML = order.map(k => { const a = A[k]; return `<button class="act ${a[0]}" data-k="${k}"><span class="ico">${a[1]}</span><span>${t(a[2])}<small>${t(a[3])}</small></span></button>`; }).join("");
      $("acts").querySelectorAll(".act").forEach(b => b.onclick = () => { log(`Tindakan: ${A[b.dataset.k][2][0]}`, `Action: ${A[b.dataset.k][2][1]}`); UI.toast("✓ " + t(A[b.dataset.k][2])); });
    };
    $("checks").querySelectorAll(".check").forEach(b => b.onclick = () => {
      const n = +b.dataset.n; b.classList.toggle("on");
      b.querySelector(".box").innerHTML = b.classList.contains("on") ? I.check : "";
      st.shared = b.classList.contains("on") ? st.shared.concat(n) : st.shared.filter(x => x !== n);
      renderActs();
    });
    renderActs();
    $("toSummary").onclick = showSummary;
    window.scrollTo(0, 0);
  }

  // ---------- summary ----------
  function spark() {
    const pts = [{ t: 0, risk: 0 }].concat(st.timeline);
    const maxT = Math.max(40, pts[pts.length - 1].t + 2), W = 320, H = 110;
    const x = v => 8 + (v / maxT) * (W - 16), y = v => H - 10 - (v / 100) * (H - 22);
    const path = pts.map((p, n) => `${n ? "L" : "M"}${x(p.t).toFixed(1)},${y(p.risk).toFixed(1)}`).join(" ");
    const [med, high] = JAGA ? [30, 60] : [40, 75];
    const mark = (tt, col, lbl) => tt === null ? "" : `<line x1="${x(tt)}" x2="${x(tt)}" y1="8" y2="${H - 10}" stroke="${col}" stroke-dasharray="3 3"/><text x="${x(tt) + 3}" y="16" font-size="10" fill="${col}" font-weight="700">${lbl}</text>`;
    return `<svg class="spark" viewBox="0 0 ${W} ${H}" role="img" aria-label="Risk over the call">
      <rect x="8" y="${y(100)}" width="${W - 16}" height="${y(high) - y(100)}" fill="#FCEDEB"/>
      <rect x="8" y="${y(high)}" width="${W - 16}" height="${y(med) - y(high)}" fill="#FFF2E2"/>
      ${mark(st.firstWarn, "#1F7A45", t(["amaran", "warned"]))}${mark(st.ask, "#D13225", "TAC")}
      <path d="${path}" fill="none" stroke="#1D1B1A" stroke-width="3" stroke-linejoin="round"/>
      ${pts.map(p => `<circle cx="${x(p.t)}" cy="${y(p.risk)}" r="3.5" fill="#1D1B1A"/>`).join("")}</svg>`;
  }

  function showSummary() {
    st.phase = "summary";
    const warned = st.firstWarn !== null && st.ask !== null ? st.ask - st.firstWarn : null;
    const cls = e => /TAC|Bukti|Evidence/.test(e.text[0]) ? "r" : /AI/.test(e.text[0]) ? "v" : /Amaran|alert/i.test(e.text[0]) ? "o" : "";
    root.innerHTML = `<main class="page">
      ${homeLink()}
      <h1 class="page-title" style="margin-top:12px">${t(["Ringkasan panggilan", "Call summary"])}</h1>
      <div class="section card"><div class="row"><span class="avatar av-red">${I.shieldAlert}</span>
        <div class="grow"><b>${t(["Polis palsu (Macau scam)", "Fake police (Macau scam)"])}</b><small class="tiny">+60 3-2266 xxxx · ${fmt(st.clock)}</small></div>${UI.tierBadge("HIGH")}</div>
        <div style="margin-top:12px">${spark()}</div></div>
      ${warned !== null ? `<div class="warned" style="margin:14px 0 0"><div class="big">${warned} ${t(["saat", "seconds"])}</div><p>${t(["amaran diberi sebelum dia minta TAC", "of warning before he asked for the TAC"])}</p></div>` : ""}
      <div class="section"><div class="section-head"><h3>${t(["Apa yang berlaku", "What happened"])}</h3></div>
        <div class="card timeline">${st.events.map(e => `<div class="tl ${cls(e)}"><small>${fmt(e.t)}</small>${t(e.text)}</div>`).join("")}</div></div>
      ${st.evidence.length ? `<div class="section card"><b>${t(["Bukti untuk bank & polis", "Evidence for the bank & police"])}</b><div class="chips" style="margin-top:8px">${st.evidence.map(e => `<span class="badge b-violet">${e}</span>`).join("")}</div></div>` : ""}
      <div class="section card" style="background:var(--navy);color:#fff"><b>${t(["Ingat", "Remember"])}</b>
        <p style="opacity:.85;margin-top:4px">${t(["Polis tak siasat atau minta duit melalui telefon. Kalau ragu, telefon balai sendiri atau 997.", "Police never investigate or ask for money by phone. If unsure, call the station yourself or 997."])}</p></div>
      <button class="btn btn-primary btn-block section" id="toFb">${t(["Siapa yang call tadi?", "Who was the caller?"])} ${I.chevron}</button>
    </main>`;
    $("toFb").onclick = showFeedback;
    window.scrollTo(0, 0);
  }

  // ---------- feedback: Lapor & Amaran ----------
  function showFeedback() {
    const WHO = [["😠", ["Penipu", "Scammer"]], ["🧑‍💼", ["Jurujual", "Salesperson"]], ["🙂", ["Orang betul", "Genuine"]], ["🤔", ["Tak pasti", "Not sure"]]];
    const group = (id, opts, multi) => `<div class="chips" id="${id}">${opts.map((o, n) => `<button class="opt" data-n="${n}" data-multi="${multi ? 1 : 0}">${t(o)}</button>`).join("")}</div>`;
    root.innerHTML = `<main class="page">
      ${homeLink()}
      <h1 class="page-title" style="margin-top:12px">${t(["Siapa yang call tadi?", "Who was the caller?"])}</h1>
      <p class="page-sub">${t(["Satu tekan sahaja. Jawapan anda melindungi orang lain.", "Just one tap. Your answer protects others."])}</p>
      <div class="section fb-grid" id="who">${WHO.map((w, n) => `<button class="fb-tile ${n === 0 ? "on" : ""}" data-n="${n}"><span class="em">${w[0]}</span>${t(w[1])}</button>`).join("")}</div>
      <details class="section card"><summary style="font-weight:700;cursor:pointer;min-height:44px;display:flex;align-items:center">${t(["Tambah maklumat (pilihan)", "Add details (optional)"])}</summary>
        <h3 style="margin:12px 0 10px;font-size:1rem">${t(["Dia mengaku sebagai…", "They said they were…"])}</h3>
        ${group("claim", [["Polis", "Police"], ["Bank", "Bank"], ["LHDN", "LHDN"], ["Kurier", "Courier"], ["Lain", "Other"]])}
        <h3 style="margin:14px 0 10px;font-size:1rem">${t(["Hantar amaran kepada", "Send a warning to"])}</h3>
        ${group("acts", [["MCMC / 997", "MCMC / 997"], ["Keluarga", "Family"], ["Komuniti", "Community"]], true)}
        <textarea class="input" rows="2" style="margin-top:12px" placeholder="${t(["Lain-lain…", "Anything else…"])}"></textarea>
      </details>
      <button class="btn btn-primary btn-block section" id="send">${t(["Hantar", "Send"])}</button>
    </main>`;
    root.querySelectorAll("#who .fb-tile").forEach(b => b.onclick = () => { root.querySelectorAll("#who .fb-tile").forEach(x => x.classList.remove("on")); b.classList.add("on"); });
    root.querySelectorAll(".opt").forEach(b => b.onclick = () => {
      if (b.dataset.multi !== "1") b.parentElement.querySelectorAll(".opt").forEach(x => x.classList.remove("on"));
      b.classList.toggle("on");
    });
    const pre = (id, n) => root.querySelector(`#${id} .opt[data-n="${n}"]`).classList.add("on");
    pre("claim", 0); pre("acts", 0); pre("acts", 1); pre("acts", 2);
    $("send").onclick = showDone;
    window.scrollTo(0, 0);
  }

  function showDone() {
    const warned = st.firstWarn !== null && st.ask !== null ? st.ask - st.firstWarn : null;
    Store.addCall({ id: "d" + Date.now(), when: "Baru tadi", whenEn: "Just now", name: "+60 3-2266 xxxx", tier: "HIGH", type: "authority",
      label: ["Polis palsu (Macau scam)", "Fake police (Macau scam)"], ai: st.route === "ai", warned, reports: 13, evidence: st.evidence });
    root.innerHTML = `<main class="page center" style="padding-top:60px">
      <div class="hero" style="text-align:center"><img class="boo-hero boo-wave" src="assets/brand/ghost.png" alt="">
        <h2>${t(["Terima kasih, Mak Rosnah", "Thank you, Mak Rosnah"])}</h2>
        <p>${t(["Nombor ini kini ditanda oleh 13 pengguna sebagai 'PDRM palsu'.", "This number is now flagged by 13 users as 'fake PDRM'."])}</p></div>
      <div class="section stack">
        <a class="btn btn-primary btn-block" href="index.html">${I.home}${t(["Kembali ke Utama", "Back to Home"])}</a>
        <a class="btn btn-outline btn-block" href="history.html">${t(["Lihat sejarah", "View history"])}</a>
        ${SHOW_PCT ? `<a class="btn btn-outline btn-block" href="officer.html">${I.bank} ${t(["Paparan pegawai bank", "Bank officer view"])}</a>` : ""}
        <a class="btn btn-ghost btn-block" href="call.html">${t(["Ulang latihan", "Replay practice"])}</a>
      </div></main>`;
  }

  // ---------- presenter helpers ----------
  const bar = document.createElement("div");
  bar.className = "demo-bar";
  bar.innerHTML = `<button id="spd" title="Speed">1×</button><button id="rst" title="Restart">↺</button>`;
  document.body.appendChild(bar);
  $("spd").onclick = () => { st.speed = st.speed === 1 ? 2 : 1; $("spd").textContent = st.speed + "×"; };
  $("rst").onclick = () => location.reload();
  if ("speechSynthesis" in window) speechSynthesis.getVoices();

  showIncoming();
})();
