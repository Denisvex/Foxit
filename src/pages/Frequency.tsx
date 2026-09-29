import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { KEYS, loadStr, saveStr } from '../lib/store';
import { useHelperHints } from '../lib/helper';
import { useAutoGreet } from '../lib/voice';
import { useToast } from '../lib/ui';

const GREET = 'Hmm, let me think with you... 🦊';
const DEFAULT_BUBBLE = 'Hmm, let me think with you... 🦊';
const TEXTS: Record<string, string> = {
  '1': 'Chill start — <b>1 run</b> a day. Quality over quantity!',
  '2': 'Perfect balance — <b>morning & afternoon</b>!',
  '3': 'Beast mode — <b>3 runs</b> every day!',
};
const OPTIONS = [
  { v: '1', top: 'once', bottom: 'a day' },
  { v: '2', top: 'morning', bottom: '& afternoon' },
  { v: '3', top: 'morning', bottom: 'noon & night' },
];

function initialSelection(): string | null {
  const s = loadStr(KEYS.runsPerDay, '');
  return s === '1' || s === '2' || s === '3' ? s : null;
}

// Port of frequency.html: runs per day (1–3). Restores the saved value,
// requires a pick, stores foxit_runs_per_day, then /schedule.
export default function Frequency() {
  const navigate = useNavigate();
  useAutoGreet(GREET);
  useHelperHints();
  const { toast, toastEl } = useToast();
  const [selected, setSelected] = useState<string | null>(initialSelection);
  const [bubble, setBubble] = useState(() => {
    const s = initialSelection();
    return (s && TEXTS[s]) || DEFAULT_BUBBLE;
  });
  const timer = useRef(0);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const select = (v: string) => {
    setSelected(v);
    setBubble(TEXTS[v] || DEFAULT_BUBBLE);
  };

  const submit = () => {
    if (!selected) {
      setBubble('Pick <b>1, 2 or 3</b> to keep going! 👆');
      toast('Pick 1, 2 or 3 to keep going!');
      return;
    }
    saveStr(KEYS.runsPerDay, selected);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => navigate('/schedule'), 600);
  };

  return (
    <div className="fox-stage flex items-center justify-center">
      <style>{`@keyframes fox-think{0%,100%{transform:rotate(0) translateY(0)}50%{transform:rotate(-1.5deg) translateY(-6px)}}`}</style>
      <div className="w-full max-w-[380px] text-center">
        <div
          className="mb-3.5 rounded-2xl border border-[#222] bg-[#111] px-4 py-3.5 text-[15px] leading-snug [&_b]:text-[#FF6B35]"
          dangerouslySetInnerHTML={{ __html: bubble }}
        />
        <div className="mx-auto aspect-square w-[min(68vw,260px)] animate-[fox-think_2.4s_ease-in-out_infinite]">
          <img
            src="./foxit-thinking.png"
            alt="Foxit thinking"
            className="block h-full w-full object-contain drop-shadow-[0_8px_32px_rgba(255,107,53,0.35)]"
          />
        </div>
        <h1 className="mt-3 text-2xl font-semibold leading-[1.3] tracking-[-0.02em]">
          How many times do you
          <br />
          want to run every day?
        </h1>
        <p className="fox-hint mt-1.5 text-sm">
          Pick 1 to 3 — you can change it later
        </p>

        <div className="mt-5 flex justify-center gap-2.5">
          {OPTIONS.map((o) => {
            const active = selected === o.v;
            return (
              <button
                key={o.v}
                onClick={() => select(o.v)}
                className={`flex-1 rounded-[20px] border-2 px-2 pb-3.5 pt-[18px] ${
                  active
                    ? 'border-[#FF6B35] bg-[#1a120e] shadow-[0_8px_32px_rgba(255,107,53,0.25)]'
                    : 'border-[#222] bg-[#111]'
                }`}
              >
                <div
                  className={`text-4xl font-extrabold leading-none ${active ? 'text-[#FF6B35]' : 'text-white'}`}
                >
                  {o.v}
                </div>
                <div
                  className={`mt-1.5 text-[13px] font-semibold ${active ? 'text-white' : 'text-[#999]'}`}
                >
                  {o.top}
                  <br />
                  {o.bottom}
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-6 flex justify-center">
          <button
            id="continue"
            onClick={submit}
            className="fox-btn-orange flex h-[62px] w-[270px] items-center justify-center gap-2.5 rounded-full text-lg tracking-[0.02em]"
          >
            continue <span aria-hidden="true">→</span>
          </button>
        </div>
        <button
          onClick={() => navigate('/goal')}
          className="mx-auto mt-3.5 block text-[13px] text-[#666]"
        >
          ← back
        </button>
      </div>
      {toastEl}
    </div>
  );
}
