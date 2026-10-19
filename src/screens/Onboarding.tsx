import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, BriefcaseBusiness, Check, Flame, Hand, Keyboard, Layers, Lock, MonitorSmartphone, ShieldCheck, Timer, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { AssistResult, Mode } from '../../shared/types';
import { demoAssist } from '../../shared/demo';
import { useStore } from '../lib/store';
import { Button, Logo, cx, softSpring, spring } from '../components/ui';
import { ReplyCard, copyText } from '../components/results';

const STEPS = 5;

export default function Onboarding({ onDone }: { onDone: () => void }) {
  const store = useStore();
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [age, setAge] = useState(store.settings.ageConfirmed);
  const [uses, setUses] = useState<Mode[]>(store.settings.useCases);
  const [samples, setSamples] = useState(store.style.samples.join('\n'));

  const go = (n: number) => {
    setDir(n > step ? 1 : -1);
    setStep(n);
  };

  const finish = () => {
    store.updateSettings({ onboarded: true, ageConfirmed: age, useCases: uses, defaultMode: uses.includes('dating') && age ? 'dating' : (uses[0] ?? 'friends') });
    onDone();
  };

  return (
    <div className="relative flex h-full flex-col overflow-hidden">
      <div className="aurora grain pointer-events-none absolute inset-0" />
      <div className="relative flex items-center justify-between px-5 pt-5">
        <Logo />
        {step > 0 && step < STEPS - 1 && (
          <button onClick={() => go(step + 1)} className="text-[13px] text-muted">
            Skip
          </button>
        )}
      </div>
      <div className="relative mt-4 flex gap-1.5 px-5">
        {Array.from({ length: STEPS }).map((_, i) => (
          <div key={i} className="h-1 flex-1 overflow-hidden rounded-full bg-line-strong">
            <motion.div className="h-full bg-indigo-2" initial={false} animate={{ width: i <= step ? '100%' : '0%' }} transition={softSpring} />
          </div>
        ))}
      </div>

      <div className="relative flex-1 overflow-y-auto no-scrollbar">
        <AnimatePresence mode="wait" custom={dir}>
          <motion.div
            key={step}
            custom={dir}
            initial={{ opacity: 0, x: dir * 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: dir * -40 }}
            transition={softSpring}
            className="flex min-h-full flex-col px-5 pt-8 pb-6"
          >
            {step === 0 && <Welcome age={age} setAge={setAge} onNext={() => go(1)} />}
            {step === 1 && <UseCases uses={uses} setUses={setUses} age={age} onNext={() => go(2)} />}
            {step === 2 && (
              <SoundLikeMe
                samples={samples}
                setSamples={setSamples}
                onNext={() => {
                  store.setStyleSamples(samples.split('\n').map((s) => s.trim()).filter(Boolean).slice(0, 10));
                  go(3);
                }}
              />
            )}
            {step === 3 && <Permissions onNext={() => go(4)} />}
            {step === 4 && <DemoReply onDone={finish} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

function Welcome({ age, setAge, onNext }: { age: boolean; setAge: (v: boolean) => void; onNext: () => void }) {
  return (
    <>
      <div className="relative mx-auto mb-8 h-[220px] w-full max-w-[300px]">
        <FloatingBubbles />
      </div>
      <h1 className="font-display text-[52px] leading-[0.92] tracking-tight">
        Never get stuck on a <em className="text-gradient">reply</em> again.
      </h1>
      <p className="mt-4 text-[15.5px] leading-relaxed text-ink-2">Tap the bubble, get the perfect message in your own voice, and keep the conversation flowing.</p>
      <div className="flex-1" />
      <button onClick={() => setAge(!age)} className="mt-8 flex items-center gap-3 rounded-2xl border border-line bg-surface/70 p-3.5 text-left backdrop-blur">
        <motion.span animate={{ scale: age ? [1, 1.2, 1] : 1 }} className={cx('grid size-6 shrink-0 place-items-center rounded-lg border-2', age ? 'border-indigo bg-indigo text-white' : 'border-line-strong')}>
          {age && <Check size={14} strokeWidth={3} />}
        </motion.span>
        <span className="text-[13.5px] leading-snug text-ink-2">I'm 18 or older. Dating and flirty modes are 18+ only.</span>
      </button>
      <Button size="lg" block className="mt-3" onClick={onNext}>
        Get started <ArrowRight size={18} />
      </Button>
      {!age && <p className="mt-2 text-center text-[11.5px] text-muted">Under 18? You can still use Friends, Family and Work.</p>}
    </>
  );
}

function FloatingBubbles() {
  const items = [
    { t: 'hey… so what are you up to this weekend?', me: false, x: 0, y: 0, d: 0.1 },
    { t: 'not much yet 👀 you?', me: true, x: 40, y: 64, d: 0.5 },
  ];
  return (
    <>
      {items.map((b, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: [0, -6, 0], scale: 1 }}
          transition={{ opacity: { delay: b.d }, scale: { delay: b.d, ...spring }, y: { delay: b.d + 0.5, duration: 4 + i, repeat: Infinity, ease: 'easeInOut' } }}
          className={cx('absolute max-w-[220px] rounded-[22px] px-4 py-2.5 text-[14px] shadow-card', b.me ? 'rounded-br-md bg-indigo text-white' : 'rounded-bl-md border border-line bg-surface')}
          style={{ left: b.me ? undefined : b.x, right: b.me ? 0 : undefined, top: b.y }}
        >
          {b.t}
        </motion.div>
      ))}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1, ...softSpring }}
        className="absolute bottom-0 left-4 right-10 rounded-[22px] border border-mint/30 bg-surface/90 p-3 shadow-card backdrop-blur"
      >
        <p className="mb-1 text-[10px] font-semibold tracking-wide text-mint uppercase">EasyChat · Playful</p>
        <p className="text-[13.5px]">Plotting something fun actually - got a good brunch spot recommendation? 😄</p>
      </motion.div>
      <motion.div
        className="absolute -right-1 bottom-14 size-14 rounded-full bg-gradient-to-br from-indigo-2 to-indigo shadow-[0_10px_40px_rgba(99,91,255,.7)]"
        initial={{ scale: 0 }}
        animate={{ scale: [1, 1.08, 1] }}
        transition={{ scale: { delay: 1.3, duration: 2.2, repeat: Infinity } }}
      >
        <div className="grid size-full place-items-center">
          <div className="flex gap-1">
            {[0, 1, 2].map((d) => (
              <motion.span key={d} className={cx('size-1.5 rounded-full', d === 2 ? 'bg-mint' : 'bg-white')} animate={{ y: [0, -3, 0] }} transition={{ delay: d * 0.15, duration: 0.9, repeat: Infinity }} />
            ))}
          </div>
        </div>
      </motion.div>
    </>
  );
}

