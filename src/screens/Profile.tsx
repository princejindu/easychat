import { motion } from 'framer-motion';
import { ChevronRight, Crown, Download, Moon, Star, Sun, Trash2 } from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import type { StyleTraits } from '../../shared/types';
import { aiEngine } from '../lib/api';
import { LANGUAGES, MODES, VIBES } from '../lib/meta';
import { useStore } from '../lib/store';
import { Button, Card, Chip, SectionLabel, Segmented, Sheet, Toggle, cx, rise, stagger, useConfirmTap, useToast } from '../components/ui';

function Row({ title, sub, children, onClick }: { title: string; sub?: string; children?: ReactNode; onClick?: () => void }) {
  const Comp = onClick ? 'button' : 'div';
  return (
    <Comp onClick={onClick} className="flex w-full items-center gap-3 px-4 py-3.5 text-left">
      <div className="min-w-0 flex-1">
        <p className="text-[14.5px] font-medium">{title}</p>
        {sub && <p className="mt-0.5 text-[12px] leading-snug text-muted">{sub}</p>}
      </div>
      {children ?? (onClick && <ChevronRight size={18} className="text-muted" />)}
    </Comp>
  );
}

const PLAN_NAME = { free: 'Free', weekly: 'Pro Weekly', monthly: 'Pro Monthly', annual: 'Pro Annual' } as const;

