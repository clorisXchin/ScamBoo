/* Call protection prototype: localStorage layer (prototype only, no backend) */
(function () {
  const K = { settings: "cp_settings", calls: "cp_calls" };
  const read = (k, fb) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : fb; } catch (e) { return fb; } };
  const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* blocked or full */ } };

  const DEFAULTS = {
    lang: "bm", mode: "jaga_penuh", contact: "Amir (anak)", contactTel: "+60120004471", voice: true,
    role: "elder",        // "elder" (Mak Rosnah) or "guardian" (Amir)
    size: "m",            // text size: m / l / xl
    contrast: "normal",   // "normal" or "high"
    readAloud: true,      // show the read-aloud button
    countdown: 5,         // Jaga Penuh auto hand-over seconds: 5, 10 or 0 (off)
    onboarded: false,
  };

  // Seed history so the app looks lived-in on first open.
  const SEED = [
    { id: "s1", when: "Semalam, 4:12 ptg", whenEn: "Yesterday, 4:12 pm", name: "+60 3-2716 xxxx", tier: "HIGH", type: "authority",
      label: ["Polis palsu (Macau scam)", "Fake police (Macau scam)"], ai: true, warned: 22, reports: 12 },
    { id: "s2", when: "Semalam, 11:03 pg", whenEn: "Yesterday, 11:03 am", name: "Pos Laju rider", tier: "LOW", type: "courier",
      label: ["Penghantaran bungkusan", "Parcel delivery"], ai: false },
    { id: "s3", when: "Isnin, 9:40 pg", whenEn: "Monday, 9:40 am", name: "+60 11-5123 xxxx", tier: "NOT_SURE", type: "tele",
      label: ["Jurujual insurans", "Insurance telemarketer"], ai: false },
    { id: "s4", when: "Ahad, 8:15 mlm", whenEn: "Sunday, 8:15 pm", name: "+60 17-880 xxxx", tier: "MEDIUM", type: "lucky_draw",
      label: ["Hadiah cabutan bertuah", "Lucky draw prize"], ai: false, warned: 14, reports: 5 },
  ];

  window.Store = {
    settings() { return Object.assign({}, DEFAULTS, read(K.settings, {})); },
    set(patch) { write(K.settings, Object.assign(this.settings(), patch)); },
    calls() { return read(K.calls, null) || SEED; },
    addCall(c) { const list = this.calls().slice(); list.unshift(c); write(K.calls, list.slice(0, 20)); },
    reset() { try { localStorage.removeItem(K.calls); localStorage.removeItem(K.settings); } catch (e) { /* ignore */ } },
    resetCalls() { try { localStorage.removeItem(K.calls); } catch (e) { /* ignore */ } },
  };
})();
