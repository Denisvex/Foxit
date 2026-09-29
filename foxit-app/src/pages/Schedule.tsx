import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { KEYS, load, loadStr, save, saveStr } from '../lib/store';
import { useHelperHints } from '../lib/helper';
import { useAutoGreet } from '../lib/voice';

type AmPm = 'AM' | 'PM';

interface RunTime {
  h: number;
  m: number;
  ampm: AmPm;
}

// Legacy key the vanilla app also reads from.
const LEGACY_WALK_TIMES = 'foxit_walk_times';

const NAMES: Record<number, string[]> = {
  1: ['Your run'],
  2: ['Morning run', 'Afternoon run'],
  3: ['Morning run', 'Midday run', 'Evening run'],
};

const DEFAULTS: Record<number, RunTime[]> = {
  1: [{ h: 8, m: 0, ampm: 'AM' }],
  2: [
    { h: 7, m: 0, ampm: 'AM' },
    { h: 5, m: 0, ampm: 'PM' },
  ],
  3: [
    { h: 7, m: 0, ampm: 'AM' },
    { h: 12, m: 0, ampm: 'PM' },
    { h: 6, m: 0, ampm: 'PM' },
  ],
};

const FALLBACK_RUN: RunTime = { h: 8, m: 0, ampm: 'AM' };

const GREET = 'Type your run times — hour : minutes + A.M / P.M 🦊';
const INITIAL_BUBBLE =
  'Type your run times — <b>hour : minutes</b> + A.M / P.M 🦊';

function parseCount(raw: string): number {
  const n = parseInt(raw, 10);
  return n >= 1 && n <= 3 ? n : 2;
}

function loadRuns(): RunTime[] | null {
  for (const key of [KEYS.runTimes, LEGACY_WALK_TIMES]) {
    const a = load<unknown>(key, null);
    if (Array.isArray(a) && a.length) {
      return a.slice(0, 3).map((w) => {
        const o = w as { h?: unknown; m?: unknown; ampm?: unknown };
        return {
          h: typeof o.h === 'number' ? o.h : 8,
          m: typeof o.m === 'number' ? o.m : 0,
          ampm: (o.ampm === 'PM' ? 'PM' : 'AM') as AmPm,
        };
      });
    }
  }
  return null;
}

function initialRuns(count: number): RunTime[] {
  const base = loadRuns() ?? DEFAULTS[count]?.map((w) => ({ ...w })) ?? [];
  const out = [...base];
  while (out.length < count) {
    out.push({ ...(DEFAULTS[count]?.[out.length] ?? FALLBACK_RUN) });
  }
  return out.slice(0, count);
}

function fmt(w: RunTime): string {
  return `${String(w.h).padStart(2, '0')}:${String(w.m).padStart(2, '0')}`;
}

function clampH(v: number): number | null {
  if (Number.isNaN(v)) return null;
  if (v < 1) return 1;
  if (v > 12) return 12;
  return Math.trunc(v);
}

function clampM(v: number): number | null {
  if (Number.isNaN(v)) return null;
  if (v < 0) return 0;
  if (v > 59) return 59;
  return Math.trunc(v);
}

