// A simulated messaging app with the EasyChat bubble floating on top -
// the Android signature experience from the PRD, playable in the browser.
import { AnimatePresence, motion, useAnimationControls, useMotionValue } from 'framer-motion';
import { AudioLines, Camera, ChevronLeft, ClipboardPaste, MoreVertical, Phone, Send, Video, WandSparkles, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { AssistResult, Vibe } from '../../shared/types';
import { assist } from '../lib/api';
import { useStore } from '../lib/store';
import { VIBES } from '../lib/meta';
import { copyText } from '../components/results';
import { cx, softSpring, spring, useToast } from '../components/ui';

interface Msg {
  id: number;
  me: boolean;
  text: string;
}

const SCRIPT: Msg[] = [
  { id: 1, me: false, text: 'Okay your profile said you make the best carbonara in London. Bold claim 👀' },
  { id: 2, me: true, text: "I stand by it. It's a gift and a curse" },
  { id: 3, me: false, text: "Haha confidence, I like it. I just got back from two weeks in Lisbon so I'm a pastry snob now. What are you up to this weekend?" },
];

const FOLLOW_UPS = [
  "Haha okay you've got my attention 😄 Saturday works?",
  "Stop, that's actually so sweet. Tell me more!",
  'Deal. But I\'m judging the carbonara very harshly 😏',
];

type Phase = 'idle' | 'panel' | 'consent' | 'scanning' | 'results';

export default function BubbleDemo() {
  const nav = useNavigate();
  const store = useStore();
  const toast = useToast();
  const frameRef = useRef<HTMLDivElement>(null);
  const [msgs, setMsgs] = useState<Msg[]>(SCRIPT);
  const [composer, setComposer] = useState('');
  const [phase, setPhase] = useState<Phase>('idle');
  const [hidden, setHidden] = useState(!store.settings.bubbleEnabled);
  const [result, setResult] = useState<AssistResult | null>(null);
  const [vibe, setVibe] = useState<Vibe>(store.settings.ageConfirmed ? 'playful' : 'chill');
  const [clipboard, setClipboard] = useState('');
  const [typing, setTyping] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [overX, setOverX] = useState(false);
  const [side, setSide] = useState<'left' | 'right'>('right');
  const [idle, setIdle] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const controls = useAnimationControls();
  const BUBBLE = 56;

  // Position the bubble on the right edge once we know the frame size.
  useEffect(() => {
    const f = frameRef.current;
    if (!f) return;
    x.set(f.clientWidth - BUBBLE - 10);
    y.set(f.clientHeight * 0.42);
  }, [x, y]);

  // Fade to the idle opacity after a few seconds without interaction.
  useEffect(() => {
    if (phase !== 'idle' || dragging) {
      setIdle(false);
      return;
    }
    const t = setTimeout(() => setIdle(true), 3000);
    return () => clearTimeout(t);
  }, [phase, dragging]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [msgs, typing]);

  const snapToEdge = () => {
    const f = frameRef.current!;
    const midX = x.get() + BUBBLE / 2;
    if (overX) {
      setHidden(true);
      setOverX(false);
      toast('Bubble hidden - turn it back on from the app');
      return;
    }
    const toRight = midX > f.clientWidth / 2;
    setSide(toRight ? 'right' : 'left');
    const maxY = f.clientHeight - BUBBLE - 90;
    controls.start({
      x: toRight ? f.clientWidth - BUBBLE - 10 : 10,
      y: Math.max(70, Math.min(maxY, y.get())),
      transition: spring,
    });
  };

  const snap = async (v: Vibe = vibe) => {
    setPhase('scanning');
    try {
      const text = msgs.map((m) => `${m.me ? 'Me' : 'Sophie'}: ${m.text}`).join('\n');
      const [res] = await Promise.all([
        assist({ task: 'reply', mode: 'dating', vibe: v, length: 'short', language: store.settings.language, text, style: store.style.samples.length ? { samples: store.style.samples, traits: store.style.traits, forbidden: store.style.forbidden } : undefined }),
        new Promise((r) => setTimeout(r, 1500)),
      ]);
      setResult(res);
      setPhase('results');
    } catch {
      toast('Could not reach EasyChat - try again', 'warn');
      setPhase('panel');
    }
  };

  const pick = async (text: string) => {
    await copyText(text);
    setClipboard(text);
    setPhase('idle');
    toast('Copied - paste it in the chat');
  };

  const send = () => {
    if (!composer.trim()) return;
    const id = Date.now();
    setMsgs((m) => [...m, { id, me: true, text: composer.trim() }]);
    setComposer('');
    setTimeout(() => setTyping(true), 700);
    setTimeout(() => {
      setTyping(false);
      setMsgs((m) => [...m, { id: id + 1, me: false, text: FOLLOW_UPS[m.length % FOLLOW_UPS.length] }]);
    }, 2600);
  };

  return (
    <div className="absolute inset-0 flex flex-col bg-bg">
      <div className="flex items-center justify-between px-4 pt-3 pb-2">
        <button onClick={() => nav(-1)} className="flex items-center gap-1 text-[13px] font-medium text-muted">
          <ChevronLeft size={18} /> Back to EasyChat
        </button>
        <span className="rounded-full bg-indigo/15 px-2.5 py-1 text-[11px] font-semibold text-indigo-2">Bubble demo</span>
      </div>

      {/* Fake host messaging app */}
      <div ref={frameRef} className="relative mx-3 mb-3 flex flex-1 flex-col overflow-hidden rounded-[30px] border border-line-strong bg-[#FBF7F2] text-[#1d1d1f]">
        <div className="flex items-center gap-3 border-b border-black/5 bg-white/80 px-4 py-3 backdrop-blur">
          <ChevronLeft size={20} className="text-black/50" />
          <div className="grid size-9 place-items-center rounded-full bg-gradient-to-br from-[#ffb199] to-[#ff6f91] text-[13px] font-semibold text-white">S</div>
          <div className="flex-1">
            <p className="text-[14px] font-semibold">Sophie</p>
            <p className="text-[11px] text-black/45">{typing ? 'typing…' : 'Active now'}</p>
          </div>
          <Phone size={18} className="text-black/40" />
          <Video size={19} className="text-black/40" />
          <MoreVertical size={18} className="text-black/40" />
        </div>

        <div ref={scrollRef} className="no-scrollbar flex-1 space-y-2 overflow-y-auto px-3 py-4">
          <p className="pb-2 text-center text-[10.5px] font-medium tracking-wide text-black/35 uppercase">You matched with Sophie · Today</p>
          <AnimatePresence initial={false}>
            {msgs.map((m) => (
              <motion.div key={m.id} layout initial={{ opacity: 0, y: 12, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={softSpring} className={cx('flex', m.me && 'justify-end')}>
                <span className={cx('max-w-[78%] rounded-[20px] px-3.5 py-2 text-[14px] leading-snug', m.me ? 'rounded-br-md bg-[#6C4DFF] text-white' : 'rounded-bl-md bg-white shadow-sm')}>{m.text}</span>
              </motion.div>
            ))}
            {typing && (
              <motion.div key="typing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex">
                <span className="flex gap-1 rounded-[20px] rounded-bl-md bg-white px-4 py-3 shadow-sm">
                  {[0, 1, 2].map((d) => (
                    <motion.span key={d} className="size-1.5 rounded-full bg-black/40" animate={{ y: [0, -3, 0] }} transition={{ delay: d * 0.15, duration: 0.8, repeat: Infinity }} />
                  ))}
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Composer */}
        <div className="flex items-center gap-2 border-t border-black/5 bg-white px-3 py-2.5">
          <input
            value={composer}
            onChange={(e) => setComposer(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && send()}
            placeholder="Message Sophie…"
            className="h-10 flex-1 rounded-full bg-black/[.05] px-4 text-[14px] outline-none placeholder:text-black/35"
          />
          <AnimatePresence>
            {clipboard && !composer && (
              <motion.button
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                onClick={() => setComposer(clipboard)}
                className="flex h-10 items-center gap-1 rounded-full bg-[#6C4DFF]/10 px-3 text-[12px] font-semibold text-[#6C4DFF]"
              >
                <ClipboardPaste size={14} /> Paste
              </motion.button>
            )}
          </AnimatePresence>
          <motion.button whileTap={{ scale: 0.9 }} onClick={send} disabled={!composer.trim()} className="grid size-10 place-items-center rounded-full bg-[#6C4DFF] text-white disabled:opacity-40" aria-label="Send">
            <Send size={16} />
          </motion.button>
        </div>

        {/* Scan overlay */}
        <AnimatePresence>
          {phase === 'scanning' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="pointer-events-none absolute inset-0 z-20">
              <div className="absolute inset-0 bg-indigo/10" />
              <motion.div className="absolute inset-x-0 h-24 bg-gradient-to-b from-transparent via-indigo-2/40 to-transparent" initial={{ top: '-10%' }} animate={{ top: '100%' }} transition={{ duration: 1.3, repeat: Infinity, ease: 'easeInOut' }} />
              <div className="absolute inset-3 rounded-[24px] border-2 border-indigo-2/70" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Drag-to-dismiss target */}
        <AnimatePresence>
          {dragging && (
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0, scale: overX ? 1.2 : 1 }} exit={{ opacity: 0, y: 30 }} className="absolute bottom-16 left-1/2 z-30 -translate-x-1/2">
              <div className={cx('grid size-14 place-items-center rounded-full border-2 text-white backdrop-blur', overX ? 'border-[#ff5d6c] bg-[#ff5d6c]' : 'border-white/70 bg-black/40')}>
                <X size={24} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* The EasyChat bubble */}
        {!hidden && (
          <motion.button
            aria-label="EasyChat bubble"
            drag
            dragMomentum={false}
            dragConstraints={frameRef}
            dragElastic={0.1}
            animate={controls}
            style={{ x, y, width: BUBBLE, height: BUBBLE, opacity: idle ? store.settings.bubbleIdleOpacity : 1 }}
            onDragStart={() => {
              setDragging(true);
              if (phase === 'panel') setPhase('idle');
            }}
            onDrag={() => {
              const f = frameRef.current!;
              const cxp = x.get() + BUBBLE / 2;
              const cyp = y.get() + BUBBLE / 2;
              setOverX(Math.hypot(cxp - f.clientWidth / 2, cyp - (f.clientHeight - 92)) < 48);
            }}
            onDragEnd={() => {
              setDragging(false);
              snapToEdge();
            }}
            onTap={() => setPhase((p) => (p === 'idle' ? 'panel' : p === 'panel' ? 'idle' : p))}
            whileTap={{ scale: 0.92 }}
            className="absolute top-0 left-0 z-40 rounded-full bg-gradient-to-br from-[#A7A2FF] to-indigo shadow-[0_10px_30px_rgba(99,91,255,.6)] transition-opacity duration-500"
          >
            <motion.span className="absolute inset-0 rounded-full border-2 border-indigo-2" animate={{ scale: [1, 1.35], opacity: [0.6, 0] }} transition={{ duration: 2, repeat: Infinity }} />
            <span className="relative grid size-full place-items-center">
              <span className="flex gap-1">
                {[0, 1, 2].map((d) => (
                  <motion.span
                    key={d}
                    className={cx('size-1.5 rounded-full', d === 2 ? 'bg-mint' : 'bg-white')}
                    animate={phase === 'scanning' ? { y: [0, -4, 0] } : { y: 0 }}
                    transition={{ delay: d * 0.12, duration: 0.6, repeat: phase === 'scanning' ? Infinity : 0 }}
                  />
                ))}
              </span>
            </span>
            <span className="absolute -top-0.5 right-0.5 size-3 rounded-full border-2 border-[#FBF7F2] bg-mint" />
          </motion.button>
        )}

        {/* Mini panel */}
        <AnimatePresence>
          {(phase === 'panel' || phase === 'results' || phase === 'scanning') && (
            <motion.div
              initial={{ y: '110%' }}
              animate={{ y: 0 }}
              exit={{ y: '110%' }}
              transition={softSpring}
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0, bottom: 0.7 }}
              onDragEnd={(_, i) => i.offset.y > 80 && setPhase('idle')}
              className="absolute inset-x-2 bottom-2 z-50 rounded-[28px] border border-white/10 bg-[#0F1B33]/95 p-3 text-ink shadow-2xl backdrop-blur-xl"
              data-theme="dark"
              style={{ color: '#EEF1FB' }}
            >
              <div className="mx-auto mb-2.5 h-1 w-9 rounded-full bg-white/20" />
              {phase === 'panel' && (
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { icon: Camera, t: 'Snap screen', on: () => setPhase('consent'), c: 'from-[#635BFF] to-[#8B85FF]' },
                    { icon: AudioLines, t: 'Voice note', on: () => nav('/assist/voice'), c: 'from-[#FF6FA8] to-[#FFA3C9]' },
                    { icon: ClipboardPaste, t: 'Paste text', on: () => nav('/assist/paste'), c: 'from-[#2EC4A6] to-[#7CF2C8]' },
                    { icon: WandSparkles, t: 'Polish draft', on: () => nav(`/assist/polish${composer ? `?text=${encodeURIComponent(composer)}` : ''}`), c: 'from-[#FF9F5B] to-[#FFC56B]' },
                  ].map((a, i) => (
                    <motion.button key={a.t} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ ...softSpring, delay: i * 0.04 }} whileTap={{ scale: 0.92 }} onClick={a.on} className="flex flex-col items-center gap-1.5 rounded-2xl py-2">
                      <span className={cx('grid size-12 place-items-center rounded-2xl bg-gradient-to-br text-[#112345]', a.c)}>
                        <a.icon size={21} />
                      </span>
                      <span className="text-[11px] font-medium text-white/80">{a.t}</span>
                    </motion.button>
                  ))}
                </div>
              )}
              {phase === 'scanning' && (
                <div className="flex items-center gap-3 px-2 py-3">
                  <motion.div className="size-6 rounded-full border-2 border-indigo-2 border-t-transparent" animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }} />
                  <p className="text-[14px] text-white/80">Reading the chat…</p>
                </div>
              )}
              {phase === 'results' && result && (
                <div className="space-y-2">
                  <div className="no-scrollbar -mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
                    {VIBES.filter((v) => v.id !== 'professional').map((v) => (
                      <button
                        key={v.id}
                        disabled={v.id === 'flirty' && !store.settings.ageConfirmed}
                        onClick={() => {
                          setVibe(v.id);
                          snap(v.id);
                        }}
                        className={cx('h-7 shrink-0 rounded-full px-2.5 text-[11.5px] font-medium disabled:opacity-30', vibe === v.id ? 'bg-indigo text-white' : 'bg-white/10 text-white/70')}
                      >
                        {v.emoji} {v.label}
                      </button>
                    ))}
                  </div>
                  {result.interest && (
                    <div className="flex items-center gap-2 px-1 text-[11.5px] text-white/60">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
                        <motion.div className="h-full rounded-full bg-gradient-to-r from-rose via-amber to-mint" initial={{ width: 0 }} animate={{ width: `${result.interest.score}%` }} transition={{ duration: 1 }} />
                      </div>
                      Interest {result.interest.score}
                    </div>
                  )}
                  {result.options.map((o, i) => (
                    <motion.button
                      key={o.text}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ ...softSpring, delay: i * 0.07 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => pick(o.text)}
                      className="block w-full rounded-2xl bg-white/[.07] p-3 text-left hover:bg-white/10"
                    >
                      <span className="text-[10px] font-semibold tracking-wide text-mint uppercase">{o.label}</span>
                      <p className="mt-0.5 text-[13.5px] leading-snug text-white">{o.text}</p>
                    </motion.button>
                  ))}
                  <p className="pt-1 text-center text-[10.5px] text-white/40">Tap to copy · you paste & send</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Android capture consent (simulated) */}
        <AnimatePresence>
          {phase === 'consent' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-[60] grid place-items-center bg-black/50 p-6">
              <motion.div initial={{ scale: 0.9, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0 }} transition={spring} className="w-full rounded-[26px] bg-[#F3F0F7] p-5 text-[#1d1b20]">
                <p className="text-[17px] font-medium">Start recording or casting with EasyChat?</p>
                <p className="mt-2 text-[13px] leading-snug text-black/60">EasyChat will have access to all information that is visible on your screen while capturing. Apps that block capture won't be shown.</p>
                <div className="mt-5 flex justify-end gap-2 text-[14px] font-medium text-[#6C4DFF]">
                  <button className="rounded-full px-4 py-2" onClick={() => setPhase('panel')}>
                    Cancel
                  </button>
                  <button className="rounded-full bg-[#6C4DFF] px-4 py-2 text-white" onClick={() => snap()}>
                    Start now
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {hidden && (
          <button onClick={() => setHidden(false)} className="absolute top-16 left-1/2 z-30 -translate-x-1/2 rounded-full bg-black/70 px-4 py-2 text-[12px] font-medium text-white">
            Show EasyChat bubble
          </button>
        )}
      </div>
      <p className="px-6 pb-4 text-center text-[11.5px] leading-snug text-muted">
        Drag the bubble · it snaps to the {side === 'right' ? 'left or right' : 'right or left'} edge · drag to ✕ to hide. On Android this floats over Hinge, WhatsApp & more.
      </p>
    </div>
  );
}
