import { AnimatePresence, animate, motion, useMotionValue, useTransform } from 'framer-motion';
import { Check, Copy, Lightbulb, Pencil, ShieldAlert, Star, Compass, Info } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { AssistResult, RedFlag, ReplyOption, TranscriptLine } from '../../shared/types';
import { Card, cx, softSpring, spring } from './ui';

const LABEL_COLORS = ['#FFC56B', '#7CF2C8', '#FF7AB6', '#8B85FF', '#7FB2FF'];

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    ta.remove();
    return ok;
  }
}

export function ReplyCard({
  option,
  index,
  onCopy,
  onFavourite,
  favourite,
  onEdit,
}: {
  option: ReplyOption;
  index: number;
  onCopy: (text: string) => void;
  onFavourite: (text: string) => void;
  favourite: boolean;
  onEdit: (text: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(option.text);
  const [copied, setCopied] = useState(false);
  const pressTimer = useRef<number | null>(null);
  const color = LABEL_COLORS[index % LABEL_COLORS.length];

  useEffect(() => setDraft(option.text), [option.text]);

  const doCopy = () => {
    onCopy(draft);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 24, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -12, scale: 0.97 }}
      transition={{ ...softSpring, delay: index * 0.09 }}
      className="group relative overflow-hidden rounded-3xl border border-line bg-surface shadow-card"
    >
      <div className="absolute inset-y-0 left-0 w-1" style={{ background: color }} />
      <div className="p-4 pl-5">
        <div className="mb-2 flex items-center gap-2">
          <span className="rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-wide text-navy uppercase" style={{ background: color }}>
            {option.label}
          </span>
          {option.uses && <span className="truncate text-[12px] text-muted">{option.uses}</span>}
        </div>

        {editing ? (
          <textarea
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={Math.max(2, Math.ceil(draft.length / 34))}
            className="w-full resize-none rounded-2xl border border-indigo/50 bg-surface-2 p-3 text-[16px] leading-snug outline-none"
          />
        ) : (
          <button
            type="button"
            className="block w-full text-left text-[16.5px] leading-snug whitespace-pre-line text-ink"
            onPointerDown={() => {
              pressTimer.current = window.setTimeout(() => {
                pressTimer.current = null;
                setEditing(true);
              }, 480);
            }}
            onPointerUp={() => {
              if (pressTimer.current) {
                clearTimeout(pressTimer.current);
                pressTimer.current = null;
                doCopy();
              }
            }}
            onPointerLeave={() => pressTimer.current && clearTimeout(pressTimer.current)}
            aria-label={`Copy reply: ${draft}`}
          >
            {draft}
          </button>
        )}

        <div className="mt-3 flex items-start gap-2 text-[12.5px] leading-snug text-muted">
          <Lightbulb size={14} className="mt-0.5 shrink-0 text-amber" />
          <span>{option.rationale}</span>
        </div>

        <div className="mt-3 flex items-center gap-1.5">
          <motion.button
            whileTap={{ scale: 0.94 }}
            onClick={doCopy}
            className={cx('flex h-9 items-center gap-1.5 rounded-full px-3.5 text-[13px] font-semibold transition-colors', copied ? 'bg-mint text-navy' : 'bg-indigo text-white')}
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.span key={copied ? 'y' : 'n'} initial={{ y: 8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -8, opacity: 0 }} className="flex items-center gap-1.5">
                {copied ? <Check size={15} strokeWidth={3} /> : <Copy size={14} />}
                {copied ? 'Copied' : 'Copy'}
              </motion.span>
            </AnimatePresence>
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.94 }}
            onClick={() => {
              if (editing) onEdit(draft);
              setEditing((e) => !e);
            }}
            className="flex h-9 items-center gap-1.5 rounded-full bg-surface-2 px-3.5 text-[13px] font-medium text-ink-2"
          >
            {editing ? <Check size={14} /> : <Pencil size={13} />}
            {editing ? 'Done' : 'Edit'}
          </motion.button>
          <div className="flex-1" />
          <motion.button
            whileTap={{ scale: 0.8 }}
            onClick={() => onFavourite(draft)}
            aria-label={favourite ? 'Remove from favourites' : 'Save to favourites'}
            className="grid size-9 place-items-center rounded-full text-muted hover:bg-surface-2"
          >
            <motion.span animate={favourite ? { scale: [1, 1.35, 1], rotate: [0, -12, 0] } : {}} transition={{ duration: 0.4 }}>
              <Star size={17} className={favourite ? 'fill-amber text-amber' : ''} />
            </motion.span>
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

