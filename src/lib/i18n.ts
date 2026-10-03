import { useSyncExternalStore } from 'react';
import { loadStr, saveStr } from './store';
import { EN } from '../locales/en';
import { RO } from '../locales/ro';

export interface Language {
  code: string;
  name: string;
  native: string;
  complete: boolean;
}

// Full list shown in Settings (searchable). Only `complete` ones have
// full translations; the rest fall back to English until added.
export const LANGUAGES: Language[] = [
  { code: 'en', name: 'English', native: 'English', complete: true },
  { code: 'ro', name: 'Romanian', native: 'Română', complete: true },
  { code: 'es', name: 'Spanish', native: 'Español', complete: false },
  { code: 'fr', name: 'French', native: 'Français', complete: false },
  { code: 'de', name: 'German', native: 'Deutsch', complete: false },
  { code: 'it', name: 'Italian', native: 'Italiano', complete: false },
  { code: 'pt', name: 'Portuguese', native: 'Português', complete: false },
  { code: 'nl', name: 'Dutch', native: 'Nederlands', complete: false },
  { code: 'pl', name: 'Polish', native: 'Polski', complete: false },
  { code: 'uk', name: 'Ukrainian', native: 'Українська', complete: false },
  { code: 'ru', name: 'Russian', native: 'Русский', complete: false },
  { code: 'tr', name: 'Turkish', native: 'Türkçe', complete: false },
  { code: 'hu', name: 'Hungarian', native: 'Magyar', complete: false },
  { code: 'cs', name: 'Czech', native: 'Čeština', complete: false },
  { code: 'sk', name: 'Slovak', native: 'Slovenčina', complete: false },
  { code: 'bg', name: 'Bulgarian', native: 'Български', complete: false },
  { code: 'hr', name: 'Croatian', native: 'Hrvatski', complete: false },
  { code: 'sr', name: 'Serbian', native: 'Српски', complete: false },
  { code: 'sl', name: 'Slovenian', native: 'Slovenščina', complete: false },
  { code: 'el', name: 'Greek', native: 'Ελληνικά', complete: false },
  { code: 'sv', name: 'Swedish', native: 'Svenska', complete: false },
  { code: 'no', name: 'Norwegian', native: 'Norsk', complete: false },
  { code: 'da', name: 'Danish', native: 'Dansk', complete: false },
  { code: 'fi', name: 'Finnish', native: 'Suomi', complete: false },
  { code: 'id', name: 'Indonesian', native: 'Bahasa Indonesia', complete: false },
  { code: 'ms', name: 'Malay', native: 'Bahasa Melayu', complete: false },
  { code: 'vi', name: 'Vietnamese', native: 'Tiếng Việt', complete: false },
  { code: 'th', name: 'Thai', native: 'ไทย', complete: false },
  { code: 'he', name: 'Hebrew', native: 'עברית', complete: false },
  { code: 'fa', name: 'Persian', native: 'فارسی', complete: false },
  { code: 'ur', name: 'Urdu', native: 'اردو', complete: false },
  { code: 'bn', name: 'Bengali', native: 'বাংলা', complete: false },
  { code: 'ta', name: 'Tamil', native: 'தமிழ்', complete: false },
  { code: 'sw', name: 'Swahili', native: 'Kiswahili', complete: false },
  { code: 'ar', name: 'Arabic', native: 'العربية', complete: false },
  { code: 'hi', name: 'Hindi', native: 'हिन्दी', complete: false },
  { code: 'zh', name: 'Chinese', native: '中文', complete: false },
  { code: 'ja', name: 'Japanese', native: '日本語', complete: false },
  { code: 'ko', name: 'Korean', native: '한국어', complete: false },
];

const DICTS: Record<string, Record<string, string>> = { en: EN, ro: RO };

function initialLang(): string {
  try {
    const saved = loadStr('foxit_lang', 'en');
    if (DICTS[saved]) return saved;
  } catch {
    /* ignore */
  }
  return 'en';
}

let lang = initialLang();
let version = 0;
const listeners = new Set<() => void>();

function subscribe(fn: () => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

function getVersion(): number {
  return version;
}

export function getLangCode(): string {
  return lang;
}

export function setLang(code: string): void {
  if (!DICTS[code]) return;
  lang = code;
  try {
    saveStr('foxit_lang', code);
  } catch {
    /* ignore */
  }
  version++;
  listeners.forEach((l) => l());
}

/** Translate a key. Falls back to English, then to the key itself. */
export function t(key: string): string {
  return DICTS[lang]?.[key] ?? EN[key] ?? key;
}

/** Translate with {placeholders}. */
export function tv(key: string, vars: Record<string, string | number>): string {
  let s = t(key);
  for (const [k, v] of Object.entries(vars)) {
    s = s.split(`{${k}}`).join(String(v));
  }
  return s;
}

/** Subscribe a component to language changes. Call it in every
 *  component that renders translated text so it re-renders on switch. */
export function useLang(): { lang: string; t: (key: string) => string } {
  useSyncExternalStore(subscribe, getVersion);
  return { lang, t: (key: string) => t(key) };
}
