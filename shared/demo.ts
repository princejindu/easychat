// Offline demo engine. Used when no AI key is configured (or the API is
// unreachable) so every flow in the app still works end to end. It is
// deliberately simple and heuristic - the real quality comes from the model.
import type {
  AssistRequest,
  AssistResult,
  RedFlag,
  ReplyOption,
  StyleTraits,
  TranscriptLine,
  Vibe,
} from './types';

const STOP = new Set(
  'the a an and or but if then so to of in on at for with from by is are was were be been am i you we they he she it this that those these my your our their me him her them its im ive youre dont cant just really very what when where who why how do does did have has had not no yes yeah lol haha okay ok like get got go going about would could should will can also too more some any all one out up down over there here than been much well hey hi hello'.split(
    ' ',
  ),
);

const TOPICS: Record<string, string[]> = {
  travel: ['trip', 'travel', 'flight', 'lisbon', 'paris', 'italy', 'japan', 'holiday', 'vacation', 'beach', 'abroad', 'backpacking'],
  food: ['food', 'pizza', 'sushi', 'ramen', 'tacos', 'cook', 'cooking', 'brunch', 'restaurant', 'baking', 'pasta', 'curry'],
  coffee: ['coffee', 'latte', 'espresso', 'cafe', 'matcha'],
  dogs: ['golden retriever', 'dog', 'puppy', 'pup', 'doggo', 'retriever'],
  cats: ['cat', 'kitten'],
  music: ['music', 'concert', 'gig', 'festival', 'band', 'album', 'spotify', 'vinyl', 'guitar'],
  fitness: ['gym', 'run', 'running', 'marathon', 'climbing', 'yoga', 'hike', 'hiking', 'football', 'tennis'],
  films: ['film', 'movie', 'netflix', 'series', 'show', 'anime', 'cinema'],
  books: ['book', 'reading', 'novel', 'kindle'],
  work: ['work', 'job', 'meeting', 'deadline', 'project', 'client', 'office', 'proposal', 'invoice'],
};

const EMOJI_RE = /\p{Extended_Pictographic}/gu;

function pick<T>(arr: T[], seed: number): T {
  return arr[Math.abs(seed) % arr.length];
}

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return h;
}

export function parseTranscript(text: string): TranscriptLine[] {
  const lines = text
    .split(/\n+/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length === 0) return [];
  const out: TranscriptLine[] = [];
  for (const line of lines) {
    const m = line.match(/^([^:]{1,24}):\s*(.+)$/);
    if (m) {
      const who = m[1].trim().toLowerCase();
      const me = ['me', 'i', 'you (me)', 'myself'].includes(who);
      out.push({ speaker: me ? 'me' : 'them', text: m[2] });
    } else {
      out.push({ speaker: 'them', text: line });
    }
  }
  return out;
}

function findTopic(text: string): { topic: string; word: string } | null {
  for (const [topic, words] of Object.entries(TOPICS)) {
    for (const w of words) {
      // Keep the casing the person used ("Lisbon", not "lisbon").
      const m = text.match(new RegExp(`\\b${w}s?\\b`, 'i'));
      if (m) return { topic, word: /^[A-Z]/.test(m[0]) || !['lisbon', 'paris', 'italy', 'japan'].includes(w) ? m[0] : cap(m[0]) };
    }
  }
  return null;
}

