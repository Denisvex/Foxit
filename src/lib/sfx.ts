import { audioContext } from './music';

// Tiny tactile click sounds, synthesized with Web Audio. No files.
// Always on. Different actions get different clicks: primary actions
// pop, navigation ticks, closes thunk.
export type SfxKind = 'tap' | 'confirm' | 'nav' | 'toggle' | 'close' | 'success';

function blip(
  ctx: AudioContext,
  freq: number,
  delay: number,
  dur: number,
  vol: number,
  type: OscillatorType,
): void {
  const t = ctx.currentTime + delay;
  const o = ctx.createOscillator();
  o.type = type;
  o.frequency.value = freq;
  const g = ctx.createGain();
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g);
  g.connect(ctx.destination);
  o.start(t);
  o.stop(t + dur + 0.02);
}

export function playSfx(kind: SfxKind): void {
  const ctx = audioContext();
  if (!ctx) return;
  try {
    if (ctx.state === 'suspended') void ctx.resume();
    switch (kind) {
      case 'confirm':
        blip(ctx, 660, 0, 0.07, 0.05, 'triangle');
        blip(ctx, 880, 0.07, 0.09, 0.05, 'triangle');
        break;
      case 'nav':
        blip(ctx, 520, 0, 0.05, 0.04, 'triangle');
        break;
      case 'toggle':
        blip(ctx, 800, 0, 0.04, 0.04, 'triangle');
        break;
      case 'close':
        blip(ctx, 320, 0, 0.07, 0.045, 'sine');
        break;
      case 'success':
        blip(ctx, 523, 0, 0.09, 0.05, 'triangle');
        blip(ctx, 659, 0.09, 0.09, 0.05, 'triangle');
        blip(ctx, 784, 0.18, 0.14, 0.05, 'triangle');
        break;
      case 'tap':
      default:
        blip(ctx, 1200, 0, 0.05, 0.035, 'sine');
        break;
    }
  } catch {
    /* ignore */
  }
}

const CONFIRM_IDS = new Set([
  'runBtn',
  'customGo',
  'goBtn',
  'noHitGo',
  'startBtn',
  'goalSave',
  'setNameSave',
  'spotSave',
]);

let inited = false;

/** One global tap listener: every button/link clicks, each kind its own sound. */
export function initSfx(): void {
  if (inited) return;
  inited = true;
  document.addEventListener('pointerdown', (e) => {
    try {
      const t = e.target instanceof Element ? e.target.closest('button,a') : null;
      if (!t || t.hasAttribute('disabled')) return;
      const explicit = t.getAttribute('data-sfx');
      if (explicit === 'tap' || explicit === 'confirm' || explicit === 'nav' || explicit === 'toggle' || explicit === 'close' || explicit === 'success') {
        playSfx(explicit);
        return;
      }
      if (t.id && CONFIRM_IDS.has(t.id)) {
        playSfx('confirm');
        return;
      }
      if (t.classList.contains('fox-btn-primary') || t.classList.contains('fox-btn-orange')) {
        playSfx('confirm');
        return;
      }
      if (t.closest('nav') || t.id === 'workoutsBtn' || t.id === 'modelsBtn' || t.id === 'homeBtn') {
        playSfx('nav');
        return;
      }
      if (/cancel|close|stop/i.test(`${t.id} ${t.getAttribute('aria-label') || ''}`)) {
        playSfx('close');
        return;
      }
      const label = (t.textContent || '').slice(0, 24).toLowerCase();
      if (/cancel|close|stop|×/.test(label) && label.length < 12) {
        playSfx('close');
        return;
      }
      playSfx('tap');
    } catch {
      /* ignore */
    }
  });
}