// Port of schedule.html: per-run alarm times (hour : minutes + AM/PM)
// plus a stepper that also edits foxit_runs_per_day. Persists
// foxit_run_times (JSON) on every change, then /username.
export default function Schedule() {
  const navigate = useNavigate();
  useAutoGreet(GREET);
  const [count, setCount] = useState<number>(() =>
    parseCount(loadStr(KEYS.runsPerDay, '2')),
  );
  const [runs, setRuns] = useState<RunTime[]>(() =>
    initialRuns(parseCount(loadStr(KEYS.runsPerDay, '2'))),
  );
  const [bubble, setBubble] = useState(INITIAL_BUBBLE);
  const [lit, setLit] = useState<number[]>([0]);
  const timer = useRef(0);
  useHelperHints([count, runs]);

  // Mirror the original: normalize + persist once on load, clear the
  // continue timer on unmount (StrictMode-safe).
  useEffect(() => {
    save(KEYS.runTimes, runs);
    saveStr(KEYS.runsPerDay, String(count));
    return () => window.clearTimeout(timer.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const persist = (c: number, r: RunTime[]) => {
    save(KEYS.runTimes, r);
    saveStr(KEYS.runsPerDay, String(c));
  };

  const markLit = (i: number) =>
    setLit((s) => (s.includes(i) ? s : [...s, i]));

  const runName = (i: number) => NAMES[count]?.[i] ?? `Run ${i + 1}`;

  const dec = () => {
    if (count <= 1) return;
    const c = count - 1;
    const r = runs.slice(0, c);
    setCount(c);
    setRuns(r);
    persist(c, r);
  };

  const inc = () => {
    if (count >= 3) return;
    const c = count + 1;
    const r = [...runs];
    while (r.length < c) {
      r.push({ ...(DEFAULTS[c]?.[r.length] ?? FALLBACK_RUN) });
    }
    setCount(c);
    setRuns(r);
    persist(c, r);
  };

  const commitTime = (i: number, k: 'h' | 'm', el: HTMLInputElement) => {
    const cur = runs[i];
    if (!cur) return;
    const parsed = parseInt(el.value, 10);
    const v = k === 'h' ? clampH(parsed) : clampM(parsed);
    if (v === null) {
      el.value = String(cur[k]).padStart(2, '0');
      return;
    }
    const next = runs.map((w, j) => (j === i ? { ...w, [k]: v } : w));
    const w = next[i] ?? cur;
    setRuns(next);
    persist(count, next);
    el.value = String(v).padStart(2, '0');
    setBubble(`<b>${runName(i)}</b> → <b>${fmt(w)} ${w.ampm}</b> ✓`);
    markLit(i);
  };

  const setAmpm = (i: number, a: AmPm) => {
    const next = runs.map((w, j) => (j === i ? { ...w, ampm: a } : w));
    const w = next[i];
    if (!w) return;
    setRuns(next);
    persist(count, next);
    setBubble(`<b>${runName(i)}</b> → <b>${fmt(w)} ${w.ampm}</b> ✓`);
    markLit(i);
  };

  const submit = () => {
    persist(count, runs);
    setBubble(
      `Locked: <b>${runs.map((w) => `${fmt(w)} ${w.ampm}`).join(' · ')}</b> — let's run!`,
    );
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => navigate('/username'), 600);
  };

  return (
    <div className="fox-stage flex items-center justify-center">
      <div className="w-full max-w-[380px] py-[18px] text-center">
        <div
          className="mb-3 rounded-2xl border border-[#222] bg-[#111] px-3.5 py-3 text-sm leading-snug [&_b]:text-[#FF6B35]"
          dangerouslySetInnerHTML={{ __html: bubble }}
        />
        <div className="mx-auto aspect-square w-[min(52vw,160px)]">
          <img
            src="./foxit-alarmtime.png"
            alt="Foxit with alarm"
            className="block h-full w-full object-contain drop-shadow-[0_8px_32px_rgba(255,107,53,0.35)]"
          />
        </div>
        <h1 className="mt-2.5 text-[22px] font-semibold leading-[1.25] tracking-[-0.02em]">
          What time
          <br />
          are your runs?
        </h1>
        <p className="fox-hint mt-[5px] text-[13px]">
          Type the time for each run
        </p>

        <div className="mt-2.5 flex items-center justify-center gap-2 text-[13px] text-[#999]">
          <span>runs per day</span>
          <div className="flex items-center gap-[7px] rounded-full border border-[#222] bg-[#111] px-[5px] py-[3px]">
            <button
              id="minus"
              onClick={dec}
              className="h-[26px] w-[26px] rounded-full bg-[#222] text-[15px] font-extrabold text-white active:bg-[#FF6B35] active:text-black"
            >
              −
            </button>
            <b id="countLabel" className="min-w-4 text-sm font-bold text-white">
              {count}
            </b>
            <button
              id="plus"
              onClick={inc}
              className="h-[26px] w-[26px] rounded-full bg-[#222] text-[15px] font-extrabold text-white active:bg-[#FF6B35] active:text-black"
            >
              +
            </button>
          </div>
        </div>

        <div>
          {runs.map((w, i) => (
            <div
              key={`${count}-${i}`}
              className={`mt-[11px] flex items-center gap-2.5 rounded-[18px] border bg-[#111] p-[13px] text-left ${
                lit.includes(i)
                  ? 'border-[#FF6B35] shadow-[0_8px_32px_rgba(255,107,53,0.2)]'
                  : 'border-[#222]'
              }`}
            >
              <div className="min-w-0 flex-1">
                <div className="text-xs font-extrabold uppercase tracking-[0.08em] text-[#FF6B35]">
                  {runName(i)}
                </div>
                <div className="mt-[7px] flex items-center gap-1.5">
                  <input
                    aria-label="hour"
                    inputMode="numeric"
                    maxLength={2}
                    placeholder="07"
                    defaultValue={String(w.h).padStart(2, '0')}
                    key={`h-${count}-${i}-${w.ampm}`}
                    onBlur={(e) => commitTime(i, 'h', e.currentTarget)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') e.currentTarget.blur();
                    }}
                    onFocus={(e) => e.currentTarget.select()}
                    className="w-[68px] rounded-[11px] border border-[#222] bg-[#0a0a0a] px-[5px] py-[7px] text-center text-2xl font-extrabold tracking-[-0.02em] text-white outline-none focus:border-[#FF6B35]"
                  />
                  <span className="text-2xl font-extrabold text-[#666]">
                    :
                  </span>
                  <input
                    aria-label="minutes"
                    inputMode="numeric"
                    maxLength={2}
                    placeholder="00"
                    defaultValue={String(w.m).padStart(2, '0')}
                    key={`m-${count}-${i}-${w.ampm}`}
                    onBlur={(e) => commitTime(i, 'm', e.currentTarget)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') e.currentTarget.blur();
                    }}
                    onFocus={(e) => e.currentTarget.select()}
                    className="w-[68px] rounded-[11px] border border-[#222] bg-[#0a0a0a] px-[5px] py-[7px] text-center text-2xl font-extrabold tracking-[-0.02em] text-white outline-none focus:border-[#FF6B35]"
                  />
                  <div className="ml-1 flex flex-row gap-1.5">
                    {(['AM', 'PM'] as AmPm[]).map((a) => (
                      <button
                        key={a}
                        onClick={() => setAmpm(i, a)}
                        className={`rounded-full border px-[11px] py-[7px] text-xs font-extrabold ${
                          w.ampm === a
                            ? 'border-[#FF6B35] bg-[#FF6B35] text-black'
                            : 'border-[#222] bg-[#0a0a0a] text-[#999]'
                        }`}
                      >
                        {a === 'AM' ? 'A.M.' : 'P.M.'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-[18px] flex justify-center">
          <button
            id="continue"
            onClick={submit}
            className="fox-btn-orange flex h-[60px] w-[270px] items-center justify-center gap-2.5 rounded-full text-lg tracking-[0.02em]"
          >
            continue <span aria-hidden="true">→</span>
          </button>
        </div>
        <button
          onClick={() => navigate('/frequency')}
          className="mx-auto mt-3 block text-[13px] text-[#666]"
        >
          ← back
        </button>
      </div>
    </div>
  );
}
