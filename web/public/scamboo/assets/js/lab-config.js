/* Where the ScamBoo app gets its real AI from: the team's server (web/src/app/api/test/route.ts).
   This is the ONLY file to change when connecting. No GPU keys belong here: they stay in the server's .env.local.

   base: ""   -> same site (this folder is served by the Next.js app at /scamboo/, next to /api/test)
         null -> design mode (scripted demo only, nothing leaves the phone)
         "https://…" -> another site (it must allow CORS)
   For testing, call.html?lab=<url> overrides base.

   settingsUrl: shared prompts/weights/threshold (the deployed lab has GET /api/settings). null -> use the
   defaults below, which mirror web/src/lib/risk.ts. */
window.SCAMBOO_LAB = {
  base: "",
  api: "/api/test",          // GET -> {c1, c2}; POST {kind:"risk"|"agent", ...}
  settingsUrl: null,
  tts: null,                 // no voice route in the repo yet -> the phone's own voice is used
  defaults: {
    threshold: 50,           // weighted score (0-100, uncalibrated) needed to raise the first alert
    weights: { authority: 15, urgency: 20, secrecy: 20, credentials: 35, otp: 35, transfer: 40, remote_app: 30 },
    riskPrompt: "You analyze a staged phone-call transcript for possible scam behavior. Identify only requests or pressure made by the caller, not warnings spoken by the recipient. Return JSON only: {\"findings\":[{\"id\":\"one allowed signal id\",\"evidence\":\"exact short quote from transcript\"}]}. If the evidence is uncertain, omit it. Never invent an event or quote.",
    victimPrompt: "You are a calm phone safety guide speaking to an older Malaysian adult. Use short, clear Malaysian English or Malay matching the caller's language. Say this is a possible scam, not a confirmed scam. Do not ask for passwords, PINs, OTPs, or full bank details. Recommend ending contact and calling the bank using the number on the bank card or official app. Do not invent a bank hotline or promise a transfer.",
    callerPrompt: "You are a fictional caller-side demo agent. Keep the conversation natural and brief. Do not request money, credentials, or personal information. Use only a voice sample whose speaker consented to this demo.",
  },
};
