import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import TabBar from '../components/TabBar';
import { KEYS, saveStr } from '../lib/store';
import { VOICE_MODELS, activeVoiceModel, modelById, speakText, stopVoice } from '../lib/voice';
import type { VoiceModelId } from '../lib/voice';
import { applyHelperHints, useHelperHints } from '../lib/helper';
import { t, tv, useLang } from '../lib/i18n';
import { useToast } from '../lib/ui';

// Presentation meta only (art). Blurbs are built inside the component so
// they re-translate on language switch. All voice data (sample lines,
// pitch, rate, male) is reused from voice.ts.
const MODEL_IMG: Record<VoiceModelId, string> = {
  speaker1: './foxit-asking.png',
  simple: './foxit-thinking.png',
  classic: './foxit-cool.png',
  helper1: './foxit-dashboard.png',
};

function blurbFor(id: VoiceModelId): ReactNode {
  switch (id) {
    case 'speaker1':
      return (
        <>
          {t('models.blurb_speaker1_p1')} <b className="text-white">{t('models.blurb_speaker1_b1')}</b>
          {t('models.blurb_speaker1_p2')} <b className="text-white">{t('models.blurb_speaker1_b2')}</b>{' '}
          {t('models.blurb_speaker1_p3')}
        </>
      );
    case 'simple':
      return (
        <>
          {t('models.blurb_simple_p1')} <b className="text-white">{t('models.blurb_simple_b')}</b>{' '}
          {t('models.blurb_simple_p2')}
        </>
      );
    case 'classic':
      return (
        <>
          {t('models.blurb_classic_p1')} <b className="text-white">{t('models.blurb_classic_b')}</b>{' '}
          {t('models.blurb_classic_p2')}
        </>
      );
    case 'helper1':
      return (
        <>
          {t('models.blurb_helper1_p1')} <b className="text-white">{t('models.blurb_helper1_b')}</b>{' '}
          {t('models.blurb_helper1_p2')}
        </>
      );
  }
}

export default function Models() {
  useLang();
  const [sel, setSel] = useState<VoiceModelId>(() => activeVoiceModel());
  const [text, setText] = useState(() => t('models.default_text'));
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
    toast(tv('models.toast_active', { name: modelById(id).name }));
    applyHelperHints();
  };

  const preview = (id: VoiceModelId) => {
    if (!canSpeak) {
      toast(t('models.toast_no_voice'));
      return;
    }
    const m = modelById(id);
    speakText(m.sample, m);
    setSpeaking(true);
  };

  const play = () => {
    if (!canSpeak) {
      toast(t('models.toast_no_voice'));
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
    <div className="fox-app">
      <div className="fox-scroll">
      <div className="mb-2 flex items-center justify-between">
        <Link to="/dashboard" className="text-[13px] font-extrabold text-[#999]">
          {t('models.back')}
        </Link>
        <b className="text-[17px] tracking-tight">
          fox<span className="text-[#FF6B35]">it</span>
        </b>
        <span className="w-[74px]" />
      </div>

      <h1 className="mt-3 text-[28px] font-semibold tracking-tight">{t('models.title')}</h1>
      <p className="fox-hint mt-1.5 text-sm">{t('models.subtitle')}</p>

      <div>
        {VOICE_MODELS.map((m) => {
          const on = m.id === sel;
          const img = MODEL_IMG[m.id];
          const blurb = blurbFor(m.id);
          return (
            <div
              key={m.id}
              className={`mt-3.5 rounded-[20px] bg-white/[.03] p-4 text-left ${
                on ? 'shadow-[0_0_0_1.5px_rgba(255,107,53,.8)]' : ''
              }`}
            >
              <div className="flex items-center gap-3">
                <img
                  src={img}
                  alt={m.name}
                  className="h-[54px] w-[54px] object-contain drop-shadow-[0_6px_20px_rgba(255,107,53,.35)]"
                />
                <div>
                  <small className="block text-[10px] font-extrabold uppercase tracking-[.12em] text-[#FF6B35]">
                    {t('models.installed')}
                  </small>
                  <b className="block text-lg tracking-tight">{m.name}</b>
                </div>
                {on ? (
                  <div className="ml-auto rounded-full border border-[#FF6B35] bg-[#1a120e] px-2.5 py-1 text-[10px] font-black uppercase tracking-[.1em] text-[#FF6B35]">
                    {t('models.active_badge')}
                  </div>
                ) : (
                  <div className="ml-auto rounded-full border border-[#2E7CF6] bg-[#0e1a12] px-2.5 py-1 text-[10px] font-black uppercase tracking-[.1em] text-[#2E7CF6]">
                    {t('models.on_device_badge')}
                  </div>
                )}
              </div>
              <p className="fox-hint mt-2.5 text-[13px] leading-relaxed">{blurb}</p>
              <p className="mt-1 font-mono text-[11px] text-[#555]">
                {tv('models.voice_meta', {
                  pitch: m.pitch,
                  rate: m.rate,
                  gender: m.male ? t('models.gender_male') : t('models.gender_neutral'),
                })}
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
                  {on ? t('models.active_model') : t('models.use_this_model')}
                </button>
                <button
                  type="button"
                  onClick={() => preview(m.id)}
                  className="h-[46px] w-24 flex-none rounded-[13px] border-2 border-[#B34A1F] bg-[#2E7CF6] text-sm font-black text-white active:translate-y-0.5"
                >
                  {t('models.hear_it')}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 rounded-[20px] border border-[#222] bg-[#0d0d10] p-4 text-left">
        <div className="text-xs font-extrabold uppercase tracking-[.1em] text-[#999]">
          {t('models.hear_selected')}
        </div>
        <textarea
          ref={taRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={240}
          spellCheck={false}
          rows={3}
          aria-label={t('models.hear_selected')}
          className="mt-2.5 min-h-[72px] w-full resize-none rounded-xl border border-[#333] bg-[#0a0a0a] p-3 text-sm font-semibold text-white focus:border-[#2E7CF6] focus:outline-none"
        />
        <div className="mt-2.5 flex gap-2">
          <button
            id="spkPlay"
            data-hint={t('hints.spk_play')}
            type="button"
            onClick={play}
            disabled={!canSpeak || speaking}
            className="fox-btn-primary flex h-[50px] flex-1 items-center justify-center gap-2 rounded-[14px] text-[15px] active:translate-y-0.5 disabled:opacity-40"
          >
            {t('models.play')}
          </button>
          <button
            id="spkStop"
            data-hint={t('hints.spk_stop')}
            type="button"
            onClick={stop}
            disabled={!canSpeak || !speaking}
            className="h-[50px] w-[92px] flex-none rounded-[14px] border-2 border-[#333] bg-[#111] text-[15px] font-black text-white active:translate-y-0.5 disabled:opacity-40"
          >
            {t('models.stop')}
          </button>
        </div>
        <div className="fox-hint mt-2.5 text-center text-[11px]">
          {t('models.autogreet_a')} <b>{t('models.autogreet_b')}</b>{t('models.autogreet_c')}
        </div>
      </div>

      <div className="fox-hint mt-3.5 rounded-2xl border border-dashed border-[#333] bg-[#0d0d10] p-3.5 text-[13px] font-bold">
        {t('models.coming_soon')}
      </div>

      <div className="fox-hint mt-4 text-center text-xs">
        <b>{t('models.private_a')}</b>{t('models.private_b')}
      </div>

      </div>
      <TabBar />
      {toastEl}
    </div>
  );
}
