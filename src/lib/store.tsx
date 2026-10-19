import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { AssistResult, Length, Mode, StyleTraits, Task, Vibe } from '../../shared/types';
import { analyseStyle } from '../../shared/demo';

export type Plan = 'free' | 'weekly' | 'monthly' | 'annual';

export interface Settings {
  theme: 'dark' | 'light';
  language: string;
  defaultMode: Mode;
  defaultVibe: Vibe;
  defaultLength: Length;
  retention: '24h' | '7d' | 'never';
  saveHistory: boolean;
  trainingOptIn: boolean;
  ageConfirmed: boolean;
  useCases: Mode[];
  onboarded: boolean;
  bubbleEnabled: boolean;
  bubbleIdleOpacity: number;
  cloudConsent: boolean;
}

export interface StyleProfile {
  samples: string[];
  traits: StyleTraits;
  forbidden: string[];
  enabled: boolean;
}

export interface Contact {
  id: string;
  name: string;
  platform: string;
  notes: string;
  facts: string[];
  preferredVibe: Vibe | null;
  lastTopic: string;
  hue: number;
  updatedAt: number;
}

export interface HistoryItem {
  id: string;
  at: number;
  task: Task;
  mode: Mode;
  vibe: Vibe;
  contactId: string | null;
  preview: string;
  result: AssistResult;
  copied: string | null;
}

export interface Favourite {
  id: string;
  at: number;
  text: string;
  label: string;
  contactId: string | null;
}

interface State {
  settings: Settings;
  style: StyleProfile;
  contacts: Contact[];
  history: HistoryItem[];
  favourites: Favourite[];
  usage: { date: string; count: number; voice: number };
  plan: Plan;
}

const KEY = 'easychat:v1';
export const FREE_DAILY = 5;
export const FREE_VOICE_DAILY = 1;

const today = () => new Date().toISOString().slice(0, 10);

const defaults: State = {
  settings: {
    theme: 'dark',
    language: 'English (UK)',
    defaultMode: 'dating',
    defaultVibe: 'playful',
    defaultLength: 'short',
    retention: '24h',
    saveHistory: true,
    trainingOptIn: false,
    ageConfirmed: false,
    useCases: [],
    onboarded: false,
    bubbleEnabled: true,
    bubbleIdleOpacity: 0.4,
    cloudConsent: false,
  },
  style: { samples: [], traits: analyseStyle([]), forbidden: [], enabled: true },
  contacts: [],
  history: [],
  favourites: [],
  usage: { date: today(), count: 0, voice: 0 },
  plan: 'free',
};

const RETENTION_MS: Record<Settings['retention'], number> = {
  '24h': 24 * 3600_000,
  '7d': 7 * 24 * 3600_000,
  never: Number.POSITIVE_INFINITY,
};

function load(): State {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaults;
    const s = JSON.parse(raw) as Partial<State>;
    const merged: State = {
      ...defaults,
      ...s,
      settings: { ...defaults.settings, ...s.settings },
      style: { ...defaults.style, ...s.style },
    };
    if (merged.usage.date !== today()) merged.usage = { date: today(), count: 0, voice: 0 };
    // Apply the retention policy on every launch.
    const cutoff = Date.now() - RETENTION_MS[merged.settings.retention];
    merged.history = merged.history.filter((h) => h.at >= cutoff);
    return merged;
  } catch {
    return defaults;
  }
}

export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);

interface Store extends State {
  updateSettings: (p: Partial<Settings>) => void;
  setStyleSamples: (samples: string[]) => void;
  updateStyle: (p: Partial<StyleProfile>) => void;
  upsertContact: (c: Partial<Contact> & { name: string }) => Contact;
  removeContact: (id: string) => void;
  wipeContacts: () => void;
  addHistory: (h: Omit<HistoryItem, 'id' | 'at' | 'copied'>) => string;
  markCopied: (historyId: string | null, text: string) => void;
  removeHistory: (id: string) => void;
  toggleFavourite: (text: string, label: string, contactId: string | null) => void;
  isFavourite: (text: string) => boolean;
  canGenerate: (voice?: boolean) => boolean;
  consume: (voice?: boolean) => void;
  setPlan: (p: Plan) => void;
  clearAll: () => void;
  exportData: () => string;
  remaining: number;
}