export function InterestMeter({ interest }: { interest: NonNullable<AssistResult['interest']> }) {
  const mv = useMotionValue(0);
  const [shown, setShown] = useState(0);
  const angle = useTransform(mv, [0, 100], [-90, 90]);
  useEffect(() => {
    const c = animate(mv, interest.score, { duration: 1.2, ease: [0.22, 1, 0.36, 1] });
    const unsub = mv.on('change', (v) => setShown(Math.round(v)));
    return () => {
      c.stop();
      unsub();
    };
  }, [interest.score, mv]);
  const color = interest.score >= 70 ? '#7CF2C8' : interest.score >= 45 ? '#FFC56B' : '#FF7AB6';
  const arc = 'M 12 62 A 50 50 0 0 1 112 62';
  return (
    <Card className="flex items-center gap-4 p-4" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={softSpring}>
      <div className="relative h-[70px] w-[124px] shrink-0">
        <svg viewBox="0 0 124 70" className="absolute inset-0">
          <defs>
            <linearGradient id="im" x1="0" x2="1">
              <stop offset="0" stopColor="#FF7AB6" />
              <stop offset=".5" stopColor="#FFC56B" />
              <stop offset="1" stopColor="#7CF2C8" />
            </linearGradient>
          </defs>
          <path d={arc} fill="none" stroke="var(--line-strong)" strokeWidth="10" strokeLinecap="round" />
          <motion.path d={arc} fill="none" stroke="url(#im)" strokeWidth="10" strokeLinecap="round" initial={{ pathLength: 0 }} animate={{ pathLength: interest.score / 100 }} transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }} />
        </svg>
        <motion.div className="absolute bottom-[8px] left-1/2 h-[44px] w-[3px] origin-bottom -translate-x-1/2 rounded-full bg-ink" style={{ rotate: angle }} />
        <div className="absolute bottom-[3px] left-1/2 size-3 -translate-x-1/2 rounded-full bg-ink" />
      </div>
      <div className="min-w-0">
        <div className="flex items-baseline gap-1.5">
          <span className="text-[28px] leading-none font-semibold tabular-nums" style={{ color }}>
            {shown}
          </span>
          <span className="text-[12px] font-semibold tracking-wide text-muted uppercase">Interest</span>
        </div>
        <p className="mt-1 text-[13px] leading-snug text-ink-2">{interest.reading}</p>
        <p className="mt-1 text-[12.5px] leading-snug font-medium" style={{ color }}>
          → {interest.advice}
        </p>
      </div>
    </Card>
  );
}

export function RedFlags({ flags }: { flags: RedFlag[] }) {
  if (!flags.length) return null;
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={spring}
      className="rounded-3xl border border-[#ff6b79]/30 bg-[#ff6b79]/10 p-4"
      role="alert"
    >
      <div className="mb-2 flex items-center gap-2 text-[13px] font-semibold text-[#ff7f8b]">
        <motion.span animate={{ rotate: [0, -10, 10, -6, 0] }} transition={{ duration: 0.6, delay: 0.3 }}>
          <ShieldAlert size={18} />
        </motion.span>
        Red Flag Shield
      </div>
      <ul className="space-y-1.5">
        {flags.map((f, i) => (
          <li key={i} className="text-[13px] leading-snug text-ink-2">
            {f.detail}
          </li>
        ))}
      </ul>
      <p className="mt-2 text-[11.5px] text-muted">Patterns only - not proof. Never send money to someone you haven't met.</p>
    </motion.div>
  );
}

export function TranscriptView({ lines, onChange }: { lines: TranscriptLine[]; onChange?: (lines: TranscriptLine[]) => void }) {
  const [editing, setEditing] = useState<number | null>(null);
  if (!lines.length) return null;
  return (
    <div className="space-y-1.5">
      {lines.map((l, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: l.speaker === 'me' ? 16 : -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ ...softSpring, delay: i * 0.04 }}
          className={cx('flex', l.speaker === 'me' ? 'justify-end' : 'justify-start')}
        >
          {editing === i && onChange ? (
            <input
              autoFocus
              defaultValue={l.text}
              onBlur={(e) => {
                const next = [...lines];
                next[i] = { ...l, text: e.target.value };
                onChange(next);
                setEditing(null);
              }}
              onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
              className="w-[85%] rounded-2xl border border-indigo/50 bg-surface-2 px-3 py-2 text-[14px] outline-none"
            />
          ) : (
            <button
              type="button"
              onClick={() => onChange && setEditing(i)}
              onDoubleClick={() => {
                if (!onChange) return;
                const next = [...lines];
                next[i] = { ...l, speaker: l.speaker === 'me' ? 'them' : 'me' };
                onChange(next);
              }}
              className={cx(
                'max-w-[85%] rounded-[20px] px-3.5 py-2 text-left text-[14px] leading-snug',
                l.speaker === 'me' ? 'rounded-br-md bg-indigo text-white' : 'rounded-bl-md bg-surface-2 text-ink',
              )}
            >
              {l.text}
            </button>
          )}
        </motion.div>
      ))}
      {onChange && <p className="pt-1 text-center text-[11px] text-muted">Tap a line to fix it · double-tap to swap who said it</p>}
    </div>
  );
}

