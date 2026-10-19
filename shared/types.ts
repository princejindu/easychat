// Contract shared by the web client and the API server.

export type Task =
  | 'reply' // continue a chat (paste or screenshot)
  | 'opener' // dating / social profile opener
  | 'revive' // re-open a chat that went quiet
  | 'decode' // "what did they mean?"
  | 'polish' // improve the user's own draft
  | 'email' // professional email / work reply
  | 'voice'; // reply to a voice note transcript

export type Mode = 'dating' | 'friends' | 'family' | 'work';
export type Vibe = 'playful' | 'flirty' | 'chill' | 'bold' | 'sweet' | 'professional';
export type Length = 'short' | 'medium' | 'long';
export type PolishGoal = 'shorter' | 'funnier' | 'confident' | 'warmer' | 'professional';

export interface StyleTraits {
  emoji: 0 | 1 | 2; // none, some, lots
  length: Length;
  lowercase: boolean;
  slang: boolean;
  punctuation: 'minimal' | 'normal' | 'expressive';
}

export interface StylePayload {
  samples: string[];
  traits: StyleTraits;
  forbidden: string[];
}

export interface ContactPayload {
  name: string;
  facts: string[];
  lastTopic?: string;
  notes?: string;
}

export interface AssistRequest {
  task: Task;
  mode: Mode;
  vibe: Vibe;
  length: Length;
  language: string;
  text?: string;
  image?: { data: string; mediaType: 'image/png' | 'image/jpeg' | 'image/webp' | 'image/gif' };
  polishGoal?: PolishGoal;
  contact?: ContactPayload;
  style?: StylePayload;
  avoid?: string[]; // previous options, so a regenerate gives new ones
}

export interface TranscriptLine {
  speaker: 'them' | 'me';
  text: string;
}

export interface ReplyOption {
  label: string; // e.g. Playful, Curious, Bold
  text: string;
  rationale: string; // one-line "why this works"
  uses: string; // the real detail it references ("" if none)
}

export interface RedFlag {
  kind: 'money' | 'off_platform' | 'no_video' | 'love_bombing' | 'pressure' | 'disrespect' | 'other';
  detail: string;
}

export interface AssistResult {
  detected_context: string;
  transcript: TranscriptLine[];
  summary: string; // voice notes / decode
  tone: string; // "excited, a bit nervous"
  subject: string; // email subject suggestion ("" if n/a)
  decode: string; // honest read for the decode task
  uncertainty_notes: string[];
  options: ReplyOption[];
  next_step: string;
  interest: { score: number; reading: string; advice: string } | null;
  red_flags: RedFlag[];
  source: 'claude' | 'demo';
}

export interface ErrorBody {
  error: string;
  code?: 'refused' | 'rate_limited' | 'bad_request' | 'upstream';
}
