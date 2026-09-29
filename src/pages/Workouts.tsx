import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { KEYS, doneKey, loadStr } from '../lib/store';
import { useAutoGreet } from '../lib/voice';
import { useHelperHints } from '../lib/helper';
import { useToast } from '../lib/ui';

interface MuscleCard {
  p: string;
  ex: string;
  label: string;
  img: string;
}

const GROUPS = [
  'legs',
  'back',
  'abs',
  'arms',
  'shoulders',
  'cardio',
  'chest',
  'glutes',
  'fullbody',
  'face',
  'neck',
];

const CARDS: MuscleCard[] = [
  { p: 'legs', ex: 'squats', label: 'Legs', img: './foxit-running.png' },
  { p: 'back', ex: 'standing rows', label: 'Back', img: './foxit-thinking.png' },
  { p: 'abs', ex: 'knee raises', label: 'Abdomen', img: './foxit-dashboard.png' },
  { p: 'arms', ex: 'arm curls', label: 'Arms', img: './foxit-alarmtime.png' },
  { p: 'shoulders', ex: 'overhead press', label: 'Shoulders', img: './foxit-asking.png' },
  { p: 'cardio', ex: 'jumping jacks', label: 'Cardio', img: './Foxit-loadingpage.png' },
  { p: 'chest', ex: 'wall push', label: 'Chest', img: './Foxit-welcome.png' },
  { p: 'glutes', ex: 'standing kickbacks', label: 'Glutes', img: './foxit-glutes.png' },
  { p: 'fullbody', ex: 'squat press', label: 'Full body', img: './foxit-fullbody.png' },
  { p: 'face', ex: 'jaw opens face yoga', label: 'Face', img: './foxit-cool.png' },
  { p: 'neck', ex: 'head nods neck rolls', label: 'Neck', img: './foxit-coach.png' },
];

const MOTIONS = [
  { value: 'legs', label: 'Squats' },
  { value: 'back', label: 'Rows' },
  { value: 'abs', label: 'Knee raises' },
  { value: 'arms', label: 'Curls' },
  { value: 'shoulders', label: 'Press' },
  { value: 'cardio', label: 'Jacks' },
  { value: 'chest', label: 'Wall push' },
  { value: 'glutes', label: 'Kickbacks' },
  { value: 'fullbody', label: 'Squat press' },
];

// Only real words make it through — "yes" is not a workout
const JUNK = new Set([
  'yes', 'no', 'nope', 'ok', 'okay', 'yo', 'hi', 'hey', 'lol', 'idk', 'test',
  'asdf', 'qwer', 'abc', 'aaa', 'xxx', 'blah', 'maybe', 'nothing', 'whatever',
  'qwerty', 'hello', 'the', 'and', 'this', 'that', 'what', 'when', 'why', 'who',
  'how', 'are', 'you', 'i', 'a', 'an', 'it', 'is', 'be', 'do', 'so', 'xd',
  'hehe', 'haha', 'foxit', 'cool', 'stuff', 'something', 'random', 'free',
  'style', 'none', 'nah', 'yep', 'yup', 'nahh', 'pro',
]);

const JUNK_TOAST = 'Name a real workout — like “calf raises” or “neck rolls”';

function looksLikeWorkout(raw: string): string | false {
  const w = raw
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (w.replace(/[\s-]/g, '').length < 3) return false; // too short: "hi", "8"
  const letters = (w.match(/[a-z]/g) || []).length;
  if (letters < 2) return false; // needs an actual word
  const words = w.split(' ').filter(Boolean);
  if (words.length && words.every((x) => JUNK.has(x))) return false; // "yes yes" still isn't a workout
  if (JUNK.has(w)) return false;
  if (/^(.)\1+$/.test(w.replace(/[\s-]/g, ''))) return false; // "aaaa", "hhh"
  const core = w.replace(/\s/g, '');
  if ((core.match(/[a-z0-9]/g) || []).length / core.length < 0.7) return false; // symbol soup
  if (/^\d+$/.test(core)) return false; // "8"
  return w;
}

