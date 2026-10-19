# EasyChat

The AI chat partner that tells you what to say next, in your own voice. This is the **web MVP** from the PRD roadmap (Phase 1 "Validate": paste, upload, voice), built mobile-first with a playable demo of the Android floating bubble.

**Stack:** React 19 · Vite · TypeScript · Tailwind CSS v4 · Framer Motion · Express API · Claude (`claude-opus-5-5`)

## Run it

```bash
npm install
cp .env.example .env        # optional: add ANTHROPIC_API_KEY for live AI
npm run dev                 # web on :5173, API on :8787
```

Production: `npm run build && npm start` (Express serves `dist/` and the API on one port).

With no API key, the server uses a built-in **demo engine** (heuristic replies, interest meter, scam patterns) so every flow still works. Results show a `Demo engine` / `Live AI` badge. The app also falls back to the demo engine in the browser if no server is reachable, so `dist/` can be hosted statically.

To load the key: `export $(cat .env | xargs) && npm run dev`, or set `ANTHROPIC_API_KEY` in your shell.

## What's in it

| PRD feature | Where |
|---|---|
| Onboarding < 90s: 18+ gate, use cases, Sound Like Me, permissions primer, free demo reply before paywall | `src/screens/Onboarding.tsx` |
| ★ Floating bubble (drag, edge-snap, 40% idle fade, drag-to-✕, 4-action panel, Android capture consent, scan → 3 replies → copy → paste → send) | `src/screens/BubbleDemo.tsx` |
| Snap & Reply / Profile Openers: screenshot upload, paste from clipboard, stitch up to 3 for long profiles, **on-device redaction** (draw black boxes) | `src/components/inputs.tsx` |
| Paste & Reply, Revive, Decode This, Email & Work, Polish My Draft (with word diff) | `src/screens/Assist.tsx` |
| ★ Voice Note Decoder: real waveform, on-device live transcription (play aloud & listen), editable transcript, summary + tone, voice script with spoken preview | `src/components/inputs.tsx` |
| 3 distinct replies with labels, "why this works", "Uses: …", tap to copy, long-press to edit, favourites, regenerate, shorter, translate | `src/components/results.tsx` |
| Modes, vibes (Flirty blocked under 18 or in work/family), length, 6 languages incl. Nigerian Pidgin | `src/lib/meta.ts` |
| ★ Interest Meter, ★ Red Flag & Scam Shield, Next Move | `src/components/results.tsx`, `shared/demo.ts` |
| ★ People Memory: per-person facts, last topic, preferred vibe, history, one-tap wipe | `src/screens/People.tsx` |
| Privacy: explicit consent before sending, PII redaction (emails, phones, cards, postcodes), retention 24h/7d/never, training opt-in off, export JSON, delete account | `src/lib/privacy.ts`, `src/screens/Profile.tsx` |
| Free tier (5 replies + 1 voice note/day), Pro Weekly/Monthly/Annual paywall (demo checkout), referral | `src/screens/Upgrade.tsx` |
| Dark / light mode, reduced-motion support, screen-reader labels | `src/index.css`, `src/App.tsx` |

## AI pipeline

`POST /api/assist` → zod validation → per-IP rate limit → Claude with a structured-output JSON schema (`server/index.ts`). The system prompt treats all chat/screenshot/transcript text as untrusted content (prompt-injection guard), forbids manipulative or coercive messages and claims about other people's feelings, and requires openers to reference real profile details. Refusals return a friendly error; server-side fallbacks (`fallbacks: "default"`) are enabled. Deterministic scam-pattern checks are merged into the model's red flags. Logs record metadata only, never message content.

## Not in this build (native-only)

The real Android overlay (`SYSTEM_ALERT_WINDOW` + `MediaProjection`) and the iOS keyboard / Share Extension / Back Tap need the native app (React Native + Kotlin/Swift modules, per the PRD). Payments are simulated; production billing goes through Google Play / App Store with server-side receipt validation. Data is stored on-device (localStorage); Supabase auth/sync is the next step.
