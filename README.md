# ScamBoo prototype workspace

The `web/` app is a Next.js interface for testing scam-risk prompts and agent replies. It is an integration scaffold, not the finished call experience.

## Run locally

```bash
cd web
npm ci
npm run dev
```

With no GPU configuration, the interface uses mock risk findings and replies. The server route at `web/src/app/api/test/route.ts` switches each service to live mode when its base URL is set.

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

The current app has live C1 risk testing locally. C2, STT, TTS, live call control, and the product screens remain to be integrated. GPU URLs and keys are intentionally absent from this repository.

The team should use its JagaCall master document to decide the product flow and measured prediction model. The current prompt-and-weight risk score is a prototype, not a calibrated probability or a trained-model result. The hackathon demo processes audio on rented cloud GPUs, so describe it as cloud processing.
