import { useEffect } from 'react';
import { KEYS, loadStr } from './store';

export type VoiceModelId = 'speaker1' | 'simple' | 'classic' | 'helper1';

export interface VoiceModel {
  id: VoiceModelId;
  name: string;
  sample: string;
  pitch: number;
  rate: number;
  male: boolean;
}

// Must match the Models page of the vanilla app.
export const VOICE_MODELS: VoiceModel[] = [
  {
    id: 'speaker1',
    name: 'speaker 1.0',
    sample: "Hey, I'm Foxit — speaker 1.0 is online!",
    pitch: 0.85,
    rate: 1.0,
    male: true,
  },
  {
    id: 'simple',
    name: 'simple',
    sample: 'Hi. I am Foxit. Let us walk. Nice and easy.',
    pitch: 1.1,
    rate: 0.7,
    male: true,
  },
  {
    id: 'classic',
    name: 'classic',
    sample: "Hey there! I'm Foxit, ready when you are.",
    pitch: 1.0,
    rate: 1.0,
    male: false,
  },
  {
    id: 'helper1',
    name: 'helper 1.0',
    sample: "I'll add a small hint next to every button, so you always know what it does.",
    pitch: 0.9,
    rate: 0.95,
    male: true,
  },
];

export function activeVoiceModel(): VoiceModelId {
  const id = loadStr(KEYS.voiceModel, 'speaker1');
  return (VOICE_MODELS.some((m) => m.id === id) ? id : 'speaker1') as VoiceModelId;
}

export function modelById(id: VoiceModelId): VoiceModel {
  return VOICE_MODELS.find((m) => m.id === id) ?? VOICE_MODELS[0];
}

function pickVoice(m: VoiceModel): SpeechSynthesisVoice | null {
  try {
    const vs = speechSynthesis.getVoices();
    const en = vs.filter((v) => /^en/i.test(v.lang));
    const pool = en.length ? en : vs;
    if (!pool.length) return null;
    if (m.male) {
      return (
        pool.find((v) => /male|david|daniel|alex|fred/i.test(v.name)) ?? pool[0]
      );
    }
    return pool[0];
  } catch {
    return null;
  }
}

export function speakText(text: string, model: VoiceModel): void {
  try {
    if (!('speechSynthesis' in window)) return;
    const s = text.trim();
    if (!s) return;
    if (speechSynthesis.speaking) speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(s);
    const v = pickVoice(model);
    if (v) u.voice = v;
    u.pitch = model.pitch;
    u.rate = model.rate;
    speechSynthesis.speak(u);
  } catch {
    /* speech unavailable */
  }
}

export function stopVoice(): void {
  try {
    speechSynthesis.cancel();
  } catch {
    /* ignore */
  }
}

/**
 * Foxit auto-greets on page load ONLY when speaker 1.0 is the active
 * model. Any other model (or no speech support) stays silent.
 * Pass the bubble text; it is spoken ~400ms after voices load.
 */
export function useAutoGreet(text: string): void {
  useEffect(() => {
    if (!('speechSynthesis' in window)) return;
    if (activeVoiceModel() !== 'speaker1') return;
    const model = modelById('speaker1');
    let done = false;
    let t1 = 0;
    let t2 = 0;
    const say = () => {
      if (done) return;
      done = true;
      window.setTimeout(() => speakText(text, model), 400);
    };
    try {
      speechSynthesis.getVoices();
      if ('onvoiceschanged' in speechSynthesis) {
        (speechSynthesis as SpeechSynthesis).onvoiceschanged = say;
      }
      t1 = window.setTimeout(say, 1500);
      // warm up voices in some browsers
      t2 = window.setTimeout(() => {
        try {
          speechSynthesis.getVoices();
        } catch {
          /* ignore */
        }
      }, 100);
    } catch {
      /* ignore */
    }
    const onHide = () => stopVoice();
    window.addEventListener('pagehide', onHide);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.removeEventListener('pagehide', onHide);
      stopVoice();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
