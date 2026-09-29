import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { KEYS, loadStr, saveStr } from '../lib/store';
import { useHelperHints } from '../lib/helper';
import { useAutoGreet } from '../lib/voice';
import { useToast } from '../lib/ui';

const GREET = 'Ready to run with Foxit? Set your pace.';
const INITIAL_BUBBLE = 'Ready to run with <b>Foxit</b>? Set your pace.';
const CHIPS = [
  { v: '1000', label: '1000m' },
  { v: '2000', label: '2000m' },
  { v: '5000', label: '5000m' },
  { v: '10000', label: '10km' },
];

// Port of goal.html: daily running goal in meters. Restores the saved
// goal, validates 100–50000, stores foxit_goal_meters, then /frequency.
export default function Goal() {
  const navigate = useNavigate();
  useAutoGreet(GREET);
  useHelperHints();
  const { toast, toastEl } = useToast();
  const [goal, setGoal] = useState(() => loadStr(KEYS.goalMeters, ''));
  const [bubble, setBubble] = useState(INITIAL_BUBBLE);
  const inputRef = useRef<HTMLInputElement>(null);
  const timer = useRef(0);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const submit = () => {
    const v = parseInt(goal, 10);
    if (!v || v < 100) {
      setBubble('Hmm, give me at least <b>100 meters</b> to run! 🦊');
      toast('Hmm, give me at least 100 meters to run!');
      inputRef.current?.focus();
      return;
    }
    if (v > 50000) {
      setBubble('Whoa champion! Keep it under <b>50000m</b> for now.');
      toast('Whoa champion! Keep it under 50000m for now.');
      return;
    }
    saveStr(KEYS.goalMeters, String(v));
    setBubble(
      `Nice! <b>${v.toLocaleString()}m</b> a day — morning & afternoon, let's go!`,
    );
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => navigate('/frequency'), 600);
  };

  return (
    <div className="fox-stage flex items-center justify-center">
      <style>{`@keyframes fox-run{0%,100%{transform:translateY(0) rotate(0)}25%{transform:translateY(-8px) rotate(-1deg)}50%{transform:translateY(0) rotate(1deg)}75%{transform:translateY(-5px) rotate(0)}}`}</style>
      <div className="w-full max-w-[380px] text-center">
        <div
          className="mb-3.5 rounded-2xl border border-[#222] bg-[#111] px-4 py-3.5 text-[15px] leading-snug [&_b]:text-[#FF6B35]"
          dangerouslySetInnerHTML={{ __html: bubble }}
        />
        <div className="mx-auto aspect-square w-[min(68vw,260px)] animate-[fox-run_1.2s_ease-in-out_infinite]">
          <img
            src="./foxit-running.png"
            alt="Foxit running"
            className="block h-full w-full object-contain drop-shadow-[0_8px_32px_rgba(255,107,53,0.35)]"
          />
        </div>
        <h1 className="mt-3 text-2xl font-semibold leading-[1.25] tracking-[-0.02em]">
          How many meters
          <br />
          is your daily goal?
        </h1>
        <p className="fox-hint mt-1.5 text-sm">
          2 runs a day keeps the scroll away
        </p>

        <div className="mt-5 flex items-center justify-center gap-2 rounded-full border border-[#222] bg-[#111] py-1.5 pl-5 pr-1.5">
          <input
            id="goal"
            ref={inputRef}
            type="number"
            inputMode="numeric"
            min={100}
            max={50000}
            step={100}
            placeholder="2000"
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') submit();
            }}
            className="min-w-0 flex-1 bg-transparent text-center text-[22px] font-extrabold text-white outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          />
          <span className="rounded-full bg-[#222] px-3.5 py-2.5 text-[13px] font-bold uppercase tracking-[0.08em] text-[#999]">
            meters
          </span>
        </div>

        <div className="mt-3 flex flex-wrap justify-center gap-2">
          {CHIPS.map((c) => (
            <button
              key={c.v}
              onClick={() => {
                setGoal(c.v);
                inputRef.current?.focus();
              }}
              className={`rounded-full border px-3.5 py-2 text-sm font-bold ${
                goal === c.v
                  ? 'border-[#FF6B35] bg-[#FF6B35] text-black'
                  : 'border-[#222] bg-[#111] text-white'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        <div className="mt-6 flex justify-center">
          <button
            id="continue"
            onClick={submit}
            className="fox-btn-orange flex h-[62px] w-[270px] items-center justify-center gap-2.5 rounded-full text-lg tracking-[0.02em] disabled:opacity-40"
          >
            continue <span aria-hidden="true">→</span>
          </button>
        </div>
        <button
          onClick={() => navigate('/welcome')}
          className="mx-auto mt-3.5 block text-[13px] text-[#666]"
        >
          ← back
        </button>
      </div>
      {toastEl}
    </div>
  );
}
