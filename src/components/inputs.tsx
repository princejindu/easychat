import { AnimatePresence, motion } from 'framer-motion';
import { ClipboardPaste, Eraser, ImagePlus, Mic, Pause, Play, Plus, Square, Trash2, Upload } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button, cx, softSpring, spring, useToast } from './ui';

// --- Screenshot input with on-device redaction ------------------------------

interface Shot {
  id: string;
  url: string;
  img: HTMLImageElement;
  boxes: { x: number; y: number; w: number; h: number }[]; // fractions of the image
}

const MAX_SHOTS = 3;

function loadImage(file: Blob): Promise<{ url: string; img: HTMLImageElement }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => resolve({ url, img });
    img.onerror = reject;
    img.src = url;
  });
}

/** Flattens shots (stacked vertically) with redaction boxes burned in. */
export async function exportShots(shots: Shot[]): Promise<{ data: string; mediaType: 'image/jpeg' } | null> {
  if (!shots.length) return null;
  const width = Math.min(1200, Math.max(...shots.map((s) => s.img.naturalWidth)));
  const heights = shots.map((s) => (s.img.naturalHeight * width) / s.img.naturalWidth);
  let total = heights.reduce((a, b) => a + b, 0);
  const scale = total > 4000 ? 4000 / total : 1;
  total *= scale;
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(width * scale);
  canvas.height = Math.round(total);
  const ctx = canvas.getContext('2d')!;
  let y = 0;
  shots.forEach((s, i) => {
    const h = heights[i] * scale;
    const w = canvas.width;
    ctx.drawImage(s.img, 0, y, w, h);
    ctx.fillStyle = '#000';
    for (const b of s.boxes) ctx.fillRect(b.x * w, y + b.y * h, b.w * w, b.h * h);
    y += h;
  });
  const url = canvas.toDataURL('image/jpeg', 0.85);
  return { data: url.split(',')[1], mediaType: 'image/jpeg' };
}

export function ScreenshotInput({ shots, setShots, hint }: { shots: Shot[]; setShots: (s: Shot[]) => void; hint: string }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [redacting, setRedacting] = useState(false);
  const toast = useToast();

  const add = useCallback(
    async (files: FileList | File[]) => {
      const list = Array.from(files).filter((f) => f.type.startsWith('image/'));
      if (!list.length) return;
      const next = [...shots];
      for (const f of list.slice(0, MAX_SHOTS - shots.length)) {
        const { url, img } = await loadImage(f);
        next.push({ id: url, url, img, boxes: [] });
      }
      setShots(next);
    },
    [shots, setShots],
  );

  // Paste an image straight from the clipboard.
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const files = Array.from(e.clipboardData?.files ?? []);
      if (files.length) add(files);
    };
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  }, [add]);

  if (!shots.length) {
    return (
      <motion.label
        whileTap={{ scale: 0.98 }}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          add(e.dataTransfer.files);
        }}
        className="ring-gradient flex cursor-pointer flex-col items-center justify-center gap-3 rounded-[28px] bg-surface px-6 py-10 text-center"
      >
        <motion.div animate={{ y: [0, -6, 0] }} transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }} className="grid size-16 place-items-center rounded-3xl bg-gradient-to-br from-indigo to-indigo-2 text-white shadow-[0_16px_40px_-12px_rgba(99,91,255,.9)]">
          <ImagePlus size={28} />
        </motion.div>
        <div>
          <p className="text-[16px] font-semibold">Add a screenshot</p>
          <p className="mt-1 text-[13px] text-muted">{hint}</p>
        </div>
        <span className="rounded-full bg-surface-2 px-3 py-1.5 text-[12px] text-ink-2">Tap to choose · drop · or paste</span>
        <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => e.target.files && add(e.target.files)} />
      </motion.label>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-[13px] text-muted">{redacting ? 'Drag over anything private to black it out' : 'Preview - nothing is sent yet'}</p>
        <div className="flex gap-1.5">
          <Button size="sm" variant={redacting ? 'primary' : 'soft'} onClick={() => setRedacting((r) => !r)}>
            <Eraser size={14} /> {redacting ? 'Done' : 'Redact'}
          </Button>
        </div>
      </div>
      <div className="no-scrollbar flex snap-x gap-3 overflow-x-auto pb-1">
        {shots.map((s) => (
          <RedactableImage
            key={s.id}
            shot={s}
            active={redacting}
            onChange={(boxes) => setShots(shots.map((x) => (x.id === s.id ? { ...x, boxes } : x)))}
            onRemove={() => {
              URL.revokeObjectURL(s.url);
              setShots(shots.filter((x) => x.id !== s.id));
            }}
          />
        ))}
        {shots.length < MAX_SHOTS && (
          <label className="grid h-40 w-28 shrink-0 cursor-pointer snap-start place-items-center self-start rounded-3xl border border-dashed border-line-strong text-center text-[12px] text-muted">
            <div>
              <Plus className="mx-auto mb-1" size={20} />
              Add another
              <br />
              <span className="text-[11px]">long profiles</span>
            </div>
            <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files && add(e.target.files)} />
          </label>
        )}
      </div>
      {shots.some((s) => s.boxes.length) && (
        <button className="text-[12px] text-muted underline" onClick={() => { setShots(shots.map((s) => ({ ...s, boxes: [] }))); toast('Redactions cleared'); }}>
          Clear redactions
        </button>
      )}
    </div>
  );
}