function UseCases({ uses, setUses, age, onNext }: { uses: Mode[]; setUses: (m: Mode[]) => void; age: boolean; onNext: () => void }) {
  const opts: { id: Mode; label: string; blurb: string; icon: typeof Flame; color: string; disabled?: boolean }[] = [
    { id: 'dating', label: 'Dating', blurb: 'Openers, replies, knowing when to ask them out', icon: Flame, color: '#FF7AB6', disabled: !age },
    { id: 'friends', label: 'Friends & family', blurb: 'Keep chats alive, repair awkward moments', icon: Users, color: '#7CF2C8' },
    { id: 'work', label: 'Work', blurb: 'Emails, client replies, LinkedIn DMs', icon: BriefcaseBusiness, color: '#7FB2FF' },
  ];
  const toggle = (m: Mode) => setUses(uses.includes(m) ? uses.filter((x) => x !== m) : [...uses, m]);
  return (
    <>
      <h1 className="font-display text-[42px] leading-[0.95]">What will you use it for?</h1>
      <p className="mt-3 text-[15px] text-ink-2">Pick as many as you like. You can switch modes any time.</p>
      <div className="mt-8 space-y-3">
        {opts.map((o, i) => {
          const on = uses.includes(o.id);
          return (
            <motion.button
              key={o.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: o.disabled ? 0.4 : 1, y: 0 }}
              transition={{ ...softSpring, delay: i * 0.07 }}
              whileTap={{ scale: 0.98 }}
              disabled={o.disabled}
              onClick={() => toggle(o.id)}
              className={cx('flex w-full items-center gap-4 rounded-[24px] border p-4 text-left transition-colors', on ? 'border-indigo bg-indigo/10' : 'border-line bg-surface')}
            >
              <div className="grid size-12 shrink-0 place-items-center rounded-2xl text-navy" style={{ background: o.color }}>
                <o.icon size={22} />
              </div>
              <div className="flex-1">
                <p className="text-[16px] font-semibold">{o.label}</p>
                <p className="text-[12.5px] leading-snug text-muted">{o.disabled ? '18+ only' : o.blurb}</p>
              </div>
              <motion.div animate={{ scale: on ? 1 : 0.6, opacity: on ? 1 : 0 }} transition={spring} className="grid size-7 place-items-center rounded-full bg-indigo text-white">
                <Check size={15} strokeWidth={3} />
              </motion.div>
            </motion.button>
          );
        })}
      </div>
      <div className="flex-1" />
      <Button size="lg" block className="mt-8" onClick={onNext} disabled={!uses.length}>
        Continue
      </Button>
    </>
  );
}

