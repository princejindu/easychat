import type { AssistRequest, AssistResult, ErrorBody } from '../../shared/types';
import { demoAssist } from '../../shared/demo';

export class AssistError extends Error {
  code?: ErrorBody['code'];
  constructor(message: string, code?: ErrorBody['code']) {
    super(message);
    this.code = code;
  }
}

// A static build has no API server, so it always runs the demo engine in the browser.
let engine: 'claude' | 'demo' | 'offline' | null = import.meta.env.VITE_STATIC ? 'offline' : null;

export async function aiEngine(): Promise<'claude' | 'demo' | 'offline'> {
  if (engine) return engine;
  try {
    const r = await fetch('/api/health');
    const j = (await r.json()) as { ai: 'claude' | 'demo' };
    engine = j.ai;
  } catch {
    engine = 'offline';
  }
  return engine;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function assist(req: AssistRequest): Promise<AssistResult> {
  const e = await aiEngine();
  if (e === 'offline') {
    // No server running (e.g. static hosting): run the demo engine locally.
    await sleep(900 + Math.random() * 600);
    return demoAssist(req);
  }
  const started = performance.now();
  const r = await fetch('/api/assist', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  }).catch(() => null);
  if (!r) throw new AssistError("You're offline. Check your connection and try again.", 'upstream');
  if (!r.ok) {
    const body = (await r.json().catch(() => ({ error: 'Something went wrong.' }))) as ErrorBody;
    throw new AssistError(body.error, body.code);
  }
  const result = (await r.json()) as AssistResult;
  // The demo engine answers instantly; pace it so the loading moment reads.
  const elapsed = performance.now() - started;
  if (result.source === 'demo' && elapsed < 1100) await sleep(1100 - elapsed);
  return result;
}

export async function fileToBase64(file: Blob): Promise<string> {
  const buf = await file.arrayBuffer();
  let binary = '';
  const bytes = new Uint8Array(buf);
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(binary);
}
