import { motion } from 'framer-motion';
import { ArrowRight, Camera, Copy, Plus, Sparkles } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { FREE_DAILY, useStore } from '../lib/store';
import { TASKS, timeAgo } from '../lib/meta';
import { Avatar, Logo, SectionLabel, cx, rise, stagger } from '../components/ui';

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
}

export default function Home() {
  const store = useStore();
  const nav = useNavigate();
  const used = store.usage.count;
  const pct = store.plan === 'free' ? Math.min(1, used / FREE_DAILY) : 0;

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-7 px-4 pt-4 pb-32">
      {/* Header */}
      <motion.header variants={rise} className="flex items-center justify-between">
        <Logo />
        <Link to="/upgrade" className="flex items-center gap-2 rounded-full border border-line bg-surface py-1.5 pr-3 pl-1.5 text-[12px] font-medium">
          <svg width="24" height="24" viewBox="0 0 24 24" className="-rotate-90">
            <circle cx="12" cy="12" r="9" fill="none" stroke="var(--line-strong)" strokeWidth="3" />
            <motion.circle cx="12" cy="12" r="9" fill="none" stroke={store.plan === 'free' ? '#8B85FF' : '#7CF2C8'} strokeWidth="3" strokeLinecap="round" initial={{ pathLength: 0 }} animate={{ pathLength: store.plan === 'free' ? 1 - pct : 1 }} transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }} />
          </svg>
          {store.plan === 'free' ? `${store.remaining} left today` : 'Pro · unlimited'}
        </Link>
      </motion.header>

      {/* Hero */}
      <motion.section variants={rise}>
        <p className="text-[13px] text-muted">{greeting()} 👋</p>
        <h1 className="mt-1 font-display text-[44px] leading-[0.95] tracking-tight">
          What would you like <em className="text-gradient">help saying?</em>
        </h1>
      </motion.section>

      {/* Bento actions */}
      <motion.section variants={rise} className="grid grid-cols-2 gap-3">
        <motion.button
          whileHover={{ y: -3 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => nav('/assist/snap')}
          className="relative col-span-2 overflow-hidden rounded-[30px] bg-gradient-to-br from-[#5148F0] via-indigo to-[#8B85FF] p-5 text-left text-white shadow-[0_24px_60px_-24px_rgba(99,91,255,.9)]"
        >
          <div className="absolute -top-16 -right-10 size-48 rounded-full bg-white/10 blur-2xl" />
          <div className="relative flex items-start justify-between">
            <div>
              <div className="mb-3 grid size-11 place-items-center rounded-2xl bg-white/15 backdrop-blur">
                <Camera size={22} />
              </div>
              <p className="text-[20px] font-semibold tracking-tight">Snap & Reply</p>
              <p className="mt-0.5 max-w-[12rem] text-[13px] text-white/75">Screenshot any chat. Three replies in your voice, in seconds.</p>
            </div>
            <MiniChat />
          </div>
          <div className="relative mt-4 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-[12px] font-medium backdrop-blur">
            Start <ArrowRight size={13} />
          </div>
        </motion.button>

        {(['paste', 'voice', 'polish'] as const).map((k) => {
          const t = TASKS[k];
          return (
            <motion.button
              key={k}
              whileHover={{ y: -3 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => nav(`/assist/${k}`)}
              className={cx('relative overflow-hidden rounded-[26px] border border-line bg-surface p-4 text-left shadow-card', k === 'polish' && 'col-span-1')}
            >
              <div className={cx('mb-6 grid size-10 place-items-center rounded-2xl bg-gradient-to-br text-navy', t.gradient)}>
                <t.icon size={19} />
              </div>
              <p className="text-[15px] font-semibold tracking-tight">{t.title}</p>
              <p className="mt-0.5 text-[12px] leading-snug text-muted">{t.blurb}</p>
            </motion.button>
          );
        })}

        <motion.button
          whileHover={{ y: -3 }}
          whileTap={{ scale: 0.96 }}
          onClick={() => nav('/bubble')}
          className="relative overflow-hidden rounded-[26px] border border-line bg-surface-2 p-4 text-left"
        >
          <motion.div
            className="mb-6 size-10 rounded-full bg-gradient-to-br from-indigo-2 to-mint shadow-[0_0_30px_rgba(124,242,200,.5)]"
            animate={{ scale: [1, 1.12, 1], boxShadow: ['0 0 20px rgba(124,242,200,.35)', '0 0 34px rgba(139,133,255,.7)', '0 0 20px rgba(124,242,200,.35)'] }}
            transition={{ duration: 2.6, repeat: Infinity }}
          />
          <p className="text-[15px] font-semibold tracking-tight">Try the bubble</p>
          <p className="mt-0.5 text-[12px] leading-snug text-muted">See EasyChat float over a chat</p>
        </motion.button>
      </motion.section>

      {/* More tools */}
      <motion.section variants={rise}>
        <SectionLabel>More ways to help</SectionLabel>
        <div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 pb-1">
          {(['opener', 'revive', 'decode', 'email'] as const).map((k, i) => {
            const t = TASKS[k];
            return (
              <motion.button
                key={k}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + i * 0.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => nav(`/assist/${k}`)}
                className="w-[140px] shrink-0 rounded-[24px] border border-line bg-surface p-3.5 text-left"
              >
                <div className={cx('mb-3 grid size-9 place-items-center rounded-xl bg-gradient-to-br text-navy', t.gradient)}>
                  <t.icon size={17} />
                </div>
                <p className="text-[13.5px] font-semibold">{t.title}</p>
                <p className="mt-0.5 text-[11.5px] leading-snug text-muted">{t.blurb}</p>
              </motion.button>
            );
          })}
        </div>
      </motion.section>

      {/* People */}
      <motion.section variants={rise}>
        <SectionLabel action={<Link to="/people" className="text-[12px] font-medium text-indigo-2">See all</Link>}>People Memory</SectionLabel>
        <div className="no-scrollbar -mx-4 flex gap-4 overflow-x-auto px-4">
          <Link to="/people?new=1" className="flex w-14 shrink-0 flex-col items-center gap-1.5">
            <span className="grid size-14 place-items-center rounded-full border border-dashed border-line-strong text-muted">
              <Plus size={20} />
            </span>
            <span className="text-[11px] text-muted">Add</span>
          </Link>
          {store.contacts.map((c) => (
            <Link key={c.id} to={`/people/${c.id}`} className="flex w-14 shrink-0 flex-col items-center gap-1.5">
              <Avatar name={c.name} hue={c.hue} size={56} />
              <span className="w-full truncate text-center text-[11px] text-ink-2">{c.name.split(' ')[0]}</span>
            </Link>
          ))}
        </div>
      </motion.section>

      {/* Recent */}
      <motion.section variants={rise}>
        <SectionLabel>Recent</SectionLabel>
        {store.history.length === 0 ? (
          <div className="rounded-[26px] border border-dashed border-line-strong p-6 text-center">
            <Sparkles className="mx-auto mb-2 text-indigo-2" size={22} />
            <p className="text-[14px] font-medium">No replies yet</p>
            <p className="mt-1 text-[12.5px] text-muted">Your recent helps show up here. They auto-delete after {store.settings.retention === 'never' ? 'you clear them' : store.settings.retention === '24h' ? '24 hours' : '7 days'}.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {store.history.slice(0, 5).map((h) => {
              const meta = Object.values(TASKS).find((t) => t.id === h.task) ?? TASKS.paste;
              const contact = store.contacts.find((c) => c.id === h.contactId);
              return (
                <Link key={h.id} to={`/history/${h.id}`} className="flex items-center gap-3 rounded-[22px] border border-line bg-surface p-3">
                  <div className={cx('grid size-10 shrink-0 place-items-center rounded-2xl bg-gradient-to-br text-navy', meta.gradient)}>
                    <meta.icon size={17} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13.5px] font-medium">{h.copied ?? h.result.options[0]?.text ?? meta.title}</p>
                    <p className="truncate text-[11.5px] text-muted">
                      {meta.title}
                      {contact ? ` · ${contact.name}` : ''} · {timeAgo(h.at)}
                    </p>
                  </div>
                  {h.copied && <Copy size={14} className="shrink-0 text-mint" />}
                </Link>
              );
            })}
          </div>
        )}
      </motion.section>
    </motion.div>
  );
}

function MiniChat() {
  const lines = [
    { me: false, w: 'w-16' },
    { me: true, w: 'w-12' },
    { me: false, w: 'w-20' },
  ];
  return (
    <div className="relative mt-1 w-[104px] rounded-2xl bg-white/10 p-2.5 backdrop-blur">
      <div className="space-y-1.5">
        {lines.map((l, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: l.me ? 8 : -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 + i * 0.25 }}
            className={cx('h-2.5 rounded-full', l.w, l.me ? 'ml-auto bg-mint/80' : 'bg-white/50')}
          />
        ))}
      </div>
      <motion.div
        className="absolute inset-x-1 h-6 rounded-lg bg-gradient-to-b from-transparent via-mint/40 to-transparent"
        animate={{ top: ['0%', '75%', '0%'] }}
        transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 1.4, type: 'spring' }}
        className="absolute -right-2 -bottom-2 grid size-7 place-items-center rounded-full bg-mint text-navy shadow-lg"
      >
        <Sparkles size={13} />
      </motion.div>
    </div>
  );
}