function SoundLikeMe({ samples, setSamples, onNext }: { samples: string; setSamples: (s: string) => void; onNext: () => void }) {
  const count = samples.split('\n').filter((s) => s.trim()).length;
  return (
    <>
      <span className="mb-3 inline-flex w-fit items-center gap-1.5 rounded-full bg-mint/15 px-3 py-1 text-[11px] font-semibold tracking-wide text-mint uppercase">★ Sound Like Me</span>
      <h1 className="font-display text-[42px] leading-[0.95]">Teach it how you text.</h1>
      <p className="mt-3 text-[15px] text-ink-2">Paste 5-10 messages you've actually sent - one per line. EasyChat learns your slang, emoji, length and punctuation, so replies don't sound like AI.</p>
      <textarea
        value={samples}
        onChange={(e) => setSamples(e.target.value)}
        rows={7}
        placeholder={"omg yes i'm so down\nhaha no way 😂 that's actually wild\nrunning 10 mins late sorry!!\n…"}
        className="mt-6 w-full resize-none rounded-[24px] border border-line bg-surface p-4 text-[15px] leading-relaxed outline-none focus:border-indigo/60"
      />
      <div className="mt-2 flex items-center gap-2 px-1">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-line-strong">
          <motion.div className="h-full rounded-full bg-gradient-to-r from-indigo-2 to-mint" animate={{ width: `${Math.min(100, (count / 5) * 100)}%` }} transition={softSpring} />
        </div>
        <span className="text-[12px] text-muted tabular-nums">{count}/5</span>
      </div>
      <p className="mt-3 flex items-center gap-1.5 text-[12px] text-muted">
        <Lock size={12} /> Stored on your device. Edit or delete any time.
      </p>
      <div className="flex-1" />
      <Button size="lg" block className="mt-6" onClick={onNext}>
        {count ? 'Learn my style' : 'Skip for now'}
      </Button>
    </>
  );
}