export default function Profile() {
  const store = useStore();
  const nav = useNavigate();
  const toast = useToast();
  const s = store.settings;
  const [styleOpen, setStyleOpen] = useState(false);
  const [favsOpen, setFavsOpen] = useState(false);
  const [delArmed, confirmDelete] = useConfirmTap();
  const [engine, setEngine] = useState<string>('…');
  useEffect(() => {
    aiEngine().then((e) => setEngine(e === 'claude' ? 'Live AI connected' : e === 'demo' ? 'Demo engine (no AI key on server)' : 'Offline demo engine'));
  }, []);

  const download = () => {
    const blob = new Blob([store.exportData()], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `easychat-data-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    toast('Your data was exported');
  };

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-7 px-4 pt-5 pb-32">
      <motion.div variants={rise}>
        <h1 className="font-display text-[42px] leading-none">Profile</h1>
      </motion.div>

      <motion.button variants={rise} whileTap={{ scale: 0.98 }} onClick={() => nav('/upgrade')} className="relative w-full overflow-hidden rounded-[28px] bg-gradient-to-br from-[#1b2550] via-[#2a2370] to-[#4b3fd6] p-5 text-left text-white">
        <motion.div className="absolute -top-10 -right-10 size-40 rounded-full bg-mint/25 blur-3xl" animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 5, repeat: Infinity }} />
        <div className="relative flex items-center gap-3">
          <div className="grid size-11 place-items-center rounded-2xl bg-white/15">
            <Crown size={20} className="text-amber" />
          </div>
          <div className="flex-1">
            <p className="text-[12px] font-semibold tracking-wide text-white/60 uppercase">Your plan</p>
            <p className="text-[19px] font-semibold">{PLAN_NAME[store.plan]}</p>
          </div>
          <span className="rounded-full bg-white px-3 py-1.5 text-[12px] font-semibold text-navy">{store.plan === 'free' ? 'Upgrade' : 'Manage'}</span>
        </div>
        {store.plan === 'free' && (
          <p className="relative mt-3 text-[12.5px] text-white/70">
            {store.usage.count}/5 replies and {store.usage.voice}/1 voice note used today
          </p>
        )}
      </motion.button>

      <motion.section variants={rise}>
        <SectionLabel>Your voice</SectionLabel>
        <Card className="divide-y divide-line">
          <Row title="Sound Like Me" sub={store.style.samples.length ? `Learned from ${store.style.samples.length} messages` : 'Not set up - replies use a natural default'} onClick={() => setStyleOpen(true)} />
          <Row title="Use my style in replies">
            <Toggle label="Use my style" on={store.style.enabled} onChange={(v) => store.updateStyle({ enabled: v })} />
          </Row>
          <Row title="Favourite lines" sub={`${store.favourites.length} saved`} onClick={() => setFavsOpen(true)} />
        </Card>
      </motion.section>

      <motion.section variants={rise}>
        <SectionLabel>Defaults</SectionLabel>
        <Card className="space-y-4 p-4">
          <div>
            <p className="mb-2 text-[12.5px] font-medium text-muted">Default mode</p>
            <div className="flex flex-wrap gap-2">
              {MODES.map((m) => (
                <Chip key={m.id} active={s.defaultMode === m.id} layoutGroup="dmode" onClick={() => store.updateSettings({ defaultMode: m.id })} disabled={m.id === 'dating' && !s.ageConfirmed}>
                  {m.label}
                </Chip>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2 text-[12.5px] font-medium text-muted">Default vibe</p>
            <div className="flex flex-wrap gap-2">
              {VIBES.map((v) => (
                <Chip key={v.id} active={s.defaultVibe === v.id} color={v.color} layoutGroup="dvibe" onClick={() => store.updateSettings({ defaultVibe: v.id })} disabled={v.id === 'flirty' && !s.ageConfirmed}>
                  {v.emoji} {v.label}
                </Chip>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2 text-[12.5px] font-medium text-muted">Language</p>
            <select value={s.language} onChange={(e) => store.updateSettings({ language: e.target.value })} className="h-11 w-full rounded-2xl bg-surface-2 px-3 text-[14px] outline-none">
              {LANGUAGES.map((l) => (
                <option key={l}>{l}</option>
              ))}
            </select>
          </div>
        </Card>
      </motion.section>

      <motion.section variants={rise}>
        <SectionLabel>Bubble (Android)</SectionLabel>
        <Card className="divide-y divide-line">
          <Row title="Show EasyChat bubble" sub="Floats at the screen edge over your chats">
            <Toggle label="Show bubble" on={s.bubbleEnabled} onChange={(v) => store.updateSettings({ bubbleEnabled: v })} />
          </Row>
          <div className="px-4 py-3.5">
            <div className="mb-2 flex justify-between text-[14.5px] font-medium">
              Idle opacity <span className="text-muted tabular-nums">{Math.round(s.bubbleIdleOpacity * 100)}%</span>
            </div>
            <input type="range" min={0.2} max={1} step={0.05} value={s.bubbleIdleOpacity} onChange={(e) => store.updateSettings({ bubbleIdleOpacity: Number(e.target.value) })} className="w-full accent-[#635BFF]" />
          </div>
          <Row title="Try the bubble demo" onClick={() => nav('/bubble')} />
        </Card>
      </motion.section>

      <motion.section variants={rise}>
        <SectionLabel>Privacy & data</SectionLabel>
        <Card className="divide-y divide-line">
          <Row title="Allow sending to AI" sub="Required to generate replies. Revoke any time.">
            <Toggle label="Cloud consent" on={s.cloudConsent} onChange={(v) => store.updateSettings({ cloudConsent: v })} />
          </Row>
          <Row title="Keep recent history" sub="Stored only on this device">
            <Toggle label="Save history" on={s.saveHistory} onChange={(v) => store.updateSettings({ saveHistory: v })} />
          </Row>
          <div className="px-4 py-3.5">
            <p className="mb-2 text-[14.5px] font-medium">Auto-delete history after</p>
            <Segmented id="ret" value={s.retention} onChange={(v) => store.updateSettings({ retention: v })} options={[{ id: '24h', label: '24 hours' }, { id: '7d', label: '7 days' }, { id: 'never', label: 'Never' }]} />
          </div>
          <Row title="Help improve EasyChat" sub="Let anonymised examples improve the AI. Off by default.">
            <Toggle label="Training opt-in" on={s.trainingOptIn} onChange={(v) => store.updateSettings({ trainingOptIn: v })} />
          </Row>
          <Row title="Export my data" sub="Download everything as JSON">
            <Button size="sm" variant="soft" onClick={download}>
              <Download size={14} /> Export
            </Button>
          </Row>
          <Row title="Clear history" sub={`${store.history.length} items`}>
            <Button size="sm" variant="soft" onClick={() => { store.history.forEach((h) => store.removeHistory(h.id)); toast('History cleared'); }}>
              Clear
            </Button>
          </Row>
        </Card>
      </motion.section>

      <motion.section variants={rise}>
        <SectionLabel>Appearance</SectionLabel>
        <Card className="flex gap-2 p-2">
          {(['dark', 'light'] as const).map((t) => (
            <button key={t} onClick={() => store.updateSettings({ theme: t })} className={cx('flex flex-1 items-center justify-center gap-2 rounded-2xl py-3 text-[14px] font-medium transition-colors', s.theme === t ? 'bg-indigo text-white' : 'text-muted')}>
              {t === 'dark' ? <Moon size={16} /> : <Sun size={16} />}
              {t === 'dark' ? 'Dark' : 'Light'}
            </button>
          ))}
        </Card>
      </motion.section>

      <motion.section variants={rise} className="space-y-3">
        <Button
          variant="danger"
          block
          onClick={() =>
            confirmDelete(() => {
              store.clearAll();
              nav('/');
            })
          }
        >
          <Trash2 size={16} /> {delArmed ? 'Tap again to erase everything' : 'Delete account & all data'}
        </Button>
        <p className="text-center text-[11.5px] leading-relaxed text-muted">
          EasyChat by Easydesigntech Ltd · v1.0
          <br />
          {engine}
          <br />
          Never auto-sends · screenshots deleted within 24h · no training without opt-in
        </p>
      </motion.section>

      <StyleSheet open={styleOpen} onClose={() => setStyleOpen(false)} />
      <Sheet open={favsOpen} onClose={() => setFavsOpen(false)} title="Favourites">
        {store.favourites.length === 0 ? (
          <p className="text-[14px] text-muted">Tap the ☆ on any reply to save your best lines here.</p>
        ) : (
          <div className="space-y-2">
            {store.favourites.map((f) => (
              <div key={f.id} className="flex items-start gap-3 rounded-2xl bg-surface-2 p-3.5">
                <Star size={15} className="mt-0.5 shrink-0 fill-amber text-amber" />
                <p className="flex-1 text-[14px]">{f.text}</p>
                <button onClick={() => store.toggleFavourite(f.text, f.label, f.contactId)} className="text-muted" aria-label="Remove">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </Sheet>
    </motion.div>
  );
}

function StyleSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const store = useStore();
  const toast = useToast();
  const [samples, setSamples] = useState('');
  const [forbidden, setForbidden] = useState('');
  useEffect(() => {
    if (open) {
      setSamples(store.style.samples.join('\n'));
      setForbidden(store.style.forbidden.join(', '));
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps
  const t = store.style.traits;
  const setTrait = (p: Partial<StyleTraits>) => store.updateStyle({ traits: { ...t, ...p } });
  return (
    <Sheet open={open} onClose={onClose} title="Sound Like Me">
      <p className="mb-3 text-[13px] text-muted">Paste 5-10 messages you've sent, one per line. EasyChat suggests your traits - adjust anything that's off.</p>
      <textarea value={samples} onChange={(e) => setSamples(e.target.value)} rows={6} className="w-full resize-none rounded-2xl border border-line bg-surface-2 p-3.5 text-[14px] outline-none focus:border-indigo/60" placeholder="omg yes i'm so down" />
      <Button
        size="sm"
        variant="soft"
        className="mt-2"
        onClick={() => {
          store.setStyleSamples(samples.split('\n').map((x) => x.trim()).filter(Boolean).slice(0, 10));
          toast('Style updated');
        }}
      >
        Analyse my messages
      </Button>

      <div className="mt-5 space-y-4">
        <div>
          <p className="mb-2 text-[12.5px] font-medium text-muted">Emoji</p>
          <Segmented id="emoji" value={String(t.emoji) as '0' | '1' | '2'} onChange={(v) => setTrait({ emoji: Number(v) as 0 | 1 | 2 })} options={[{ id: '0', label: 'None' }, { id: '1', label: 'Some' }, { id: '2', label: 'Lots 🤩' }]} />
        </div>
        <div>
          <p className="mb-2 text-[12.5px] font-medium text-muted">Message length</p>
          <Segmented id="slen" value={t.length} onChange={(v) => setTrait({ length: v })} options={[{ id: 'short', label: 'Short' }, { id: 'medium', label: 'Medium' }, { id: 'long', label: 'Long' }]} />
        </div>
        <div>
          <p className="mb-2 text-[12.5px] font-medium text-muted">Punctuation</p>
          <Segmented id="punc" value={t.punctuation} onChange={(v) => setTrait({ punctuation: v })} options={[{ id: 'minimal', label: 'minimal' }, { id: 'normal', label: 'Normal.' }, { id: 'expressive', label: 'Wild!!' }]} />
        </div>
        <div className="flex items-center justify-between rounded-2xl bg-surface-2 px-4 py-3">
          <span className="text-[14px]">mostly lowercase</span>
          <Toggle label="Lowercase" on={t.lowercase} onChange={(v) => setTrait({ lowercase: v })} />
        </div>
        <div className="flex items-center justify-between rounded-2xl bg-surface-2 px-4 py-3">
          <span className="text-[14px]">Casual slang (tbh, ngl, gonna)</span>
          <Toggle label="Slang" on={t.slang} onChange={(v) => setTrait({ slang: v })} />
        </div>
        <div>
          <p className="mb-2 text-[12.5px] font-medium text-muted">Words I never use</p>
          <input
            value={forbidden}
            onChange={(e) => setForbidden(e.target.value)}
            onBlur={() => store.updateStyle({ forbidden: forbidden.split(',').map((x) => x.trim()).filter(Boolean) })}
            placeholder="e.g. babe, xoxo, per my last email"
            className="h-11 w-full rounded-2xl border border-line bg-surface-2 px-3.5 text-[14px] outline-none focus:border-indigo/60"
          />
        </div>
        <Button
          variant="ghost"
          block
          onClick={() => {
            store.setStyleSamples([]);
            store.updateStyle({ forbidden: [] });
            setSamples('');
            setForbidden('');
            toast('Style reset');
          }}
        >
          Reset my style
        </Button>
      </div>
    </Sheet>
  );
}