const Ctx = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>(load);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      /* storage unavailable - app still works for this session */
    }
  }, [state]);

  useEffect(() => {
    document.documentElement.dataset.theme = state.settings.theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', state.settings.theme === 'dark' ? '#0B1426' : '#F7F8FC');
  }, [state.settings.theme]);

  const updateSettings = useCallback((p: Partial<Settings>) => setState((s) => ({ ...s, settings: { ...s.settings, ...p } })), []);

  const setStyleSamples = useCallback(
    (samples: string[]) => setState((s) => ({ ...s, style: { ...s.style, samples, traits: analyseStyle(samples) } })),
    [],
  );
  const updateStyle = useCallback((p: Partial<StyleProfile>) => setState((s) => ({ ...s, style: { ...s.style, ...p } })), []);

  const contactsRef = useRef(state.contacts);
  contactsRef.current = state.contacts;

  const upsertContact = useCallback((c: Partial<Contact> & { name: string }) => {
    const found = c.id ? contactsRef.current.find((x) => x.id === c.id) : undefined;
    const saved: Contact = {
      id: found?.id ?? c.id ?? uid(),
      name: c.name,
      platform: c.platform ?? found?.platform ?? '',
      notes: c.notes ?? found?.notes ?? '',
      facts: c.facts ?? found?.facts ?? [],
      preferredVibe: c.preferredVibe !== undefined ? c.preferredVibe : (found?.preferredVibe ?? null),
      lastTopic: c.lastTopic ?? found?.lastTopic ?? '',
      hue: found?.hue ?? Math.floor(Math.random() * 360),
      updatedAt: Date.now(),
    };
    setState((s) => {
      const exists = s.contacts.some((x) => x.id === saved.id);
      return { ...s, contacts: exists ? s.contacts.map((x) => (x.id === saved.id ? saved : x)) : [saved, ...s.contacts] };
    });
    return saved;
  }, []);

  const removeContact = useCallback(
    (id: string) =>
      setState((s) => ({
        ...s,
        contacts: s.contacts.filter((c) => c.id !== id),
        history: s.history.map((h) => (h.contactId === id ? { ...h, contactId: null } : h)),
      })),
    [],
  );
  const wipeContacts = useCallback(() => setState((s) => ({ ...s, contacts: [] })), []);

  const addHistory = useCallback((h: Omit<HistoryItem, 'id' | 'at' | 'copied'>) => {
    const id = uid();
    setState((s) => (s.settings.saveHistory ? { ...s, history: [{ ...h, id, at: Date.now(), copied: null }, ...s.history].slice(0, 80) } : s));
    return id;
  }, []);

  const markCopied = useCallback(
    (historyId: string | null, text: string) =>
      setState((s) => ({ ...s, history: s.history.map((h) => (h.id === historyId ? { ...h, copied: text } : h)) })),
    [],
  );
  const removeHistory = useCallback((id: string) => setState((s) => ({ ...s, history: s.history.filter((h) => h.id !== id) })), []);

  const toggleFavourite = useCallback(
    (text: string, label: string, contactId: string | null) =>
      setState((s) => {
        const has = s.favourites.some((f) => f.text === text);
        return {
          ...s,
          favourites: has ? s.favourites.filter((f) => f.text !== text) : [{ id: uid(), at: Date.now(), text, label, contactId }, ...s.favourites],
        };
      }),
    [],
  );
  const isFavourite = useCallback((text: string) => state.favourites.some((f) => f.text === text), [state.favourites]);

  const unlimited = state.plan !== 'free';
  const canGenerate = useCallback(
    (voice = false) => unlimited || (state.usage.count < FREE_DAILY && (!voice || state.usage.voice < FREE_VOICE_DAILY)),
    [unlimited, state.usage],
  );
  const consume = useCallback(
    (voice = false) =>
      setState((s) => ({ ...s, usage: { ...s.usage, count: s.usage.count + 1, voice: s.usage.voice + (voice ? 1 : 0) } })),
    [],
  );
  const setPlan = useCallback((plan: Plan) => setState((s) => ({ ...s, plan })), []);

  const clearAll = useCallback(() => {
    try {
      localStorage.removeItem(KEY);
    } catch {
      /* ignore */
    }
    setState({ ...defaults, settings: { ...defaults.settings, theme: state.settings.theme } });
  }, [state.settings.theme]);

  const exportData = useCallback(() => JSON.stringify(state, null, 2), [state]);

  const value = useMemo<Store>(
    () => ({
      ...state,
      updateSettings,
      setStyleSamples,
      updateStyle,
      upsertContact,
      removeContact,
      wipeContacts,
      addHistory,
      markCopied,
      removeHistory,
      toggleFavourite,
      isFavourite,
      canGenerate,
      consume,
      setPlan,
      clearAll,
      exportData,
      remaining: unlimited ? Infinity : Math.max(0, FREE_DAILY - state.usage.count),
    }),
    [state, updateSettings, setStyleSamples, updateStyle, upsertContact, removeContact, wipeContacts, addHistory, markCopied, removeHistory, toggleFavourite, isFavourite, canGenerate, consume, setPlan, clearAll, exportData, unlimited],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const s = useContext(Ctx);
  if (!s) throw new Error('useStore outside StoreProvider');
  return s;
}
