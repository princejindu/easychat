import type { Mode, PolishGoal, Task, Vibe } from '../../shared/types';
import {
  AudioLines,
  BriefcaseBusiness,
  Camera,
  ClipboardPaste,
  Flame,
  HeartHandshake,
  Home,
  Mail,
  MessageCircleQuestion,
  Sparkles,
  UserRoundSearch,
  Users,
  WandSparkles,
  type LucideIcon,
} from 'lucide-react';

export const VIBES: { id: Vibe; label: string; emoji: string; color: string }[] = [
  { id: 'playful', label: 'Playful', emoji: '😄', color: '#FFC56B' },
  { id: 'flirty', label: 'Flirty', emoji: '😏', color: '#FF7AB6' },
  { id: 'chill', label: 'Chill', emoji: '😌', color: '#7CF2C8' },
  { id: 'bold', label: 'Bold', emoji: '🔥', color: '#FF8A5B' },
  { id: 'sweet', label: 'Sweet', emoji: '🥰', color: '#C9A7FF' },
  { id: 'professional', label: 'Professional', emoji: '💼', color: '#7FB2FF' },
];

export const MODES: { id: Mode; label: string; icon: LucideIcon }[] = [
  { id: 'dating', label: 'Dating', icon: Flame },
  { id: 'friends', label: 'Friends', icon: Users },
  { id: 'family', label: 'Family', icon: Home },
  { id: 'work', label: 'Work / Email', icon: BriefcaseBusiness },
];

export const GOALS: { id: PolishGoal; label: string }[] = [
  { id: 'shorter', label: 'Shorter' },
  { id: 'funnier', label: 'Funnier' },
  { id: 'confident', label: 'More confident' },
  { id: 'warmer', label: 'Warmer' },
  { id: 'professional', label: 'More professional' },
];

export interface TaskMeta {
  id: Task;
  route: string;
  title: string;
  blurb: string;
  icon: LucideIcon;
  input: 'image' | 'text' | 'audio' | 'draft';
  gradient: string;
}

export const TASKS: Record<string, TaskMeta> = {
  snap: { id: 'reply', route: 'snap', title: 'Snap & Reply', blurb: 'Screenshot a chat, get 3 replies', icon: Camera, input: 'image', gradient: 'from-[#635BFF] to-[#8B85FF]' },
  paste: { id: 'reply', route: 'paste', title: 'Paste & Reply', blurb: 'Paste any message', icon: ClipboardPaste, input: 'text', gradient: 'from-[#2EC4A6] to-[#7CF2C8]' },
  voice: { id: 'voice', route: 'voice', title: 'Voice Note', blurb: 'Transcript, tone & replies', icon: AudioLines, input: 'audio', gradient: 'from-[#FF6FA8] to-[#FFA3C9]' },
  polish: { id: 'polish', route: 'polish', title: 'Polish My Draft', blurb: 'Better, still you', icon: WandSparkles, input: 'draft', gradient: 'from-[#FF9F5B] to-[#FFC56B]' },
  opener: { id: 'opener', route: 'opener', title: 'Profile Opener', blurb: 'Openers tied to real details', icon: UserRoundSearch, input: 'image', gradient: 'from-[#B47CFF] to-[#D9B8FF]' },
  revive: { id: 'revive', route: 'revive', title: 'Revive a Chat', blurb: 'Natural re-openers', icon: HeartHandshake, input: 'text', gradient: 'from-[#4FA3FF] to-[#9BCBFF]' },
  decode: { id: 'decode', route: 'decode', title: 'Decode This', blurb: '"What did they mean?"', icon: MessageCircleQuestion, input: 'text', gradient: 'from-[#5B6CFF] to-[#7CF2C8]' },
  email: { id: 'email', route: 'email', title: 'Email & Work', blurb: 'Polished, professional replies', icon: Mail, input: 'text', gradient: 'from-[#3D5A80] to-[#7FB2FF]' },
};

export const LANGUAGES = ['English (UK)', 'English (US)', 'Nigerian Pidgin', 'Spanish', 'French', 'Portuguese'];

export const SPARK = Sparkles;

export function timeAgo(t: number): string {
  const s = Math.round((Date.now() - t) / 1000);
  if (s < 60) return 'just now';
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
}
