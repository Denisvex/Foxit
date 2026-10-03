import { KEYS, loadStr, saveStr } from './store';

// Playful generative background music, 100% synthesized with Web Audio.
// No audio files, nothing downloaded, runs fully on-device.
// Bouncy I-V-vi-IV groove in C: bass pulse, bright chord stabs,
// and a cheerful random-walk melody on top.

const STEP = 0.21; // ~143bpm eighth notes
const BAR = 16; // steps per bar

// one chord per bar: C, G, Am, F (root + third + fifth)
const BARS: number[][] = [
  [261.63, 329.63, 392.0],
  [196.0, 246.94, 293.66],
  [220.0, 261.63, 329.63],
  [174.61, 220.0, 261.63],
];

const MELODY: number[] = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5];

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let schedTimer = 0;
let nextStep = 0;
let stepIdx = 0;
let melIdx = 2;

export function audioContext(): AudioContext | null {
  ensure();
  return ctx;
}

export function musicEnabled(): boolean {
  try {
    return loadStr(KEYS.music, '1') === '1';
  } catch {
    return true;
  }
}

export function setMusicEnabled(on: boolean): void {
  try {
    saveStr(KEYS.music, on ? '1' : '0');
  } catch {
    /* ignore */
  }
  if (on) startMusic();
  else stopMusic();
}

function ensure(): boolean {
  try {
    if (!ctx) {
      const AC =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return false;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0;
      master.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') void ctx.resume();
    return true;
  } catch {
    return false;
  }
}

function tone(
  freq: number,
  t: number,
  dur: number,
  vol: number,
  type: OscillatorType,
  cutoff: number,
): void {
  if (!ctx || !master) return;
  const o = ctx.createOscillator();
  o.type = type;
  o.frequency.value = freq;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(vol, t + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  const f = ctx.createBiquadFilter();
  f.type = 'lowpass';
  f.frequency.value = cutoff;
  o.connect(g);
  g.connect(f);
  f.connect(master);
  o.start(t);
  o.stop(t + dur + 0.05);
}

export function startMusic(): void {
  if (schedTimer || !musicEnabled()) return;
  if (!ensure() || !ctx || !master) return;
  try {
    master.gain.cancelScheduledValues(ctx.currentTime);
    master.gain.setTargetAtTime(0.5, ctx.currentTime, 1.5);
  } catch {
    /* ignore */
  }
  nextStep = ctx.currentTime + 0.2;
  stepIdx = 0;
  melIdx = 2;
  schedTimer = window.setInterval(() => {
    if (!ctx || !musicEnabled()) return;
    const ahead = ctx.currentTime + 0.8;
    while (nextStep <= ahead) {
      const bar = Math.floor(stepIdx / BAR) % BARS.length;
      const s = stepIdx % BAR;
      const chord = BARS[bar];
      // bouncy bass: root on quarters, fifth pop at the turnaround
      if (s % 4 === 0) tone(chord[0] / 2, nextStep, 0.32, 0.075, 'triangle', 900);
      if (s === 14) tone(chord[2] / 2, nextStep, 0.25, 0.06, 'triangle', 900);
      // bright chord stabs on the back half
      if (s === 4 || s === 12) {
        chord.forEach((fr) => tone(fr, nextStep, 1.1, 0.028, 'triangle', 2200));
      }
      // cheerful melody: random walk, plays most eighths, skips some for bounce
      if (s % 2 === 0 && Math.random() < 0.8) {
        melIdx += Math.floor(Math.random() * 5) - 2;
        melIdx = Math.max(0, Math.min(MELODY.length - 1, melIdx));
        tone(MELODY[melIdx], nextStep, 0.32, 0.055, 'sine', 4000);
        // playful hiccup: occasional quick 16th echo a third up
        if (Math.random() < 0.25 && melIdx + 1 < MELODY.length) {
          tone(MELODY[melIdx + 1], nextStep + STEP / 2, 0.22, 0.035, 'sine', 4000);
        }
      }
      nextStep += STEP;
      stepIdx++;
    }
  }, 250);
}

export function stopMusic(): void {
  window.clearInterval(schedTimer);
  schedTimer = 0;
  try {
    if (ctx && master) master.gain.setTargetAtTime(0, ctx.currentTime, 0.4);
  } catch {
    /* ignore */
  }
}
