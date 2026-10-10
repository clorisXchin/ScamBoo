export const signals = [
  { id: "authority", label: "Claims authority", weight: 15, hint: "Pretends to be a bank, police, or official." },
  { id: "urgency", label: "Urgency or threat", weight: 20, hint: "Pressures the recipient to act immediately." },
  { id: "secrecy", label: "Secrecy", weight: 20, hint: "Asks the recipient not to tell anyone." },
  { id: "credentials", label: "Banking credentials", weight: 35, hint: "Requests a password, PIN, or card details." },
  { id: "otp", label: "OTP or TAC request", weight: 35, hint: "Requests a one-time security code." },
  { id: "transfer", label: "Money transfer", weight: 40, hint: "Asks for a transfer or payment." },
  { id: "remote_app", label: "Remote access app", weight: 30, hint: "Asks the recipient to install screen sharing or remote control." },
] as const;

export type SignalId = (typeof signals)[number]["id"];
export type RuleWeights = Record<SignalId, number>;
export type Finding = { id: SignalId; evidence: string };

export const defaultWeights = Object.fromEntries(signals.map((item) => [item.id, item.weight])) as RuleWeights;

export const defaultRiskPrompt = `You analyze a staged phone-call transcript for possible scam behavior. Identify only requests or pressure made by the caller, not warnings spoken by the recipient. Return JSON only: {"findings":[{"id":"one allowed signal id","evidence":"exact short quote from transcript"}]}. If the evidence is uncertain, omit it. Never invent an event or quote.`;

export const defaultVictimPrompt = `You are a calm phone safety guide speaking to an older Malaysian adult. Use short, clear Malaysian English or Malay matching the caller's language. Say this is a possible scam, not a confirmed scam. Do not ask for passwords, PINs, OTPs, or full bank details. Recommend ending contact and calling the bank using the number on the bank card or official app. Do not invent a bank hotline or promise a transfer.`;

export const defaultCallerPrompt = `You are a fictional caller-side demo agent. Keep the conversation natural and brief. Do not request money, credentials, or personal information. Use only a voice sample whose speaker consented to this demo.`;

export function parseWeights(value: unknown): RuleWeights {
  if (!value || typeof value !== "object") throw new Error("Rule weights are required.");
  const input = value as Record<string, unknown>;
  return Object.fromEntries(signals.map(({ id }) => {
    const weight = input[id];
    if (!Number.isInteger(weight) || (weight as number) < 0 || (weight as number) > 100) {
      throw new Error(`Weight for ${id} must be an integer from 0 to 100.`);
    }
    return [id, weight];
  })) as RuleWeights;
}

export function scoreFindings(findings: Finding[], weights: RuleWeights): number {
  return Math.min(100, [...new Set(findings.map((finding) => finding.id))].reduce((sum, id) => sum + weights[id], 0));
}

const mockPatterns: Record<SignalId, RegExp> = {
  authority: /\b(bank|police|officer|pegawai|pihak bank|mahkamah|court)\b/i,
  urgency: /\b(now|immediately|today|right away|sekarang|segera|hari ini)\b/i,
  secrecy: /\b(don't tell|do not tell|keep this secret|jangan beritahu|rahsia)\b/i,
  credentials: /\b(password|pin|card number|cvv|kata laluan|nombor kad)\b/i,
  otp: /\b(otp|tac|one.time (?:password|code)|verification code|kod pengesahan)\b/i,
  transfer: /\b(transfer|send money|payment|bayar|pindah wang|duit)\b/i,
  remote_app: /\b(anydesk|teamviewer|screen share|remote access|kongsi skrin)\b/i,
};

export function mockFindings(transcript: string): Finding[] {
  return signals.flatMap(({ id }) => {
    const match = mockPatterns[id].exec(transcript);
    return match ? [{ id, evidence: match[0] }] : [];
  });
}

export function validatedFindings(value: unknown, transcript: string): Finding[] {
  if (!value || typeof value !== "object" || !Array.isArray((value as { findings?: unknown }).findings)) {
    throw new Error("The risk model did not return a findings list.");
  }
  const allowed = new Set<string>(signals.map(({ id }) => id));
  return (value as { findings: unknown[] }).findings.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const { id, evidence } = item as Record<string, unknown>;
    if (typeof id !== "string" || !allowed.has(id) || typeof evidence !== "string") return [];
    const quote = evidence.trim();
    if (!quote || !transcript.toLowerCase().includes(quote.toLowerCase())) return [];
    return [{ id: id as SignalId, evidence: quote.slice(0, 160) }];
  });
}
