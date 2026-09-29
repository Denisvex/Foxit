import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useHelperHints } from '../lib/helper';

// Port of index.html: splash screen, auto-redirects to /welcome after
// 2400ms. Any click skips straight ahead. No voice greeting here — the
// original has no speech script on this page.
export default function Loading() {
  const navigate = useNavigate();
  useHelperHints();

  useEffect(() => {
    const t = window.setTimeout(() => navigate('/welcome'), 2400);
    return () => window.clearTimeout(t);
  }, [navigate]);

  return (
    <div
      className="fox-stage flex items-center justify-center"
      onClick={() => navigate('/welcome')}
    >
      <style>{`@keyframes fox-breathe{0%,100%{transform:scale(1) translateY(0)}50%{transform:scale(1.04) translateY(-6px)}}@keyframes fox-load{0%{transform:translateX(-100%)}100%{transform:translateX(500%)}}@keyframes fox-stage-in{from{opacity:0;transform:scale(.92)}to{opacity:1;transform:scale(1)}}`}</style>
      <div className="w-full max-w-[380px] text-center animate-[fox-stage-in_0.8s_ease-out_both]">
        <div className="mx-auto aspect-square w-[min(72vw,300px)] animate-[fox-breathe_2.2s_ease-in-out_0.8s_infinite]">
          <img
            src="./Foxit-loadingpage.png"
            alt="Foxit fox mascot"
            className="block h-full w-full object-contain drop-shadow-[0_8px_32px_rgba(255,107,53,0.35)]"
          />
        </div>
        <h1 className="text-[46px] font-extrabold tracking-[-0.04em]">
          fox<span className="text-[#FF6B35]">it</span>
        </h1>
        <p className="fox-hint mt-2 text-[13px] uppercase tracking-[0.16em]">
          walk more · scroll less
        </p>
        <div className="mx-auto mt-6 h-1 w-[200px] overflow-hidden rounded-full bg-[#1a1a1a]">
          <div className="h-full w-[40%] rounded-full bg-[#FF6B35] animate-[fox-load_1.4s_ease-in-out_infinite]" />
        </div>
      </div>
    </div>
  );
}