function keyword(text: string): string {
  const words = (text.toLowerCase().match(/[a-z']{4,}/g) ?? []).filter((w) => !STOP.has(w));
  words.sort((a, b) => b.length - a.length);
  return words[0] ?? '';
}

export function detectRedFlags(text: string): RedFlag[] {
  const t = text.toLowerCase();
  const flags: RedFlag[] = [];
  if (/(send|lend|wire|transfer).{0,20}(money|cash|£|\$)|gift ?card|crypto|bitcoin|usdt|invest(ment)? opportunit|western union/.test(t))
    flags.push({ kind: 'money', detail: 'Mentions money, crypto or gift cards - a common romance-scam pattern.' });
  if (/(whatsapp|telegram|signal|hangouts|kik) (me|instead)|move (this|our chat) (to|off)|text me on|add me on (telegram|whatsapp)/.test(t))
    flags.push({ kind: 'off_platform', detail: 'Pushing to move off the app quickly. Fine sometimes - but slow down if it feels rushed.' });
  if (/camera (is )?(broken|not working)|can'?t (video|facetime)|no video calls?/.test(t))
    flags.push({ kind: 'no_video', detail: 'Avoiding video calls is a classic sign the profile might not be real.' });
  if (/soul ?mate|love you|meant to be|never felt this way|marry you/.test(t))
    flags.push({ kind: 'love_bombing', detail: 'Very intense feelings very early - could be love-bombing.' });
  if (/why (aren'?t|won'?t) you|you owe me|stop ignoring|answer me now/.test(t))
    flags.push({ kind: 'pressure', detail: 'Pressure language. You never owe anyone a reply.' });
  return flags;
}

export function interestReading(lines: TranscriptLine[]): AssistResult['interest'] {
  const theirs = lines.filter((l) => l.speaker === 'them');
  if (theirs.length === 0) return null;
  const joined = theirs.map((l) => l.text).join(' ');
  const avgLen = joined.length / theirs.length;
  const questions = (joined.match(/\?/g) ?? []).length;
  const emojis = (joined.match(EMOJI_RE) ?? []).length;
  const excite = (joined.match(/!/g) ?? []).length;
  let score = 35 + Math.min(25, avgLen / 3) + Math.min(20, questions * 10) + Math.min(10, emojis * 4) + Math.min(10, excite * 3);
  if (/^(k|ok|cool|nice|lol|haha)\.?$/i.test(theirs[theirs.length - 1].text.trim())) score -= 25;
  score = Math.round(Math.max(8, Math.min(96, score)));
  const reading =
    score >= 75
      ? 'Warm and engaged - long replies and questions back.'
      : score >= 50
        ? 'Interested but steady. Give them something easy to run with.'
        : 'Low effort so far. Could be busy - keep it light, no pressure.';
  const advice =
    score >= 75
      ? 'Keep going - this is a good moment to suggest meeting up.'
      : score >= 50
        ? 'Ask one open question tied to something they said.'
        : 'Send one light message, then give it space.';
  return { score, reading, advice };
}

const LABELS: Record<Vibe, [string, string, string]> = {
  playful: ['Playful', 'Curious', 'Bold'],
  flirty: ['Flirty', 'Curious', 'Bold'],
  chill: ['Chill', 'Curious', 'Warm'],
  bold: ['Bold', 'Curious', 'Playful'],
  sweet: ['Sweet', 'Curious', 'Playful'],
  professional: ['Concise', 'Warm', 'Direct'],
};

function applyStyle(text: string, traits?: StyleTraits): string {
  if (!traits) return text;
  let t = text;
  if (traits.emoji === 0) t = t.replace(EMOJI_RE, '').replace(/\s{2,}/g, ' ').trim();
  if (traits.lowercase) t = t.toLowerCase();
  if (traits.punctuation === 'minimal') t = t.replace(/[.!]+$/, '').trim();
  if (traits.slang) t = t.replace(/\bvery\b/g, 'so').replace(/\bgoing to\b/g, 'gonna');
  return t;
}

function cap(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function polishText(draft: string, goal: string, seed: number): ReplyOption[] {
  const clean = draft.trim().replace(/\s+/g, ' ');
  const trimmed = clean
    .replace(/\b(just|really|actually|basically|literally|kind of|sort of|i think|i guess|maybe)\b\s*/gi, '')
    .replace(/\bsorry\b,?\s*/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
  const firstSentence = trimmed.split(/(?<=[.!?])\s/)[0] ?? trimmed;
  const variants: Record<string, ReplyOption[]> = {
    shorter: [
      { label: 'Tight', text: cap(firstSentence), rationale: 'Keeps your main point, drops the rest.', uses: '' },
      { label: 'Trimmed', text: cap(trimmed), rationale: 'Same message without filler words.', uses: '' },
      { label: 'One-liner', text: cap(firstSentence.replace(/[.!?]+$/, '')) + ' 👍', rationale: 'Quick and friendly.', uses: '' },
    ],
    funnier: [
      { label: 'Light', text: cap(trimmed) + ' (no pressure, I promise 😄)', rationale: 'A small self-aware aside lowers the stakes.', uses: '' },
      { label: 'Cheeky', text: cap(trimmed.replace(/[.!?]+$/, '')) + ' - final answer 😏', rationale: 'Game-show energy makes it feel playful.', uses: '' },
      { label: 'Dramatic', text: 'Breaking news: ' + trimmed.charAt(0).toLowerCase() + trimmed.slice(1), rationale: 'Mock-serious framing gets a smile.', uses: '' },
    ],
    confident: [
      { label: 'Confident', text: cap(trimmed.replace(/\?$/, '.')), rationale: 'No hedging - says what you mean.', uses: '' },
      { label: 'Direct', text: cap(firstSentence.replace(/\?$/, '.')), rationale: 'Leads with the point.', uses: '' },
      { label: 'Assured', text: cap(trimmed) + ' Let me know what works for you.', rationale: 'Clear, with an easy next step.', uses: '' },
    ],
    warmer: [
      { label: 'Warm', text: cap(trimmed) + ' Hope your day is going well!', rationale: 'Adds genuine warmth without changing meaning.', uses: '' },
      { label: 'Kind', text: 'Honestly, ' + trimmed.charAt(0).toLowerCase() + trimmed.slice(1) + ' 😊', rationale: 'Softer opening, friendly close.', uses: '' },
      { label: 'Caring', text: cap(trimmed) + ' No rush at all.', rationale: 'Takes the pressure off them.', uses: '' },
    ],
    professional: [
      { label: 'Polished', text: 'Hi, ' + trimmed.charAt(0).toLowerCase() + trimmed.slice(1).replace(/[!]+/g, '.') + ' Thanks in advance.', rationale: 'Clear, courteous and to the point.', uses: '' },
      { label: 'Formal', text: 'Thank you for your message. ' + cap(trimmed.replace(/[!]+/g, '.')), rationale: 'Acknowledges them before your point.', uses: '' },
      { label: 'Brief', text: cap(firstSentence.replace(/[!]+/g, '.')) + ' Best regards.', rationale: 'Respects their time.', uses: '' },
    ],
  };
  const list = variants[goal] ?? variants.confident;
  return seed % 2 ? list : [...list].reverse();
}

export function demoAssist(req: AssistRequest): AssistResult {
  const seed = hash((req.text ?? '') + req.vibe + req.mode + (req.avoid?.length ?? 0));
  const text = (req.text ?? '').trim();
  const transcript = req.image && !text ? sampleTranscript() : parseTranscript(text);
  const lastThem = [...transcript].reverse().find((l) => l.speaker === 'them')?.text ?? text;
  const contactFact = req.contact?.facts?.[0];
  const found = findTopic(lastThem) ?? (contactFact ? findTopic(contactFact) : null);
  const kw = found?.word ?? keyword(lastThem);
  const asked = /\?\s*$/.test(lastThem);
  const name = req.contact?.name;
  const hi = name ? `${name}, ` : '';
  const labels = LABELS[req.vibe];
  const professional = req.mode === 'work' || req.vibe === 'professional';
  const flags = detectRedFlags(transcript.map((l) => l.text).join('\n') || text);

  let options: ReplyOption[] = [];
  let summary = '';
  let tone = '';
  let subject = '';
  let decode = '';
  let next = '';

  if (req.task === 'polish') {
    options = polishText(text, req.polishGoal ?? 'confident', seed);
    next = 'Read it once out loud - if it sounds like you, send it.';
  } else if (req.task === 'email' || professional) {
    const topic = kw || 'this';
    subject = req.task === 'email' ? `Re: ${cap(topic)} - next steps` : '';
    options = [
      { label: 'Concise', text: `Hi${name ? ' ' + name : ''},\n\nThanks for getting in touch about ${topic}. I've reviewed it and I'm happy to proceed. Could you confirm the timeline that works best on your side?\n\nBest regards`, rationale: 'Short, clear, ends with one easy question.', uses: kw ? `Mentions "${kw}"` : '' },
      { label: 'Warm', text: `Hi${name ? ' ' + name : ''},\n\nReally appreciate you reaching out - ${topic} sounds like a great fit. I'd love to set up a quick call this week to talk it through. Does Thursday or Friday suit you?\n\nThanks again`, rationale: 'Friendly tone builds rapport and proposes a concrete time.', uses: '' },
      { label: 'Direct', text: `Hi${name ? ' ' + name : ''},\n\nThanks - noted on ${topic}. Here's where I've landed: I can deliver by end of next week. Let me know if anything needs to change.\n\nBest`, rationale: 'States your position upfront so nothing is ambiguous.', uses: '' },
    ];
    next = 'Propose one specific time so they can just say yes.';
  } else if (req.task === 'opener') {
    const detail = kw || 'your profile';
    options = [
      { label: labels[0], text: pick([`Okay, ${detail} - I need the story behind that immediately 😄`, `Settle this: is ${detail} a personality trait or a lifestyle?`], seed), rationale: 'Playful hook on a real detail invites a fun answer.', uses: `Uses: ${detail}` },
      { label: labels[1], text: `${cap(detail)} caught my eye - what got you into it?`, rationale: 'An open question about something they chose to share.', uses: `Uses: ${detail}` },
      { label: labels[2], text: `You + ${detail} = my favourite profile today. Tell me your best ${detail} story and I'll match it.`, rationale: 'Confident and specific - stands out from "hey".', uses: `Uses: ${detail}` },
    ];
    next = 'If they reply with a story, ask a follow-up before sharing yours.';
  } else if (req.task === 'revive') {
    const topic = req.contact?.lastTopic || kw || 'that thing we talked about';
    options = [
      { label: labels[0], text: `${hi}I just thought of you because of ${topic} - did that ever happen in the end? 😄`, rationale: 'A callback shows you remembered without making it awkward.', uses: `Uses: ${topic}` },
      { label: labels[1], text: `${hi}random one, but how did ${topic} go?`, rationale: 'Low-pressure and easy to answer.', uses: `Uses: ${topic}` },
      { label: labels[2], text: `${hi}life got busy, but I'd still love to grab that drink. This week?`, rationale: 'Owns the gap and moves things forward.', uses: '' },
    ];
    next = 'Send one message, then let it breathe for a day or two.';
  } else if (req.task === 'decode') {
    const short = lastThem.length < 12;
    decode = short
      ? `"${lastThem}" is short, but short isn't automatically negative - people reply briefly when busy. There's no clear signal either way, so don't over-read it.`
      : asked
        ? `They asked you a question, which usually means they want the conversation to keep going. The tone reads friendly and open.`
        : `They're sharing something about their day/life - that's an invitation to respond to it, not just to change topic.`;
    tone = short ? 'neutral, possibly busy' : 'friendly, open';
    options = [
      { label: 'Natural', text: asked ? `Good question! Honestly, I'd say yes - what about you?` : `Ha, that sounds like a lot - how are you feeling about it?`, rationale: 'Responds to what they actually said.', uses: '' },
      { label: 'Curious', text: `Wait, tell me more about ${kw || 'that'}?`, rationale: 'Shows interest without assuming.', uses: kw ? `Uses: ${kw}` : '' },
      { label: 'Light', text: `Haha fair 😄 what are you up to later?`, rationale: 'Keeps it easy if they were just busy.', uses: '' },
    ];
    next = 'Ask, don\'t assume - one honest question beats a guess.';
  } else {
    // reply + voice
    const topic = kw;
    const yesNo = /^(is|are|do|does|would|have|has|can|could|will|did)\b/i.test(lastThem.split(/[.!]\s/).pop()?.trim() ?? '');
    const answer = !asked
      ? ''
      : yesNo
        ? pick(['Honestly? Yes.', 'Easy - yes.', 'Hmm, good question.'], seed) + ' '
        : /up to|plans|doing/i.test(lastThem)
          ? pick(['Not much planned yet!', 'Keeping it free so far.', 'Nothing set in stone yet.'], seed) + ' '
          : '';
    const variants: Record<string, string[]> = {
      playful: [
        `${answer}${topic ? `${cap(topic)}?? Okay, I need the full story - best part first 😄` : 'You have my full attention now 😄 go on…'}`,
        `${answer}${topic ? `Wait, ${topic}? Tell me everything - best bit first` : 'Okay that made me laugh. What else have you got?'}`,
        `${answer}Bold claim. Prove it over a drink this week? 😏`,
      ],
      flirty: [
        `${answer}${topic ? `${cap(topic)} and good taste? You're making this hard to play it cool 😏` : 'Careful, I might start looking forward to your texts 😏'}`,
        `${answer}${topic ? `So what's your favourite thing about ${topic}? Asking for very specific reasons` : 'Tell me something nobody on here knows about you'}`,
        `${answer}I think this conversation would be even better in person. Thursday?`,
      ],
      chill: [
        `${answer}${topic ? `${cap(topic)} sounds good honestly, nice one` : 'Haha fair enough, sounds good'}`,
        `${answer}${topic ? `How was ${topic} in the end?` : 'What are you up to this week?'}`,
        `${answer}${topic ? `Love that. I've been meaning to get into ${topic} myself` : 'Same here tbh, been a long week'} 🙂`,
      ],
      bold: [
        `${answer}${topic ? `Right, ${topic} is officially our first date plan. When are you free?` : "Let's skip the small talk - drinks this week?"}`,
        `${answer}${topic ? `Real question: what's the best ${topic} you've ever had?` : "What's one thing you'd do this weekend if you had zero plans?"}`,
        `${answer}${topic ? `You clearly know ${topic}. Show me your favourite spot?` : 'I like where this is going. Let\'s keep it going in person.'}`,
      ],
      sweet: [
        `${answer}${topic ? `That's lovely - ${topic} sounds like such a good time 😊` : 'That honestly made my day 😊'}`,
        `${answer}${topic ? `What do you love most about ${topic}?` : 'How has your week been, really?'}`,
        `${answer}${topic ? `Haha I can picture it. ${cap(topic)} people are the best people` : 'You seem really easy to talk to, you know that?'} 🥰`,
      ],
      professional: [
        `${answer}Thanks for the update${topic ? ` on ${topic}` : ''} - that works for me.`,
        `${answer}Thanks! Could you share a bit more detail${topic ? ` on ${topic}` : ''}?`,
        `${answer}Sounds good. Shall we pick a time to go through it?`,
      ],
    };
    const v = variants[req.vibe] ?? variants.chill;
    const rationales = [
      'Responds to what they said and adds energy.',
      'An open question tied to their message keeps it flowing.',
      'Moves the conversation forward with confidence.',
    ];
    options = v.map((t, i) => ({ label: labels[i], text: t, rationale: rationales[i], uses: topic && i < 2 ? `Uses: ${topic}` : '' }));
    if (req.task === 'voice') {
      summary = lastThem.length > 90 ? lastThem.slice(0, 88).trim() + '…' : lastThem || 'A short voice note.';
      tone = /!|excited|amazing|can't wait/i.test(lastThem) ? 'excited, upbeat' : /sorry|tired|stress/i.test(lastThem) ? 'a bit tired, apologetic' : 'relaxed, friendly';
    }
    next = asked ? 'Answer their question, then ask one back.' : topic ? `Ask one more question about ${topic}, then suggest meeting.` : 'Keep it light and ask an open question.';
  }

  // Regenerate: rotate so the user sees a different order and wording.
  if (req.avoid?.length) {
    options = options.map((o) => ({ ...o, text: o.text.replace(/^(Okay|Wait|Right|Ha),?\s*/i, '') }));
    options.push(options.shift()!);
  }

  options = options.map((o) => ({ ...o, text: applyStyle(o.text, req.style?.traits) }));

  return {
    detected_context: professional ? 'work' : req.mode,
    transcript,
    summary,
    tone,
    subject,
    decode,
    uncertainty_notes: req.image ? ['Demo mode: this is a sample reading of your screenshot. Connect an AI key for real OCR.'] : [],
    options,
    next_step: next,
    interest: req.task === 'polish' || req.task === 'email' || professional ? null : withFlags(interestReading(transcript), flags.length),
    red_flags: flags,
    source: 'demo',
  };
}

function withFlags(i: AssistResult['interest'], n: number): AssistResult['interest'] {
  if (!i || n === 0) return i;
  return { score: Math.max(5, i.score - 25 * n), reading: 'Engagement is high, but the red flags matter more than the score.', advice: 'Slow down - keep it on the app and never send money.' };
}

function sampleTranscript(): TranscriptLine[] {
  return [
    { speaker: 'them', text: 'Okay be honest, is pineapple on pizza a dealbreaker?' },
    { speaker: 'me', text: 'Depends who is asking 👀' },
    { speaker: 'them', text: 'Someone who just got back from 2 weeks in Lisbon and ate nothing but pastéis de nata' },
  ];
}

// "Sound Like Me": derive editable style traits from the user's own messages.
export function analyseStyle(samples: string[]): StyleTraits {
  const s = samples.filter((x) => x.trim());
  if (s.length === 0) return { emoji: 1, length: 'medium', lowercase: false, slang: false, punctuation: 'normal' };
  const joined = s.join(' ');
  const emojiPer = (joined.match(EMOJI_RE) ?? []).length / s.length;
  const avg = joined.length / s.length;
  const letters = joined.replace(/[^a-zA-Z]/g, '');
  const upper = joined.match(/(^|[.!?]\s+)[A-Z]/g)?.length ?? 0;
  const lowercase = letters.length > 0 && upper / s.length < 0.3;
  const slang = /\b(lol|lmao|tbh|ngl|omg|u|ur|gonna|wanna|innit|bruh|fr|idk|rn)\b/i.test(joined);
  const excl = (joined.match(/[!?]{1,}/g) ?? []).length / s.length;
  const endsBare = s.filter((x) => !/[.!?]$/.test(x.trim())).length / s.length;
  return {
    emoji: emojiPer >= 1 ? 2 : emojiPer > 0.2 ? 1 : 0,
    length: avg < 35 ? 'short' : avg < 90 ? 'medium' : 'long',
    lowercase,
    slang,
    punctuation: excl > 0.8 ? 'expressive' : endsBare > 0.6 ? 'minimal' : 'normal',
  };
}