export default function Workouts() {
  const navigate = useNavigate();
  const { toast, toastEl } = useToast();
  const [query, setQuery] = useState('');
  const [customName, setCustomName] = useState('');
  const [customMotion, setCustomMotion] = useState('legs');
  const [foxOk, setFoxOk] = useState(true);
  const [name] = useState(() => loadStr(KEYS.username, 'champ'));
  const [doneSet] = useState<Set<string>>(() => {
    const s = new Set<string>();
    try {
      GROUPS.forEach((g) => {
        if (localStorage.getItem(doneKey(g))) s.add(g);
      });
    } catch {
      /* storage unavailable */
    }
    return s;
  });

  useAutoGreet(`Yo! I'm Foxit Cool — let's train, ${name}!`);

  const filtered = useMemo(() => {
    const v = query.trim().toLowerCase();
    if (!v) return CARDS;
    return CARDS.filter((c) =>
      `${c.p} ${c.ex} ${c.label}`.toLowerCase().includes(v),
    );
  }, [query]);

  useHelperHints([query, filtered.length]);

  const customURL = (workout: string) =>
    `/verify?custom=${encodeURIComponent(workout)}&motion=${customMotion}`;

  const handleCustomGo = () => {
    const v = looksLikeWorkout(customName.slice(0, 24));
    if (!v) {
      toast(JUNK_TOAST);
      return;
    }
    navigate(customURL(v));
  };

  const handleNoHitGo = () => {
    const raw = query.trim().slice(0, 24);
    const v = looksLikeWorkout(raw);
    if (raw && !v) {
      toast(JUNK_TOAST);
      return;
    }
    navigate(customURL(v || 'Freestyle'));
  };

  const handleNext = () => {
    let next = 'legs';
    try {
      next = GROUPS.find((g) => !localStorage.getItem(doneKey(g))) ?? 'legs';
    } catch {
      next = 'legs';
    }
    navigate(`/verify?group=${next}`);
  };

  const showNoHit = query.trim() !== '' && filtered.length === 0;

  return (
    <div className="fox-stage">
      <div className="mx-auto w-full max-w-[380px] text-center">
        <div className="mb-2.5 flex items-center justify-between">
          <Link to="/dashboard" className="text-[13px] font-extrabold text-[#999] no-underline">
            ← dashboard
          </Link>
          <b className="text-[17px] tracking-tight">
            fox<span className="text-[#FF6B35]">it</span>
          </b>
          <span style={{ width: 74 }} />
        </div>

        <div className="mb-3.5 rounded-2xl border border-[#222] bg-[#111] px-4 py-3.5 text-[15px]">
          Yo! I&apos;m <b className="text-[#FF6B35]">Foxit Cool</b> — let&apos;s train,{' '}
          <b className="text-[#FF6B35]">{name}</b>!
        </div>

        <div className="mx-auto aspect-square w-[min(68vw,260px)]">
          {foxOk ? (
            <img
              className="block h-full w-full object-contain"
              style={{ filter: 'drop-shadow(0 8px 32px rgba(46,124,246,.45))' }}
              src="./foxit-cool.png"
              alt="Foxit Cool welcoming you"
              onError={() => setFoxOk(false)}
            />
          ) : (
            <img
              className="mx-auto block h-[110px] w-[110px] object-contain"
              src="./foxit-logo.png"
              alt="Foxit"
            />
          )}
        </div>

        <h1 className="mt-3 text-[28px] font-semibold tracking-tight">Workouts</h1>
        <p className="fox-hint mt-1.5 text-sm">Pick your posture — scroll less, move more</p>

        <div className="mt-3.5 flex items-center gap-2 rounded-full border border-[#222] bg-[#111] px-4 py-2">
          <span aria-hidden="true" className="text-[#555]">⌕</span>
          <input
            id="q"
            type="text"
            autoComplete="off"
            placeholder="Muscle or move: legs, jumping jacks…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="min-w-0 flex-1 border-none bg-transparent text-sm font-semibold text-white outline-none"
          />
        </div>

        <div className="mt-2 flex gap-2">
          <input
            id="customName"
            type="text"
            maxLength={24}
            autoComplete="off"
            placeholder="Or type ANY workout: neck, calves…"
            value={customName}
            onChange={(e) => setCustomName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCustomGo();
            }}
            className="min-w-0 flex-1 rounded-xl border border-[#333] bg-[#0a0a0a] px-3 py-2.5 text-sm font-semibold text-white focus:border-[#2E7CF6] focus:outline-none"
          />
          <select
            id="customMotion"
            aria-label="tracking motion"
            value={customMotion}
            onChange={(e) => setCustomMotion(e.target.value)}
            className="w-[118px] flex-none rounded-xl border border-[#333] bg-[#0a0a0a] px-1.5 py-2.5 text-[13px] font-bold text-white focus:border-[#2E7CF6] focus:outline-none"
          >
            {MOTIONS.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
          <button
            id="customGo"
            data-hint="start custom workout"
            aria-label="start custom workout"
            onClick={handleCustomGo}
            className="w-[52px] flex-none cursor-pointer rounded-xl border-2 border-b-4 border-[#B34A1F] bg-[#2E7CF6] text-[18px] font-black text-white active:translate-y-0.5 active:border-b-2"
          >
            →
          </button>
        </div>
        <div className="fox-hint mt-1.5 text-[11px]">
          Preset buttons are just suggestions — name anything, pick how it&apos;s tracked, train.
        </div>

        {showNoHit && (
          <div className="mt-2.5 rounded-[14px] border border-dashed border-[#444] bg-[#111] p-3 text-[13px] text-[#999]">
            <span>No preset for &ldquo;{query.trim()}&rdquo; — train it your way:</span>
            <button
              id="noHitGo"
              data-hint="train it anyway"
              onClick={handleNoHitGo}
              className="mt-2 w-full cursor-pointer rounded-xl border-2 border-[#B34A1F] bg-[#2E7CF6] py-2.5 text-sm font-black text-white"
            >
              Train it anyway →
            </button>
          </div>
        )}

        <div className="mt-4 grid grid-cols-3 gap-2">
          {filtered.map((c) => {
            const done = doneSet.has(c.p);
            return (
              <button
                key={c.p}
                data-hint={`train ${c.p}`}
                onClick={() => navigate(`/verify?group=${c.p}`)}
                style={done ? { borderColor: '#2E7CF6' } : undefined}
                className="cursor-pointer rounded-[14px] border-2 border-b-4 border-[#2a2a2e] bg-[#111] px-0.5 pb-2 pt-2.5 text-white active:translate-y-0.5 active:border-b-2"
              >
                <span className="block">
                  <img
                    src={c.img}
                    alt={c.label}
                    loading="lazy"
                    className="mx-auto block h-[46px] w-[46px] object-contain"
                    style={{ filter: 'drop-shadow(0 4px 12px rgba(255,107,53,.3))' }}
                  />
                </span>
                <small className="mt-1 block text-[10px] font-extrabold text-[#999]">
                  {c.label}
                  {done ? ' ✓' : ''}
                </small>
              </button>
            );
          })}
        </div>

        <div className="mt-[18px]">
          <button
            id="goBtn"
            data-hint="start workout"
            onClick={handleNext}
            className="fox-btn-primary flex h-[60px] w-full cursor-pointer items-center justify-center gap-2.5 rounded-[18px] text-[18px] active:translate-y-0.5"
            style={{ textShadow: '0 1px 4px rgba(0,0,0,.4)' }}
          >
            start workout <span aria-hidden="true">→</span>
          </button>
        </div>
      </div>
      {toastEl}
    </div>
  );
}