// Word-level diff (LCS) - drafts are short, so O(n·m) is fine.
export function DiffView({ before, after }: { before: string; after: string }) {
  const a = before.split(/(\s+)/).filter((x) => x.length);
  const b = after.split(/(\s+)/).filter((x) => x.length);
  const dp: number[][] = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));
  for (let i = a.length - 1; i >= 0; i--) for (let j = b.length - 1; j >= 0; j--) dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
  const out: { t: string; k: 'same' | 'add' | 'del' }[] = [];
  let i = 0;
  let j = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      out.push({ t: a[i], k: 'same' });
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) out.push({ t: a[i++], k: 'del' });
    else out.push({ t: b[j++], k: 'add' });
  }
  while (i < a.length) out.push({ t: a[i++], k: 'del' });
  while (j < b.length) out.push({ t: b[j++], k: 'add' });
  return (
    <p className="text-[14px] leading-relaxed">
      {out.map((p, n) =>
        p.k === 'same' ? (
          <span key={n} className="text-ink-2">
            {p.t}
          </span>
        ) : p.k === 'add' ? (
          <motion.span key={n} initial={{ backgroundColor: 'rgba(124,242,200,0.6)' }} animate={{ backgroundColor: 'rgba(124,242,200,0.18)' }} transition={{ duration: 1.2, delay: n * 0.01 }} className="rounded px-0.5 text-mint">
            {p.t}
          </motion.span>
        ) : /^\s+$/.test(p.t) ? null : (
          <span key={n} className="text-[#ff7f8b]/80 line-through decoration-[#ff7f8b]/60">
            {p.t}
          </span>
        ),
      )}
    </p>
  );
}

export function NextMove({ text }: { text: string }) {
  if (!text) return null;
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ ...softSpring, delay: 0.35 }} className="flex items-start gap-3 rounded-3xl bg-gradient-to-br from-indigo/20 to-mint/10 p-4">
      <div className="grid size-8 shrink-0 place-items-center rounded-full bg-indigo text-white">
        <Compass size={16} />
      </div>
      <div>
        <p className="text-[11px] font-semibold tracking-[0.08em] text-indigo-2 uppercase">Next move</p>
        <p className="mt-0.5 text-[14px] leading-snug text-ink">{text}</p>
      </div>
    </motion.div>
  );
}

export function Notes({ notes }: { notes: string[] }) {
  if (!notes.length) return null;
  return (
    <div className="flex items-start gap-2 rounded-2xl bg-surface-2 px-3.5 py-3 text-[12.5px] leading-snug text-muted">
      <Info size={14} className="mt-0.5 shrink-0" />
      <div>{notes.map((n, i) => <p key={i}>{n}</p>)}</div>
    </div>
  );
}

const PHRASES = ['Reading the vibe…', 'Checking who said what…', 'Matching your style…', 'Finding something real to say…', 'Writing three different options…'];

export function Thinking() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((x) => (x + 1) % PHRASES.length), 1100);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="space-y-3" aria-busy>
      <div className="flex items-center gap-3 px-1 py-2">
        <div className="relative size-9">
          <motion.div className="absolute inset-0 rounded-full bg-gradient-to-br from-indigo-2 to-mint" animate={{ scale: [1, 1.18, 1], rotate: 360 }} transition={{ scale: { duration: 1.6, repeat: Infinity }, rotate: { duration: 4, repeat: Infinity, ease: 'linear' } }} />
          <motion.div className="absolute inset-1.5 rounded-full bg-bg" />
          <motion.div className="absolute inset-3 rounded-full bg-indigo-2" animate={{ scale: [0.6, 1, 0.6] }} transition={{ duration: 1.2, repeat: Infinity }} />
        </div>
        <AnimatePresence mode="wait">
          <motion.p key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="text-[14px] font-medium text-ink-2">
            {PHRASES[i]}
          </motion.p>
        </AnimatePresence>
      </div>
      {[0, 1, 2].map((k) => (
        <motion.div key={k} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: k * 0.1 }} className="rounded-3xl border border-line bg-surface p-4">
          <div className="shimmer mb-3 h-5 w-20 rounded-full" />
          <div className="shimmer mb-2 h-4 w-full rounded-lg" />
          <div className="shimmer h-4 w-2/3 rounded-lg" />
        </motion.div>
      ))}
    </div>
  );
}
