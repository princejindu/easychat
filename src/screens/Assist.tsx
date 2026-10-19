import { AnimatePresence, motion } from 'framer-motion';
import { Languages, Lock, RefreshCw, Scissors, ShieldCheck, Sparkles, UserRoundPlus, Volume2, Wand2 } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import type { AssistRequest, AssistResult, Length, Mode, PolishGoal, TranscriptLine, Vibe } from '../../shared/types';
import { assist, AssistError } from '../lib/api';
import { GOALS, LANGUAGES, MODES, TASKS, VIBES } from '../lib/meta';
import { redact, redactionSummary } from '../lib/privacy';
import { useStore } from '../lib/store';
import { exportShots, ScreenshotInput, TextInput, VoiceInput, type Shot } from '../components/inputs';
import { copyText, DiffView, InterestMeter, NextMove, Notes, RedFlags, ReplyCard, Thinking, TranscriptView } from '../components/results';
import { Avatar, Button, Card, Chip, cx, Segmented, Sheet, softSpring, TopBar, useToast } from '../components/ui';

const PLACEHOLDERS: Record<string, string> = {
  paste: 'Paste the conversation…\n\nAlex: so what are you up to this weekend?\nMe: not much yet 👀',
  revive: 'Paste the last few messages before it went quiet…',
  decode: 'Paste the message you\'re not sure about…',
  email: 'Paste the email or work message you need to reply to…',
  polish: 'Type or paste your own draft…',
};

