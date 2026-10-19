// On-device redaction of personal data before anything is uploaded.
const PATTERNS: { kind: string; re: RegExp; mask: string }[] = [
  { kind: 'email', re: /[\w.+-]+@[\w-]+\.[\w.-]+/g, mask: '[email]' },
  { kind: 'phone', re: /(?:\+?\d[\d\s().-]{7,}\d)/g, mask: '[phone]' },
  { kind: 'card', re: /\b(?:\d[ -]?){13,19}\b/g, mask: '[card]' },
  { kind: 'postcode', re: /\b[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}\b/g, mask: '[postcode]' },
  { kind: 'address', re: /\b\d{1,4}\s+[A-Z][a-z]+(?:\s[A-Z][a-z]+)*\s(?:Street|St|Road|Rd|Avenue|Ave|Lane|Ln|Drive|Dr|Close|Way)\b/g, mask: '[address]' },
];

export function redact(text: string): { text: string; found: Record<string, number> } {
  const found: Record<string, number> = {};
  let out = text;
  for (const p of PATTERNS) {
    out = out.replace(p.re, () => {
      found[p.kind] = (found[p.kind] ?? 0) + 1;
      return p.mask;
    });
  }
  return { text: out, found };
}

export function redactionSummary(found: Record<string, number>): string {
  const parts = Object.entries(found).map(([k, n]) => `${n} ${k}${n > 1 ? 's' : ''}`);
  return parts.length ? `Hidden before sending: ${parts.join(', ')}` : '';
}
