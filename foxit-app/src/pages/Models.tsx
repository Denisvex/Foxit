import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { KEYS, saveStr } from '../lib/store';
import { VOICE_MODELS, activeVoiceModel, modelById, speakText, stopVoice } from '../lib/voice';
import type { VoiceModelId } from '../lib/voice';
import { applyHelperHints, useHelperHints } from '../lib/helper';
import { useToast } from '../lib/ui';

// Presentation meta only (art + description). All voice data
// (sample lines, pitch, rate, male) is reused from voice.ts.
const MODEL_META: Record<VoiceModelId, { img: string; blurb: ReactNode }> = {
  speaker1: {
    img: './foxit-asking.png',
    blurb: (
      <>
        Foxit&apos;s voice engine — <b className="text-white">playful, boy-ish</b>, curious. He{' '}
        <b className="text-white">auto-speaks</b> Foxit&apos;s line on every page.
      </>
    ),
  },
  simple: {
    img: './foxit-thinking.png',
    blurb: (
      <>
        Speaks even simpler — <b className="text-white">slow, short and easy</b> to follow.
      </>
    ),
  },
  classic: {
    img: './foxit-cool.png',
    blurb: (
      <>
        The <b className="text-white">original Foxit</b> — his normal, everyday voice.
      </>
    ),
  },
  helper1: {
    img: './foxit-dashboard.png',
    blurb: (
      <>
        Adds a <b className="text-white">tiny hint next to every button</b> telling you exactly
        what it does.
      </>
    ),
  },
};