function RedactableImage({ shot, active, onChange, onRemove }: { shot: Shot; active: boolean; onChange: (b: Shot['boxes']) => void; onRemove: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const [drag, setDrag] = useState<{ x0: number; y0: number; x: number; y: number } | null>(null);
  const pos = (e: React.PointerEvent) => {
    const r = ref.current!.getBoundingClientRect();
    return { x: Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)), y: Math.max(0, Math.min(1, (e.clientY - r.top) / r.height)) };
  };
  const live = drag ? { x: Math.min(drag.x0, drag.x), y: Math.min(drag.y0, drag.y), w: Math.abs(drag.x - drag.x0), h: Math.abs(drag.y - drag.y0) } : null;
  return (
    <motion.div layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={softSpring} className="relative w-[62%] shrink-0 snap-start">
      <div
        ref={ref}
        className={cx('relative overflow-hidden rounded-3xl border border-line-strong', active && 'cursor-crosshair ring-2 ring-indigo')}
        style={{ touchAction: active ? 'none' : 'auto' }}
        onPointerDown={(e) => {
          if (!active) return;
          (e.target as HTMLElement).setPointerCapture(e.pointerId);
          const p = pos(e);
          setDrag({ x0: p.x, y0: p.y, x: p.x, y: p.y });
        }}
        onPointerMove={(e) => drag && setDrag({ ...drag, ...pos(e) })}
        onPointerUp={() => {
          if (live && live.w > 0.02 && live.h > 0.01) onChange([...shot.boxes, live]);
          setDrag(null);
        }}
      >
        <img src={shot.url} alt="Screenshot preview" className="block w-full select-none" draggable={false} />
        {[...shot.boxes, ...(live ? [live] : [])].map((b, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={() => active && i < shot.boxes.length && onChange(shot.boxes.filter((_, k) => k !== i))}
            className="absolute rounded-md bg-black"
            style={{ left: `${b.x * 100}%`, top: `${b.y * 100}%`, width: `${b.w * 100}%`, height: `${b.h * 100}%` }}
          />
        ))}
      </div>
      <button onClick={onRemove} aria-label="Remove screenshot" className="absolute top-2 right-2 grid size-8 place-items-center rounded-full bg-black/60 text-white backdrop-blur">
        <Trash2 size={14} />
      </button>
    </motion.div>
  );
}

export type { Shot };

// --- Text input ----------------------------------------------------------------

