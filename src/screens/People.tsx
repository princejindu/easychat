import { AnimatePresence, motion } from 'framer-motion';
import { Plus, Search, Sparkles, Trash2, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import type { Vibe } from '../../shared/types';
import { useStore } from '../lib/store';
import { TASKS, VIBES, timeAgo } from '../lib/meta';
import { Avatar, Button, Card, Chip, IconButton, SectionLabel, Sheet, TopBar, cx, rise, softSpring, stagger, useConfirmTap, useToast } from '../components/ui';

export function PeopleList() {
  const store = useStore();
  const [params, setParams] = useSearchParams();
  const [q, setQ] = useState('');
  const [adding, setAdding] = useState(params.get('new') === '1');
  const [wipeArmed, confirmWipe] = useConfirmTap();
  const list = store.contacts.filter((c) => (c.name + c.facts.join(' ') + c.platform).toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="pb-32">
      <div className="px-4 pt-5">
        <p className="text-[12px] font-semibold tracking-[0.1em] text-indigo-2 uppercase">★ People Memory</p>
        <h1 className="mt-1 font-display text-[42px] leading-none">Your people</h1>
        <p className="mt-2 text-[14px] text-muted">A private card per person, so replies remember "your trip to Lisbon" weeks later.</p>
      </div>
      <div className="sticky top-0 z-20 bg-bg/85 px-4 py-3 backdrop-blur-xl">
        <div className="flex gap-2">
          <label className="flex h-11 flex-1 items-center gap-2 rounded-2xl bg-surface-2 px-3.5">
            <Search size={16} className="text-muted" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search people & details" className="flex-1 bg-transparent text-[14px] outline-none placeholder:text-muted" />
          </label>
          <Button onClick={() => setAdding(true)} aria-label="Add person" className="w-11 px-0">
            <Plus size={20} />
          </Button>
        </div>
      </div>

      <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-2.5 px-4">
        {list.length === 0 && (
          <motion.div variants={rise} className="mt-6 rounded-[28px] border border-dashed border-line-strong p-8 text-center">
            <div className="mx-auto mb-4 flex justify-center -space-x-3">
              {[200, 320, 30].map((h, i) => (
                <motion.div key={h} initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: i * 0.1 }}>
                  <Avatar name={['M', 'J', 'A'][i]} hue={h} size={48} />
                </motion.div>
              ))}
            </div>
            <p className="text-[15px] font-semibold">{q ? 'No matches' : 'No one saved yet'}</p>
            <p className="mt-1 text-[13px] text-muted">Add someone, or tap "Remember" after getting replies. Opt-in, on-device, one-tap wipe.</p>
          </motion.div>
        )}
        {list.map((c) => (
          <motion.div key={c.id} variants={rise} layout>
            <Link to={`/people/${c.id}`} className="flex items-center gap-3.5 rounded-[24px] border border-line bg-surface p-3.5 shadow-card">
              <Avatar name={c.name} hue={c.hue} size={50} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-[15px] font-semibold">{c.name}</p>
                  {c.platform && <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[10.5px] text-muted">{c.platform}</span>}
                </div>
                <p className="truncate text-[12.5px] text-muted">{c.lastTopic ? `Last: ${c.lastTopic}` : c.facts[0] ?? 'No details yet'}</p>
              </div>
              {c.preferredVibe && <span className="text-[18px]">{VIBES.find((v) => v.id === c.preferredVibe)?.emoji}</span>}
            </Link>
          </motion.div>
        ))}
        {store.contacts.length > 0 && (
          <button
            onClick={() => confirmWipe(store.wipeContacts)}
            className={cx('mx-auto mt-4 block text-[12px] underline', wipeArmed ? 'font-semibold text-[#ff6b79]' : 'text-muted')}
          >
            {wipeArmed ? 'Tap again to wipe everything' : 'Wipe all People Memory'}
          </button>
        )}
      </motion.div>

      <EditPerson
        open={adding}
        onClose={() => {
          setAdding(false);
          if (params.get('new')) setParams({});
        }}
      />
    </div>
  );
}

const PLATFORMS = ['Hinge', 'Tinder', 'Bumble', 'WhatsApp', 'Instagram', 'iMessage', 'LinkedIn', 'Email'];