export default function Assist() {
  const { kind = 'paste' } = useParams();
  const meta = TASKS[kind] ?? TASKS.paste;
  const [params] = useSearchParams();
  const store = useStore();
  const toast = useToast();
  const nav = useNavigate();

  const [contactId, setContactId] = useState<string | null>(params.get('contact'));
  const contact = store.contacts.find((c) => c.id === contactId) ?? null;

  const [text, setText] = useState(params.get('text') ?? '');
  const [shots, setShots] = useState<Shot[]>([]);
  const [mode, setMode] = useState<Mode>(kind === 'email' ? 'work' : store.settings.defaultMode);
  const [vibe, setVibe] = useState<Vibe>(kind === 'email' ? 'professional' : (contact?.preferredVibe ?? store.settings.defaultVibe));
  const [length, setLength] = useState<Length>(kind === 'email' ? 'medium' : store.settings.defaultLength);
  const [language, setLanguage] = useState(store.settings.language);
  const [goal, setGoal] = useState<PolishGoal>('confident');

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AssistResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [historyId, setHistoryId] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<TranscriptLine[]>([]);
  const [consentOpen, setConsentOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [peopleOpen, setPeopleOpen] = useState(false);
  const [saveOpen, setSaveOpen] = useState(false);
  const [sentDraft, setSentDraft] = useState('');
  const resultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (contact?.preferredVibe) setVibe(contact.preferredVibe);
  }, [contact?.preferredVibe]);

  const flirtyBlocked = !store.settings.ageConfirmed || mode === 'work' || mode === 'family';
  useEffect(() => {
    if (vibe === 'flirty' && flirtyBlocked) setVibe('playful');
  }, [flirtyBlocked, vibe]);

  const redaction = useMemo(() => redact(text), [text]);
  const hasInput = meta.input === 'image' ? shots.length > 0 : text.trim().length > 1;

  async function run(opts: { avoid?: string[]; lang?: string; overrideText?: string; polishGoal?: PolishGoal; consented?: boolean } = {}) {
    if (!store.canGenerate(meta.id === 'voice')) {
      nav('/upgrade?reason=limit');
      return;
    }
    if (!store.settings.cloudConsent && !opts.consented) {
      setConsentOpen(true);
      return;
    }
    setLoading(true);
    setError(null);
    if (!opts.avoid) setResult(null);
    setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
    try {
      const image = meta.input === 'image' && !opts.overrideText ? await exportShots(shots) : null;
      const sendText = opts.overrideText ?? (meta.input === 'image' ? '' : redaction.text);
      const req: AssistRequest = {
        task: meta.id,
        mode,
        vibe,
        length,
        language: opts.lang ?? language,
        text: sendText || undefined,
        image: image ?? undefined,
        polishGoal: meta.id === 'polish' ? (opts.polishGoal ?? goal) : undefined,
        contact: contact ? { name: contact.name, facts: contact.facts, lastTopic: contact.lastTopic, notes: contact.notes } : undefined,
        style: store.style.enabled && (store.style.samples.length || store.style.forbidden.length) ? { samples: store.style.samples.slice(0, 10), traits: store.style.traits, forbidden: store.style.forbidden } : undefined,
        avoid: opts.avoid,
      };
      const res = await assist(req);
      setResult(res);
      setTranscript(res.transcript);
      setSentDraft(sendText);
      store.consume(meta.id === 'voice');
      const id = store.addHistory({
        task: meta.id,
        mode,
        vibe,
        contactId,
        preview: (sendText || res.transcript.map((l) => l.text).join(' ') || 'Screenshot').slice(0, 120),
        result: res,
      });
      setHistoryId(id);
    } catch (e) {
      setError(e instanceof AssistError ? e.message : 'Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  }

  const onCopy = async (t: string) => {
    const ok = await copyText(t);
    toast(ok ? 'Copied - paste it in your chat' : "Couldn't copy - long-press to select", ok ? 'ok' : 'warn');
    store.markCopied(historyId, t);
  };

  const transcriptText = transcript.map((l) => `${l.speaker === 'me' ? 'Me' : contact?.name || 'Them'}: ${l.text}`).join('\n');

  return (
    <div className="relative min-h-full pb-32">
      <TopBar
        title={meta.title}
        subtitle={contact ? `with ${contact.name}` : meta.blurb}
        right={
          <button onClick={() => setPeopleOpen(true)} className="flex items-center gap-1.5 rounded-full bg-surface-2 py-1 pr-3 pl-1 text-[12.5px] font-medium">
            {contact ? <Avatar name={contact.name} hue={contact.hue} size={26} /> : <span className="grid size-[26px] place-items-center rounded-full bg-line-strong"><UserRoundPlus size={14} /></span>}
            {contact ? contact.name.split(' ')[0] : 'Who?'}
          </button>
        }
      />

      <div className="space-y-5 px-4">
        {/* Input */}
        <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={softSpring}>
          {meta.input === 'image' && (
            <ScreenshotInput
              shots={shots}
              setShots={setShots}
              hint={meta.id === 'opener' ? 'A dating profile, Instagram bio or LinkedIn - scroll and add two for long profiles' : 'A chat from Hinge, WhatsApp, Instagram, iMessage…'}
            />
          )}
          {meta.input === 'audio' && <VoiceInput transcript={text} setTranscript={setText} />}
          {(meta.input === 'text' || meta.input === 'draft') && (
            <TextInput value={text} onChange={setText} placeholder={PLACEHOLDERS[kind] ?? PLACEHOLDERS.paste} rows={meta.input === 'draft' ? 4 : 6} />
          )}
          <AnimatePresence>
            {redactionSummary(redaction.found) && (
              <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-2 flex items-center gap-1.5 px-1 text-[12px] text-mint">
                <ShieldCheck size={13} /> {redactionSummary(redaction.found)}
              </motion.p>
            )}
          </AnimatePresence>
        </motion.section>

        {/* Controls */}
        <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ ...softSpring, delay: 0.06 }} className="space-y-4">
          {meta.id === 'polish' ? (
            <div>
              <p className="mb-2 px-1 text-[12px] font-semibold tracking-[0.08em] text-muted uppercase">Make it</p>
              <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
                {GOALS.map((g) => (
                  <Chip key={g.id} active={goal === g.id} onClick={() => setGoal(g.id)} layoutGroup="goal">
                    {g.label}
                  </Chip>
                ))}
              </div>
            </div>
          ) : (
            <>
              <div>
                <p className="mb-2 px-1 text-[12px] font-semibold tracking-[0.08em] text-muted uppercase">Mode</p>
                <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
                  {MODES.map((m) => (
                    <Chip key={m.id} active={mode === m.id} onClick={() => setMode(m.id)} layoutGroup="mode">
                      <m.icon size={14} /> {m.label}
                    </Chip>
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-2 px-1 text-[12px] font-semibold tracking-[0.08em] text-muted uppercase">Vibe</p>
                <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
                  {VIBES.map((v) => (
                    <Chip
                      key={v.id}
                      active={vibe === v.id}
                      onClick={() => setVibe(v.id)}
                      layoutGroup="vibe"
                      color={v.color}
                      disabled={v.id === 'flirty' && flirtyBlocked}
                      title={v.id === 'flirty' && flirtyBlocked ? (store.settings.ageConfirmed ? 'Not available in this mode' : '18+ only') : undefined}
                    >
                      <span>{v.emoji}</span> {v.label}
                    </Chip>
                  ))}
                </div>
              </div>
            </>
          )}
          <div className="flex gap-2">
            <div className="flex-1">
              <Segmented id="len" value={length} onChange={setLength} options={[{ id: 'short', label: 'Short' }, { id: 'medium', label: 'Medium' }, { id: 'long', label: 'Long' }]} />
            </div>
            <button onClick={() => setLangOpen(true)} className="flex items-center gap-1.5 rounded-2xl bg-surface-2 px-3 text-[12.5px] font-medium text-ink-2">
              <Languages size={15} /> {language.replace(/ \(.*\)/, '')}
            </button>
          </div>
        </motion.section>

        <Button size="lg" block disabled={!hasInput || loading} onClick={() => run()}>
          <motion.span animate={loading ? { rotate: 360 } : { rotate: 0 }} transition={loading ? { duration: 1, repeat: Infinity, ease: 'linear' } : {}}>
            <Sparkles size={18} />
          </motion.span>
          {loading ? 'Working on it…' : meta.id === 'polish' ? 'Polish it' : meta.id === 'decode' ? 'Decode it' : 'Get 3 replies'}
        </Button>
        {store.plan === 'free' && (
          <p className="-mt-3 text-center text-[11.5px] text-muted">
            {store.remaining} free {store.remaining === 1 ? 'reply' : 'replies'} left today · <button className="text-indigo-2" onClick={() => nav('/upgrade')}>Go unlimited</button>
          </p>
        )}

        {/* Results */}
        <div ref={resultsRef} className="scroll-mt-16 space-y-3">
          {loading && !result && <Thinking />}
          {error && (
            <Card className="p-4 text-[14px]">
              <p className="font-medium text-[#ff7f8b]">{error}</p>
              <p className="mt-1 text-[12.5px] text-muted">If this app blocks capture, paste the text instead - EasyChat never bypasses a block.</p>
              <Button size="sm" variant="soft" className="mt-3" onClick={() => run()}>
                Try again
              </Button>
            </Card>
          )}
          {result && (
            <ResultsBlock
              result={result}
              loading={loading}
              transcript={transcript}
              setTranscript={setTranscript}
              onRerunTranscript={() => run({ overrideText: transcriptText })}
              sentDraft={meta.id === 'polish' ? sentDraft : ''}
              onCopy={onCopy}
              contactId={contactId}
              onRegenerate={() => run({ avoid: result.options.map((o) => o.text) })}
              onShorten={() => {
                setLength('short');
                run({ avoid: result.options.map((o) => o.text) });
              }}
              onTranslate={() => setLangOpen(true)}
              onSave={() => setSaveOpen(true)}
              isVoice={meta.id === 'voice'}
            />
          )}
        </div>
      </div>

      {/* Consent (PRD: specific, revocable consent before sending third-party messages) */}
      <Sheet open={consentOpen} onClose={() => setConsentOpen(false)} title="Before we send">
        <div className="space-y-3 text-[14px] leading-relaxed text-ink-2">
          <p>To write replies, EasyChat sends what you chose - and only that - to our AI for processing.</p>
          {[
            ['Only what you share', 'Nothing is read in the background. You chose this text or screenshot.'],
            ['Deleted within 24 hours', 'Screenshots and audio are processed then deleted. Phone numbers and emails are hidden first.'],
            ['Never used for training', 'Unless you opt in separately in Privacy settings.'],
            ['Other people have privacy too', "Only share conversations you're comfortable sharing."],
          ].map(([t, d]) => (
            <div key={t} className="flex gap-3 rounded-2xl bg-surface-2 p-3">
              <Lock size={16} className="mt-0.5 shrink-0 text-mint" />
              <div>
                <p className="font-semibold text-ink">{t}</p>
                <p className="text-[13px] text-muted">{d}</p>
              </div>
            </div>
          ))}
          <Button
            block
            size="lg"
            onClick={() => {
              store.updateSettings({ cloudConsent: true });
              setConsentOpen(false);
              run({ consented: true });
            }}
          >
            I understand - continue
          </Button>
          <p className="text-center text-[12px] text-muted">You can revoke this any time in Profile → Privacy.</p>
        </div>
      </Sheet>

      <Sheet open={langOpen} onClose={() => setLangOpen(false)} title="Language">
        <div className="grid gap-2">
          {LANGUAGES.map((l) => (
            <button
              key={l}
              onClick={() => {
                setLanguage(l);
                setLangOpen(false);
                if (result) run({ lang: l, avoid: result.options.map((o) => o.text) });
              }}
              className={cx('flex items-center justify-between rounded-2xl px-4 py-3.5 text-left text-[15px]', l === language ? 'bg-indigo text-white' : 'bg-surface-2')}
            >
              {l}
              {l === 'Nigerian Pidgin' && <span className="text-[11px] opacity-70">Culture & Slang Bridge</span>}
            </button>
          ))}
        </div>
      </Sheet>

      <Sheet open={peopleOpen} onClose={() => setPeopleOpen(false)} title="Who is this?">
        <p className="mb-3 text-[13px] text-muted">Pick a person from People Memory so replies can reference what you know - "your trip to Lisbon" weeks later.</p>
        <div className="grid gap-2">
          <button onClick={() => { setContactId(null); setPeopleOpen(false); }} className={cx('rounded-2xl px-4 py-3 text-left text-[14px]', !contactId ? 'bg-indigo text-white' : 'bg-surface-2')}>
            No one specific
          </button>
          {store.contacts.map((c) => (
            <button key={c.id} onClick={() => { setContactId(c.id); setPeopleOpen(false); }} className={cx('flex items-center gap-3 rounded-2xl px-3 py-2.5 text-left', c.id === contactId ? 'bg-indigo text-white' : 'bg-surface-2')}>
              <Avatar name={c.name} hue={c.hue} size={34} />
              <div className="min-w-0">
                <p className="text-[14px] font-medium">{c.name}</p>
                <p className="truncate text-[12px] opacity-70">{c.facts.slice(0, 3).join(' · ') || c.platform || 'No facts yet'}</p>
              </div>
            </button>
          ))}
          <Button variant="outline" onClick={() => nav('/people?new=1')}>
            <UserRoundPlus size={16} /> Add a person
          </Button>
        </div>
      </Sheet>

      <SaveToMemory open={saveOpen} onClose={() => setSaveOpen(false)} contactId={contactId} setContactId={setContactId} transcript={transcript} vibe={vibe} />
    </div>
  );
}

function ResultsBlock({
  result,
  loading,
  transcript,
  setTranscript,
  onRerunTranscript,
  sentDraft,
  onCopy,
  contactId,
  onRegenerate,
  onShorten,
  onTranslate,
  onSave,
  isVoice,
}: {
  result: AssistResult;
  loading: boolean;
  transcript: TranscriptLine[];
  setTranscript: (t: TranscriptLine[]) => void;
  onRerunTranscript: () => void;
  sentDraft: string;
  onCopy: (t: string) => void;
  contactId: string | null;
  onRegenerate: () => void;
  onShorten: () => void;
  onTranslate: () => void;
  onSave: () => void;
  isVoice: boolean;
}) {
  const store = useStore();
  const [showTranscript, setShowTranscript] = useState(false);
  const [script, setScript] = useState(false);
  const edited = JSON.stringify(transcript) !== JSON.stringify(result.transcript);

  const speak = (t: string) => {
    try {
      speechSynthesis.cancel();
      speechSynthesis.speak(new SpeechSynthesisUtterance(t));
    } catch {
      /* not supported */
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <h2 className="font-display text-[30px] leading-none">{isVoice ? 'Voice note' : 'Your options'}</h2>
        <span className={cx('rounded-full px-2.5 py-1 text-[10.5px] font-semibold tracking-wide uppercase', result.source === 'claude' ? 'bg-mint/15 text-mint' : 'bg-amber/15 text-amber')}>
          {result.source === 'claude' ? 'Live AI' : 'Demo engine'}
        </span>
      </div>

      {(result.summary || result.tone) && (
        <Card className="p-4">
          {result.summary && <p className="text-[15px] leading-snug">{result.summary}</p>}
          {result.tone && (
            <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-rose/15 px-2.5 py-1 text-[12px] font-medium text-rose">
              Tone: {result.tone}
            </p>
          )}
        </Card>
      )}

      {result.decode && (
        <Card className="p-4">
          <p className="mb-1 text-[11px] font-semibold tracking-[0.08em] text-indigo-2 uppercase">Honest read</p>
          <p className="text-[15px] leading-relaxed">{result.decode}</p>
        </Card>
      )}

      <RedFlags flags={result.red_flags} />
      {result.interest && <InterestMeter interest={result.interest} />}

      {result.subject && (
        <Card className="flex items-center justify-between gap-3 p-4">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold tracking-[0.08em] text-muted uppercase">Subject</p>
            <p className="truncate text-[15px] font-medium">{result.subject}</p>
          </div>
          <Button size="sm" variant="soft" onClick={() => onCopy(result.subject)}>
            Copy
          </Button>
        </Card>
      )}

      {transcript.length > 0 && !isVoice && (
        <Card className="p-4">
          <button className="flex w-full items-center justify-between text-[13px] font-medium text-ink-2" onClick={() => setShowTranscript((s) => !s)}>
            What EasyChat read ({transcript.length} {transcript.length === 1 ? 'message' : 'messages'})
            <span className="text-indigo-2">{showTranscript ? 'Hide' : 'Check'}</span>
          </button>
          <AnimatePresence>
            {showTranscript && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                <div className="pt-3">
                  <TranscriptView lines={transcript} onChange={setTranscript} />
                  {edited && (
                    <Button size="sm" block className="mt-3" onClick={onRerunTranscript}>
                      <RefreshCw size={14} /> Redo with my fixes
                    </Button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      )}

      {isVoice && (
        <div className="flex justify-end">
          <Segmented id="script" value={script ? 'script' : 'text'} onChange={(v) => setScript(v === 'script')} options={[{ id: 'text', label: 'Text reply' }, { id: 'script', label: 'Voice script' }]} />
        </div>
      )}

      <div className={cx('space-y-3 transition-opacity', loading && 'pointer-events-none opacity-40')}>
        <AnimatePresence mode="popLayout">
          {result.options.map((o, i) => (
            <div key={o.text} className="relative">
              {sentDraft && i === 0 && (
                <Card className="mb-3 p-4">
                  <p className="mb-1.5 text-[11px] font-semibold tracking-[0.08em] text-muted uppercase">What changed</p>
                  <DiffView before={sentDraft} after={o.text} />
                </Card>
              )}
              <ReplyCard
                option={script ? { ...o, label: `${o.label} · script`, rationale: 'Read it out loud as a voice note - pause at the commas.' } : o}
                index={i}
                onCopy={onCopy}
                onFavourite={(t) => store.toggleFavourite(t, o.label, contactId)}
                favourite={store.isFavourite(o.text)}
                onEdit={() => {}}
              />
              {script && (
                <button onClick={() => speak(o.text)} className="absolute top-3.5 right-3.5 grid size-8 place-items-center rounded-full bg-surface-2 text-ink-2" aria-label="Preview out loud">
                  <Volume2 size={15} />
                </button>
              )}
            </div>
          ))}
        </AnimatePresence>
      </div>

      <NextMove text={result.next_step} />
      <Notes notes={result.uncertainty_notes} />

      <div className="grid grid-cols-2 gap-2 pt-1">
        <Button variant="soft" onClick={onRegenerate} disabled={loading}>
          <RefreshCw size={15} /> Regenerate
        </Button>
        <Button variant="soft" onClick={onShorten} disabled={loading}>
          <Scissors size={15} /> Shorter
        </Button>
        <Button variant="soft" onClick={onTranslate} disabled={loading}>
          <Languages size={15} /> Translate
        </Button>
        <Button variant="soft" onClick={onSave}>
          <Wand2 size={15} /> Remember
        </Button>
      </div>
      <p className="px-2 pt-1 text-center text-[11.5px] leading-snug text-muted">AI suggestions are estimates and can get context wrong. EasyChat never sends anything - you always press send.</p>
    </motion.div>
  );
}

function SaveToMemory({
  open,
  onClose,
  contactId,
  setContactId,
  transcript,
  vibe,
}: {
  open: boolean;
  onClose: () => void;
  contactId: string | null;
  setContactId: (id: string) => void;
  transcript: TranscriptLine[];
  vibe: Vibe;
}) {
  const store = useStore();
  const toast = useToast();
  const existing = store.contacts.find((c) => c.id === contactId);
  const [name, setName] = useState(existing?.name ?? '');
  const [fact, setFact] = useState('');
  const lastTheirs = [...transcript].reverse().find((l) => l.speaker === 'them')?.text ?? '';
  const [topic, setTopic] = useState(lastTheirs.slice(0, 80));

  useEffect(() => {
    if (open) {
      setName(existing?.name ?? '');
      setTopic(lastTheirs.slice(0, 80));
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Sheet open={open} onClose={onClose} title="Remember this person">
      <p className="mb-4 text-[13px] text-muted">People Memory is opt-in, stays on your device, and can be wiped in one tap.</p>
      <div className="space-y-3">
        <label className="block">
          <span className="mb-1 block px-1 text-[12px] font-medium text-muted">Name</span>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Maya from Hinge" className="h-12 w-full rounded-2xl border border-line bg-surface-2 px-4 outline-none focus:border-indigo/60" />
        </label>
        <label className="block">
          <span className="mb-1 block px-1 text-[12px] font-medium text-muted">Last topic</span>
          <input value={topic} onChange={(e) => setTopic(e.target.value)} className="h-12 w-full rounded-2xl border border-line bg-surface-2 px-4 outline-none focus:border-indigo/60" />
        </label>
        <label className="block">
          <span className="mb-1 block px-1 text-[12px] font-medium text-muted">Something they shared (optional)</span>
          <input value={fact} onChange={(e) => setFact(e.target.value)} placeholder="e.g. has a golden retriever called Biscuit" className="h-12 w-full rounded-2xl border border-line bg-surface-2 px-4 outline-none focus:border-indigo/60" />
        </label>
        <Button
          block
          size="lg"
          disabled={!name.trim()}
          onClick={() => {
            const c = store.upsertContact({
              id: existing?.id,
              name: name.trim(),
              lastTopic: topic.trim(),
              facts: fact.trim() ? [...(existing?.facts ?? []), fact.trim()] : existing?.facts,
              preferredVibe: vibe,
            });
            setContactId(c.id);
            toast(`Saved to ${c.name}'s card`);
            onClose();
          }}
        >
          Save to People Memory
        </Button>
      </div>
    </Sheet>
  );
}
