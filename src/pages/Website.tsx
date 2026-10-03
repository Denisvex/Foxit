import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useHelperHints } from '../lib/helper';
import { t, useLang } from '../lib/i18n';

const FEATURES = [
  { ico: '🎯', h: 'site.feature_1_h', p: 'site.feature_1_p' },
  { ico: '⏰', h: 'site.feature_2_h', p: 'site.feature_2_p' },
  { ico: '🗺️', h: 'site.feature_3_h', p: 'site.feature_3_p' },
  { ico: '📍', h: 'site.feature_4_h', p: 'site.feature_4_p' },
  { ico: '🏃', h: 'site.feature_5_h', p: 'site.feature_5_p' },
  { ico: '🔥', h: 'site.feature_6_h', p: 'site.feature_6_p' },
];

const STEPS = [
  {
    img: './Foxit-welcome.png',
    alt: 'site.step_1_alt',
    step: 'site.step_1_kicker',
    h: 'site.step_1_h',
    p: 'site.step_1_p',
    to: '/welcome',
    label: 'site.step_1_label',
  },
  {
    img: './foxit-running.png',
    alt: 'site.step_2_alt',
    step: 'site.step_2_kicker',
    h: 'site.step_2_h',
    p: 'site.step_2_p',
    to: '/goal',
    label: 'site.step_2_label',
  },
  {
    img: './foxit-thinking.png',
    alt: 'site.step_3_alt',
    step: 'site.step_3_kicker',
    h: 'site.step_3_h',
    p: 'site.step_3_p',
    to: '/frequency',
    label: 'site.step_3_label',
  },
  {
    img: './foxit-dashboard.png',
    alt: 'site.step_4_alt',
    step: 'site.step_4_kicker',
    h: 'site.step_4_h',
    p: 'site.step_4_p',
    to: '/dashboard',
    label: 'site.step_4_label',
  },
];

const MASCOTS_TOP = [
  { img: './Foxit-loadingpage.png', alt: 'site.mascot_top_1_alt', b: 'site.mascot_top_1_b', s: 'site.mascot_top_1_s' },
  { img: './Foxit-welcome.png', alt: 'site.mascot_top_2_alt', b: 'site.mascot_top_2_b', s: 'site.mascot_top_2_s' },
  { img: './foxit-running.png', alt: 'site.mascot_top_3_alt', b: 'site.mascot_top_3_b', s: 'site.mascot_top_3_s' },
  { img: './foxit-thinking.png', alt: 'site.mascot_top_4_alt', b: 'site.mascot_top_4_b', s: 'site.mascot_top_4_s' },
];

const MASCOTS_BOTTOM = [
  { img: './foxit-asking.png', alt: 'site.mascot_bottom_1_alt', b: 'site.mascot_bottom_1_b', s: 'site.mascot_bottom_1_s' },
  { img: './foxit-alarmtime.png', alt: 'site.mascot_bottom_2_alt', b: 'site.mascot_bottom_2_b', s: 'site.mascot_bottom_2_s' },
  { img: './foxit-dashboard.png', alt: 'site.mascot_bottom_3_alt', b: 'site.mascot_bottom_3_b', s: 'site.mascot_bottom_3_s' },
];

const MARQUEE = [
  'site.marquee_1',
  'site.marquee_2',
  'site.marquee_3',
  'site.marquee_4',
  'site.marquee_5',
  'site.marquee_6',
  'site.marquee_7',
  'site.marquee_8',
];

const MAP_POINTS = [
  'site.map_li_1',
  'site.map_li_2',
  'site.map_li_3',
  'site.map_li_4',
];

