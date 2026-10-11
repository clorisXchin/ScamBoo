# ScamBoo description
ScamBoo is an interactive prototype that helps older adults recognize suspicious phone conversations and choose safer next steps. It simulates a call, shows the conversation and risk alerts, demonstrates an AI handover, and guides the user to contact family or support services such as Malaysia’s NSRC 997. The current demo is a call simulation, not real cellular call interception.

# ScamBoo prototype workspace

The `web/` app is a Next.js interface for testing scam-risk prompts and agent replies. It is an integration scaffold, not the finished call experience.

## Run locally

```bash
cd web
npm ci
npm run dev
```

With no GPU configuration, the interface uses mock risk findings and replies. The server route at `web/src/app/api/test/route.ts` switches each service to live mode when its base URL is set.

## ScamBoo app (product screens)

The phone app design lives in `web/public/scamboo/` and is served at `http://localhost:3000/scamboo/index.html`. It calls the same `/api/test` route for risk findings and agent replies, so it goes live as soon as the GPU variables below are set. Without them it shows the server's example answers and labels them as examples. See `web/public/scamboo/README.md`.

## Server-side configuration

Place these in `web/.env.local` for local work, or the hosting provider's server-side environment. Never commit keys or put them in `NEXT_PUBLIC_` variables.

```text
QWEN_C1_BASE_URL=https://<risk-host>/v1
QWEN_C1_API_KEY=<private-key>
QWEN_C1_MODEL=<model-id>
QWEN_C2_BASE_URL=https://<dialogue-host>/v1
QWEN_C2_API_KEY=<private-key>
QWEN_C2_MODEL=<model-id>
SCAMBOO_ACCESS_KEY=<private-app-access-key>
```

# ScamBoo main features
✨ Key Features

1. Suspicious Caller Identification

Flags potentially suspicious or unknown phone numbers.

Provides an early warning before the user proceeds with the call.

2. AI Scam Detection

Analyzes conversational patterns, keywords, and suspicious requests.

Demonstrates support for English, Bahasa Melayu, and Bahasa Rojak.

Identifies possible impersonation, urgency, threats, and OTP requests.

3. Explainable Scam Alerts

Displays Potential Scam or High Risk warnings.

Explains why the conversation may be suspicious.

Allows users to decide whether to continue the call or activate protection.

4. AI Agent Takeover

Demonstrates a simulated handover from the victim to an AI voice agent.

The AI decoy continues the suspicious conversation while the victim receives safety guidance.

Designed to reduce the victim's exposure to manipulation.

5. Emergency Rescue Assistance

Helps users identify personal or banking information they may have shared.

Provides quick access to bank assistance, NSRC 997, and emergency contacts.

Demonstrates a reporting workflow for suspicious phone numbers.

6. Scam Categorization and Awareness

Categorizes suspicious calls into job, financial/telecommunication, and lucky draw/lottery scams.

Provides practical steps to avoid future scams.

Allows users to report incorrect scam detections.
*/
