import {
  mockFindings,
  parseWeights,
  scoreFindings,
  signals,
  validatedFindings,
  type Finding,
} from "@/lib/risk";

function configuration(kind: "C1" | "C2") {
  const baseUrl = process.env[`QWEN_${kind}_BASE_URL`]?.trim();
  const apiKey = process.env[`QWEN_${kind}_API_KEY`]?.trim();
  return { baseUrl, apiKey, model: process.env[`QWEN_${kind}_MODEL`] || "Qwen/Qwen3-8B" };
}

function authorize(request: Request, live: boolean): Response | null {
  if (!live) return null;
  const expected = process.env.SCAMBOO_ACCESS_KEY;
  if (!expected) return Response.json({ error: "Set SCAMBOO_ACCESS_KEY before enabling a live GPU." }, { status: 503 });
  if (request.headers.get("x-scamboo-key") !== expected) {
    return Response.json({ error: "Access key is missing or incorrect." }, { status: 401 });
  }
  return null;
}

function textField(value: unknown, name: string, maxLength: number): string {
  if (typeof value !== "string" || !value.trim() || value.length > maxLength) {
    throw new Error(`${name} must contain 1 to ${maxLength} characters.`);
  }
  return value.trim();
}

async function qwenChat(
  kind: "C1" | "C2",
  messages: { role: "system" | "user"; content: string }[],
): Promise<string> {
  const { baseUrl, apiKey, model } = configuration(kind);
  if (!baseUrl) throw new Error(`${kind} is not configured.`);
  const url = new URL(`${baseUrl.replace(/\/$/, "")}/chat/completions`);
  if (!["http:", "https:"].includes(url.protocol)) throw new Error(`${kind} URL must use HTTP or HTTPS.`);
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
    },
    body: JSON.stringify({ model, messages, temperature: kind === "C1" ? 0 : 0.5, max_tokens: 650 }),
    signal: AbortSignal.timeout(25_000),
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`${kind} model returned HTTP ${response.status}.`);
  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;
  if (typeof content !== "string" || !content.trim()) throw new Error(`${kind} returned an empty answer.`);
  return content.trim();
}

function extractJson(text: string): unknown {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end < start) throw new Error("C1 did not return JSON. Try a clearer risk prompt.");
  return JSON.parse(text.slice(start, end + 1));
}

export async function GET() {
  return Response.json({ c1: Boolean(configuration("C1").baseUrl), c2: Boolean(configuration("C2").baseUrl) });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body || typeof body !== "object") throw new Error("Request body must be an object.");
    if (body.kind === "risk") {
      const transcript = textField(body.transcript, "Transcript", 12_000);
      const prompt = textField(body.prompt, "Risk prompt", 4_000);
      const weights = parseWeights(body.weights);
      const threshold = Number(body.threshold);
      if (!Number.isInteger(threshold) || threshold < 1 || threshold > 100) {
        throw new Error("Threshold must be an integer from 1 to 100.");
      }
      const live = Boolean(configuration("C1").baseUrl);
      const rejected = authorize(request, live);
      if (rejected) return rejected;
      let findings: Finding[];
      if (live) {
        const allowed = signals.map(({ id, hint }) => `${id}: ${hint}`).join("\n");
        const answer = await qwenChat("C1", [
          { role: "system", content: `${prompt}\n\nAllowed signal IDs:\n${allowed}\n/no_think` },
          { role: "user", content: transcript },
        ]);
        findings = validatedFindings(extractJson(answer), transcript);
      } else {
        findings = mockFindings(transcript);
      }
      const score = scoreFindings(findings, weights);
      return Response.json({ mode: live ? "live" : "mock", findings, score, threshold, intervene: score >= threshold });
    }
    if (body.kind === "agent") {
      const transcript = textField(body.transcript, "Transcript", 12_000);
      const prompt = textField(body.prompt, "Agent prompt", 4_000);
      const audience = body.audience === "caller" ? "caller" : body.audience === "victim" ? "victim" : null;
      if (!audience) throw new Error("Audience must be victim or caller.");
      const live = Boolean(configuration("C2").baseUrl);
      const rejected = authorize(request, live);
      if (rejected) return rejected;
      const text = live
        ? await qwenChat("C2", [
            { role: "system", content: `${prompt}\nKeep the reply to two spoken sentences. /no_think` },
            { role: "user", content: `Audience: ${audience}\nTranscript:\n${transcript}\nNext spoken reply:` },
          ])
        : audience === "victim"
          ? "This may be a scam. Please stop sharing details and call your bank using the number on your card or official app."
          : "I need a moment to understand. Can you explain what you want me to do?";
      return Response.json({ mode: live ? "live" : "mock", text });
    }
    throw new Error("Kind must be risk or agent.");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Request failed.";
    const upstream = /C1|C2|fetch|timeout|JSON/.test(message);
    return Response.json({ error: message }, { status: upstream ? 502 : 400 });
  }
}