function EditPerson({ open, onClose, id }: { open: boolean; onClose: () => void; id?: string }) {
  const store = useStore();
  const toast = useToast();
  const nav = useNavigate();
  const existing = store.contacts.find((c) => c.id === id);
  const [name, setName] = useState('');
  const [platform, setPlatform] = useState('');
  const [notes, setNotes] = useState('');
  useEffect(() => {
    if (open) {
      setName(existing?.name ?? '');
      setPlatform(existing?.platform ?? '');
      setNotes(existing?.notes ?? '');
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <Sheet open={open} onClose={onClose} title={existing ? 'Edit person' : 'Add a person'}>
      <div className="space-y-4">
        <input value={name} onChange={(e) => setName(e.target.value)} autoFocus placeholder="Name or nickname" className="h-12 w-full rounded-2xl border border-line bg-surface-2 px-4 text-[15px] outline-none focus:border-indigo/60" />
        <div>
          <p className="mb-2 px-1 text-[12px] font-medium text-muted">Where you chat</p>
          <div className="flex flex-wrap gap-2">
            {PLATFORMS.map((p) => (
              <Chip key={p} active={platform === p} onClick={() => setPlatform(platform === p ? '' : p)}>
                {p}
              </Chip>
            ))}
          </div>
        </div>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="Notes - inside jokes, how you met…" className="w-full resize-none rounded-2xl border border-line bg-surface-2 p-4 text-[14px] outline-none focus:border-indigo/60" />
        <Button
          block
          size="lg"
          disabled={!name.trim()}
          onClick={() => {
            const c = store.upsertContact({ id: existing?.id, name: name.trim(), platform, notes });
            toast(existing ? 'Saved' : `${c.name} added`);
            onClose();
            if (!existing) nav(`/people/${c.id}`);
          }}
        >
          {existing ? 'Save' : 'Add person'}
        </Button>
      </div>
    </Sheet>
  );
}

export function PersonDetail() {
  const { id } = useParams();
  const store = useStore();
  const nav = useNavigate();
  const toast = useToast();
  const c = store.contacts.find((x) => x.id === id);
  const [fact, setFact] = useState('');
  const [editing, setEditing] = useState(false);
  const [delArmed, confirmDel] = useConfirmTap();
  if (!c) {
    return (
      <div>
        <TopBar title="Not found" />
        <p className="p-6 text-muted">This person was deleted.</p>
      </div>
    );
  }
  const history = store.history.filter((h) => h.contactId === c.id);
  const favs = store.favourites.filter((f) => f.contactId === c.id);
  const addFact = () => {
    if (!fact.trim()) return;
    store.upsertContact({ id: c.id, name: c.name, facts: [...c.facts, fact.trim()] });
    setFact('');
  };

  return (
    <div className="pb-32">
      <TopBar
        right={
          <IconButton
            label={delArmed ? 'Tap again to delete' : 'Delete person'}
            className={delArmed ? 'w-auto gap-1.5 bg-[#ff5d6c]/15 px-3 text-[12px] font-semibold text-[#ff6b79]' : ''}
            onClick={() =>
              confirmDel(() => {
                store.removeContact(c.id);
                toast(`${c.name} deleted`);
                nav('/people');
              })
            }
          >
            <Trash2 size={18} />
            {delArmed && 'Tap again'}
          </IconButton>
        }
      />
      <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-6 px-4">
        <motion.div variants={rise} className="flex flex-col items-center text-center">
          <motion.div initial={{ scale: 0.6, rotate: -10 }} animate={{ scale: 1, rotate: 0 }} transition={softSpring}>
            <Avatar name={c.name} hue={c.hue} size={88} />
          </motion.div>
          <h1 className="mt-3 font-display text-[38px] leading-none">{c.name}</h1>
          <p className="mt-1 text-[13px] text-muted">
            {c.platform || 'No platform'} · updated {timeAgo(c.updatedAt)}
          </p>
          <button onClick={() => setEditing(true)} className="mt-2 text-[12.5px] font-medium text-indigo-2">
            Edit details
          </button>
        </motion.div>

        <motion.div variants={rise} className="grid grid-cols-2 gap-2">
          <Button onClick={() => nav(`/assist/snap?contact=${c.id}`)}>
            <Sparkles size={16} /> Reply to {c.name.split(' ')[0]}
          </Button>
          <Button variant="soft" onClick={() => nav(`/assist/revive?contact=${c.id}`)}>
            Revive chat
          </Button>
        </motion.div>

        <motion.section variants={rise}>
          <SectionLabel>Preferred vibe</SectionLabel>
          <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
            {VIBES.map((v) => (
              <Chip
                key={v.id}
                active={c.preferredVibe === v.id}
                color={v.color}
                layoutGroup="pvibe"
                disabled={v.id === 'flirty' && !store.settings.ageConfirmed}
                onClick={() => store.upsertContact({ id: c.id, name: c.name, preferredVibe: c.preferredVibe === v.id ? null : (v.id as Vibe) })}
              >
                {v.emoji} {v.label}
              </Chip>
            ))}
          </div>
        </motion.section>

        <motion.section variants={rise}>
          <SectionLabel>What they've shared</SectionLabel>
          <Card className="p-4">
            <div className="flex flex-wrap gap-2">
              <AnimatePresence>
                {c.facts.map((f, i) => (
                  <motion.span key={f + i} layout initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.6, opacity: 0 }} className="flex items-center gap-1 rounded-full bg-indigo/12 py-1.5 pr-1.5 pl-3 text-[13px] text-ink">
                    {f}
                    <button aria-label={`Remove ${f}`} onClick={() => store.upsertContact({ id: c.id, name: c.name, facts: c.facts.filter((_, k) => k !== i) })} className="grid size-5 place-items-center rounded-full hover:bg-line-strong">
                      <X size={12} />
                    </button>
                  </motion.span>
                ))}
              </AnimatePresence>
              {c.facts.length === 0 && <p className="text-[13px] text-muted">Nothing yet. Add details they chose to share - their dog's name, a trip, a favourite band.</p>}
            </div>
            <div className="mt-3 flex gap-2">
              <input value={fact} onChange={(e) => setFact(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addFact()} placeholder="Add a detail…" className="h-10 flex-1 rounded-xl bg-surface-2 px-3 text-[14px] outline-none" />
              <Button size="sm" onClick={addFact} disabled={!fact.trim()}>
                Add
              </Button>
            </div>
          </Card>
        </motion.section>

        <motion.section variants={rise}>
          <SectionLabel>Last topic</SectionLabel>
          <input
            value={c.lastTopic}
            onChange={(e) => store.upsertContact({ id: c.id, name: c.name, lastTopic: e.target.value })}
            placeholder="What you were last talking about"
            className="h-12 w-full rounded-2xl border border-line bg-surface px-4 text-[14px] outline-none focus:border-indigo/60"
          />
        </motion.section>

        {favs.length > 0 && (
          <motion.section variants={rise}>
            <SectionLabel>Best lines</SectionLabel>
            <div className="space-y-2">
              {favs.map((f) => (
                <Card key={f.id} className="p-3.5 text-[14px]">
                  {f.text}
                </Card>
              ))}
            </div>
          </motion.section>
        )}

        <motion.section variants={rise}>
          <SectionLabel>History</SectionLabel>
          {history.length === 0 ? (
            <p className="px-1 text-[13px] text-muted">No saved replies with {c.name} yet.</p>
          ) : (
            <div className="space-y-2">
              {history.map((h) => {
                const m = Object.values(TASKS).find((t) => t.id === h.task) ?? TASKS.paste;
                return (
                  <Link key={h.id} to={`/history/${h.id}`} className={cx('flex items-center gap-3 rounded-[20px] border border-line bg-surface p-3')}>
                    <m.icon size={16} className="shrink-0 text-indigo-2" />
                    <p className="min-w-0 flex-1 truncate text-[13.5px]">{h.copied ?? h.result.options[0]?.text}</p>
                    <span className="shrink-0 text-[11px] text-muted">{timeAgo(h.at)}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </motion.section>
      </motion.div>
      <EditPerson open={editing} onClose={() => setEditing(false)} id={c.id} />
    </div>
  );
}
