import { AnimatePresence, motion } from 'framer-motion';
import { Check, Crown, Gift, X } from 'lucide-react';
import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useStore, type Plan } from '../lib/store';
import { Button, IconButton, cx, softSpring, spring, useToast } from '../components/ui';

const PLANS: { id: Exclude<Plan, 'free'>; name: string; price: string; per: string; note?: string; badge?: string; features: string[] }[] = [
  { id: 'annual', name: 'Pro Annual', price: '£49.99', per: '/year', note: '3-day free trial · ≈ £0.96/week', badge: 'Best value', features: ['Everything in Pro Monthly', 'Early access to new features'] },
  { id: 'monthly', name: 'Pro Monthly', price: '£9.99', per: '/month', features: ['People Memory', 'Interest Meter & Red Flag Shield', 'Next Move Coach'] },
  { id: 'weekly', name: 'Pro Weekly', price: '£3.99', per: '/week', features: ['Unlimited replies & voice notes', 'Sound Like Me', 'All vibes and modes'] },
];

const PERKS = ['Unlimited replies & voice notes', 'Sound Like Me in every reply', 'People Memory & Interest Meter', 'Red Flag & Scam Shield', 'Culture & Slang Bridge'];

export default function Upgrade() {
  const nav = useNavigate();
  const [params] = useSearchParams();
  const store = useStore();
  const toast = useToast();
  const [sel, setSel] = useState<Exclude<Plan, 'free'>>('annual');
  const [done, setDone] = useState(false);
  const limit = params.get('reason') === 'limit';

  return (
    <div className="relative min-h-full overflow-hidden pb-10">
      <div className="aurora grain pointer-events-none absolute inset-0" />
      <div className="relative flex justify-end px-3 pt-3">
        <IconButton label="Close" onClick={() => nav(-1)}>
          <X size={20} />
        </IconButton>
      </div>

      <AnimatePresence mode="wait">
        {done ? (
          <motion.div key="done" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="relative flex flex-col items-center px-6 pt-16 text-center">
            <motion.div initial={{ scale: 0, rotate: -40 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 200, damping: 12 }} className="grid size-24 place-items-center rounded-[32px] bg-gradient-to-br from-amber to-[#FF8A5B] text-navy shadow-[0_20px_60px_-10px_rgba(255,197,107,.7)]">
              <Crown size={44} />
            </motion.div>
            {[...Array(12)].map((_, i) => (
              <motion.span
                key={i}
                className="absolute top-28 size-2 rounded-full"
                style={{ background: ['#7CF2C8', '#FF7AB6', '#FFC56B', '#8B85FF'][i % 4] }}
                initial={{ x: 0, y: 0, opacity: 1 }}
                animate={{ x: Math.cos((i / 12) * Math.PI * 2) * 140, y: Math.sin((i / 12) * Math.PI * 2) * 140, opacity: 0 }}
                transition={{ duration: 1.1, ease: 'easeOut' }}
              />
            ))}
            <h1 className="mt-8 font-display text-[46px] leading-none">You're Pro.</h1>
            <p className="mt-3 text-[15px] text-ink-2">Unlimited replies, People Memory and every vibe - unlocked.</p>
            <Button size="lg" block className="mt-10" onClick={() => nav('/')}>
              Let's go
            </Button>
          </motion.div>
        ) : (
          <motion.div key="plans" exit={{ opacity: 0 }} className="relative px-5">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={softSpring}>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber/15 px-3 py-1 text-[11px] font-semibold tracking-wide text-amber uppercase">
                <Crown size={12} /> EasyChat Pro
              </span>
              <h1 className="mt-3 font-display text-[46px] leading-[0.95]">{limit ? "You're on a roll." : 'Never run out of words.'}</h1>
              <p className="mt-2 text-[15px] text-ink-2">{limit ? "You've used today's 5 free replies. Go unlimited, or come back tomorrow." : 'Cheaper than the weekly-subscription apps - and it actually sounds like you.'}</p>
            </motion.div>

            <ul className="mt-6 space-y-2">
              {PERKS.map((p, i) => (
                <motion.li key={p} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 + i * 0.05 }} className="flex items-center gap-2.5 text-[14px]">
                  <span className="grid size-5 place-items-center rounded-full bg-mint text-navy">
                    <Check size={12} strokeWidth={3} />
                  </span>
                  {p}
                </motion.li>
              ))}
            </ul>

            <div className="mt-6 space-y-2.5">
              {PLANS.map((p) => (
                <motion.button key={p.id} whileTap={{ scale: 0.98 }} onClick={() => setSel(p.id)} className={cx('relative w-full rounded-[24px] border-2 p-4 text-left transition-colors', sel === p.id ? 'border-indigo bg-indigo/10' : 'border-line bg-surface')}>
                  {p.badge && <span className="absolute -top-2.5 right-4 rounded-full bg-mint px-2.5 py-0.5 text-[10.5px] font-bold text-navy uppercase">{p.badge}</span>}
                  <div className="flex items-center gap-3">
                    <span className={cx('grid size-5 place-items-center rounded-full border-2', sel === p.id ? 'border-indigo' : 'border-line-strong')}>
                      {sel === p.id && <motion.span layoutId="radio" transition={spring} className="size-2.5 rounded-full bg-indigo" />}
                    </span>
                    <div className="flex-1">
                      <p className="text-[15px] font-semibold">{p.name}</p>
                      {p.note && <p className="text-[12px] text-mint">{p.note}</p>}
                    </div>
                    <p className="text-[18px] font-semibold">
                      {p.price}
                      <span className="text-[12px] font-normal text-muted">{p.per}</span>
                    </p>
                  </div>
                </motion.button>
              ))}
            </div>

            <Button
              size="lg"
              block
              className="mt-6"
              onClick={() => {
                store.setPlan(sel);
                setDone(true);
                toast('Demo purchase - no payment taken');
              }}
            >
              {sel === 'annual' ? 'Start 3-day free trial' : 'Continue'}
            </Button>
            <button onClick={() => toast('Referral link copied - share it with a friend')} className="mt-3 flex w-full items-center justify-center gap-1.5 text-[13px] text-indigo-2">
              <Gift size={14} /> Give a friend 7 days of Pro, get 7 days free
            </button>
            <p className="mt-4 text-center text-[11px] leading-snug text-muted">
              Demo checkout - no payment is taken in this preview. In the apps, billing runs through Google Play and the App Store, verified server-side. Cancel any time.
            </p>
            {store.plan !== 'free' && (
              <button onClick={() => { store.setPlan('free'); toast('Switched back to Free'); nav(-1); }} className="mx-auto mt-3 block text-[12px] text-muted underline">
                Switch back to Free
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
