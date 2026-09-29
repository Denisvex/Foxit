import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { KEYS, loadStr, saveStr } from '../lib/store';
import { useHelperHints } from '../lib/helper';
import { useAutoGreet } from '../lib/voice';
import { useToast } from '../lib/ui';

const GREET = "Hey, I'm Foxit — what should I call you? 🦊";
const INITIAL_BUBBLE = "Hey, I'm <b>Foxit</b> — what should I call you? 🦊";

// Port of username.html: pick a username (2–16 chars, [A-Za-z0-9_.-],
// spaces become _). Stores foxit_username, then /dashboard.
export default function Username() {
  const navigate = useNavigate();
  useAutoGreet(GREET);
  useHelperHints();
  const { toast, toastEl } = useToast();
  const [name, setName] = useState(() => loadStr(KEYS.username, ''));
  const [bubble, setBubble] = useState(INITIAL_BUBBLE);
  const [done, setDone] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const timer = useRef(0);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const submit = () => {
    const v = name.trim().replace(/\s+/g, '_').slice(0, 16);
    if (v.length < 2) {
      setBubble('Give me at least <b>2 letters</b> please! 🦊');
      toast('Give me at least 2 letters please!');
      inputRef.current?.focus();
      return;
    }
    if (!/^[A-Za-z0-9_.-]+$/.test(v)) {
      setBubble('Letters, numbers, <b>_ . -</b> only please!');
      toast('Letters, numbers, _ . - only please!');
      inputRef.current?.focus();
      return;
    }
    saveStr(KEYS.username, v);
    setBubble(`Nice to meet you, <b>${v}</b>! Let's go!`);
    setDone(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => navigate('/dashboard'), 600);
  };

  return (
    <div className="fox-stage flex items-center justify-center">
      <div className="w-full max-w-[380px] text-center">
        <div
          className="mb-3.5 rounded-2xl border border-[#222] bg-[#111] px-4 py-3.5 text-[15px] leading-snug [&_b]:text-[#FF6B35]"
          dangerouslySetInnerHTML={{ __html: bubble }}
        />
        <div className="mx-auto aspect-square w-[min(68vw,220px)]">
          <img
            src="./foxit-asking.png"
            alt="Foxit asking"
            className="block h-full w-full object-contain drop-shadow-[0_8px_32px_rgba(255,107,53,0.35)]"
          />
        </div>
        <h1 className="mt-3 text-2xl font-semibold leading-[1.3] tracking-[-0.02em]">
          Pick a username
        </h1>
        <p className="fox-hint mt-1.5 text-sm">
          2-16 letters — this shows on your runs
        </p>

        <div className="mt-5 flex items-center rounded-full border border-[#222] bg-[#111] py-1.5 pl-5 pr-1.5">
          <input
            id="name"
            ref={inputRef}
            type="text"
            maxLength={16}
            autoComplete="nickname"
            placeholder="e.g. fox_runner"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') submit();
            }}
            className="min-w-0 flex-1 bg-transparent py-2 text-center text-lg font-bold text-white outline-none"
          />
        </div>

        <div className="mt-6 flex justify-center">
          <button
            id="continue"
            onClick={submit}
            className="fox-btn-orange flex h-[62px] w-[270px] items-center justify-center gap-2.5 rounded-full text-lg tracking-[0.02em]"
          >
            {done ? 'lets go' : 'continue'}{' '}
            <span aria-hidden="true">→</span>
          </button>
        </div>
        <button
          onClick={() => navigate('/schedule')}
          className="mx-auto mt-3.5 block text-[13px] text-[#666]"
        >
          ← back
        </button>
      </div>
      {toastEl}
    </div>
  );
}
