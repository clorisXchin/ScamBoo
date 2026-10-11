# ScamBoo app (phone MVP)

The ScamBoo customer app is an installable phone web app (PWA) for older users and their family "guardian". It's plain HTML, CSS and JS in this folder. Next.js serves it as-is at **`/scamboo/index.html`**, on the same site as the team's `/api/test` route, so the browser never needs a GPU key.

## Open it

```bash
cd web
npm ci
npm run dev          # or: npm run build && npm run start
```

| Page | What it is |
|---|---|
| `http://localhost:3000/scamboo/index.html` | The app. First run shows the 4-step setup. |
| `http://localhost:3000/scamboo/call.html?judge` | The practice scam call, with scores shown for judges. |
| `http://localhost:3000/scamboo/connector.html` | The AI connection check, with try buttons for C1 and C2. |

On a phone you can "Add to Home Screen". The app installs with the ScamBoo ghost icon.

## How it connects to the team's AI

- `assets/js/lab-config.js` is the only switch:
  - `base: ""` means same site (default here)
  - `base: null` means design mode with the scripted demo only
  - `settingsUrl` is the shared prompts/weights/threshold source; `null` uses the defaults copied from `web/src/lib/risk.ts`, with threshold 50
- `assets/js/live.js` is the adapter:
  - **Risk:** `POST /api/test {kind:"risk", transcript, prompt, weights, threshold}`. The `findings` are shown on the alert cards as plain-language reasons with the exact quote.
  - **Agent:** `POST /api/test {kind:"agent", transcript, prompt, audience}`. This drives Boo's reply to the caller after hand-over and the calm guidance for the protected person.
  - **Access key:** sent as `x-scamboo-key`. Enter it once on `connector.html`; it's kept only in that phone's local storage, never in code.
- **Honest labels:** the pill on the call screen says **"LIVE · Qwen"** only when the server answers with `mode: "live"`. Without GPU config it says **"Contoh pelayan (tiada GPU)"** (server examples, no GPU). The score is a weighted evidence score, never shown as a probability. Older users see words only; percentages and scores appear in Guardian/judge view.
- **Voices:** this repo has no TTS route yet, so the phone's own voice is used, with a label saying so. When a Fish/Chatterbox route exists, set `tts` in `lab-config.js`.
- **Typed caller lines:** in live mode, a "Taip ayat pemanggil" box on the call screen sends any typed sentence through the same flow. This is the fallback when there's no microphone.

## Main screens

- **Elder mode** (3 tabs: Utama / Sejarah / Bantuan):
  - status shown in words
  - big red "Saya rasa ditipu" help button
  - one-tap 997 and family calls
  - number lookup
  - text size A/A+/A++, high contrast and read-aloud
- **Guardian mode** (Ringkasan / Amaran / Tetapan):
  - silent alerts and "Call Mak"
  - weekly stats and family invite share
  - protection settings (elders can't switch protection off)
- **Practice call:**
  - whispered warning + vibration
  - First Insight card and second alert
  - "Serahkan kepada AI" (hand over) with a Cancel option and an adjustable countdown
  - Boo (the AI ghost) talks to the scammer
  - after-call check, summary and feedback
- **`officer.html`:** a bank fraud-officer queue made of **synthetic** demo cases.

Design notes: "Ghost White" palette from the logo (red = brand + danger only), Fredoka + Inter, every colour pair checked for WCAG AA contrast, and "reduce motion" respected.
