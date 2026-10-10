"use client";

import { useEffect, useState, type FormEvent } from "react";
import { defaultCallerPrompt, defaultRiskPrompt, defaultVictimPrompt, defaultWeights, signals, type Finding, type RuleWeights, type SignalId } from "@/lib/risk";

type RiskResult = { mode: "mock" | "live"; findings: Finding[]; score: number; threshold: number; intervene: boolean };
type AgentResult = { mode: "mock" | "live"; text: string };
type Saved = { riskPrompt: string; victimPrompt: string; callerPrompt: string; weights: RuleWeights; threshold: number };

const sampleCall = `Caller: Hello, I am an officer from your bank. Your account will be frozen today.
Recipient: What should I do?
Caller: Keep this secret. Tell me the OTP you just received and transfer the money now.`;
const ordinaryCall = `Caller: Hi grandma, I will visit on Sunday afternoon.
Recipient: Lovely. Please bring the family photos.
Caller: Sure, see you then.`;

function responseError(value: unknown): string {
  return value && typeof value === "object" && "error" in value && typeof value.error === "string" ? value.error : "The request failed. Check the endpoint and try again.";
}

export default function Home() {
  const [transcript, setTranscript] = useState(sampleCall);
  const [riskPrompt, setRiskPrompt] = useState(defaultRiskPrompt);
  const [victimPrompt, setVictimPrompt] = useState(defaultVictimPrompt);
  const [callerPrompt, setCallerPrompt] = useState(defaultCallerPrompt);
  const [weights, setWeights] = useState<RuleWeights>(defaultWeights);
  const [threshold, setThreshold] = useState(90);
  const [audience, setAudience] = useState<"victim" | "caller">("victim");
  const [accessKey, setAccessKey] = useState("");
  const [status, setStatus] = useState<{ c1: boolean; c2: boolean } | null>(null);
  const [statusError, setStatusError] = useState("");
  const [riskResult, setRiskResult] = useState<RiskResult | null>(null);
  const [agentResult, setAgentResult] = useState<AgentResult | null>(null);
  const [riskError, setRiskError] = useState("");
  const [agentError, setAgentError] = useState("");
  const [riskBusy, setRiskBusy] = useState(false);
  const [agentBusy, setAgentBusy] = useState(false);
  const [savedMessage, setSavedMessage] = useState("");

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      try {
        const raw = localStorage.getItem("scamboo-settings-v1");
        if (raw) {
          const saved = JSON.parse(raw) as Partial<Saved>;
          if (typeof saved.riskPrompt === "string") setRiskPrompt(saved.riskPrompt);
          if (typeof saved.victimPrompt === "string") setVictimPrompt(saved.victimPrompt);
          if (typeof saved.callerPrompt === "string") setCallerPrompt(saved.callerPrompt);
          if (saved.weights) setWeights({ ...defaultWeights, ...saved.weights });
          if (typeof saved.threshold === "number") setThreshold(saved.threshold);
        }
      } catch { setSavedMessage("Saved settings could not be read. Defaults are loaded."); }
    });
    fetch("/api/test")
      .then(async (response) => {
        if (!response.ok) throw new Error("Could not check model status.");
        setStatus(await response.json());
      })
      .catch(() => setStatusError("Model status unavailable. You can still try the test bench."));
    return () => { cancelled = true; };
  }, []);

  function saveSettings() {
    try {
      localStorage.setItem("scamboo-settings-v1", JSON.stringify({ riskPrompt, victimPrompt, callerPrompt, weights, threshold } satisfies Saved));
      setSavedMessage("Saved in this browser. Share prompt text separately with teammates.");
    } catch { setSavedMessage("This browser could not save settings. Copy your prompts before closing."); }
  }

  function setWeight(id: SignalId, value: string) {
    setWeights((current) => ({ ...current, [id]: value === "" ? 0 : Math.min(100, Math.max(0, Number(value) || 0)) }));
    setRiskResult(null);
  }

  async function runRisk(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setRiskBusy(true); setRiskError(""); setRiskResult(null);
    try {
      const response = await fetch("/api/test", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(accessKey ? { "x-scamboo-key": accessKey } : {}) },
        body: JSON.stringify({ kind: "risk", transcript, prompt: riskPrompt, weights, threshold }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(responseError(data));
      setRiskResult(data as RiskResult);
    } catch (error) { setRiskError(error instanceof Error ? error.message : "Risk test failed. Try again."); }
    finally { setRiskBusy(false); }
  }

  async function runAgent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setAgentBusy(true); setAgentError(""); setAgentResult(null);
    try {
      const response = await fetch("/api/test", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(accessKey ? { "x-scamboo-key": accessKey } : {}) },
        body: JSON.stringify({ kind: "agent", transcript, audience, prompt: audience === "victim" ? victimPrompt : callerPrompt }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(responseError(data));
      setAgentResult(data as AgentResult);
    } catch (error) { setAgentError(error instanceof Error ? error.message : "Agent test failed. Try again."); }
    finally { setAgentBusy(false); }
  }

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-8 flex flex-wrap items-start justify-between gap-5 border-b border-border pb-6">
        <div>
          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.16em] text-muted">ScamBoo · team workspace</p>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Call safety test bench</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">Test staged conversations, tune detection rules, and draft spoken agent replies before connecting live audio.</p>
        </div>
        <div className="flex flex-wrap gap-2" aria-label="Model connection status">
          <span className="status-pill">C1 Risk <strong>{status ? (status.c1 ? "Live" : "Mock") : "Checking"}</strong></span>
          <span className="status-pill">C2 Dialogue <strong>{status ? (status.c2 ? "Live" : "Mock") : "Checking"}</strong></span>
        </div>
      </header>
      {statusError && <p role="status" className="mb-5 rounded-lg bg-notice p-3 text-sm">{statusError}</p>}

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="space-y-6" aria-labelledby="input-heading">
          <div className="panel">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div><p className="eyebrow">01 · Input</p><h2 id="input-heading" className="section-title">Conversation</h2></div>
              <div className="flex gap-2">
                <button type="button" className="button-secondary" onClick={() => { setTranscript(sampleCall); setRiskResult(null); setAgentResult(null); }}>Scam example</button>
                <button type="button" className="button-secondary" onClick={() => { setTranscript(ordinaryCall); setRiskResult(null); setAgentResult(null); }}>Ordinary call</button>
              </div>
            </div>
            <label className="field-label" htmlFor="transcript">Staged call transcript</label>
            <textarea id="transcript" className="field min-h-52 font-mono text-sm" value={transcript} onChange={(event) => { setTranscript(event.target.value); setRiskResult(null); setAgentResult(null); }} maxLength={12000} aria-describedby="transcript-help" />
            <p id="transcript-help" className="help-text">Label each speaker. Use invented or consented test conversations only. This text is sent to the configured model when live.</p>
          </div>

          <form className="panel" onSubmit={runRisk}>
            <p className="eyebrow">02 · C1 / Qwen3-8B</p><h2 className="section-title">Risk detection</h2>
            <p className="section-copy">C1 extracts evidence. The weights below produce a test score, not a calibrated probability.</p>
            <label className="field-label mt-5" htmlFor="risk-prompt">Detection prompt</label>
            <textarea id="risk-prompt" className="field min-h-36 text-sm" value={riskPrompt} onChange={(event) => setRiskPrompt(event.target.value)} maxLength={4000} />
            <fieldset className="mt-5">
              <legend className="field-label">Evidence weights</legend>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">{signals.map((signal) => (
                <div key={signal.id} className="rule-row">
                  <label htmlFor={`weight-${signal.id}`} className="min-w-0 flex-1 text-sm font-medium">{signal.label}</label>
                  <input id={`weight-${signal.id}`} type="number" min="0" max="100" step="1" className="weight-input" value={weights[signal.id]} onChange={(event) => setWeight(signal.id, event.target.value)} />
                </div>
              ))}</div>
            </fieldset>
            <div className="mt-5 flex flex-wrap items-end justify-between gap-4">
              <div><label className="field-label" htmlFor="threshold">Intervention threshold</label><input id="threshold" type="number" min="1" max="100" step="1" className="field w-28" value={threshold} onChange={(event) => { setThreshold(Number(event.target.value)); setRiskResult(null); }} /></div>
              <button className="button-primary" type="submit" disabled={riskBusy || !transcript.trim()} aria-busy={riskBusy}>{riskBusy ? "Checking call..." : "Analyze call"}</button>
            </div>
            {riskError && <p role="alert" className="error-box mt-4">{riskError} <button type="submit" className="underline">Retry</button></p>}
          </form>
        </section>

        <section className="space-y-6" aria-label="Results and agent replies">
          <div className="panel min-h-64" aria-live="polite">
            <p className="eyebrow">03 · Decision evidence</p><h2 className="section-title">Risk result</h2>
            {riskBusy ? <div className="mt-6 space-y-3" aria-label="Analyzing call"><div className="skeleton h-16" /><div className="skeleton h-12" /><p className="help-text">C1 is reviewing the transcript...</p></div> : riskResult ? <>
              <div className="mt-5 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <strong className="text-5xl tabular-nums">{riskResult.score}<span className="text-2xl text-muted">/100</span></strong>
                <span className={riskResult.intervene ? "decision-high" : "decision-low"}>{riskResult.intervene ? "Review for intervention" : "Below threshold"}</span>
                <span className="text-sm text-muted">{riskResult.mode === "mock" ? "Mock keyword check" : "Live C1 evidence"}</span>
              </div>
              <p className="help-text mt-3">Threshold {riskResult.threshold}. This score is a weighted rule total; it is not a probability of fraud.</p>
              {riskResult.findings.length ? <ul className="mt-5 space-y-2">{riskResult.findings.map((finding, index) => (
                <li key={`${finding.id}-${index}`} className="finding-row"><span className="font-medium">{signals.find((signal) => signal.id === finding.id)?.label}</span><q className="text-muted">{finding.evidence}</q></li>
              ))}</ul> : <p className="empty-state mt-5">No configured signals were found. Try another staged transcript or adjust the prompt.</p>}
            </> : <p className="empty-state mt-6">Run “Analyze call” to see the evidence and proposed action.</p>}
          </div>

          <form className="panel" onSubmit={runAgent}>
            <p className="eyebrow">04 · C2 / Qwen3-8B</p><h2 className="section-title">Agent reply</h2>
            <p className="section-copy">Try the next spoken line for either side of the separated call.</p>
            <fieldset className="mt-5"><legend className="field-label">Who will hear the reply?</legend><div className="mt-2 flex flex-wrap gap-2">
              <label className="choice"><input type="radio" name="audience" checked={audience === "victim"} onChange={() => { setAudience("victim"); setAgentResult(null); }} /> Recipient</label>
              <label className="choice"><input type="radio" name="audience" checked={audience === "caller"} onChange={() => { setAudience("caller"); setAgentResult(null); }} /> Caller-side demo</label>
            </div></fieldset>
            <label className="field-label mt-5" htmlFor="agent-prompt">{audience === "victim" ? "Recipient guidance prompt" : "Caller-side personality prompt"}</label>
            <textarea id="agent-prompt" className="field min-h-40 text-sm" value={audience === "victim" ? victimPrompt : callerPrompt} onChange={(event) => audience === "victim" ? setVictimPrompt(event.target.value) : setCallerPrompt(event.target.value)} maxLength={4000} />
            <div className="mt-5 flex justify-end"><button type="submit" className="button-primary" disabled={agentBusy || !transcript.trim()} aria-busy={agentBusy}>{agentBusy ? "Writing reply..." : "Generate reply"}</button></div>
            {agentError && <p role="alert" className="error-box mt-4">{agentError} <button type="submit" className="underline">Retry</button></p>}
            <div className="mt-5 border-t border-border pt-5" aria-live="polite"><p className="field-label">Next spoken line</p>
              {agentBusy ? <div className="skeleton mt-3 h-20" /> : agentResult ? <blockquote className="reply-box mt-2">“{agentResult.text}”<span className="mt-3 block text-xs font-medium text-muted">{agentResult.mode === "mock" ? "Mock reply; prompt edits require live C2" : "Generated by live C2"}</span></blockquote> : <p className="empty-state mt-2">Generate a reply to review it here.</p>}
            </div>
          </form>

          <div className="panel"><p className="eyebrow">Team settings</p><h2 className="section-title">Save this setup</h2>
            <p className="section-copy">Prompts, weights, and threshold save only in this browser. The transcript and access key are never saved.</p>
            <label className="field-label mt-5" htmlFor="access-key">Live model access key</label>
            <input id="access-key" type="password" autoComplete="off" className="field" value={accessKey} onChange={(event) => setAccessKey(event.target.value)} placeholder="Provided by the deployment worker" />
            <p className="help-text">Used only for live C1/C2 requests. Keep it out of the repository.</p>
            <button type="button" className="button-secondary mt-5" onClick={saveSettings}>Save settings in browser</button>
            {savedMessage && <p role="status" className="help-text mt-3">{savedMessage}</p>}
          </div>
        </section>
      </div>
    </main>
  );
}
