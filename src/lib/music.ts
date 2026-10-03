import { KEYS, loadStr, saveStr } from './store';

// Slight generative background music, 100% synthesized with Web Audio.
// No audio files, nothing downloaded, runs fully on-device.

const CHORDS: number[][] = [
  [174.61, 220.0, 261.63],
  [146.83, 174.61, 220.0],
  [130.81, 164.81, 196.0],
  [164.81, 196.0, 246.94],
];

const PENTA: number[] = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5];

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let schedTimer = 0;
let nextPad = 0;
let nextPluck = 0;
let chordStep = 0;

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

function pad(freqs: number[], t: number): void {
  if (!ctx || !master) return;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(0.05, t + 2.5);
  g.gain.linearRampToValueAtTime(0, t + 8);
  const f = ctx.createBiquadFilter();
  f.type = 'lowpass';
  f.frequency.value = 750;
  g.connect(f);
  f.connect(master);
  freqs.forEach((fr) => {
    if (!ctx) return;
    const o = ctx.createOscillator();
    o.type = 'triangle';
    o.frequency.value = fr;
    o.connect(g);
    o.start(t);
    o.stop(t + 8.5);
  });
}

function pluck(fr: number, t: number): void {
  if (!ctx || !master) return;
  const o = ctx.createOscillator();
  o.type = 'sine';
  o.frequency.value = fr;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.09, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 2.2);
  o.connect(g);
  g.connect(master);
  o.start(t);
  o.stop(t + 2.4);
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
  nextPad = ctx.currentTime + 0.3;
  nextPluck = ctx.currentTime + 1.5;
  schedTimer = window.setInterval(() => {
    if (!ctx || !musicEnabled()) return;
    const ahead = ctx.currentTime + 1.2;
    if (nextPad <= ahead) {
      pad(CHORDS[chordStep % CHORDS.length], nextPad);
      chordStep++;
      nextPad += 8;
    }
    if (nextPluck <= ahead) {
      if (Math.random() < 0.75) {
        pluck(PENTA[Math.floor(Math.random() * PENTA.length)], nextPluck);
      }
      nextPluck += 2 + Math.random() * 2.5;
    }
  }, 500);
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
