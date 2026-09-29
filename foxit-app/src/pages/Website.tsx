import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useHelperHints } from '../lib/helper';

const FEATURES = [
  {
    ico: '🎯',
    h: 'Meter goals that fit you',
    p: '100 m to 50 km per day. Quick chips for 1k, 2k, 5k, 10k. Split automatically across your runs.',
  },
  {
    ico: '⏰',
    h: '1–3 runs on your schedule',
    p: 'Morning, midday, evening — type hour : minutes + AM/PM. Adjust count anytime with the stepper.',
  },
  {
    ico: '🗺️',
    h: 'Live map, real streets',
    p: 'Leaflet + OpenStreetMap with GPS centering, world-wide search, zoom controls, and routing to your spot.',
  },
  {
    ico: '📍',
    h: 'Spots + start point',
    p: 'Park Loop, Riverside, Track, Hill Trail — or tap the map to add your own. Drop a 🏁 start and get a driving-style route.',
  },
  {
    ico: '🏃',
    h: 'One-tap GPS tracking',
    p: 'Hit run! → live arrow, distance + timer. Hit stop → saved to history, confetti, run checked off.',
  },
  {
    ico: '🔥',
    h: 'Streaks that stick',
    p: 'Mon–Sun week view, day streak counter, tips from Foxit every tap. Works offline — chips still work.',
  },
];

const STEPS = [
  {
    img: './Foxit-welcome.png',
    alt: 'Welcome',
    step: 'Step 1 · Say hi',
    h: 'Meet Foxit',
    p: 'Cheeky fox, big energy. Sets the vibe: run morning & afternoon.',
    to: '/welcome',
    label: 'Open welcome →',
  },
  {
    img: './foxit-running.png',
    alt: 'Set goal',
    step: 'Step 2 · Set goal',
    h: 'Pick your meters',
    p: 'How many meters is your daily goal? Start with 2000 m.',
    to: '/goal',
    label: 'Open goal picker →',
  },
  {
    img: './foxit-thinking.png',
    alt: 'Frequency',
    step: 'Step 3 · Plan it',
    h: '1, 2 or 3 runs?',
    p: 'Then set exact times with the alarm editor. Foxit remembers.',
    to: '/frequency',
    label: 'Open planner →',
  },
  {
    img: './foxit-dashboard.png',
    alt: 'Dashboard',
    step: 'Step 4 · Run!',
    h: 'Pick spot → run!',
    p: 'Live map, GPS arrow, streak week. Tap the fox for tips.',
    to: '/dashboard',
    label: 'Open dashboard →',
  },
];

const MASCOTS_TOP = [
  { img: './Foxit-loadingpage.png', alt: 'Foxit loading', b: 'Focused', s: 'loading screen · breathe animation' },
  { img: './Foxit-welcome.png', alt: 'Foxit waving', b: 'Hype buddy', s: 'welcome · wave animation' },
  { img: './foxit-running.png', alt: 'Foxit running', b: 'Pacemaker', s: 'goal screen · bounce run' },
  { img: './foxit-thinking.png', alt: 'Foxit thinking', b: 'Planner', s: 'frequency · think tilt' },
];

const MASCOTS_BOTTOM = [
  { img: './foxit-asking.png', alt: 'Foxit asking name', b: 'Curious', s: 'username screen' },
  { img: './foxit-alarmtime.png', alt: 'Foxit alarm', b: 'Punctual', s: 'schedule screen' },
  { img: './foxit-dashboard.png', alt: 'Foxit dashboard', b: 'Coach', s: 'dashboard hero' },
];

