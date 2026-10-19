import { AnimatePresence, motion, type HTMLMotionProps } from 'framer-motion';
import { createContext, useCallback, useContext, useId, useState, type ReactNode } from 'react';
import { Check, ChevronLeft, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const spring = { type: 'spring', stiffness: 420, damping: 32 } as const;
export const softSpring = { type: 'spring', stiffness: 260, damping: 26 } as const;

export function cx(...c: (string | false | null | undefined)[]) {
  return c.filter(Boolean).join(' ');
}

export function Logo({ size = 28, withWord = true }: { size?: number; withWord?: boolean }) {
  const gid = 'lg' + useId().replace(/[^a-zA-Z0-9_-]/g, '');
  return (
    <div className="flex items-center gap-2">
      <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden>
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#A7A2FF" />
            <stop offset="1" stopColor="#635BFF" />
          </linearGradient>
        </defs>
        <rect width="64" height="64" rx="20" fill={`url(#${gid})`} />
        <path d="M18 20h28a6 6 0 0 1 6 6v12a6 6 0 0 1-6 6H30l-9 7v-7h-3a6 6 0 0 1-6-6V26a6 6 0 0 1 6-6z" fill="#0B1426" opacity=".9" />
        <circle cx="25" cy="32" r="3" fill="#fff" />
        <circle cx="32" cy="32" r="3" fill="#fff" />
        <circle cx="39" cy="32" r="3" fill="#7CF2C8" />
      </svg>
      {withWord && (
        <span className="text-[17px] font-semibold tracking-tight">
          Easy<span className="text-indigo-2">Chat</span>
        </span>
      )}
    </div>
  );
}

type BtnProps = HTMLMotionProps<'button'> & {
  variant?: 'primary' | 'ghost' | 'soft' | 'danger' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  block?: boolean;
};

export function Button({ variant = 'primary', size = 'md', block, className, children, ...rest }: BtnProps) {
  const base = 'relative inline-flex items-center justify-center gap-2 rounded-2xl font-medium select-none disabled:opacity-40 disabled:pointer-events-none';
  const sizes = { sm: 'h-9 px-3.5 text-[13px]', md: 'h-11 px-5 text-[15px]', lg: 'h-14 px-6 text-[16px]' };
  const variants = {
    primary: 'bg-indigo text-white shadow-[0_10px_30px_-10px_rgba(99,91,255,.8)] hover:bg-[#7069ff]',
    soft: 'bg-surface-2 text-ink hover:bg-line-strong',
    ghost: 'text-ink-2 hover:bg-surface-2',
    outline: 'border border-line-strong text-ink hover:bg-surface-2',
    danger: 'bg-[#ff5d6c]/12 text-[#ff6b79] hover:bg-[#ff5d6c]/20',
  };
  return (
    <motion.button whileTap={{ scale: 0.96 }} transition={spring} className={cx(base, sizes[size], variants[variant], block && 'w-full', className)} {...rest}>
      {children}
    </motion.button>
  );
}

export function IconButton({ label, className, children, ...rest }: HTMLMotionProps<'button'> & { label: string }) {
  return (
    <motion.button
      whileTap={{ scale: 0.9 }}
      transition={spring}
      aria-label={label}
      title={label}
      className={cx('grid size-10 place-items-center rounded-full text-ink-2 hover:bg-surface-2', className)}
      {...rest}
    >
      {children}
    </motion.button>
  );
}

export function Chip({
  active,
  onClick,
  children,
  layoutGroup,
  color,
  disabled,
  title,
}: {
  active?: boolean;
  onClick?: () => void;
  children: ReactNode;
  layoutGroup?: string;
  color?: string;
  disabled?: boolean;
  title?: string;
}) {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.94 }}
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-pressed={active}
      className={cx(
        'relative inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-[13px] font-medium transition-colors disabled:opacity-35',
        active ? 'text-white' : 'bg-surface-2 text-ink-2 hover:text-ink',
      )}
    >
      {active && (
        <motion.span
          layoutId={layoutGroup ? `chip-${layoutGroup}` : undefined}
          transition={spring}
          className="absolute inset-0 rounded-full"
          style={{ background: color ? `linear-gradient(135deg, ${color}, #635BFF)` : '#635BFF' }}
        />
      )}
      <span className="relative flex items-center gap-1.5">{children}</span>
    </motion.button>
  );
}

export function Card({ className, children, ...rest }: HTMLMotionProps<'div'>) {
  return (
    <motion.div className={cx('rounded-3xl border border-line bg-surface shadow-card', className)} {...rest}>
      {children}
    </motion.div>
  );
}

export function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={() => onChange(!on)}
      className={cx('relative h-7 w-12 shrink-0 rounded-full transition-colors', on ? 'bg-indigo' : 'bg-line-strong')}
    >
      <motion.span layout transition={spring} className={cx('absolute top-1 size-5 rounded-full bg-white shadow', on ? 'right-1' : 'left-1')} />
    </button>
  );
}