export default function Models() {
  const [sel, setSel] = useState<VoiceModelId>(() => activeVoiceModel());
  const [text, setText] = useState('Hey, I\'m Foxit — let\'s scroll less and move more!');
  const [speaking, setSpeaking] = useState(false);
  const [canSpeak] = useState(() => typeof window !== 'undefined' && 'speechSynthesis' in window);
  const taRef = useRef<HTMLTextAreaElement | null>(null);
  const { toast, toastEl } = useToast();

  // Helper chips live here too; re-applied whenever the model changes.
  useHelperHints([sel]);

  // Warm up voices once. Cancel speech on unmount + pagehide.
  useEffect(() => {
    try {
      window.speechSynthesis.getVoices();
    } catch {
      /* speech unavailable */
    }
    const onHide = () => stopVoice();
    window.addEventListener('pagehide', onHide);
    return () => {
      window.removeEventListener('pagehide', onHide);
      stopVoice();
    };
  }, []);

  // speakText() exposes no end callback, so poll the engine to reset buttons.
  useEffect(() => {
    if (!canSpeak) return;
    const t = window.setInterval(() => {
      try {
        if (!window.speechSynthesis.speaking) setSpeaking(false);
      } catch {
        /* ignore */
      }
    }, 400);
    return () => window.clearInterval(t);
  }, [canSpeak]);

  const select = (id: VoiceModelId) => {
    setSel(id);
    saveStr(KEYS.voiceModel, id);
    toast(`${modelById(id).name} active`);
    applyHelperHints();
  };

  const preview = (id: VoiceModelId) => {
    if (!canSpeak) {
      toast('Voice not supported on this device');
      return;
    }
    const m = modelById(id);
    speakText(m.sample, m);
    setSpeaking(true);
  };

  const play = () => {
    if (!canSpeak) {
      toast('Voice not supported on this device');
      return;
    }
    if (!text.trim()) {
      taRef.current?.focus();
      return;
    }
    speakText(text, modelById(sel));
    setSpeaking(true);
  };

  const stop = () => {
    stopVoice();
    setSpeaking(false);
  };

  return (
    <div className="fox-stage">
      <div className="mb-2 flex items-center justify-between">
        <Link to="/dashboard" className="text-[13px] font-extrabold text-[#999]">
          ← dashboard
        </Link>
        <b className="text-[17px] tracking-tight">
          fox<span className="text-[#FF6B35]">it</span>
        </b>
        <span className="w-[74px]" />
      </div>

      <h1 className="mt-3 text-[28px] font-semibold tracking-tight">Models</h1>
      <p className="fox-hint mt-1.5 text-sm">On-device add-ons Foxit can wear</p>

      <div>
        {VOICE_MODELS.map((m) => {
          const on = m.id === sel;
          const meta = MODEL_META[m.id];
          return (
            <div
              key={m.id}
              className={`mt-3.5 rounded-[20px] border-2 bg-[#111] p-4 text-left ${
                on ? 'border-[#FF6B35] shadow-[0_0_0_2px_rgba(255,107,53,.35)]' : 'border-[#222]'
              }`}
            >
              <div className="flex items-center gap-3">
                <img
                  src={meta.img}
                  alt={m.name}
                  className="h-[54px] w-[54px] object-contain drop-shadow-[0_6px_20px_rgba(255,107,53,.35)]"
                />
                <div>
                  <small className="block text-[10px] font-extrabold uppercase tracking-[.12em] text-[#FF6B35]">
                    installed
                  </small>
                  <b className="block text-lg tracking-tight">{m.name}</b>
                </div>
                {on ? (
                  <div className="ml-auto rounded-full border border-[#FF6B35] bg-[#1a120e] px-2.5 py-1 text-[10px] font-black uppercase tracking-[.1em] text-[#FF6B35]">
                    active
                  </div>
                ) : (
                  <div className="ml-auto rounded-full border border-[#2E7CF6] bg-[#0e1a12] px-2.5 py-1 text-[10px] font-black uppercase tracking-[.1em] text-[#2E7CF6]">
                    on-device
                  </div>
                )}
              </div>
              <p className="fox-hint mt-2.5 text-[13px] leading-relaxed">{meta.blurb}</p>
              <p className="mt-1 font-mono text-[11px] text-[#555]">
                pitch {m.pitch} · rate {m.rate} · {m.male ? 'male' : 'neutral'} voice
              </p>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => select(m.id)}
                  className={`h-[46px] flex-1 rounded-[13px] border-2 text-sm font-black active:translate-y-0.5 ${
                    on
                      ? 'border-[#FF6B35] bg-[#0a0a0a] text-[#FF6B35]'
                      : 'border-[#333] bg-[#0a0a0a] text-white'
                  }`}
                >
                  {on ? '✓ active model' : 'use this model'}
                </button>
                <button
                  type="button"
                  onClick={() => preview(m.id)}
                  className="h-[46px] w-24 flex-none rounded-[13px] border-2 border-[#B34A1F] bg-[#2E7CF6] text-sm font-black text-white active:translate-y-0.5"
                >
                  ▶ hear it
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 rounded-[20px] border border-[#222] bg-[#0d0d10] p-4 text-left">
        <div className="text-xs font-extrabold uppercase tracking-[.1em] text-[#999]">
          hear the selected model
        </div>
        <textarea
          ref={taRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={240}
          spellCheck={false}
          rows={3}
          className="mt-2.5 min-h-[72px] w-full resize-none rounded-xl border border-[#333] bg-[#0a0a0a] p-3 text-sm font-semibold text-white focus:border-[#2E7CF6] focus:outline-none"
        />
        <div className="mt-2.5 flex gap-2">
          <button
            id="spkPlay"
            data-hint="play the voice"
            type="button"
            onClick={play}
            disabled={!canSpeak || speaking}
            className="fox-btn-primary flex h-[50px] flex-1 items-center justify-center gap-2 rounded-[14px] text-[15px] active:translate-y-0.5 disabled:opacity-40"
          >
            ▶ play
          </button>
          <button
            id="spkStop"
            data-hint="stop the voice"
            type="button"
            onClick={stop}
            disabled={!canSpeak || !speaking}
            className="h-[50px] w-[92px] flex-none rounded-[14px] border-2 border-[#333] bg-[#111] text-[15px] font-black text-white active:translate-y-0.5 disabled:opacity-40"
          >
            ■ stop
          </button>
        </div>
        <div className="fox-hint mt-2.5 text-center text-[11px]">
          The selected model also <b>auto-greets you on every page</b>. Voice runs on your
          phone&apos;s built-in speech — nothing recorded, nothing uploaded.
        </div>
      </div>

      <div className="fox-hint mt-3.5 rounded-2xl border border-dashed border-[#333] bg-[#0d0d10] p-3.5 text-[13px] font-bold">
        More models coming soon…
      </div>

      <div className="fox-hint mt-4 text-center text-xs">
        <b>Private by design:</b> models run 100% on-device, zero data sent anywhere.
      </div>

      {toastEl}
    </div>
  );
}