function Permissions({ onNext }: { onNext: () => void }) {
  const [platform, setPlatform] = useState<'android' | 'ios'>(/iphone|ipad/i.test(navigator.userAgent) ? 'ios' : 'android');
  const steps =
    platform === 'android'
      ? [
          { icon: Layers, t: 'Display over other apps', d: 'Lets the EasyChat bubble sit at the edge of your screen. Drag it to the X to hide it.' },
          { icon: MonitorSmartphone, t: 'Screen capture - only when you tap', d: 'Android asks you to confirm each session. Apps that block capture stay blocked.' },
        ]
      : [
          { icon: Keyboard, t: 'EasyChat Keyboard', d: 'Replies appear above your keys and insert straight into the chat. Full Access is needed to reach the AI.' },
          { icon: Hand, t: 'Back Tap shortcut', d: 'Double-tap the back of your iPhone to send a screenshot to EasyChat in one move.' },
        ];
  return (
    <>
      <h1 className="font-display text-[42px] leading-[0.95]">Works where you chat.</h1>
      <div className="mt-5 flex rounded-2xl bg-surface-2 p-1">
        {(['android', 'ios'] as const).map((p) => (
          <button key={p} onClick={() => setPlatform(p)} className={cx('relative flex-1 rounded-xl py-2 text-[13px] font-medium', platform === p ? 'text-ink' : 'text-muted')}>
            {platform === p && <motion.span layoutId="plat" transition={spring} className="absolute inset-0 rounded-xl bg-surface shadow-card" />}
            <span className="relative">{p === 'android' ? 'Android' : 'iPhone'}</span>
          </button>
        ))}
      </div>
      <AnimatePresence mode="wait">
        <motion.div key={platform} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="mt-5 space-y-3">
          {steps.map((s, i) => (
            <div key={s.t} className="flex gap-3.5 rounded-[22px] border border-line bg-surface p-4">
              <div className="grid size-10 shrink-0 place-items-center rounded-2xl bg-indigo/15 text-indigo-2">
                <s.icon size={19} />
              </div>
              <div>
                <p className="text-[14.5px] font-semibold">
                  {i + 1}. {s.t}
                </p>
                <p className="mt-0.5 text-[12.5px] leading-snug text-muted">{s.d}</p>
              </div>
            </div>
          ))}
        </motion.div>
      </AnimatePresence>
      <div className="mt-6 grid grid-cols-3 gap-2">
        {[
          { icon: Hand, t: 'Never auto-sends' },
          { icon: Timer, t: 'Deleted in 24h' },
          { icon: ShieldCheck, t: 'No training on chats' },
        ].map((p) => (
          <div key={p.t} className="rounded-2xl bg-surface-2 p-3 text-center">
            <p.icon size={18} className="mx-auto mb-1.5 text-mint" />
            <p className="text-[11.5px] leading-tight font-medium text-ink-2">{p.t}</p>
          </div>
        ))}
      </div>
      <p className="mt-4 text-[12px] leading-snug text-muted">This web preview doesn't need these permissions - the native Android and iPhone apps ask for them when you first use each feature.</p>
      <div className="flex-1" />
      <Button size="lg" block className="mt-6" onClick={onNext}>
        Got it
      </Button>
    </>
  );
}

const SAMPLE_CHAT = 'Maya: okay be honest, is pineapple on pizza a dealbreaker?\nMe: depends who is asking 👀\nMaya: someone who just got back from 2 weeks in lisbon and ate nothing but pastéis de nata';

function DemoReply({ onDone }: { onDone: () => void }) {
  const store = useStore();
  const [res, setRes] = useState<AssistResult | null>(null);
  useEffect(() => {
    const t = setTimeout(
      () =>
        setRes(
          demoAssist({
            task: 'reply',
            mode: 'dating',
            vibe: store.settings.ageConfirmed ? 'playful' : 'chill',
            length: 'short',
            language: 'English (UK)',
            text: SAMPLE_CHAT,
            style: { samples: store.style.samples, traits: store.style.traits, forbidden: [] },
          }),
        ),
      1400,
    );
    return () => clearTimeout(t);
  }, [store.settings.ageConfirmed, store.style]);
  const lines = SAMPLE_CHAT.split('\n').map((l) => ({ me: l.startsWith('Me:'), t: l.replace(/^[^:]+:\s*/, '') }));
  return (
    <>
      <h1 className="font-display text-[42px] leading-[0.95]">Here's one on us.</h1>
      <p className="mt-3 text-[15px] text-ink-2">A sample chat - watch EasyChat write three different replies.</p>
      <div className="mt-5 space-y-1.5 rounded-[24px] border border-line bg-surface p-4">
        {lines.map((l, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.25 }} className={cx('flex', l.me && 'justify-end')}>
            <span className={cx('max-w-[80%] rounded-[18px] px-3 py-1.5 text-[13.5px]', l.me ? 'rounded-br-md bg-indigo text-white' : 'rounded-bl-md bg-surface-2')}>{l.t}</span>
          </motion.div>
        ))}
      </div>
      <div className="mt-4 space-y-3">
        {!res ? (
          <div className="flex items-center gap-2 px-1 text-[13px] text-muted">
            <motion.span className="size-2 rounded-full bg-indigo-2" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1, repeat: Infinity }} />
            Reading the vibe…
          </div>
        ) : (
          res.options.map((o, i) => <ReplyCard key={o.text} option={o} index={i} onCopy={(t) => copyText(t)} onFavourite={() => {}} favourite={false} onEdit={() => {}} />)
        )}
      </div>
      <div className="flex-1" />
      <Button size="lg" block className="mt-6" onClick={onDone} disabled={!res}>
        Start using EasyChat <ArrowRight size={18} />
      </Button>
    </>
  );
}