export function Segmented<T extends string>({ value, options, onChange, id }: { value: T; options: { id: T; label: string }[]; onChange: (v: T) => void; id: string }) {
  return (
    <div className="flex rounded-2xl bg-surface-2 p-1">
      {options.map((o) => (
        <button key={o.id} type="button" onClick={() => onChange(o.id)} className={cx('relative flex-1 rounded-xl py-2 text-[13px] font-medium', value === o.id ? 'text-ink' : 'text-muted')}>
          {value === o.id && <motion.span layoutId={`seg-${id}`} transition={spring} className="absolute inset-0 rounded-xl bg-surface shadow-card" />}
          <span className="relative">{o.label}</span>
        </button>
      ))}
    </div>
  );
}

export function TopBar({ title, back = true, right, subtitle }: { title?: ReactNode; back?: boolean; right?: ReactNode; subtitle?: ReactNode }) {
  const nav = useNavigate();
  return (
    <div className="sticky top-0 z-30 flex items-center gap-1 bg-bg/80 px-3 pt-3 pb-2 backdrop-blur-xl">
      {back ? (
        <IconButton label="Back" onClick={() => (window.history.length > 1 ? nav(-1) : nav('/'))}>
          <ChevronLeft size={22} />
        </IconButton>
      ) : (
        <div className="w-2" />
      )}
      <div className="min-w-0 flex-1">
        {title && <h1 className="truncate text-[17px] font-semibold tracking-tight">{title}</h1>}
        {subtitle && <p className="truncate text-[12px] text-muted">{subtitle}</p>}
      </div>
      {right}
    </div>
  );
}

export function Sheet({ open, onClose, children, title }: { open: boolean; onClose: () => void; children: ReactNode; title?: string }) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="absolute inset-0 z-[60] bg-black/50 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal
            aria-label={title}
            className="absolute inset-x-0 bottom-0 z-[61] max-h-[88%] overflow-y-auto rounded-t-[32px] border-t border-line-strong bg-surface px-5 pt-3 pb-8 no-scrollbar"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={softSpring}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.6 }}
            onDragEnd={(_, i) => {
              if (i.offset.y > 120 || i.velocity.y > 600) onClose();
            }}
          >
            <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-line-strong" />
            {title && (
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-display text-[28px] leading-none">{title}</h2>
                <IconButton label="Close" onClick={onClose}>
                  <X size={20} />
                </IconButton>
              </div>
            )}
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// --- Toasts ------------------------------------------------------------------
interface ToastItem {
  id: number;
  text: string;
  tone: 'ok' | 'warn';
}
const ToastCtx = createContext<(text: string, tone?: 'ok' | 'warn') => void>(() => {});

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const push = useCallback((text: string, tone: 'ok' | 'warn' = 'ok') => {
    const id = Date.now() + Math.random();
    setItems((s) => [...s.slice(-2), { id, text, tone }]);
    setTimeout(() => setItems((s) => s.filter((t) => t.id !== id)), 2400);
  }, []);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div aria-live="polite" className="pointer-events-none absolute inset-x-0 top-4 z-[80] flex flex-col items-center gap-2 px-4">
        <AnimatePresence>
          {items.map((t) => (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: -16, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={spring}
              className="flex items-center gap-2 rounded-full border border-line-strong bg-surface/95 px-4 py-2.5 text-[13px] font-medium shadow-card backdrop-blur"
            >
              <span className={cx('grid size-5 place-items-center rounded-full', t.tone === 'ok' ? 'bg-mint text-navy' : 'bg-amber text-navy')}>
                {t.tone === 'ok' ? <Check size={13} strokeWidth={3} /> : '!'}
              </span>
              {t.text}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastCtx.Provider>
  );
}

export const useToast = () => useContext(ToastCtx);

export function Avatar({ name, hue, size = 44 }: { name: string; hue: number; size?: number }) {
  const initials = name
    .split(/\s+/)
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  return (
    <div
      className="grid shrink-0 place-items-center rounded-full font-semibold text-white"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.36,
        background: `linear-gradient(135deg, hsl(${hue} 80% 66%), hsl(${(hue + 50) % 360} 75% 52%))`,
      }}
    >
      {initials || '?'}
    </div>
  );
}

export function SectionLabel({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-2.5 flex items-center justify-between px-1">
      <h3 className="text-[12px] font-semibold tracking-[0.08em] text-muted uppercase">{children}</h3>
      {action}
    </div>
  );
}

export const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05, delayChildren: 0.04 } },
};
export const rise = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: softSpring },
};

/** Two-tap confirm for destructive actions (native confirm() dialogs are blocked in embedded viewers). */
export function useConfirmTap(): [boolean, (fn: () => void) => void] {
  const [armed, setArmed] = useState(false);
  const trigger = useCallback(
    (fn: () => void) => {
      if (armed) {
        setArmed(false);
        fn();
      } else {
        setArmed(true);
        setTimeout(() => setArmed(false), 3000);
      }
    },
    [armed],
  );
  return [armed, trigger];
}