export default function Website() {
  // Marketing page: no voice here, but helper chips still apply.
  useHelperHints();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-dvh bg-[#070707] text-white">
      <header className="sticky top-0 z-50 border-b border-[#1a1a1e] bg-[rgba(7,7,7,.82)] backdrop-blur-xl">
        <div className="mx-auto flex w-[min(92vw,1120px)] items-center justify-between py-3.5">
          <a href="#top" className="flex items-center gap-2.5 text-[22px] font-black tracking-tight no-underline">
            <img src="./foxit-logo.png" alt="Foxit logo" className="h-9 w-9 rounded-[10px]" />
            <span>
              fox<span className="text-[#FF6B35]">it</span>
            </span>
          </a>
          <nav className={`${menuOpen ? 'flex' : 'hidden'} absolute inset-x-0 top-16 flex-col items-start gap-5 bg-[#0e0e10] px-[4vw] py-3.5 md:static md:flex md:flex-row md:items-center md:gap-[22px] md:bg-transparent md:p-0`}>
            <a href="#features" onClick={() => setMenuOpen(false)} className="text-sm font-semibold text-[#a1a1aa] no-underline hover:text-white">Features</a>
            <a href="#how" onClick={() => setMenuOpen(false)} className="text-sm font-semibold text-[#a1a1aa] no-underline hover:text-white">How it works</a>
            <a href="#live-map" onClick={() => setMenuOpen(false)} className="text-sm font-semibold text-[#a1a1aa] no-underline hover:text-white">Live map</a>
            <a href="#mascots" onClick={() => setMenuOpen(false)} className="text-sm font-semibold text-[#a1a1aa] no-underline hover:text-white">Meet Foxit</a>
            <a href="#faq" onClick={() => setMenuOpen(false)} className="text-sm font-semibold text-[#a1a1aa] no-underline hover:text-white">FAQ</a>
            <Link to="/" onClick={() => setMenuOpen(false)} className="fox-btn-orange rounded-full px-[18px] py-2 text-sm no-underline">
              Open app →
            </Link>
          </nav>
          <button
            type="button"
            aria-label="menu"
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
                🦊 run more · scroll less
              </span>
              <h1 className="my-[18px] text-[clamp(42px,6vw,72px)] font-black leading-[.95] tracking-[-.04em]">
                2 runs a day keeps the <em className="not-italic text-[#FF6B35]">scroll</em> away.
              </h1>
              <p className="max-w-[46ch] text-lg text-[#a1a1aa]">
                Foxit is your pocket running coach — a cheeky fox who helps you set a daily meter
                goal, schedule morning &amp; afternoon runs, pick a spot on a live map, and keep
                the streak alive.
              </p>
              <div className="mt-[26px] flex flex-wrap gap-3">
                <Link to="/" className="fox-btn-orange rounded-full px-6 py-3 text-base no-underline">
                  Start running →
                </Link>
                <Link to="/dashboard" className="rounded-full border-2 border-[#2a2a2e] border-b-4 bg-[#161618] px-[22px] py-[11px] text-[15px] font-extrabold text-white no-underline hover:border-[#FF6B35]">
                  Live demo dashboard
                </Link>
              </div>
              <div className="mt-3.5 text-[13px] font-semibold text-[#666]">
                No install · works in browser · free maps · GPS tracking
              </div>
              <div className="mt-[26px] flex flex-wrap gap-2.5">
                <div className="min-w-[132px] rounded-2xl border-2 border-[#222226] border-b-4 bg-[#111113] px-4 py-3">
                  <b className="block text-[22px] font-black">100<i className="not-italic text-[#FF6B35]">m</i> – 50<i className="not-italic text-[#FF6B35]">km</i></b>
                  <span className="text-xs font-semibold text-[#a1a1aa]">flexible daily goals</span>
                </div>
                <div className="min-w-[132px] rounded-2xl border-2 border-[#222226] border-b-4 bg-[#111113] px-4 py-3">
                  <b className="block text-[22px] font-black">1 – 3</b>
                  <span className="text-xs font-semibold text-[#a1a1aa]">runs per day</span>
                </div>
                <div className="min-w-[132px] rounded-2xl border-2 border-[#222226] border-b-4 bg-[#111113] px-4 py-3">
                  <b className="block text-[22px] font-black">🔥 streak</b>
                  <span className="text-xs font-semibold text-[#a1a1aa]">week view + confetti</span>
                </div>
              </div>
            </div>

            {/* Phone mock: the vanilla page embedded the live app in an iframe;
                ported as a static preview that routes into the app instead. */}
            <div className="relative flex items-start justify-center">
              <div className="absolute left-0 top-[18%] rounded-2xl border border-[#2c2c32] bg-[rgba(17,17,19,.94)] px-3.5 py-2.5 text-[13px] font-bold shadow-[0_12px_40px_rgba(0,0,0,.5)] max-md:hidden">
                📍 <b className="text-[#FF6B35]">Park Loop</b> · 800 m
              </div>
              <div className="absolute bottom-[18%] right-0 rounded-2xl border border-[#2c2c32] bg-[rgba(17,17,19,.94)] px-3.5 py-2.5 text-[13px] font-bold shadow-[0_12px_40px_rgba(0,0,0,.5)] max-md:hidden">
                🔥 <b className="text-[#FF6B35]">4 day</b> streak!
              </div>
              <div className="flex flex-col items-center">
                <div className="relative w-[min(78vw,302px)] rounded-[56px] bg-[linear-gradient(145deg,#4a4a4e,#101012_38%,#2e2e32_70%,#0a0a0c)] p-[11px] shadow-[0_30px_90px_rgba(0,0,0,.75),0_10px_55px_rgba(255,107,53,.22)]">
                  <div className="relative h-[560px] overflow-hidden rounded-[46px] border border-black bg-black">
                    <img src="./Foxit-welcome.png" alt="Foxit app preview" className="h-full w-full bg-black object-contain" />
                    <div className="absolute left-1/2 top-3 z-[5] flex h-[29px] w-28 -translate-x-1/2 items-center justify-end rounded-full border border-[#222] bg-black pr-3">
                      <span className="h-2.5 w-2.5 rounded-full bg-[#05070d]" />
                    </div>
                    <div className="absolute bottom-2 left-1/2 z-[6] h-[5px] w-[118px] -translate-x-1/2 rounded-full bg-white/90" />
                  </div>
                </div>
                <div className="mt-3.5 flex justify-center gap-2">
                  <Link to="/welcome" className="fox-btn-orange rounded-full px-4 py-2 text-[13px] no-underline">Welcome</Link>
                  <Link to="/goal" className="rounded-full border-2 border-[#2a2a2e] bg-[#161618] px-4 py-2 text-[13px] font-extrabold text-white no-underline">Goal</Link>
                  <Link to="/dashboard" className="rounded-full border-2 border-[#2a2a2e] bg-[#161618] px-4 py-2 text-[13px] font-extrabold text-white no-underline">Map</Link>
                </div>
                <Link to="/welcome" className="mt-2.5 text-xs text-[#666] no-underline hover:text-[#FF6B35]">
                  Open full app →
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* MARQUEE */}
        <div className="overflow-hidden whitespace-nowrap border-y border-[#1c1c20] bg-[#0a0a0c] py-3 text-[13px] font-bold uppercase tracking-[.12em] text-[#777]">
          <span className="mx-[18px]">🏃 morning run <b className="text-[#FF6B35]">·</b></span>
          <span className="mx-[18px]">📵 scroll less <b className="text-[#FF6B35]">·</b></span>
          <span className="mx-[18px]">🗺️ live map <b className="text-[#FF6B35]">·</b></span>
          <span className="mx-[18px]">🔥 streaks <b className="text-[#FF6B35]">·</b></span>
          <span className="mx-[18px]">📍 custom spots <b className="text-[#FF6B35]">·</b></span>
          <span className="mx-[18px]">⏰ run alarms <b className="text-[#FF6B35]">·</b></span>
          <span className="mx-[18px]">🦊 foxit coach <b className="text-[#FF6B35]">·</b></span>
          <span className="mx-[18px]">🏃 afternoon run <b className="text-[#FF6B35]">·</b></span>
        </div>

        {/* FEATURES */}
        <section id="features" className="py-[72px]">
          <div className="mx-auto w-[min(92vw,1120px)]">
            <div className="text-xs font-extrabold uppercase tracking-[.14em] text-[#FF6B35]">Why foxit</div>
            <h2 className="my-2.5 text-[clamp(28px,4vw,44px)] font-black leading-[1.05] tracking-[-.03em]">
              Small runs. Big habit.<br />Zero guilt-tripping.
            </h2>
            <p className="max-w-[62ch] text-base text-[#a1a1aa]">
              Everything in the app is designed to get you out the door — not to sell you shoes.
              Set it once, tap <b>run!</b> daily, watch the week light up.
            </p>
            <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((c) => (
                <div key={c.h} className="rounded-[20px] border-2 border-[#222226] border-b-[5px] bg-[#111113] p-[22px] text-left transition hover:-translate-y-1 hover:border-[#FF6B35]">
                  <div className="mb-3.5 flex h-11 w-11 items-center justify-center rounded-[13px] border border-[#2a2a2e] bg-[#1a1a1e] text-[22px]">{c.ico}</div>
                  <h3 className="mb-1.5 text-lg font-extrabold">{c.h}</h3>
                  <p className="text-sm text-[#a1a1aa]">{c.p}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section id="how" className="pb-[72px] pt-0">
          <div className="mx-auto w-[min(92vw,1120px)]">
            <div className="text-xs font-extrabold uppercase tracking-[.14em] text-[#FF6B35]">How it works</div>
            <h2 className="my-2.5 text-[clamp(28px,4vw,44px)] font-black leading-[1.05] tracking-[-.03em]">
              From “maybe later” to “done” in 4 taps.
            </h2>
            <p className="max-w-[62ch] text-base text-[#a1a1aa]">This is the real app flow — click any step to try it live.</p>
            <div className="mt-8 grid gap-3.5 md:grid-cols-2 lg:grid-cols-4">
              {STEPS.map((s) => (
                <div key={s.h} className="overflow-hidden rounded-[20px] border-2 border-[#232327] bg-[#0f0f12] text-left">
                  <img src={s.img} alt={s.alt} className="aspect-square w-full border-b border-[#222] bg-black object-contain p-3.5" />
                  <div className="p-4">
                    <small className="text-[11px] font-extrabold uppercase tracking-[.1em] text-[#FF6B35]">{s.step}</small>
                    <h3 className="my-1.5 text-[17px] font-extrabold">{s.h}</h3>
                    <p className="text-[13px] text-[#a1a1aa]">{s.p}</p>
                    <Link to={s.to} className="mt-1 inline-block text-[13px] font-extrabold text-white no-underline hover:text-[#FF6B35]">
                      {s.label}
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
            <div className="text-xs font-extrabold uppercase tracking-[.14em] text-[#FF6B35]">Live map deep-dive</div>
            <h2 className="my-2.5 text-[clamp(28px,4vw,44px)] font-black leading-[1.05] tracking-[-.03em]">
              Not a screenshot. A real running map.
            </h2>
            <div className="mt-5 grid items-center gap-7 md:grid-cols-2">
              <div>
                <p className="max-w-[62ch] text-base text-[#a1a1aa]">
                  The dashboard (<Link to="/dashboard" className="font-extrabold text-[#FF6B35]">try it</Link>) centers on you,
                  draws loop routes for each spot, and routes you from 🏁 start to 📍 spot via OSRM —
                  with a straight-line fallback offline.
                </p>
                <ul className="mt-[18px] grid list-none gap-2.5">
                  {[
                    '4 built-in spots — Park Loop 800 m, Riverside 1200 m, Track 400 m, Hill Trail 1500 m, each with animated dashed loops.',
                    '+ spot mode — arm it, tap anywhere, name it, set meters. Delete with × on the chip.',
                    '▶ start mode — set your start, get distance + ETA “pe drum” in the pill.',
                    '🔍 world search — Nominatim-powered, fly-to animation anywhere on Earth.',
                  ].map((li) => (
                    <li key={li} className="flex items-start gap-2.5 rounded-[14px] border border-[#222] bg-[#121214] p-3 text-sm">
                      <i className="flex h-[26px] w-[26px] flex-none items-center justify-center rounded-full bg-[#FF6B35] text-[13px] font-black not-italic text-black">✓</i>
                      <span>{li}</span>
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
                  <Link to="/dashboard" className="fox-btn-orange rounded-full px-[18px] py-2 text-sm no-underline">Open live map</Link>
                  <Link to="/schedule" className="rounded-full border-2 border-[#2a2a2e] border-b-4 bg-[#161618] px-[18px] py-2 text-sm font-extrabold text-white no-underline">Edit run times</Link>
                </div>
              </div>
            </div>
            <div className="mt-7 grid items-center gap-[22px] rounded-3xl border-2 border-[#232327] bg-[linear-gradient(180deg,#0e0e10,#070707)] p-[22px] md:grid-cols-2">
              <div>
                <h3 className="text-[22px] font-extrabold">Tracking that respects you</h3>
                <p className="mt-2 text-sm text-[#a1a1aa]">
                  GPS only starts after you press <b>run!</b>. Accuracy filter (&gt;30 m ignored),
                  3 m movement threshold, high-accuracy watch. Stop → distance saved, next run
                  auto-checked, week re-rendered.
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
            <div className="text-xs font-extrabold uppercase tracking-[.14em] text-[#FF6B35]">Meet foxit</div>
            <h2 className="my-2.5 text-[clamp(28px,4vw,44px)] font-black leading-[1.05] tracking-[-.03em]">
              One fox, many moods.
            </h2>
            <p className="max-w-[62ch] text-base text-[#a1a1aa]">
              Sporty, encouraging, slightly sassy. He lives in the app — tap him on the dashboard for tips.
            </p>
            <div className="mt-7 grid grid-cols-2 gap-3.5 lg:grid-cols-4">
              {MASCOTS_TOP.map((m) => (
                <div key={m.b} className="rounded-[20px] border-2 border-[#232327] bg-[#0f0f12] p-4 text-center">
                  <img src={m.img} alt={m.alt} className="aspect-square w-full object-contain" />
                  <b className="mt-2 block font-extrabold">{m.b}</b>
                  <span className="text-xs text-[#a1a1aa]">{m.s}</span>
                </div>
              ))}
            </div>
            <div className="mt-3.5 grid grid-cols-2 gap-3.5 md:grid-cols-3">
              {MASCOTS_BOTTOM.map((m) => (
                <div key={m.b} className="rounded-[20px] border-2 border-[#232327] bg-[#0f0f12] p-4 text-center">
                  <img src={m.img} alt={m.alt} className="mx-auto aspect-square w-full max-w-[280px] object-contain" />
                  <b className="mt-2 block font-extrabold">{m.b}</b>
                  <span className="text-xs text-[#a1a1aa]">{m.s}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ + CTA */}
        <section id="faq" className="pb-[72px]">
          <div className="mx-auto w-[min(92vw,1120px)]">
            <div className="text-xs font-extrabold uppercase tracking-[.14em] text-[#FF6B35]">FAQ</div>
            <h2 className="my-2.5 text-[clamp(28px,4vw,44px)] font-black leading-[1.05] tracking-[-.03em]">
              Quick answers.
            </h2>
            <div className="mt-7 grid max-w-[760px] gap-2.5">
              <details open className="rounded-2xl border-2 border-[#222226] bg-[#111113] px-[18px] py-4">
                <summary className="cursor-pointer text-base font-extrabold">Is Foxit free?</summary>
                <p className="mt-2 text-sm text-[#a1a1aa]">
                  Yes — this prototype runs entirely in your browser with free maps (OpenStreetMap),
                  free routing (OSRM) and free search (Nominatim). No keys, no backend. Your data
                  stays in localStorage on your device.
                </p>
              </details>
              <details className="rounded-2xl border-2 border-[#222226] bg-[#111113] px-[18px] py-4">
                <summary className="cursor-pointer text-base font-extrabold">Do I need to install anything?</summary>
                <p className="mt-2 text-sm text-[#a1a1aa]">
                  No. Open <Link to="/" className="text-[#FF6B35]">the app</Link> to start onboarding,
                  or jump straight to <Link to="/dashboard" className="text-[#FF6B35]">the dashboard</Link>.
                  For GPS, open via a secure context (https or http://127.0.0.1) and allow location.
                </p>
              </details>
              <details className="rounded-2xl border-2 border-[#222226] bg-[#111113] px-[18px] py-4">
                <summary className="cursor-pointer text-base font-extrabold">How do streaks work?</summary>
                <p className="mt-2 text-sm text-[#a1a1aa]">
                  Each day has 1–3 run slots. Finish at least one and the day counts. The counter walks
                  back day-by-day from today (or yesterday if today isn’t done yet). The week strip shows
                  Mon–Sun with ✓ for hit days.
                </p>
              </details>
              <details className="rounded-2xl border-2 border-[#222226] bg-[#111113] px-[18px] py-4">
                <summary className="cursor-pointer text-base font-extrabold">Can I run offline?</summary>
                <p className="mt-2 text-sm text-[#a1a1aa]">
                  Partially. Chips, spots, timers and logs all work offline. Live tiles, routing and
                  search need internet — the app shows an “Offline — map paused” note and falls back to
                  straight lines.
                </p>
              </details>
              <details className="rounded-2xl border-2 border-[#222226] bg-[#111113] px-[18px] py-4">
                <summary className="cursor-pointer text-base font-extrabold">Where is my data?</summary>
                <p className="mt-2 text-sm text-[#a1a1aa]">
                  In your browser’s localStorage under keys like <b>foxit_log</b> and <b>foxit_tracks</b>.
                  Clear site data to reset. Nothing is uploaded anywhere.
                </p>
              </details>
            </div>
            <div className="relative mt-5 overflow-hidden rounded-[28px] border-2 border-[rgba(255,107,53,.35)] bg-[#0d0d0f] px-7 py-12 text-center">
              <img src="./foxit-running.png" alt="Foxit running" className="mx-auto aspect-square w-[140px] object-contain" />
              <h2 className="mt-3 text-[clamp(28px,4vw,44px)] font-black leading-[1.05] tracking-[-.03em]">
                Ready? Foxit’s waiting. 🦊
              </h2>
              <p className="mx-auto max-w-[62ch] text-base text-[#a1a1aa]">
                Set a 2000 m goal. Run morning &amp; afternoon. Feel smug by dinner.
              </p>
              <div className="mt-[26px] flex flex-wrap justify-center gap-3">
                <Link to="/" className="fox-btn-orange rounded-full px-6 py-3 text-base no-underline">
                  Launch foxit →
                </Link>
                <Link to="/username" className="rounded-full border-2 border-[#2a2a2e] border-b-4 bg-[#161618] px-[22px] py-[11px] text-[15px] font-extrabold text-white no-underline">
                  Pick a username
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
              <img src="./foxit-logo.png" alt="logo" className="h-7 w-7 rounded-[10px]" />
              <span>fox<span className="text-[#FF6B35]">it</span></span>
            </a>
            <div className="mt-2">run more · scroll less — © 2026 Foxit.</div>
          </div>
          <div className="flex flex-wrap gap-[18px]">
            <Link to="/" className="font-semibold text-[#a1a1aa] no-underline hover:text-white">Loading</Link>
            <Link to="/welcome" className="font-semibold text-[#a1a1aa] no-underline hover:text-white">Welcome</Link>
            <Link to="/goal" className="font-semibold text-[#a1a1aa] no-underline hover:text-white">Goal</Link>
            <Link to="/frequency" className="font-semibold text-[#a1a1aa] no-underline hover:text-white">Frequency</Link>
            <Link to="/schedule" className="font-semibold text-[#a1a1aa] no-underline hover:text-white">Schedule</Link>
            <Link to="/username" className="font-semibold text-[#a1a1aa] no-underline hover:text-white">Username</Link>
            <Link to="/dashboard" className="font-semibold text-[#a1a1aa] no-underline hover:text-white">Dashboard</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