export default function Website() {
  // Marketing page: no voice here, but helper chips still apply.
  useLang();
  useHelperHints();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-dvh bg-[#070707] text-white">
      <header className="sticky top-0 z-50 border-b border-[#1a1a1e] bg-[rgba(7,7,7,.82)] backdrop-blur-xl">
        <div className="mx-auto flex w-[min(92vw,1120px)] items-center justify-between py-3.5">
          <a href="#top" className="flex items-center gap-2.5 text-[22px] font-black tracking-tight no-underline">
            <img src="./foxit-logo.png" alt={t('site.logo_alt')} className="h-9 w-9 rounded-[10px]" />
            <span>
              fox<span className="text-[#FF6B35]">it</span>
            </span>
          </a>
          <nav className={`${menuOpen ? 'flex' : 'hidden'} absolute inset-x-0 top-16 flex-col items-start gap-5 bg-[#0e0e10] px-[4vw] py-3.5 md:static md:flex md:flex-row md:items-center md:gap-[22px] md:bg-transparent md:p-0`}>
            <a href="#features" onClick={() => setMenuOpen(false)} className="text-sm font-semibold text-[#a1a1aa] no-underline hover:text-white">{t('site.nav_features')}</a>
            <a href="#how" onClick={() => setMenuOpen(false)} className="text-sm font-semibold text-[#a1a1aa] no-underline hover:text-white">{t('site.nav_how')}</a>
            <a href="#live-map" onClick={() => setMenuOpen(false)} className="text-sm font-semibold text-[#a1a1aa] no-underline hover:text-white">{t('site.nav_live_map')}</a>
            <a href="#mascots" onClick={() => setMenuOpen(false)} className="text-sm font-semibold text-[#a1a1aa] no-underline hover:text-white">{t('site.nav_meet_foxit')}</a>
            <a href="#faq" onClick={() => setMenuOpen(false)} className="text-sm font-semibold text-[#a1a1aa] no-underline hover:text-white">{t('site.nav_faq')}</a>
            <Link to="/" onClick={() => setMenuOpen(false)} className="fox-btn-orange rounded-full px-[18px] py-2 text-sm no-underline">
              {t('site.nav_open_app')}
            </Link>
          </nav>
          <button
            type="button"
            aria-label={t('site.nav_menu')}
            onClick={() => setMenuOpen((v) => !v)}
            className="rounded-[10px] border border-[#2a2a2e] bg-[#161616] px-3 py-2 text-lg text-white md:hidden"
          >
            ☰
          </button>
        </div>
      </header>

      <main id="top">
        {/* HERO */}
        <div className="relative overflow-hidden py-[72px]">
          <div className="mx-auto grid w-[min(92vw,1120px)] items-center gap-10 md:grid-cols-[1.05fr_.95fr]">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-[rgba(255,107,53,.35)] bg-[#151310] px-3.5 py-[7px] text-xs font-bold uppercase tracking-[.08em] text-[#ffb897]">
                {t('site.hero_badge')}
              </span>
              <h1 className="my-[18px] text-[clamp(42px,6vw,72px)] font-black leading-[.95] tracking-[-.04em]">
                {t('site.hero_title_a')}<em className="not-italic text-[#FF6B35]">{t('site.hero_title_em')}</em>{t('site.hero_title_b')}
              </h1>
              <p className="max-w-[46ch] text-lg text-[#a1a1aa]">
                {t('site.hero_sub')}
              </p>
              <div className="mt-[26px] flex flex-wrap gap-3">
                <Link to="/" className="fox-btn-orange rounded-full px-6 py-3 text-base no-underline">
                  {t('site.hero_cta_start')}
                </Link>
                <Link to="/dashboard" className="rounded-full border-2 border-[#2a2a2e] border-b-4 bg-[#161618] px-[22px] py-[11px] text-[15px] font-extrabold text-white no-underline hover:border-[#FF6B35]">
                  {t('site.hero_cta_demo')}
                </Link>
              </div>
              <div className="mt-3.5 text-[13px] font-semibold text-[#666]">
                {t('site.hero_note')}
              </div>
              <div className="mt-[26px] flex flex-wrap gap-2.5">
                <div className="min-w-[132px] rounded-2xl border-2 border-[#222226] border-b-4 bg-[#111113] px-4 py-3">
                  <b className="block text-[22px] font-black">100<i className="not-italic text-[#FF6B35]">m</i> – 50<i className="not-italic text-[#FF6B35]">km</i></b>
                  <span className="text-xs font-semibold text-[#a1a1aa]">{t('site.stat_goals_label')}</span>
                </div>
                <div className="min-w-[132px] rounded-2xl border-2 border-[#222226] border-b-4 bg-[#111113] px-4 py-3">
                  <b className="block text-[22px] font-black">1 – 3</b>
                  <span className="text-xs font-semibold text-[#a1a1aa]">{t('site.stat_runs_label')}</span>
                </div>
                <div className="min-w-[132px] rounded-2xl border-2 border-[#222226] border-b-4 bg-[#111113] px-4 py-3">
                  <b className="block text-[22px] font-black">{t('site.stat_streak_value')}</b>
                  <span className="text-xs font-semibold text-[#a1a1aa]">{t('site.stat_streak_label')}</span>
                </div>
              </div>
            </div>

            {/* Phone mock: the vanilla page embedded the live app in an iframe;
                ported as a static preview that routes into the app instead. */}
            <div className="relative flex items-start justify-center">
              <div className="absolute left-0 top-[18%] rounded-2xl border border-[#2c2c32] bg-[rgba(17,17,19,.94)] px-3.5 py-2.5 text-[13px] font-bold shadow-[0_12px_40px_rgba(0,0,0,.5)] max-md:hidden">
                📍 <b className="text-[#FF6B35]">{t('site.mock_spot_name')}</b> · 800 m
              </div>
              <div className="absolute bottom-[18%] right-0 rounded-2xl border border-[#2c2c32] bg-[rgba(17,17,19,.94)] px-3.5 py-2.5 text-[13px] font-bold shadow-[0_12px_40px_rgba(0,0,0,.5)] max-md:hidden">
                🔥 <b className="text-[#FF6B35]">{t('site.mock_streak_b')}</b>{t('site.mock_streak_after')}
              </div>
              <div className="flex flex-col items-center">
                <div className="relative w-[min(78vw,302px)] rounded-[56px] bg-[linear-gradient(145deg,#4a4a4e,#101012_38%,#2e2e32_70%,#0a0a0c)] p-[11px] shadow-[0_30px_90px_rgba(0,0,0,.75),0_10px_55px_rgba(255,107,53,.22)]">
                  <div className="relative h-[560px] overflow-hidden rounded-[46px] border border-black bg-black">
                    <img src="./Foxit-welcome.png" alt={t('site.preview_alt')} className="h-full w-full bg-black object-contain" />
                    <div className="absolute left-1/2 top-3 z-[5] flex h-[29px] w-28 -translate-x-1/2 items-center justify-end rounded-full border border-[#222] bg-black pr-3">
                      <span className="h-2.5 w-2.5 rounded-full bg-[#05070d]" />
                    </div>
                    <div className="absolute bottom-2 left-1/2 z-[6] h-[5px] w-[118px] -translate-x-1/2 rounded-full bg-white/90" />
                  </div>
                </div>
                <div className="mt-3.5 flex justify-center gap-2">
                  <Link to="/welcome" className="fox-btn-orange rounded-full px-4 py-2 text-[13px] no-underline">{t('site.phone_welcome')}</Link>
                  <Link to="/goal" className="rounded-full border-2 border-[#2a2a2e] bg-[#161618] px-4 py-2 text-[13px] font-extrabold text-white no-underline">{t('site.phone_goal')}</Link>
                  <Link to="/dashboard" className="rounded-full border-2 border-[#2a2a2e] bg-[#161618] px-4 py-2 text-[13px] font-extrabold text-white no-underline">{t('site.phone_map')}</Link>
                </div>
                <Link to="/welcome" className="mt-2.5 text-xs text-[#666] no-underline hover:text-[#FF6B35]">
                  {t('site.phone_open_full')}
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* MARQUEE */}
        <div className="overflow-hidden whitespace-nowrap border-y border-[#1c1c20] bg-[#0a0a0c] py-3 text-[13px] font-bold uppercase tracking-[.12em] text-[#777]">
          {MARQUEE.map((k) => (
            <span key={k} className="mx-[18px]">{t(k)} <b className="text-[#FF6B35]">·</b></span>
          ))}
        </div>

        {/* FEATURES */}
        <section id="features" className="py-[72px]">
          <div className="mx-auto w-[min(92vw,1120px)]">
            <div className="text-xs font-extrabold uppercase tracking-[.14em] text-[#FF6B35]">{t('site.features_eyebrow')}</div>
            <h2 className="my-2.5 text-[clamp(28px,4vw,44px)] font-black leading-[1.05] tracking-[-.03em]">
              {t('site.features_title_a')}<br />{t('site.features_title_b')}
            </h2>
            <p className="max-w-[62ch] text-base text-[#a1a1aa]">
              {t('site.features_sub_a')}<b>{t('site.features_sub_run')}</b>{t('site.features_sub_b')}
            </p>
            <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((c) => (
                <div key={c.h} className="rounded-[20px] border-2 border-[#222226] border-b-[5px] bg-[#111113] p-[22px] text-left transition hover:-translate-y-1 hover:border-[#FF6B35]">
                  <div className="mb-3.5 flex h-11 w-11 items-center justify-center rounded-[13px] border border-[#2a2a2e] bg-[#1a1a1e] text-[22px]">{c.ico}</div>
                  <h3 className="mb-1.5 text-lg font-extrabold">{t(c.h)}</h3>
                  <p className="text-sm text-[#a1a1aa]">{t(c.p)}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section id="how" className="pb-[72px] pt-0">
          <div className="mx-auto w-[min(92vw,1120px)]">
            <div className="text-xs font-extrabold uppercase tracking-[.14em] text-[#FF6B35]">{t('site.how_eyebrow')}</div>
            <h2 className="my-2.5 text-[clamp(28px,4vw,44px)] font-black leading-[1.05] tracking-[-.03em]">
              {t('site.how_title')}
            </h2>
            <p className="max-w-[62ch] text-base text-[#a1a1aa]">{t('site.how_sub')}</p>
            <div className="mt-8 grid gap-3.5 md:grid-cols-2 lg:grid-cols-4">
              {STEPS.map((s) => (
                <div key={s.h} className="overflow-hidden rounded-[20px] border-2 border-[#232327] bg-[#0f0f12] text-left">
                  <img src={s.img} alt={t(s.alt)} className="aspect-square w-full border-b border-[#222] bg-black object-contain p-3.5" />
                  <div className="p-4">
                    <small className="text-[11px] font-extrabold uppercase tracking-[.1em] text-[#FF6B35]">{t(s.step)}</small>
                    <h3 className="my-1.5 text-[17px] font-extrabold">{t(s.h)}</h3>
                    <p className="text-[13px] text-[#a1a1aa]">{t(s.p)}</p>
                    <Link to={s.to} className="mt-1 inline-block text-[13px] font-extrabold text-white no-underline hover:text-[#FF6B35]">
                      {t(s.label)}
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* LIVE MAP SHOWCASE */}
        <section id="live-map" className="border-y border-[#1c1c20] bg-[#0e0e10] py-[72px]">
          <div className="mx-auto w-[min(92vw,1120px)]">
            <div className="text-xs font-extrabold uppercase tracking-[.14em] text-[#FF6B35]">{t('site.map_eyebrow')}</div>
            <h2 className="my-2.5 text-[clamp(28px,4vw,44px)] font-black leading-[1.05] tracking-[-.03em]">
              {t('site.map_title')}
            </h2>
            <div className="mt-5 grid items-center gap-7 md:grid-cols-2">
              <div>
                <p className="max-w-[62ch] text-base text-[#a1a1aa]">
                  {t('site.map_intro_a')}<Link to="/dashboard" className="font-extrabold text-[#FF6B35]">{t('site.map_intro_link')}</Link>{t('site.map_intro_b')}
                </p>
                <ul className="mt-[18px] grid list-none gap-2.5">
                  {MAP_POINTS.map((k) => (
                    <li key={k} className="flex items-start gap-2.5 rounded-[14px] border border-[#222] bg-[#121214] p-3 text-sm">
                      <i className="flex h-[26px] w-[26px] flex-none items-center justify-center rounded-full bg-[#FF6B35] text-[13px] font-black not-italic text-black">✓</i>
                      <span>{t(k)}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <div className="overflow-x-auto rounded-[14px] border border-[#2a2a2e] bg-black p-4 font-mono text-[12.5px] text-[#c9c9d1]">
                  LOCAL STORAGE<br /><br />
                  foxit_username → <b className="text-[#FF6B35]">&quot;fox_runner&quot;</b><br />
                  foxit_goal_meters → <b className="text-[#FF6B35]">&quot;2000&quot;</b><br />
                  foxit_runs_per_day → <b className="text-[#FF6B35]">&quot;2&quot;</b><br />
                  foxit_run_times → <b className="text-[#FF6B35]">[{`{h:7,m:0,ampm:"AM"}, …`}]</b><br />
                  foxit_spot → <b className="text-[#FF6B35]">&quot;park&quot;</b> · foxit_start → <b className="text-[#FF6B35]">{`{lat,lng}`}</b><br />
                  foxit_log → <b className="text-[#FF6B35]">{`{ "2026-09-21": {done:[true,false]} }`}</b><br />
                  foxit_tracks → <b className="text-[#FF6B35]">[{`{meters:812, secs:342}`}]</b><br />
                  foxit_custom_spots → <b className="text-[#FF6B35]">[]</b>
                </div>
                <div className="mt-3 flex flex-wrap gap-2.5">
                  <Link to="/dashboard" className="fox-btn-orange rounded-full px-[18px] py-2 text-sm no-underline">{t('site.map_cta_open')}</Link>
                  <Link to="/schedule" className="rounded-full border-2 border-[#2a2a2e] border-b-4 bg-[#161618] px-[18px] py-2 text-sm font-extrabold text-white no-underline">{t('site.map_cta_edit')}</Link>
                </div>
              </div>
            </div>
            <div className="mt-7 grid items-center gap-[22px] rounded-3xl border-2 border-[#232327] bg-[linear-gradient(180deg,#0e0e10,#070707)] p-[22px] md:grid-cols-2">
              <div>
                <h3 className="text-[22px] font-extrabold">{t('site.track_h')}</h3>
                <p className="mt-2 text-sm text-[#a1a1aa]">
                  {t('site.track_p_a')}<b>{t('site.track_p_run')}</b>{t('site.track_p_b')}
                </p>
              </div>
              <div className="overflow-x-auto rounded-[14px] border border-[#2a2a2e] bg-black p-4 font-mono text-[12.5px] text-[#c9c9d1]">
                TRACKING LOOP<br /><br />
                run! → <b className="text-[#FF6B35]">getCurrentPosition</b> → watchPosition<br />
                arrow rotate by <b className="text-[#FF6B35]">bearing</b> · panTo(you)<br />
                tick: <b className="text-[#FF6B35]">812 m · 5:42 · tap stop to finish</b><br />
                stop → <b className="text-[#FF6B35]">confetti(x,y)</b> + toast “Saved! 812 m” 🎉
              </div>
            </div>
          </div>
        </section>

        {/* MASCOTS */}
        <section id="mascots" className="py-[72px]">
          <div className="mx-auto w-[min(92vw,1120px)]">
            <div className="text-xs font-extrabold uppercase tracking-[.14em] text-[#FF6B35]">{t('site.mascots_eyebrow')}</div>
            <h2 className="my-2.5 text-[clamp(28px,4vw,44px)] font-black leading-[1.05] tracking-[-.03em]">
              {t('site.mascots_title')}
            </h2>
            <p className="max-w-[62ch] text-base text-[#a1a1aa]">
              {t('site.mascots_sub')}
            </p>
            <div className="mt-7 grid grid-cols-2 gap-3.5 lg:grid-cols-4">
              {MASCOTS_TOP.map((m) => (
                <div key={m.b} className="rounded-[20px] border-2 border-[#232327] bg-[#0f0f12] p-4 text-center">
                  <img src={m.img} alt={t(m.alt)} className="aspect-square w-full object-contain" />
                  <b className="mt-2 block font-extrabold">{t(m.b)}</b>
                  <span className="text-xs text-[#a1a1aa]">{t(m.s)}</span>
                </div>
              ))}
            </div>
            <div className="mt-3.5 grid grid-cols-2 gap-3.5 md:grid-cols-3">
              {MASCOTS_BOTTOM.map((m) => (
                <div key={m.b} className="rounded-[20px] border-2 border-[#232327] bg-[#0f0f12] p-4 text-center">
                  <img src={m.img} alt={t(m.alt)} className="mx-auto aspect-square w-full max-w-[280px] object-contain" />
                  <b className="mt-2 block font-extrabold">{t(m.b)}</b>
                  <span className="text-xs text-[#a1a1aa]">{t(m.s)}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ + CTA */}
        <section id="faq" className="pb-[72px]">
          <div className="mx-auto w-[min(92vw,1120px)]">
            <div className="text-xs font-extrabold uppercase tracking-[.14em] text-[#FF6B35]">{t('site.faq_eyebrow')}</div>
            <h2 className="my-2.5 text-[clamp(28px,4vw,44px)] font-black leading-[1.05] tracking-[-.03em]">
              {t('site.faq_title')}
            </h2>
            <div className="mt-7 grid max-w-[760px] gap-2.5">
              <details open className="rounded-2xl border-2 border-[#222226] bg-[#111113] px-[18px] py-4">
                <summary className="cursor-pointer text-base font-extrabold">{t('site.faq_1_q')}</summary>
                <p className="mt-2 text-sm text-[#a1a1aa]">
                  {t('site.faq_1_a')}
                </p>
              </details>
              <details className="rounded-2xl border-2 border-[#222226] bg-[#111113] px-[18px] py-4">
                <summary className="cursor-pointer text-base font-extrabold">{t('site.faq_2_q')}</summary>
                <p className="mt-2 text-sm text-[#a1a1aa]">
                  {t('site.faq_2_a1')}<Link to="/" className="text-[#FF6B35]">{t('site.faq_2_link1')}</Link>{t('site.faq_2_a2')}<Link to="/dashboard" className="text-[#FF6B35]">{t('site.faq_2_link2')}</Link>{t('site.faq_2_a3')}
                </p>
              </details>
              <details className="rounded-2xl border-2 border-[#222226] bg-[#111113] px-[18px] py-4">
                <summary className="cursor-pointer text-base font-extrabold">{t('site.faq_3_q')}</summary>
                <p className="mt-2 text-sm text-[#a1a1aa]">
                  {t('site.faq_3_a')}
                </p>
              </details>
              <details className="rounded-2xl border-2 border-[#222226] bg-[#111113] px-[18px] py-4">
                <summary className="cursor-pointer text-base font-extrabold">{t('site.faq_4_q')}</summary>
                <p className="mt-2 text-sm text-[#a1a1aa]">
                  {t('site.faq_4_a')}
                </p>
              </details>
              <details className="rounded-2xl border-2 border-[#222226] bg-[#111113] px-[18px] py-4">
                <summary className="cursor-pointer text-base font-extrabold">{t('site.faq_5_q')}</summary>
                <p className="mt-2 text-sm text-[#a1a1aa]">
                  {t('site.faq_5_a1')}<b>foxit_log</b>{t('site.faq_5_a2')}<b>foxit_tracks</b>{t('site.faq_5_a3')}
                </p>
              </details>
            </div>
            <div className="relative mt-5 overflow-hidden rounded-[28px] border-2 border-[rgba(255,107,53,.35)] bg-[#0d0d0f] px-7 py-12 text-center">
              <img src="./foxit-running.png" alt={t('site.cta_img_alt')} className="mx-auto aspect-square w-[140px] object-contain" />
              <h2 className="mt-3 text-[clamp(28px,4vw,44px)] font-black leading-[1.05] tracking-[-.03em]">
                {t('site.cta_title')}
              </h2>
              <p className="mx-auto max-w-[62ch] text-base text-[#a1a1aa]">
                {t('site.cta_sub')}
              </p>
              <div className="mt-[26px] flex flex-wrap justify-center gap-3">
                <Link to="/" className="fox-btn-orange rounded-full px-6 py-3 text-base no-underline">
                  {t('site.cta_launch')}
                </Link>
                <Link to="/username" className="rounded-full border-2 border-[#2a2a2e] border-b-4 bg-[#161618] px-[22px] py-[11px] text-[15px] font-extrabold text-white no-underline">
                  {t('site.cta_username')}
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-[#1c1c20] pb-11 pt-8 text-[13px] text-[#666]">
        <div className="mx-auto flex w-[min(92vw,1120px)] flex-wrap items-start justify-between gap-5">
          <div>
            <a href="#top" className="flex items-center gap-2.5 text-lg font-black no-underline">
              <img src="./foxit-logo.png" alt={t('site.footer_logo_alt')} className="h-7 w-7 rounded-[10px]" />
              <span>fox<span className="text-[#FF6B35]">it</span></span>
            </a>
            <div className="mt-2">{t('site.footer_tag')}</div>
          </div>
          <div className="flex flex-wrap gap-[18px]">
            <Link to="/" className="font-semibold text-[#a1a1aa] no-underline hover:text-white">{t('site.footer_loading')}</Link>
            <Link to="/welcome" className="font-semibold text-[#a1a1aa] no-underline hover:text-white">{t('site.footer_welcome')}</Link>
            <Link to="/goal" className="font-semibold text-[#a1a1aa] no-underline hover:text-white">{t('site.footer_goal')}</Link>
            <Link to="/frequency" className="font-semibold text-[#a1a1aa] no-underline hover:text-white">{t('site.footer_frequency')}</Link>
            <Link to="/schedule" className="font-semibold text-[#a1a1aa] no-underline hover:text-white">{t('site.footer_schedule')}</Link>
            <Link to="/username" className="font-semibold text-[#a1a1aa] no-underline hover:text-white">{t('site.footer_username')}</Link>
            <Link to="/dashboard" className="font-semibold text-[#a1a1aa] no-underline hover:text-white">{t('site.footer_dashboard')}</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