export function TextInput({ value, onChange, placeholder, rows = 6 }: { value: string; onChange: (v: string) => void; placeholder: string; rows?: number }) {
  const toast = useToast();
  const paste = async () => {
    try {
      const t = await navigator.clipboard.readText();
      if (t) onChange(t);
      else toast('Clipboard is empty', 'warn');
    } catch {
      toast('Allow clipboard access, or long-press to paste', 'warn');
    }
  };
  return (
    <div className="ring-gradient rounded-[28px] bg-surface p-1">
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="block w-full resize-none rounded-[24px] bg-transparent px-4 pt-4 pb-2 text-[15.5px] leading-relaxed text-ink outline-none placeholder:text-muted/70"
      />
      <div className="flex items-center justify-between px-3 pb-2">
        <span className="text-[11.5px] text-muted">{value.length ? `${value.length} chars` : 'Tip: put "Me:" before your own lines'}</span>
        <div className="flex gap-1">
          {value && (
            <Button size="sm" variant="ghost" onClick={() => onChange('')}>
              Clear
            </Button>
          )}
          <Button size="sm" variant="soft" onClick={paste}>
            <ClipboardPaste size={14} /> Paste
          </Button>
        </div>
      </div>
    </div>
  );
}

// --- Voice note input -------------------------------------------------------

type SpeechRec = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((e: { resultIndex: number; results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }> }) => void) | null;
  onend: (() => void) | null;
  onerror: ((e: { error: string }) => void) | null;
};

function getRecognizer(): SpeechRec | null {
  const W = window as unknown as { SpeechRecognition?: new () => SpeechRec; webkitSpeechRecognition?: new () => SpeechRec };
  const C = W.SpeechRecognition ?? W.webkitSpeechRecognition;
  return C ? new C() : null;
}

async function peaksFor(file: Blob, bars = 56): Promise<number[]> {
  try {
    const ctx = new AudioContext();
    const buf = await ctx.decodeAudioData(await file.arrayBuffer());
    const data = buf.getChannelData(0);
    const step = Math.floor(data.length / bars);
    const peaks = Array.from({ length: bars }, (_, i) => {
      let max = 0;
      for (let j = i * step; j < (i + 1) * step; j += 64) max = Math.max(max, Math.abs(data[j]));
      return max;
    });
    const top = Math.max(...peaks, 0.01);
    ctx.close();
    return peaks.map((p) => 0.12 + (p / top) * 0.88);
  } catch {
    return Array.from({ length: bars }, (_, i) => 0.25 + Math.abs(Math.sin(i * 0.7)) * 0.6);
  }
}

export function Waveform({ peaks, progress, live }: { peaks: number[]; progress: number; live?: boolean }) {
  return (
    <div className="flex h-14 items-center gap-[3px]">
      {peaks.map((p, i) => (
        <motion.span
          key={i}
          className={cx('w-[3px] flex-1 rounded-full', i / peaks.length <= progress ? 'bg-rose' : 'bg-line-strong')}
          initial={{ scaleY: 0.1 }}
          animate={live ? { scaleY: [0.2, p, 0.35, p * 0.8, 0.2] } : { scaleY: p }}
          transition={live ? { duration: 1 + (i % 5) * 0.12, repeat: Infinity, ease: 'easeInOut' } : { ...spring, delay: i * 0.008 }}
          style={{ height: '100%', originY: 0.5 }}
        />
      ))}
    </div>
  );
}

const SAMPLE_VOICE =
  "Heyyy so sorry I didn't reply earlier, today was insane. I finally booked the Lisbon trip for March and I'm so excited but also a bit nervous because I've never travelled solo. Anyway, how was your weekend? Did you end up going to that jazz bar?";

