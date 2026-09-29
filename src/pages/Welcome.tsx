import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useHelperHints } from '../lib/helper';
import { useAutoGreet } from '../lib/voice';

const GREET = "Hey! I'm Foxit — let's walk morning & afternoon, scroll less.";
const BUBBLE = "Hey! I'm <b>Foxit</b> — let's walk morning & afternoon, scroll less.";

// Port of welcome.html: greeting bubble + waving fox, CTA to /goal,
// replay link back to the loading screen.
export default function Welcome() {
  const navigate = useNavigate();
  useAutoGreet(GREET);
  useHelperHints();
  const [bubble] = useState(BUBBLE);

  return (
    <div className="fox-stage flex items-center justify-center">
      <style>{`@keyframes fox-wave{0%,100%{transform:rotate(0) translateY(0)}50%{transform:rotate(-1.5deg) translateY(-6px)}}`}</style>
      <div className="w-full max-w-[380px] text-center">
        <div
          className="mb-3.5 rounded-2xl border border-[#222] bg-[#111] px-4 py-3.5 text-[15px] leading-snug [&_b]:text-[#FF6B35]"
          dangerouslySetInnerHTML={{ __html: bubble }}
        />
        <div className="mx-auto aspect-square w-[min(68vw,280px)] animate-[fox-wave_2.4s_ease-in-out_infinite]">
          <img
            src="./Foxit-welcome.png"
            alt="Foxit waving"
            className="block h-full w-full object-contain drop-shadow-[0_8px_32px_rgba(255,107,53,0.35)]"
          />
        </div>
        <h1 className="mt-3 text-[30px] font-semibold tracking-[-0.02em]">
          Welcome
        </h1>
        <p className="fox-hint mt-1.5 text-sm">
          2 walks a day keeps the scroll away
        </p>
        <div className="mt-14 flex justify-center">
          <button
            onClick={() => navigate('/goal')}
            className="fox-btn-orange flex h-[62px] w-[270px] items-center justify-center gap-2.5 rounded-full text-lg tracking-[0.02em]"
          >
            lets start <span aria-hidden="true">→</span>
          </button>
        </div>
        <button
          onClick={() => navigate('/')}
          className="mx-auto mt-3.5 block text-[13px] text-[#666]"
        >
          ↺ replay loading
        </button>
      </div>
    </div>
  );
}
