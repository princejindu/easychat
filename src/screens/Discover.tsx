import { motion } from 'framer-motion';
import { ArrowUpRight, Bell, Brain, ShieldAlert, Gauge, Lightbulb, MessagesSquare, Theater, Watch, Globe } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { TASKS } from '../lib/meta';
import { SectionLabel, cx, rise, stagger, useToast } from '../components/ui';

const TIPS = [
  { t: 'Answer, then ask', d: 'Respond to what they said before adding a new question. It shows you listened.' },
  { t: 'Specific beats generic', d: '"Your dog looks like a menace (complimentary)" lands better than "nice pic".' },
  { t: 'Match their energy', d: 'Long thoughtful messages deserve more than "haha yeah". Short ones don\'t need an essay.' },
  { t: 'Suggest, don\'t push', d: 'After a few good exchanges, offer a plan with an easy out: "drinks this week, if you fancy it?"' },
];

const SOON = [
  { icon: Theater, t: 'Reply Practice', d: 'Rehearse with an AI that plays the match, then get feedback.' },
  { icon: MessagesSquare, t: 'Group Chat Mode', d: 'Catch up on a long group chat and fit the room.' },
  { icon: Watch, t: 'Watch quick replies', d: 'Glanceable picks on Wear OS & Apple Watch.' },
  { icon: Globe, t: 'Browser extension', d: 'Same help in Gmail, LinkedIn and WhatsApp Web.' },
];

export default function Discover() {
  const nav = useNavigate();
  const toast = useToast();
  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-8 px-4 pt-5 pb-32">
      <motion.div variants={rise}>
        <h1 className="font-display text-[42px] leading-none">Discover</h1>
        <p className="mt-2 text-[14px] text-muted">Every way EasyChat can help, plus what's coming next.</p>
      </motion.div>

      <motion.section variants={rise}>
        <SectionLabel>Use cases</SectionLabel>
        <div className="grid grid-cols-2 gap-3">
          {Object.values(TASKS).map((t, i) => (
            <motion.button
              key={t.route}
              whileHover={{ y: -3 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => nav(`/assist/${t.route}`)}
              className={cx('group relative overflow-hidden rounded-[26px] border border-line bg-surface p-4 text-left', (i === 0 || i === 7) && 'col-span-2')}
            >
              <div className={cx('absolute -top-8 -right-8 size-24 rounded-full bg-gradient-to-br opacity-20 blur-xl transition-opacity group-hover:opacity-40', t.gradient)} />
              <div className={cx('mb-4 grid size-10 place-items-center rounded-2xl bg-gradient-to-br text-navy', t.gradient)}>
                <t.icon size={19} />
              </div>
              <p className="text-[14.5px] font-semibold">{t.title}</p>
              <p className="mt-0.5 text-[12px] leading-snug text-muted">{t.blurb}</p>
              <ArrowUpRight size={16} className="absolute top-4 right-4 text-muted transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </motion.button>
          ))}
        </div>
      </motion.section>

      <motion.section variants={rise}>
        <SectionLabel>Only on EasyChat</SectionLabel>
        <div className="space-y-2.5">
          {[
            { icon: Gauge, t: 'Interest Meter', d: 'An honest read of engagement - reply length, questions back, effort.', c: '#7CF2C8' },
            { icon: ShieldAlert, t: 'Red Flag & Scam Shield', d: 'Warns about money requests, rushing off-app, refusing video, love-bombing.', c: '#FF7AB6' },
            { icon: Brain, t: 'Sound Like Me', d: 'Learns your slang, emoji and punctuation so replies don\'t sound like AI.', c: '#8B85FF' },
            { icon: Lightbulb, t: 'Why this works', d: 'Every reply explains itself, so you learn instead of depending on the app.', c: '#FFC56B' },
          ].map((f) => (
            <div key={f.t} className="flex gap-3.5 rounded-[22px] border border-line bg-surface p-4">
              <div className="grid size-10 shrink-0 place-items-center rounded-2xl text-navy" style={{ background: f.c }}>
                <f.icon size={19} />
              </div>
              <div>
                <p className="text-[14.5px] font-semibold">{f.t}</p>
                <p className="mt-0.5 text-[12.5px] leading-snug text-muted">{f.d}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.section>

      <motion.section variants={rise}>
        <SectionLabel>Conversation tips</SectionLabel>
        <div className="no-scrollbar -mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-1">
          {TIPS.map((t, i) => (
            <div key={t.t} className="w-[240px] shrink-0 snap-start rounded-[26px] bg-gradient-to-br from-indigo/25 via-surface to-surface p-5">
              <p className="font-display text-[44px] leading-none text-indigo-2">{String(i + 1).padStart(2, '0')}</p>
              <p className="mt-3 text-[15px] font-semibold">{t.t}</p>
              <p className="mt-1 text-[12.5px] leading-snug text-muted">{t.d}</p>
            </div>
          ))}
        </div>
      </motion.section>

      <motion.section variants={rise}>
        <SectionLabel>Coming soon</SectionLabel>
        <div className="grid grid-cols-2 gap-3">
          {SOON.map((s) => (
            <button key={s.t} onClick={() => toast(`We'll let you know when ${s.t} lands`)} className="rounded-[24px] border border-dashed border-line-strong p-4 text-left">
              <s.icon size={20} className="mb-3 text-muted" />
              <p className="text-[13.5px] font-semibold">{s.t}</p>
              <p className="mt-0.5 text-[11.5px] leading-snug text-muted">{s.d}</p>
              <span className="mt-3 inline-flex items-center gap-1 text-[11px] font-medium text-indigo-2">
                <Bell size={11} /> Notify me
              </span>
            </button>
          ))}
        </div>
      </motion.section>
    </motion.div>
  );
}