export function VoiceInput({ transcript, setTranscript }: { transcript: string; setTranscript: (t: string) => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [peaks, setPeaks] = useState<number[]>([]);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [listening, setListening] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const recRef = useRef<SpeechRec | null>(null);
  const baseRef = useRef('');
  const toast = useToast();
  const supported = typeof window !== 'undefined' && !!getRecognizer();
  const url = useMemo(() => (file ? URL.createObjectURL(file) : ''), [file]);

  useEffect(() => () => { if (url) URL.revokeObjectURL(url); }, [url]);

  const onFile = async (f: File) => {
    setFile(f);
    setPeaks(await peaksFor(f));
  };

  const startListening = () => {
    const rec = getRecognizer();
    if (!rec) return toast('Live transcription needs Chrome or Edge', 'warn');
    rec.lang = 'en-GB';
    rec.continuous = true;
    rec.interimResults = true;
    baseRef.current = transcript ? transcript + ' ' : '';
    rec.onresult = (e) => {
      let finalText = '';
      let interim = '';
      for (let i = 0; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) finalText += r[0].transcript;
        else interim += r[0].transcript;
      }
      setTranscript((baseRef.current + finalText + interim).trimStart());
    };
    rec.onerror = (e) => {
      if (e.error === 'not-allowed') toast('Microphone permission was denied', 'warn');
    };
    rec.onend = () => setListening(false);
    recRef.current = rec;
    rec.start();
    setListening(true);
    // Play the note aloud so the on-device recogniser can hear it.
    if (audioRef.current && file) audioRef.current.play();
  };

  const stopListening = () => {
    recRef.current?.stop();
    audioRef.current?.pause();
    setListening(false);
  };

  return (
    <div className="space-y-3">
      <div className="ring-gradient rounded-[28px] bg-surface p-4">
        {file ? (
          <div className="flex items-center gap-3">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => (playing ? audioRef.current?.pause() : audioRef.current?.play())}
              className="grid size-12 shrink-0 place-items-center rounded-full bg-rose text-navy"
              aria-label={playing ? 'Pause' : 'Play'}
            >
              {playing ? <Pause size={20} /> : <Play size={20} className="ml-0.5" />}
            </motion.button>
            <div className="min-w-0 flex-1">
              <Waveform peaks={peaks} progress={progress} />
              <p className="truncate text-[11.5px] text-muted">{file.name}</p>
            </div>
            <button onClick={() => { setFile(null); setPeaks([]); }} aria-label="Remove audio" className="text-muted">
              <Trash2 size={16} />
            </button>
            <audio
              ref={audioRef}
              src={url}
              onPlay={() => setPlaying(true)}
              onPause={() => setPlaying(false)}
              onEnded={() => { setPlaying(false); setProgress(0); }}
              onTimeUpdate={(e) => setProgress(e.currentTarget.currentTime / (e.currentTarget.duration || 1))}
            />
          </div>
        ) : listening ? (
          <Waveform peaks={Array.from({ length: 40 }, (_, i) => 0.3 + ((i * 37) % 10) / 14)} progress={1} live />
        ) : (
          <label className="flex cursor-pointer items-center gap-4">
            <div className="grid size-14 place-items-center rounded-3xl bg-gradient-to-br from-rose to-[#FFA3C9] text-navy">
              <Upload size={22} />
            </div>
            <div className="flex-1">
              <p className="text-[15px] font-semibold">Add a voice note</p>
              <p className="text-[12.5px] text-muted">Shared from WhatsApp, Telegram, Instagram - or any audio file</p>
            </div>
            <input type="file" accept="audio/*,.opus,.ogg,.m4a" className="hidden" onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
          </label>
        )}

        <div className="mt-4 flex gap-2">
          <Button
            size="sm"
            variant={listening ? 'danger' : 'primary'}
            className="flex-1"
            onClick={listening ? stopListening : startListening}
            disabled={!supported}
            title={supported ? '' : 'Live transcription is not supported in this browser'}
          >
            {listening ? <Square size={13} /> : <Mic size={14} />}
            {listening ? 'Stop listening' : file ? 'Play & transcribe' : 'Listen live'}
          </Button>
          {!transcript && (
            <Button size="sm" variant="soft" onClick={() => setTranscript(SAMPLE_VOICE)}>
              Try a sample
            </Button>
          )}
        </div>
        {!supported && <p className="mt-2 text-[11.5px] text-muted">On-device transcription isn't available in this browser - type or paste what they said below.</p>}
      </div>

      <AnimatePresence>
        {(transcript || listening || file) && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={softSpring}>
            <p className="mb-1.5 px-1 text-[12px] font-semibold tracking-[0.08em] text-muted uppercase">Transcript · check & edit</p>
            <textarea
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              rows={5}
              placeholder={listening ? 'Listening…' : 'What did they say?'}
              className="block w-full resize-none rounded-3xl border border-line bg-surface p-4 text-[15px] leading-relaxed outline-none focus:border-indigo/60"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
