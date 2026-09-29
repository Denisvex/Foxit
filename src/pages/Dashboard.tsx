import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Crosshair,
  DotsThree,
  Flame,
  Gear,
  MagnifyingGlass,
  MapPin,
  Minus,
  Play,
  Plus,
  X,
} from '@phosphor-icons/react';
import TabBar from '../components/TabBar';
import { KEYS, load, loadStr, save, saveStr } from '../lib/store';
import { useAutoGreet } from '../lib/voice';
import { useHelperHints } from '../lib/helper';
import { useToast } from '../lib/ui';

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

interface RunTime {
  h: number;
  m: number;
  ampm: string;
}

interface CustomSpot {
  id: string;
  name: string;
  dist: number;
  lat: number;
  lng: number;
}

interface SpotDef {
  n: number;
  name: string;
  dist: number;
  custom?: boolean;
}

interface DayLog {
  done: boolean[];
}

type LogMap = Record<string, DayLog>;

interface Track {
  d: string;
  t: number;
  meters: number;
  secs: number;
  spot: string;
}

interface Expression {
  id: string;
  src: string;
  label: string;
  filter?: string;
}

interface Material {
  id: string;
  label: string;
  sw: string;
  filter: string;
  art?: string;
}

interface NominatimResult {
  display_name: string;
  lat: string;
  lon: string;
}

interface OsrmResponse {
  routes?: Array<{
    geometry: { coordinates: number[][] };
    distance: number;
    duration: number;
  }>;
}

/* ------------------------------------------------------------------ */
/* Constants ported 1:1 from dashboard.html                             */
/* ------------------------------------------------------------------ */

const SPOTS: Record<string, SpotDef> = {
  park: { n: 1, name: 'Park Loop', dist: 800 },
  river: { n: 2, name: 'Riverside', dist: 1200 },
  track: { n: 3, name: 'Track', dist: 400 },
  hill: { n: 4, name: 'Hill Trail', dist: 1500 },
};

const SPOT_GEO: Record<string, { bearing: number; d: number }> = {
  park: { bearing: 300, d: 350 },
  river: { bearing: 80, d: 700 },
  track: { bearing: 200, d: 450 },
  hill: { bearing: 40, d: 900 },
};

const NAMES: Record<number, string[]> = {
  1: ['Your run'],
  2: ['Morning run', 'Afternoon run'],
  3: ['Morning run', 'Midday run', 'Evening run'],
};

const DEFAULTS: Record<number, RunTime[]> = {
  1: [{ h: 8, m: 0, ampm: 'AM' }],
  2: [
    { h: 7, m: 0, ampm: 'AM' },
    { h: 5, m: 0, ampm: 'PM' },
  ],
  3: [
    { h: 7, m: 0, ampm: 'AM' },
    { h: 12, m: 0, ampm: 'PM' },
    { h: 6, m: 0, ampm: 'PM' },
  ],
};

const HOME: [number, number] = [40.7812, -73.9665];
const FINISH_RADIUS = 50;

const TIPS = [
  'Drink water before you go! 💧',
  'Morning runs hit different 🌅',
  'New spot? Riverside is flat & fast 🏞️',
  'Streaks are built one run at a time 🔥',
  'Tie those shoes tight! 👟',
  'Walk more, scroll less 📵',
];

const EXPRESSIONS: Expression[] = [
  { id: 'happy', src: 'foxit-dashboard.png', label: 'Happy' },
  { id: 'runner', src: 'foxit-running.png', label: 'Runner' },
  { id: 'thinker', src: 'foxit-thinking.png', label: 'Thinker' },
  { id: 'curious', src: 'foxit-asking.png', label: 'Curious' },
  { id: 'early', src: 'foxit-alarmtime.png', label: 'Early bird' },
  { id: 'jumper', src: 'Foxit-loadingpage.png', label: 'Jumper' },
  { id: 'waver', src: 'Foxit-welcome.png', label: 'Waver' },
  { id: 'classic', src: 'foxit-logo.png', label: 'Classic' },
  { id: 'sunset', src: 'foxit-dashboard.png', label: 'Sunset', filter: 'hue-rotate(-40deg) saturate(1.5)' },
  { id: 'night', src: 'foxit-dashboard.png', label: 'Night owl', filter: 'brightness(.75) saturate(.85) hue-rotate(15deg)' },
  { id: 'mono', src: 'foxit-dashboard.png', label: 'Mono', filter: 'grayscale(1)' },
  { id: 'gold', src: 'foxit-dashboard.png', label: 'Gold', filter: 'sepia(.6) saturate(2.2) hue-rotate(-15deg)' },
];

const MATERIALS: Material[] = [
  { id: 'classic', label: 'Classic', sw: 'linear-gradient(135deg,#FF6B35,#2E7CF6)', filter: '' },
  { id: 'ruby', label: 'Ruby', sw: 'linear-gradient(135deg,#c22330,#5e0d14)', filter: '', art: 'ruby' },
  { id: 'sapphire', label: 'Sapphire', sw: 'linear-gradient(135deg,#4da6ff,#0b2fa0)', filter: 'hue-rotate(150deg) saturate(1.6)' },
  { id: 'emerald', label: 'Emerald', sw: 'linear-gradient(135deg,#3ddc84,#0a6b3a)', filter: 'hue-rotate(110deg) saturate(1.5)' },
  { id: 'amethyst', label: 'Amethyst', sw: 'linear-gradient(135deg,#c86bff,#5b1a9e)', filter: 'hue-rotate(-110deg) saturate(1.6)' },
  { id: 'topaz', label: 'Topaz', sw: 'linear-gradient(135deg,#ffd02f,#b87a00)', filter: 'sepia(.5) saturate(2.5) hue-rotate(-10deg)' },
  { id: 'diamond', label: 'Diamond', sw: 'linear-gradient(135deg,#ffffff,#9adfff)', filter: 'saturate(.3) brightness(1.35)' },
  { id: 'iron', label: 'Iron', sw: 'linear-gradient(135deg,#cfd2d8,#5a5e66)', filter: 'grayscale(1) brightness(.9) contrast(1.2)' },
];

const GOAL_PRESETS = [1000, 2000, 5000, 10000];

/* ------------------------------------------------------------------ */
/* Pure helpers (outside component so map callbacks stay stable)        */
/* ------------------------------------------------------------------ */

const pad = (n: number): string => String(n).padStart(2, '0');
const dayKey = (d: Date): string => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

const rad = (x: number): number => (x * Math.PI) / 180;
const deg = (x: number): number => (x * 180) / Math.PI;

function dest(lat: number, lng: number, brg: number, dist: number): [number, number] {
  const R = 6371000;
  const d = dist / R;
  const b = rad(brg);
  const la1 = rad(lat);
  const lo1 = rad(lng);
  const la2 = Math.asin(Math.sin(la1) * Math.cos(d) + Math.cos(la1) * Math.sin(d) * Math.cos(b));
  const lo2 = lo1 + Math.atan2(Math.sin(b) * Math.sin(d) * Math.cos(la1), Math.cos(d) - Math.sin(la1) * Math.sin(la2));
  return [deg(la2), deg(lo2)];
}

function loopPts(lat: number, lng: number, meters: number): [number, number][] {
  const r = meters / (2 * Math.PI);
  const pts: [number, number][] = [];
  for (let i = 0; i <= 24; i++) {
    pts.push(dest(lat, lng, (i / 24) * 360, r));
  }
  return pts;
}

function hav(a: [number, number], b: [number, number]): number {
  const R = 6371000;
  const la1 = (a[0] * Math.PI) / 180;
  const la2 = (b[0] * Math.PI) / 180;
  const x = (((b[1] - a[1]) * Math.PI) / 180) * Math.cos((la1 + la2) / 2);
  const y = ((b[0] - a[0]) * Math.PI) / 180;
  return Math.sqrt(x * x + y * y) * R;
}

function allSpotDefs(customs: CustomSpot[]): Record<string, SpotDef> {
  const m: Record<string, SpotDef> = { ...SPOTS };
  customs.forEach((c, i) => {
    m[c.id] = { n: 5 + i, name: c.name, dist: c.dist, custom: true };
  });
  return m;
}

/** Ruby material swaps every expression PNG for its *-ruby.png art. */
function artSrc(src: string, mat: Material | null): string {
  return mat && mat.art === 'ruby' ? src.replace(/\.png$/i, '-ruby.png') : src;
}

function exprOf(id: string | null): Expression {
  return EXPRESSIONS.find((x) => x.id === id) ?? EXPRESSIONS[0];
}

function matOf(id: string | null): Material {
  return MATERIALS.find((x) => x.id === id) ?? MATERIALS[0];
}

function makePinIcon(defs: Record<string, SpotDef>, id: string, selected: string): L.DivIcon {
  const s = defs[id] ?? { n: 0, name: '', dist: 0 };
  return L.divIcon({
    className: '',
    html: `<div class="fp-pin${id === selected ? ' sel' : ''}">${s.n}</div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  });
}

function arrowIcon(rot: number, col: string): L.DivIcon {
  return L.divIcon({
    className: '',
    html: `<div class="cursor-wrap" style="transform:rotate(${rot}deg)"><svg width="26" height="26" viewBox="0 0 24 24"><path d="M12 2 L19 21 L12 17 L5 21 Z" fill="${col}" stroke="#000" stroke-width="1.6" stroke-linejoin="round"/></svg></div>`,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
  });
}

function confetti(x: number, y: number): void {
  const colors = ['#FF6B35', '#FFD02F', '#3b82f6', '#ffffff', '#7CFC00'];
  for (let i = 0; i < 28; i++) {
    const c = document.createElement('div');
    c.className = 'confetti-dot';
    c.style.background = colors[i % colors.length];
    c.style.left = `${x}px`;
    c.style.top = `${y}px`;
    document.body.appendChild(c);
    const dx = (Math.random() - 0.5) * 320;
    const dy = -80 - Math.random() * 220;
    const anim = c.animate(
      [
        { transform: 'translate(0,0) rotate(0deg)', opacity: 1 },
        { transform: `translate(${dx}px,${dy + 260}px) rotate(${Math.random() * 720 - 360}deg)`, opacity: 0 },
      ],
      { duration: 900 + Math.random() * 700, easing: 'cubic-bezier(.2,.7,.3,1)' },
    );
    anim.onfinish = () => c.remove();
  }
}

/* ------------------------------------------------------------------ */
/* Boot state (read once, mirrors the original load sequence)           */
/* ------------------------------------------------------------------ */

interface Boot {
  username: string;
  goal: number;
  count: number;
  times: RunTime[];
  log: LogMap;
  spot: string;
  customs: CustomSpot[];
  startPt: { lat: number; lng: number } | null;
  exprId: string | null;
  matId: string | null;
}

function loadBoot(today: string): Boot {
  const username = loadStr(KEYS.username, '') || 'runner';
  const goal = parseInt(loadStr(KEYS.goalMeters, ''), 10) || 2000;
  let count = parseInt(loadStr(KEYS.runsPerDay, ''), 10);
  if (!(count >= 1 && count <= 3)) count = 2;
  let times: RunTime[] =
    load<RunTime[] | null>(KEYS.runTimes, null) ??
    load<RunTime[] | null>('foxit_walk_times', null) ??
    DEFAULTS[count].map((t) => ({ ...t }));
  times = times.slice(0, count);
  while (times.length < count) times.push({ ...DEFAULTS[count][times.length] });
  const customs = load<CustomSpot[]>('foxit_custom_spots', []);
  const defs = allSpotDefs(customs);
  let spot = loadStr(KEYS.spot, '');
  if (!defs[spot]) spot = 'park';
  const log = load<LogMap>(KEYS.log, {});
  if (!log[today] || !Array.isArray(log[today].done) || log[today].done.length !== count) {
    log[today] = { done: Array.from({ length: count }, () => false) };
  }
  const startPt = load<{ lat: number; lng: number } | null>('foxit_start', null);
  return {
    username,
    goal,
    count,
    times,
    log,
    spot,
    customs,
    startPt,
    exprId: loadStr(KEYS.expression, '') || null,
    matId: loadStr(KEYS.material, '') || null,
  };
}

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

export default function Dashboard() {
  const [now] = useState(() => new Date());
  const todayKey = dayKey(now);
  const [boot] = useState(() => loadBoot(dayKey(new Date())));

  const [username, setUsername] = useState(boot.username);
  const [goal, setGoal] = useState(boot.goal);
  const [count, setCount] = useState(boot.count);
  const [times, setTimes] = useState<RunTime[]>(boot.times);
  const [log, setLog] = useState<LogMap>(boot.log);
  const [spot, setSpot] = useState(boot.spot);
  const [customs, setCustoms] = useState<CustomSpot[]>(boot.customs);
  const [exprId, setExprId] = useState<string | null>(boot.exprId);
  const [matId, setMatId] = useState<string | null>(boot.matId);

  const [tipIdx, setTipIdx] = useState<number | null>(null);
  const [tracking, setTracking] = useState(false);
  const [targetName, setTargetName] = useState('');
  const [routeInfo, setRouteInfo] = useState<string | null>(null);
  const [thirsty, setThirsty] = useState(false);
  const [, setTick] = useState(0);

  const [profileOpen, setProfileOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [goalInput, setGoalInput] = useState('');
  const [nameInput, setNameInput] = useState('');

  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<NominatimResult[]>([]);
  const [searchMsg, setSearchMsg] = useState<string | null>('Type to search anywhere in the world 🌍');
  const [searching, setSearching] = useState(false);

  const [chipsVisible, setChipsVisible] = useState(false);
  const [mapToolsVisible, setMapToolsVisible] = useState(false);
  const [adding, setAdding] = useState(false);
  const [startArmed, setStartArmed] = useState(false);
  const [spotFormOpen, setSpotFormOpen] = useState(false);
  const [formName, setFormName] = useState('');
  const [formDist, setFormDist] = useState('');
  const [mapFailed, setMapFailed] = useState(false);

  const { toast, toastEl } = useToast();
  useAutoGreet(`Welcome, ${boot.username}! Pick a spot and hit run!`);
  useHelperHints([
    profileOpen,
    settingsOpen,
    searchOpen,
    chipsVisible,
    mapToolsVisible,
    spotFormOpen,
    customs.length,
    tracking,
    results.length,
  ]);

  /* Refs (map + run engine live here so Leaflet callbacks stay fresh) */
  const mapDivRef = useRef<HTMLDivElement | null>(null);
  const runBtnRef = useRef<HTMLButtonElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const spotNameRef = useRef<HTMLInputElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Record<string, L.Marker>>({});
  const routesRef = useRef<Record<string, L.Polyline>>({});
  const youMarkerRef = useRef<L.Marker | null>(null);
  const startMarkerRef = useRef<L.Marker | null>(null);
  const tempMarkerRef = useRef<L.Marker | null>(null);
  const pathLayersRef = useRef<L.Polyline[]>([]);
  const pathSeqRef = useRef(0);
  const aliveRef = useRef(true);

  const spotRef = useRef(spot);
  const countRef = useRef(count);
  const customsRef = useRef(customs);
  const startPtRef = useRef<{ lat: number; lng: number } | null>(boot.startPt);
  const logRef = useRef(log);

  const trackingRef = useRef(false);
  const watchIdRef = useRef<number | null>(null);
  const trDistRef = useRef(0);
  const trT0Ref = useRef(0);
  const trTimerRef = useRef(0);
  const trLastRef = useRef<[number, number] | null>(null);
  const trArrowRef = useRef<L.Marker | null>(null);
  const trTargetRef = useRef<{ lat: number; lng: number } | null>(null);
  const trTargetNameRef = useRef('');
  const trLastMoveRef = useRef(0);
  const trThirstyAtRef = useRef(0);
  const thirstTimerRef = useRef(0);
  const searchTimerRef = useRef(0);
  const searchSeqRef = useRef(0);
  const tempLatLngRef = useRef<[number, number] | null>(null);
  const onMapTapRef = useRef((_e: L.LeafletMouseEvent) => {});

  const expr = exprOf(exprId);
  const mat = matOf(matId);
  const heroFilter = mat.art === 'ruby' ? '' : [mat.filter, expr.filter].filter(Boolean).join(' ') || '';

  /* Week + streak (derived from foxit_log) */
  const week = useMemo(() => {
    const dayDone = (k: string): boolean => {
      const e = log[k];
      return !!e && Array.isArray(e.done) && e.done.some(Boolean);
    };
    let s = 0;
    const d = new Date(now);
    if (!dayDone(dayKey(d))) d.setDate(d.getDate() - 1);
    while (dayDone(dayKey(d))) {
      s++;
      d.setDate(d.getDate() - 1);
    }
    const off = (now.getDay() + 6) % 7;
    const mon = new Date(now);
    mon.setDate(now.getDate() - off);
    const labels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
    const days = [];
    for (let i = 0; i < 7; i++) {
      const dayD = new Date(mon);
      dayD.setDate(mon.getDate() + i);
      const k = dayKey(dayD);
      days.push({ label: labels[i], num: dayD.getDate(), hit: dayDone(k), today: k === todayKey });
    }
    return { days, streak: s };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [log]);

  /* Today's tracked meters → goal progress ring in the hero */
  const todayMeters = useMemo(() => {
    try {
      const tracks = load<Track[]>('foxit_tracks', []);
      return tracks.filter((t) => t.d === todayKey).reduce((a, t) => a + (t.meters || 0), 0);
    } catch {
      return 0;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [log, tracking]);

  const doneCount = (log[todayKey]?.done ?? []).filter(Boolean).length;
  const goalPct = Math.min(1, todayMeters / Math.max(1, goal));
  const RING_C = 2 * Math.PI * 19;

  /* ------------------------- map primitives ------------------------- */

  const drawPath = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;
    for (const l of pathLayersRef.current) {
      try {
        map.removeLayer(l);
      } catch {
        /* already removed */
      }
    }
    pathLayersRef.current = [];
    const startPt = startPtRef.current;
    if (!startPt) return;
    const m = markersRef.current[spotRef.current];
    if (!m) return;
    const d = m.getLatLng();
    const my = ++pathSeqRef.current;
    void (async () => {
      let pts: [number, number][] | null = null;
      let info: string | null = null;
      try {
        const u = `https://router.project-osrm.org/route/v1/driving/${startPt.lng},${startPt.lat};${d.lng},${d.lat}?overview=full&geometries=geojson`;
        const r = (await (await fetch(u)).json()) as OsrmResponse;
        const rt = r.routes?.[0];
        if (rt && my === pathSeqRef.current) {
          pts = rt.geometry.coordinates.map((c) => [c[1], c[0]] as [number, number]);
          const dist = rt.distance < 1000 ? `${Math.round(rt.distance)} m` : `${(rt.distance / 1000).toFixed(1)} km`;
          const when = rt.duration < 90 ? `${Math.round(rt.duration)}s` : `${Math.round(rt.duration / 60)} min`;
          info = `🛣️ ${dist} · ~${when} pe drum`;
        }
      } catch {
        /* offline — straight-line fallback below */
      }
      if (my !== pathSeqRef.current) return;
      const mapNow = mapRef.current;
      if (!mapNow || !aliveRef.current) return;
      if (!pts) {
        const a: [number, number] = [startPt.lat, startPt.lng];
        const b: [number, number] = [d.lat, d.lng];
        pts = [a, [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], b];
      }
      const mid = Math.max(1, Math.floor(pts.length / 2));
      pathLayersRef.current = [
        L.polyline(pts, { color: '#ffffff', weight: 9, opacity: 0.9 }).addTo(mapNow),
        L.polyline(pts.slice(0, mid + 1), { color: '#2E7CF6', weight: 5 }).addTo(mapNow),
        L.polyline(pts.slice(mid), { color: '#FF6B35', weight: 5 }).addTo(mapNow),
      ];
      if (info) setRouteInfo(info);
    })();
  }, []);

  const selectSpot = useCallback(
    (id: string, teleport = false) => {
      const defs = allSpotDefs(customsRef.current);
      const s = defs[id];
      if (!s) return;
      spotRef.current = id;
      setSpot(id);
      saveStr(KEYS.spot, id);
      for (const [mid, mk] of Object.entries(markersRef.current)) {
        try {
          mk.setIcon(makePinIcon(defs, mid, id));
        } catch {
          /* marker gone */
        }
      }
      for (const [rid, r] of Object.entries(routesRef.current)) {
        try {
          if (rid === id) r.setStyle({ color: '#FF6B35', weight: 4, opacity: 1 });
          else r.setStyle({ color: '#777', weight: 2, opacity: 0.55 });
        } catch {
          /* route gone */
        }
      }
      setRouteInfo(null);
      drawPath();
      if (teleport) {
        const map = mapRef.current;
        const mk = markersRef.current[id];
        if (map && mk) {
          try {
            const ll = mk.getLatLng();
            try {
              map.flyTo(ll, 16, { duration: 1.2 });
            } catch {
              map.setView(ll, 16);
            }
          } catch {
            /* ignore */
          }
        }
      }
    },
    [drawPath],
  );

  const addCustomMarker = useCallback(
    (c: CustomSpot) => {
      const map = mapRef.current;
      if (!map || markersRef.current[c.id]) return;
      const defs = allSpotDefs(customsRef.current);
      routesRef.current[c.id] = L.polyline(loopPts(c.lat, c.lng, c.dist), {
        color: '#777',
        weight: 2,
        opacity: 0.55,
        dashArray: '10 8',
        className: 'route-anim',
      }).addTo(map);
      markersRef.current[c.id] = L.marker([c.lat, c.lng], {
        icon: makePinIcon(defs, c.id, spotRef.current),
      })
        .addTo(map)
        .on('click', () => selectSpot(c.id));
    },
    [selectSpot],
  );

  const placeSpots = useCallback(
    (center: [number, number]) => {
      for (const [id, g] of Object.entries(SPOT_GEO)) {
        const [la, lo] = dest(center[0], center[1], g.bearing, g.d);
        const mk = markersRef.current[id];
        if (mk) mk.setLatLng([la, lo]);
        const rt = routesRef.current[id];
        const sd = SPOTS[id];
        if (rt && sd) rt.setLatLngs(loopPts(la, lo, sd.dist));
      }
      drawPath();
    },
    [drawPath],
  );

  const drawStartMarker = useCallback(() => {
    const map = mapRef.current;
    const sp = startPtRef.current;
    if (!map || !sp) return;
    if (startMarkerRef.current) startMarkerRef.current.setLatLng([sp.lat, sp.lng]);
    else
      startMarkerRef.current = L.marker([sp.lat, sp.lng], {
        icon: L.divIcon({
          className: '',
          html: '<div class="fp-pin fp-start">S</div>',
          iconSize: [30, 30],
          iconAnchor: [15, 15],
        }),
        interactive: false,
      }).addTo(map);
  }, []);

  const locate = useCallback(
    (recenter: boolean) => {
      if (!navigator.geolocation) {
        if (recenter) toast('GPS unavailable');
        return;
      }
      if (recenter) toast('Locating… 📍');
      navigator.geolocation.getCurrentPosition(
        (p) => {
          if (!aliveRef.current) return;
          const c: [number, number] = [p.coords.latitude, p.coords.longitude];
          const map = mapRef.current;
          if (!map) return;
          if (youMarkerRef.current) youMarkerRef.current.setLatLng(c);
          else
            youMarkerRef.current = L.marker(c, {
              icon: L.divIcon({
                className: '',
                html: '<div class="fp-you"></div>',
                iconSize: [16, 16],
                iconAnchor: [8, 8],
              }),
              interactive: false,
            }).addTo(map);
          placeSpots(c);
          if (recenter) {
            try {
              map.flyTo(c, 16, { duration: 1.2 });
            } catch {
              map.setView(c, 16);
            }
            toast('GPS live — teleported to you! 🏃');
          } else map.setView(c, 14);
        },
        () => {
          if (recenter) toast('Location blocked — tap 🔒/ⓘ in address bar → Location → Allow 📍');
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 2000 },
      );
    },
    [placeSpots, toast],
  );

  const gotoSpot = useCallback((id: string) => {
    const map = mapRef.current;
    const mk = markersRef.current[id];
    if (!map || !mk) return;
    try {
      const ll = mk.getLatLng();
      try {
        map.flyTo(ll, 16, { duration: 1.2 });
      } catch {
        map.setView(ll, 16);
      }
    } catch {
      /* ignore */
    }
  }, []);

  const doSetStart = useCallback(
    (ll: L.LatLng) => {
      const sp = { lat: ll.lat, lng: ll.lng };
      startPtRef.current = sp;
      save('foxit_start', sp);
      drawStartMarker();
      drawPath();
      setAdding(false);
      setStartArmed(false);
      setSpotFormOpen(false);
      const map = mapRef.current;
      if (tempMarkerRef.current && map) {
        try {
          map.removeLayer(tempMarkerRef.current);
        } catch {
          /* gone */
        }
      }
      tempMarkerRef.current = null;
      tempLatLngRef.current = null;
      toast('Start point set! 🏁');
    },
    [drawPath, drawStartMarker, toast],
  );

  /* ------------------------- run engine ------------------------- */

  const stopTrackingCleanup = useCallback(() => {
    if (watchIdRef.current !== null) {
      try {
        navigator.geolocation.clearWatch(watchIdRef.current);
      } catch {
        /* ignore */
      }
      watchIdRef.current = null;
    }
    if (trTimerRef.current) {
      window.clearInterval(trTimerRef.current);
      trTimerRef.current = 0;
    }
    const arrow = trArrowRef.current;
    const map = mapRef.current;
    if (arrow && map) {
      try {
        map.removeLayer(arrow);
      } catch {
        /* gone */
      }
    }
    trArrowRef.current = null;
    trackingRef.current = false;
  }, []);

  const showThirsty = useCallback(() => {
    trThirstyAtRef.current = Date.now();
    setThirsty(true);
    window.clearTimeout(thirstTimerRef.current);
    thirstTimerRef.current = window.setTimeout(() => setThirsty(false), 2500);
  }, []);

  const finishRun = useCallback(() => {
    stopTrackingCleanup();
    const meters = Math.round(trDistRef.current);
    const secs = Math.floor((Date.now() - trT0Ref.current) / 1000);
    const name = trTargetNameRef.current || 'spot';
    const tracks = load<Track[]>('foxit_tracks', []);
    tracks.push({ d: todayKey, t: Date.now(), meters, secs, spot: spotRef.current });
    save('foxit_tracks', tracks);
    const done = [...(logRef.current[todayKey]?.done ?? [])];
    const i = done.findIndex((d) => !d);
    if (i !== -1) {
      done[i] = true;
      const nextLog = { ...logRef.current, [todayKey]: { done } };
      logRef.current = nextLog;
      setLog(nextLog);
      save(KEYS.log, nextLog);
    }
    trTargetRef.current = null;
    setTracking(false);
    selectSpot(spotRef.current);
    const r = runBtnRef.current?.getBoundingClientRect();
    if (r) confetti(r.left + r.width / 2, r.top);
    const dd = meters < 1000 ? `${meters} m` : `${(meters / 1000).toFixed(2)} km`;
    const names = NAMES[countRef.current] ?? NAMES[2];
    toast(i !== -1 ? `Arrived at ${name}! ${dd} · ${names[i] ?? 'run'} 🎉` : `Arrived! ${dd} 🎉`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectSpot, stopTrackingCleanup, toast]);

  const tickRun = useCallback(() => {
    setTick((t) => t + 1);
    if (trackingRef.current && Date.now() - trLastMoveRef.current >= 30000 && Date.now() - trThirstyAtRef.current >= 60000) {
      showThirsty();
    }
  }, [showThirsty]);

  const startRun = useCallback(() => {
    if (trackingRef.current) {
      let left = '';
      const tgt = trTargetRef.current;
      const last = trLastRef.current;
      if (tgt && last) {
        const r = Math.round(hav(last, [tgt.lat, tgt.lng]));
        left = ` — ${r < 1000 ? `${r} m` : `${(r / 1000).toFixed(2)} km`} left`;
      }
      toast(`Reach ${trTargetNameRef.current || 'your spot'} to finish${left} 🏁`);
      return;
    }
    if (!navigator.geolocation) {
      toast('No GPS on this device 📍');
      return;
    }
    if (!mapRef.current) {
      toast('Map offline');
      return;
    }
    if (!window.isSecureContext) {
      toast('Open via http://127.0.0.1:8000 — GPS needs it 🔒');
      return;
    }
    const begin = (p: GeolocationPosition) => {
      if (!aliveRef.current || trackingRef.current) return;
      const map = mapRef.current;
      const mk = markersRef.current[spotRef.current];
      if (!map || !mk) {
        toast('Pick a spot first 📍');
        return;
      }
      const t = mk.getLatLng();
      trTargetRef.current = { lat: t.lat, lng: t.lng };
      const defs = allSpotDefs(customsRef.current);
      trTargetNameRef.current = defs[spotRef.current]?.name ?? 'spot';
      setTargetName(trTargetNameRef.current);
      trackingRef.current = true;
      trDistRef.current = 0;
      trT0Ref.current = Date.now();
      trLastMoveRef.current = Date.now();
      trLastRef.current = [p.coords.latitude, p.coords.longitude];
      setTracking(true);
      if (trArrowRef.current) {
        try {
          map.removeLayer(trArrowRef.current);
        } catch {
          /* gone */
        }
      }
      trArrowRef.current = L.marker(trLastRef.current, {
        icon: arrowIcon(0, '#FF6B35'),
        interactive: false,
        keyboard: false,
      }).addTo(map);
      map.setView(trLastRef.current, 16);
      watchIdRef.current = navigator.geolocation.watchPosition(
        (pp) => {
          if (!trackingRef.current || !aliveRef.current) return;
          if (pp.coords.accuracy && pp.coords.accuracy > 30) return;
          const last = trLastRef.current;
          if (!last) return;
          const q: [number, number] = [pp.coords.latitude, pp.coords.longitude];
          const d = hav(last, q);
          if (d < 3) return;
          const brg =
            (Math.atan2(
              (q[1] - last[1]) * Math.cos((((last[0] + q[0]) / 2) * Math.PI) / 180),
              q[0] - last[0],
            ) *
              180) /
            Math.PI;
          trDistRef.current += d;
          trLastRef.current = q;
          trLastMoveRef.current = Date.now();
          const arrow = trArrowRef.current;
          const m2 = mapRef.current;
          if (arrow) {
            arrow.setLatLng(q);
            arrow.setIcon(arrowIcon(brg, '#FF6B35'));
          }
          if (m2) m2.panTo(q);
          tickRun();
          const tgt = trTargetRef.current;
          if (tgt && hav(q, [tgt.lat, tgt.lng]) <= FINISH_RADIUS) {
            finishRun();
          }
        },
        () => toast('GPS lost 😕'),
        { enableHighAccuracy: true, maximumAge: 1000, timeout: 10000 },
      );
      trTimerRef.current = window.setInterval(tickRun, 1000);
      toast(`GPS live — reach ${trTargetNameRef.current}! 🏃`);
    };
    toast('Waiting for GPS… 📍');
    const opts: PositionOptions = { enableHighAccuracy: true, timeout: 10000 };
    const ask = () =>
      navigator.geolocation.getCurrentPosition(
        begin,
        () => toast('Blocked: tap 🔒/ⓘ in address bar → Location → Allow 📍'),
        opts,
      );
    try {
      if (navigator.permissions?.query) {
        navigator.permissions
          .query({ name: 'geolocation' as PermissionName })
          .then((r) => {
            if (r.state === 'denied') toast('Blocked: tap 🔒/ⓘ in address bar → Location → Allow 📍');
            else ask();
          })
          .catch(ask);
      } else ask();
    } catch {
      ask();
    }
  }, [finishRun, tickRun, toast]);

  /* ------------------------- map lifecycle ------------------------- */

  useEffect(() => {
    aliveRef.current = true;
    const el = mapDivRef.current;
    if (!el || mapRef.current) return undefined;
    let map: L.Map | null = null;
    try {
      map = L.map(el, { zoomControl: false }).setView(HOME, 14);
    } catch {
      setMapFailed(true);
      return undefined;
    }
    mapRef.current = map;
    map.attributionControl.setPrefix(false);
    map.attributionControl.addAttribution('© OpenStreetMap');
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);
    const defs = allSpotDefs(customsRef.current);
    for (const id of Object.keys(SPOTS)) {
      routesRef.current[id] = L.polyline([], {
        color: '#FF6B35',
        weight: 4,
        dashArray: '10 8',
        className: 'route-anim',
      }).addTo(map);
      markersRef.current[id] = L.marker([0, 0], { icon: makePinIcon(defs, id, spotRef.current) })
        .addTo(map)
        .on('click', () => selectSpot(id));
    }
    for (const c of customsRef.current) addCustomMarker(c);
    map.on('click', (e: L.LeafletMouseEvent) => onMapTapRef.current(e));
    placeSpots(HOME);
    drawStartMarker();
    window.setTimeout(() => {
      try {
        map?.invalidateSize();
      } catch {
        /* ignore */
      }
    }, 300);
    let ro: ResizeObserver | null = null;
    try {
      ro = new ResizeObserver(() => {
        try {
          map?.invalidateSize();
        } catch {
          /* ignore */
        }
      });
      ro.observe(el);
    } catch {
      /* resize observer unavailable */
    }
    locate(false);
    selectSpot(spotRef.current);
    return () => {
      aliveRef.current = false;
      try {
        ro?.disconnect();
      } catch {
        /* ignore */
      }
      searchSeqRef.current++;
      window.clearTimeout(searchTimerRef.current);
      window.clearTimeout(thirstTimerRef.current);
      stopTrackingCleanup();
      pathSeqRef.current++;
      const m = mapRef.current;
      mapRef.current = null;
      markersRef.current = {};
      routesRef.current = {};
      youMarkerRef.current = null;
      startMarkerRef.current = null;
      tempMarkerRef.current = null;
      trArrowRef.current = null;
      pathLayersRef.current = [];
      try {
        m?.remove();
      } catch {
        /* ignore */
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* Latest map-tap handler (map click listener is registered once) */
  const onMapTap = (e: L.LeafletMouseEvent): void => {
    if (startArmed) {
      doSetStart(e.latlng);
      return;
    }
    const map = mapRef.current;
    if (!adding || !map) return;
    tempLatLngRef.current = [e.latlng.lat, e.latlng.lng];
    if (tempMarkerRef.current) tempMarkerRef.current.setLatLng(e.latlng);
    else
      tempMarkerRef.current = L.marker(e.latlng, {
        icon: L.divIcon({
          className: '',
          html: '<div class="fp-pin sel">?</div>',
          iconSize: [30, 30],
          iconAnchor: [15, 15],
        }),
        interactive: false,
      }).addTo(map);
    setFormName('');
    setFormDist('');
    setSpotFormOpen(true);
    window.setTimeout(() => {
      try {
        spotNameRef.current?.focus();
      } catch {
        /* ignore */
      }
    }, 60);
  };
  onMapTapRef.current = onMapTap;

  /* ------------------------- spots ------------------------- */

  const defs = allSpotDefs(customs);
  const cur = defs[spot] ?? SPOTS.park;

  const delSpot = (id: string): void => {
    const next = customsRef.current.filter((c) => c.id !== id);
    customsRef.current = next;
    setCustoms(next);
    save('foxit_custom_spots', next);
    const map = mapRef.current;
    if (map) {
      const mk = markersRef.current[id];
      if (mk) {
        try {
          map.removeLayer(mk);
        } catch {
          /* gone */
        }
        delete markersRef.current[id];
      }
      const rt = routesRef.current[id];
      if (rt) {
        try {
          map.removeLayer(rt);
        } catch {
          /* gone */
        }
        delete routesRef.current[id];
      }
    }
    if (spotRef.current === id) selectSpot('park');
    toast('Spot deleted');
  };

  const closeSpotForm = (): void => {
    setSpotFormOpen(false);
    const map = mapRef.current;
    if (tempMarkerRef.current && map) {
      try {
        map.removeLayer(tempMarkerRef.current);
      } catch {
        /* gone */
      }
    }
    tempMarkerRef.current = null;
    tempLatLngRef.current = null;
  };

  const toggleAdd = (): void => {
    if (!mapRef.current) {
      toast('Map offline — spots still selectable');
      return;
    }
    if (adding) {
      setAdding(false);
      closeSpotForm();
    } else {
      setAdding(true);
      setStartArmed(false);
      toast('Tap the map where you want your spot 📍');
    }
  };

  const toggleStartArm = (): void => {
    if (!mapRef.current) {
      toast('Map offline');
      return;
    }
    if (startArmed) {
      setStartArmed(false);
    } else {
      setAdding(false);
      closeSpotForm();
      setStartArmed(true);
      toast('Tap the map for your START point 🏁');
    }
  };

  const saveSpot = (): void => {
    const ll = tempLatLngRef.current;
    if (!ll) {
      toast('Tap the map first 📍');
      return;
    }
    const name = formName.trim().slice(0, 24) || 'My spot';
    let dist = parseInt(formDist, 10);
    if (!(dist > 0)) dist = 1000;
    if (dist > 50000) dist = 50000;
    const c: CustomSpot = { id: `c${Date.now()}`, name, dist, lat: ll[0], lng: ll[1] };
    const next = [...customsRef.current, c];
    customsRef.current = next;
    setCustoms(next);
    save('foxit_custom_spots', next);
    closeSpotForm();
    addCustomMarker(c);
    setAdding(false);
    selectSpot(c.id);
    toast(`📍 ${name} added!`);
  };

  /* ------------------------- search ------------------------- */

  const openSearch = (): void => {
    setSearchOpen(true);
    setQuery('');
    setResults([]);
    setSearchMsg('Type to search anywhere in the world 🌍');
    setSearching(false);
    window.setTimeout(() => {
      try {
        searchInputRef.current?.focus();
      } catch {
        /* ignore */
      }
    }, 60);
  };

  const closeSearch = (): void => {
    setSearchOpen(false);
    const map = mapRef.current;
    if (map) {
      try {
        map.invalidateSize();
      } catch {
        /* ignore */
      }
    }
  };

  const runSearch = async (q: string, token: number): Promise<void> => {
    try {
      const r = (await (
        await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=6&q=${encodeURIComponent(q)}`)
      ).json()) as NominatimResult[];
      if (token !== searchSeqRef.current || !aliveRef.current) return;
      setSearching(false);
      if (!r.length) {
        setResults([]);
        setSearchMsg('Nothing found 😕');
        return;
      }
      setResults(r);
      setSearchMsg(null);
    } catch {
      if (token === searchSeqRef.current && aliveRef.current) {
        setSearching(false);
        setResults([]);
        setSearchMsg('Offline — search needs internet 😕');
      }
    }
  };

  const onQueryChange = (v: string): void => {
    setQuery(v);
    window.clearTimeout(searchTimerRef.current);
    const q = v.trim();
    if (q.length < 3) {
      setSearching(false);
      setResults([]);
      setSearchMsg('Keep typing…');
      return;
    }
    setSearching(true);
    setSearchMsg(null);
    const token = ++searchSeqRef.current;
    searchTimerRef.current = window.setTimeout(() => {
      void runSearch(q, token);
    }, 500);
  };

  const pickSearchResult = (p: NominatimResult): void => {
    closeSearch();
    const lat = parseFloat(p.lat);
    const lon = parseFloat(p.lon);
    const map = mapRef.current;
    if (map) {
      try {
        map.flyTo([lat, lon], 16, { duration: 1.4 });
      } catch {
        map.setView([lat, lon], 16);
      }
    }
    toast(`📍 ${p.display_name.split(',')[0]}`);
  };

  /* ------------------------- profile ------------------------- */

  const pickExpr = (id: string): void => {
    const e = exprOf(id);
    setExprId(e.id);
    saveStr(KEYS.expression, e.id);
    toast(`Foxit is feeling ${e.label}! 🦊`);
  };

  const pickMat = (id: string): void => {
    const m = matOf(id);
    setMatId(m.id);
    saveStr(KEYS.material, m.id);
    toast(`${m.label} Foxit equipped!`);
  };

  /* ------------------------- settings ------------------------- */

  const openSettings = (): void => {
    setGoalInput(String(goal));
    setNameInput(username === 'runner' ? '' : username);
    setSettingsOpen(true);
  };

  const saveGoal = (): void => {
    const v = parseInt(goalInput, 10);
    if (!v || v < 100) {
      toast('At least 100 meters! 🦊');
      return;
    }
    if (v > 50000) {
      toast('Keep it under 50000m!');
      return;
    }
    setGoal(v);
    saveStr(KEYS.goalMeters, String(v));
    toast(`Daily goal: ${v.toLocaleString()}m! 🎯`);
  };

  const setRuns = (n: number): void => {
    if (n === count) return;
    setCount(n);
    countRef.current = n;
    saveStr(KEYS.runsPerDay, String(n));
    const nextTimes = times.slice(0, n);
    while (nextTimes.length < n) nextTimes.push({ ...DEFAULTS[n][nextTimes.length] });
    setTimes(nextTimes);
    save(KEYS.runTimes, nextTimes);
    const old = logRef.current[todayKey]?.done ?? [];
    const done = Array.from({ length: n }, (_, i) => old[i] ?? false);
    const nextLog = { ...logRef.current, [todayKey]: { done } };
    logRef.current = nextLog;
    setLog(nextLog);
    save(KEYS.log, nextLog);
    toast(n === 1 ? 'Chill start — 1 run a day!' : n === 2 ? 'Perfect — morning & afternoon!' : 'Beast mode — 3 runs! 🔥');
  };

  const saveName = (): void => {
    const v = nameInput.trim().replace(/\s+/g, '_').slice(0, 16);
    if (v.length < 2) {
      toast('Give me at least 2 letters! 🦊');
      return;
    }
    if (!/^[A-Za-z0-9_.-]+$/.test(v)) {
      toast('Letters, numbers, _ . - only!');
      return;
    }
    setUsername(v);
    saveStr(KEYS.username, v);
    toast(`Nice to meet you, ${v}! 🦊`);
  };

  /* ------------------------- run line ------------------------- */

  const renderSpotLine = (): React.ReactNode => {
    if (tracking) {
      const s = Math.floor((Date.now() - trT0Ref.current) / 1000);
      const d = trDistRef.current;
      const dd = d < 1000 ? `${Math.round(d)} m` : `${(d / 1000).toFixed(2)} km`;
      let left = '';
      const tgt = trTargetRef.current;
      const last = trLastRef.current;
      if (tgt && last) {
        const r = Math.round(hav(last, [tgt.lat, tgt.lng]));
        const rr = r < 1000 ? `${r} m` : `${(r / 1000).toFixed(2)} km`;
        left = ` · ${rr} to ${trTargetNameRef.current}`;
      }
      return (
        <>
          <span className="live-dot inline-block w-1.5 h-1.5 rounded-full bg-[#ff5b5b] mr-1 align-middle" />
          🏃 <b>{dd}</b> · {Math.floor(s / 60)}:{String(s % 60).padStart(2, '0')}
          {left} · reach spot to finish 🏁
        </>
      );
    }
    if (routeInfo) {
      return (
        <>
          📍 <b>{cur.name}</b> · {routeInfo}
        </>
      );
    }
    return (
      <>
        📍 <b>{cur.name}</b> · {cur.dist.toLocaleString()} m
      </>
    );
  };

  /* ------------------------- render ------------------------- */

  return (
    <div className="fox-screen">
      <style>{`
        .fox-screen{height:100dvh;max-width:430px;width:94vw;margin:0 auto;display:flex;flex-direction:column;overflow:hidden;padding:0 16px calc(10px + env(safe-area-inset-bottom));animation:fox-in .35s ease both}
        .leaflet-container{background:#2e2e30;font:inherit}
        .leaflet-tile-pane{filter:grayscale(1) invert(1) brightness(1.5) contrast(.85)}
        .leaflet-control-attribution{background:rgba(0,0,0,.55)!important;color:#555!important;font-size:9px!important;padding:1px 6px!important}
        .leaflet-control-attribution a{color:#777!important}
        .fp-pin{width:30px;height:30px;border-radius:50%;background:#222;border:2px solid #888;color:#fff;font-size:14px;font-weight:800;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 10px rgba(0,0,0,.6)}
        .fp-pin.sel{background:#FF6B35;border-color:#FF6B35;color:#000;animation:pin-pulse 1.8s ease-out infinite}
        .fp-pin.fp-start{background:#2E7CF6;border-color:#2E7CF6;color:#fff}
        .fp-you{width:16px;height:16px;border-radius:50%;background:#3b82f6;border:3px solid #fff;box-shadow:0 0 0 6px rgba(59,130,246,.25)}
        .cursor-wrap{width:26px;height:26px;filter:drop-shadow(0 0 4px rgba(0,0,0,.9))}
        .cursor-wrap svg{display:block}
        .leaflet-overlay-pane path.route-anim{animation:dash-march 1s linear infinite}
        @keyframes dash-march{to{stroke-dashoffset:-28}}
        @keyframes pin-pulse{0%{box-shadow:0 0 0 0 rgba(255,107,53,.55)}100%{box-shadow:0 0 0 16px rgba(255,107,53,0)}}
        @keyframes fox-bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
        @keyframes sheet-up{from{transform:translateY(48px);opacity:0}to{transform:none;opacity:1}}
        .sheet-up{animation:sheet-up .28s cubic-bezier(.2,.8,.3,1) both}
        @keyframes glow-pulse{0%,100%{opacity:.55}50%{opacity:1}}
        .live-dot{animation:glow-pulse 1.4s ease-in-out infinite}
        @keyframes rise{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
        .rise{animation:rise .5s cubic-bezier(.2,.8,.3,1) both}
        body::before{content:"";position:fixed;inset:0;pointer-events:none;z-index:0;
          background:radial-gradient(620px 320px at 50% -90px,rgba(255,107,53,.15),transparent 70%),
          radial-gradient(520px 320px at 88% 112%,rgba(46,124,246,.12),transparent 70%)}
        @media (prefers-reduced-motion: reduce){.rise,.sheet-up,.live-dot{animation:none}}
        .confetti-dot{position:fixed;width:10px;height:14px;border-radius:3px;z-index:1000;pointer-events:none}
        .no-scrollbar::-webkit-scrollbar{display:none}
        .no-scrollbar{scrollbar-width:none}
      `}</style>

      {/* topbar — sticky glass */}
      <div className="rise sticky top-0 z-[600] -mx-4 px-4 pt-2 pb-2.5" style={{ backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)', background: 'linear-gradient(rgba(10,10,15,.94),rgba(10,10,15,.72))', borderBottom: '1px solid rgba(255,255,255,.06)' }}>
        <div className="flex items-center justify-between">
          <button id="profileBtn" onClick={() => setProfileOpen(true)} aria-label="edit profile" className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-full pl-1 pr-3.5 py-1 cursor-pointer" style={{ boxShadow: '0 4px 16px rgba(0,0,0,.4)' }}>
            <img src="./foxit-logo.png" alt="Foxit logo" className="w-[30px] h-[30px] rounded-full block" style={{ boxShadow: '0 0 0 2px #FF6B35' }} />
            <b className="text-[16px] tracking-tight">
              fox<span className="text-[#FF6B35]">it</span>
            </b>
          </button>
          <div className="flex items-center gap-1.5">
            <span className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-full px-3 py-1.5 text-xs font-extrabold tabular-nums" style={{ boxShadow: '0 4px 16px rgba(0,0,0,.4)' }}>
              <Flame size={14} weight="fill" className="text-[#FF6B35]" /> <b className="text-[#FF6B35]">{week.streak}</b>
            </span>
            <button id="settingsBtn" onClick={openSettings} aria-label="settings" className="flex bg-white/5 border border-white/10 rounded-full w-[34px] h-[34px] text-sm font-extrabold cursor-pointer items-center justify-center" style={{ boxShadow: '0 4px 16px rgba(0,0,0,.4)' }}>
              <Gear size={16} weight="bold" />
            </button>
          </div>
        </div>
      </div>

      {/* hero */}
      <div className="rise relative mt-2 overflow-hidden rounded-[24px] border border-white/10 shrink-0" style={{ background: 'linear-gradient(165deg,#1a1a21 0%,#0c0c10 70%)', boxShadow: '0 14px 36px rgba(0,0,0,.5), 0 0 44px rgba(255,107,53,.12)', animationDelay: '60ms' }}>
        <div aria-hidden className="pointer-events-none absolute -top-16 -right-16 w-56 h-56 rounded-full" style={{ background: 'radial-gradient(circle,rgba(255,107,53,.22),transparent 70%)' }} />
        <div className="relative flex gap-2.5 p-3 items-center">
          <img
            src={`./${artSrc(expr.src, mat)}`}
            alt="Foxit"
            onClick={() => setTipIdx((i) => (i === null ? 0 : i + 1))}
            style={heroFilter ? { filter: heroFilter } : undefined}
            className="w-[76px] h-[76px] rounded-[20px] object-cover cursor-pointer border border-white/10 shrink-0 active:scale-[.97]"
          />
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-black tracking-[.22em] text-[#8b8b96]">TODAY</p>
            <h2 className="text-[20px] font-semibold tracking-tight leading-tight truncate">
              {username}<span className="text-[#FF6B35]">!</span>
            </h2>
            <p className="text-[12px] text-[#cfcfd6] mt-px leading-snug line-clamp-2">
              {tipIdx === null ? (
                <>Pick a spot and hit <b className="text-[#FF6B35]">run!</b></>
              ) : (
                <>{TIPS[tipIdx % TIPS.length]}</>
              )}
            </p>
          </div>
          <div className="relative w-[60px] h-[60px] shrink-0" role="img" aria-label={`${Math.round(goalPct * 100)} percent of daily goal`}>
            <svg viewBox="0 0 44 44" className="w-full h-full -rotate-90">
              <defs>
                <linearGradient id="goalGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#2E7CF6" />
                  <stop offset="100%" stopColor="#FF6B35" />
                </linearGradient>
              </defs>
              <circle cx="22" cy="22" r="19" fill="none" stroke="rgba(255,255,255,.1)" strokeWidth="5" />
              <circle cx="22" cy="22" r="19" fill="none" stroke="url(#goalGrad)" strokeWidth="5" strokeLinecap="round" strokeDasharray={`${goalPct * RING_C} ${RING_C}`} style={{ transition: 'stroke-dasharray .6s ease' }} />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-[12px] font-black tabular-nums">{Math.round(goalPct * 100)}%</span>
          </div>
        </div>
        <div className="relative px-3 pb-2.5 -mt-0.5">
          <div className="flex justify-between text-[10.5px] font-extrabold tabular-nums">
            <span className="fox-hint">{doneCount}/{count} runs · 🔥 {week.streak}</span>
            <span>{todayMeters >= 1000 ? `${(todayMeters / 1000).toFixed(1)}km` : `${todayMeters}m`} <span className="text-[#888]">/ {goal >= 1000 ? `${goal / 1000}km` : `${goal}m`}</span></span>
          </div>
          <div className="h-1.5 rounded-full bg-black/70 overflow-hidden mt-1 border border-white/5">
            <div className="h-full rounded-full" style={{ width: `${goalPct * 100}%`, background: 'linear-gradient(90deg,#2E7CF6,#FF6B35)', transition: 'width .6s ease' }} />
          </div>
        </div>
      </div>

      {/* week */}
      <div className="rise mt-2 rounded-[20px] border border-white/10 px-2.5 pt-2 pb-2.5 shrink-0" style={{ background: 'linear-gradient(160deg,#15151b,#0b0b0e)', boxShadow: '0 12px 32px rgba(0,0,0,.45)', animationDelay: '120ms' }}>
        <div className="flex gap-[5px]">
          {week.days.map((d, i) => (
            <div
              key={i}
              className={`flex-1 rounded-xl py-[5px] px-0 pb-1 text-center border ${
                d.today
                  ? 'border-[#2E7CF6]'
                  : d.hit
                    ? 'border-[#FF6B35]/60'
                    : 'border-white/5'
              }`}
              style={
                d.today
                  ? { background: 'linear-gradient(180deg,#FF6B35,#d94f1e)', boxShadow: '0 0 0 2px rgba(46,124,246,.55), 0 6px 18px rgba(255,107,53,.4)' }
                  : d.hit
                    ? { background: 'rgba(255,107,53,.14)' }
                    : { background: 'rgba(255,255,255,.03)' }
              }
            >
              <small className={`block text-[9px] font-black ${d.hit || d.today ? 'text-black' : 'text-[#666]'}`}>{d.label}</small>
              <b className={`block text-[14px] mt-px ${d.hit || d.today ? 'text-black' : d.today ? '' : 'text-[#eee]'}`}>{d.hit ? '✓' : d.num}</b>
            </div>
          ))}
        </div>
      </div>

      {/* live map: full-bleed, part of the app, no frame */}
      <div
        className="rise relative -mx-4 mt-2 flex-1 min-h-0 border-y border-white/5"
        style={{ animationDelay: '220ms' }}
      >
        <div ref={mapDivRef} className="absolute inset-0 z-0" style={{ background: '#2e2e30' }} />

        <div className="absolute left-2.5 right-2.5 top-2.5 z-[502] flex gap-1.5">
          <div
            onClick={() => gotoSpot(spot)}
            className="flex-1 min-w-0 bg-[rgba(12,12,16,.72)] backdrop-blur-md border border-[#333] rounded-full px-3 py-[7px] text-xs font-bold whitespace-nowrap overflow-hidden text-ellipsis cursor-pointer"
          >
            {renderSpotLine()}
          </div>
          <button
            id="searchBtn"
            onClick={openSearch}
            aria-label="search places"
            className="flex shrink-0 w-[38px] items-center justify-center rounded-xl border-2 border-[#3a3a40] bg-[rgba(12,12,16,.72)] backdrop-blur-md text-base cursor-pointer"
          >
            <MagnifyingGlass size={18} weight="bold" />
          </button>
        </div>

        {searchOpen && (
          <div className="absolute inset-0 z-[503] bg-[rgba(10,10,12,.97)] p-3 overflow-y-auto">
            <div className="flex gap-1.5">
              <input
                ref={searchInputRef}
                value={query}
                onChange={(e) => onQueryChange(e.target.value)}
                placeholder="Search places, addresses…"
                autoComplete="off"
                className="flex-1 min-w-0 bg-[#0a0a0a] border-2 border-[#FF6B35] rounded-xl px-3 py-2.5 text-sm font-bold focus:outline-none"
              />
              <button
                id="searchClose"
                onClick={closeSearch}
                aria-label="close search"
                className="flex shrink-0 w-11 items-center justify-center rounded-xl border-2 border-[#3a3a40] bg-[#222] text-lg font-extrabold cursor-pointer"
              >
                <X size={18} weight="bold" />
              </button>
            </div>
            <div>
              {searching && <div className="fox-hint text-xs text-center mt-3.5">Searching…</div>}
              {!searching && searchMsg && <div className="fox-hint text-xs text-center mt-3.5">{searchMsg}</div>}
              {!searching &&
                results.map((p, i) => {
                  const [main, ...rest] = p.display_name.split(',');
                  return (
                    <button
                      key={i}
                      onClick={() => pickSearchResult(p)}
                      className="block w-full text-left bg-[#111] border border-[#222] rounded-xl px-3 py-2.5 text-[13px] font-semibold mt-2 cursor-pointer"
                    >
                      {main}
                      <small className="fox-hint block font-semibold text-[11px] mt-0.5">{rest.slice(0, 2).join(',')}</small>
                    </button>
                  );
                })}
            </div>
          </div>
        )}

        <button
          id="mapToggle"
          onClick={() => setMapToolsVisible((v) => !v)}
          aria-label="show map buttons"
          className={`absolute right-2.5 bottom-[54px] z-[501] w-[38px] h-[38px] rounded-[13px] border-2 border-b-4 border-[#3a3a40] bg-[rgba(12,12,16,.72)] backdrop-blur-md text-[17px] font-extrabold cursor-pointer flex items-center justify-center ${
            mapToolsVisible ? 'bg-[#FF6B35] border-[#B34A1F] text-black' : ''
          }`}
        >
          {mapToolsVisible ? <X size={17} weight="bold" /> : <DotsThree size={20} weight="bold" />}
        </button>

        <button
          id="spotsBtn"
          onClick={() => setChipsVisible((v) => !v)}
          aria-label="show spots"
          className="fox-btn-orange absolute left-2.5 bottom-2 z-[501] w-[38px] h-[38px] rounded-[13px] text-[17px] flex items-center justify-center cursor-pointer"
        >
          <MapPin size={18} weight="fill" />
        </button>

        {mapToolsVisible && (
          <div className="absolute left-2.5 right-[58px] bottom-[52px] z-[500] flex flex-row gap-1.5 overflow-x-auto no-scrollbar p-0.5">
            <button
              id="gpsBtn"
              onClick={() => locate(true)}
              aria-label="go to my location"
              className="flex shrink-0 w-[38px] h-[38px] items-center justify-center rounded-[13px] border-2 border-b-4 border-[#3a3a40] bg-[rgba(12,12,16,.72)] backdrop-blur-md text-[17px] font-extrabold cursor-pointer"
            >
              <Crosshair size={18} weight="bold" />
            </button>
            <button
              id="zoomIn"
              onClick={() => mapRef.current?.zoomIn()}
              aria-label="zoom in"
              className="flex shrink-0 w-[38px] h-[38px] items-center justify-center rounded-[13px] border-2 border-b-4 border-[#3a3a40] bg-[rgba(12,12,16,.72)] backdrop-blur-md text-[17px] font-extrabold cursor-pointer"
            >
              <Plus size={17} weight="bold" />
            </button>
            <button
              id="zoomOut"
              onClick={() => mapRef.current?.zoomOut()}
              aria-label="zoom out"
              className="flex shrink-0 w-[38px] h-[38px] items-center justify-center rounded-[13px] border-2 border-b-4 border-[#3a3a40] bg-[rgba(12,12,16,.72)] backdrop-blur-md text-[17px] font-extrabold cursor-pointer"
            >
              <Minus size={17} weight="bold" />
            </button>
            <button
              id="addBtn"
              onClick={toggleAdd}
              aria-label="add spot"
              className={`flex shrink-0 h-[38px] items-center gap-1 rounded-[13px] border-2 border-b-4 px-2.5 text-[13px] font-extrabold cursor-pointer ${
                adding ? 'bg-[#FF6B35] border-[#B34A1F] text-black' : 'border-[#3a3a40] bg-[rgba(12,12,16,.72)] backdrop-blur-md'
              }`}
            >
              {adding ? 'tap map!' : <><Plus size={15} weight="bold" /> spot</>}
            </button>
            <button
              id="startPointBtn"
              onClick={toggleStartArm}
              aria-label="set start point"
              className={`flex shrink-0 h-[38px] items-center gap-1 rounded-[13px] border-2 border-b-4 px-2.5 text-[13px] font-extrabold cursor-pointer ${
                startArmed ? 'bg-[#FF6B35] border-[#B34A1F] text-black' : 'border-[#3a3a40] bg-[rgba(12,12,16,.72)] backdrop-blur-md'
              }`}
            >
              <Play size={14} weight="fill" /> start
            </button>
          </div>
        )}

        {spotFormOpen && (
          <div className="absolute left-2.5 right-2.5 bottom-11 z-[501] bg-[rgba(17,17,17,.95)] border-2 border-[#FF6B35] rounded-2xl px-3 py-2.5">
            <div className="text-[13px] font-extrabold">New spot 📍</div>
            <input
              ref={spotNameRef}
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              maxLength={24}
              placeholder="Name — e.g. Stadium"
              className="w-full bg-[#0a0a0a] border border-[#333] rounded-[10px] px-2.5 py-2 text-sm font-bold mt-1.5 focus:outline-none focus:border-[#FF6B35]"
            />
            <input
              value={formDist}
              onChange={(e) => setFormDist(e.target.value)}
              inputMode="numeric"
              maxLength={5}
              placeholder="Distance in meters — e.g. 1000"
              className="w-full bg-[#0a0a0a] border border-[#333] rounded-[10px] px-2.5 py-2 text-sm font-bold mt-1.5 focus:outline-none focus:border-[#FF6B35]"
            />
            <div className="flex gap-1.5 mt-2">
              <button
                id="spotCancel"
                onClick={closeSpotForm}
                className="flex-1 rounded-xl border-2 border-b-4 border-[#3a3a40] bg-[#222] font-extrabold text-[13px] py-2 cursor-pointer"
              >
                cancel
              </button>
              <button id="spotSave" onClick={saveSpot} className="fox-btn-orange flex-1 rounded-xl text-[13px] py-2 cursor-pointer">
                save ✓
              </button>
            </div>
          </div>
        )}

        {chipsVisible && (
          <div className="absolute left-0 right-0 bottom-2 z-[500] flex gap-1.5 pl-14 pr-2.5 overflow-x-auto no-scrollbar">
            {Object.entries(defs).map(([id, s]) => (
              <button
                key={id}
                onClick={() => selectSpot(id, true)}
                className={`shrink-0 border-2 border-b-4 rounded-2xl px-3 py-[7px] text-xs font-extrabold cursor-pointer ${
                  id === spot ? 'bg-[#FF6B35] border-[#FF6B35] text-black' : 'bg-[rgba(12,12,16,.72)] backdrop-blur-md border-[#3a3a40]'
                }`}
              >
                {s.n}. {s.name}
                {s.custom && (
                  <span
                    onClick={(e) => {
                      e.stopPropagation();
                      delSpot(id);
                    }}
                    className={`ml-1.5 font-black ${id === spot ? 'text-black' : 'text-[#FF6B35]'}`}
                  >
                    ×
                  </span>
                )}
              </button>
            ))}
          </div>
        )}

        {mapFailed && <div className="absolute left-2.5 right-2.5 bottom-[46px] z-[501] p-2.5 rounded-xl bg-[rgba(26,18,14,.95)] border border-[rgba(255,107,53,.4)] fox-hint text-xs text-center">Offline — map paused. Chips still work. 🦊</div>}

        {!chipsVisible && (
          <button
            id="runBtn"
            ref={runBtnRef}
            onClick={startRun}
            className="absolute left-14 right-2.5 bottom-2 z-[501] h-[48px] rounded-2xl border-2 border-b-4 border-[#B34A1F] text-black text-[17px] font-black tracking-wide cursor-pointer"
            style={{ background: 'linear-gradient(135deg,#FF6B35,#ff8c42)', boxShadow: '0 0 0 3px rgba(46,124,246,.9), 0 10px 30px rgba(255,107,53,.55)' }}
          >
            {tracking ? `go to ${targetName} 🏁` : 'run! 🏃'}
          </button>
        )}
      </div>

      {/* native tab bar */}
      <div className="rise shrink-0" style={{ animationDelay: '280ms' }}>
        <TabBar />
      </div>

      {/* profile sheet */}
      {profileOpen && (
        <div onClick={(e) => e.target === e.currentTarget && setProfileOpen(false)} className="fixed inset-0 z-[998] bg-black/70" style={{ backdropFilter: 'blur(2px)' }}>
          <div className="sheet-up absolute inset-x-0 bottom-0 mx-auto w-[min(100vw,480px)] max-h-[88dvh] overflow-y-auto bg-[#141417] border-t-2 border-[#FF6B35] rounded-t-[28px] px-5 pt-2 pb-6" style={{ boxShadow: '0 -18px 60px rgba(0,0,0,.6)' }}>
            <div className="w-10 h-1 rounded-full bg-white/20 mx-auto mt-1 mb-3" />
            <div className="text-[19px] font-semibold tracking-tight text-center">Change your Foxit 🦊</div>
            <div className="fox-hint mt-[5px] text-[11px] font-bold text-center">username lives in Settings ⚙</div>
            <div className="block mt-4 text-[11px] font-extrabold tracking-[.1em] uppercase text-[#999] text-center">Foxit expression</div>
            <div className="mt-2.5 grid grid-cols-3 gap-2">
              {EXPRESSIONS.map((e) => (
                <button
                  key={e.id}
                  onClick={() => pickExpr(e.id)}
                  className={`bg-[#0a0a0a] border-2 rounded-[14px] px-1 pt-1.5 pb-[5px] cursor-pointer ${e.id === expr.id ? 'border-[#FF6B35]' : 'border-[#2a2a2e]'}`}
                  style={e.id === expr.id ? { boxShadow: '0 0 0 2px rgba(255,107,53,.4)' } : undefined}
                >
                  <img
                    src={`./${artSrc(e.src, mat)}`}
                    alt={e.label}
                    loading="lazy"
                    style={mat.art === 'ruby' || !e.filter ? undefined : { filter: e.filter }}
                    className="w-full h-14 object-contain block"
                  />
                  <small className={`block mt-[3px] text-[10px] font-extrabold ${e.id === expr.id ? 'text-[#FF6B35]' : 'text-[#999]'}`}>{e.label}</small>
                </button>
              ))}
            </div>
            <div className="block mt-4 text-[11px] font-extrabold tracking-[.1em] uppercase text-[#999] text-center">Foxit material</div>
            <div className="mt-2.5 grid grid-cols-4 gap-2">
              {MATERIALS.map((m) => (
                <button
                  key={m.id}
                  onClick={() => pickMat(m.id)}
                  className={`bg-[#0a0a0a] border-2 rounded-[14px] px-0.5 pt-2 pb-1.5 cursor-pointer ${m.id === mat.id ? 'border-[#FF6B35]' : 'border-[#2a2a2e]'}`}
                  style={m.id === mat.id ? { boxShadow: '0 0 0 2px rgba(255,107,53,.4)' } : undefined}
                >
                  <i className="block w-[30px] h-[30px] rounded-full mx-auto" style={{ background: m.sw }} />
                  <small className={`block mt-1 text-[9px] font-extrabold ${m.id === mat.id ? 'text-[#FF6B35]' : 'text-[#999]'}`}>{m.label}</small>
                </button>
              ))}
            </div>
            <button id="profileClose" onClick={() => setProfileOpen(false)} className="fox-btn-orange block w-full mt-4 rounded-[14px] text-base py-[11px] cursor-pointer">
              done ✓
            </button>
          </div>
        </div>
      )}

      {/* settings sheet */}
      {settingsOpen && (
        <div onClick={(e) => e.target === e.currentTarget && setSettingsOpen(false)} className="fixed inset-0 z-[998] bg-black/70" style={{ backdropFilter: 'blur(2px)' }}>
          <div className="sheet-up absolute inset-x-0 bottom-0 mx-auto w-[min(100vw,480px)] max-h-[88dvh] overflow-y-auto bg-[#141417] border-t-2 border-[#FF6B35] rounded-t-[28px] px-5 pt-2 pb-6" style={{ boxShadow: '0 -18px 60px rgba(0,0,0,.6)' }}>
            <div className="w-10 h-1 rounded-full bg-white/20 mx-auto mt-1 mb-3" />
            <div className="text-[19px] font-semibold tracking-tight text-center">Settings ⚙</div>
            <div className="block mt-4 text-[11px] font-extrabold tracking-[.1em] uppercase text-[#999] text-center">Daily goal (meters)</div>
            <div className="mt-2 flex gap-2">
              <input
                value={goalInput}
                onChange={(e) => setGoalInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && saveGoal()}
                inputMode="numeric"
                placeholder="2000"
                className="flex-1 min-w-0 bg-[#0a0a0a] border border-[#333] rounded-xl px-3 py-2.5 text-base font-bold text-center focus:outline-none focus:border-[#FF6B35]"
              />
              <button id="goalSave" onClick={saveGoal} className="fox-btn-orange shrink-0 w-[76px] rounded-xl text-sm cursor-pointer">
                save
              </button>
            </div>
            <div className="mt-2 flex gap-1.5 justify-center flex-wrap">
              {GOAL_PRESETS.map((v) => (
                <button
                  key={v}
                  onClick={() => setGoalInput(String(v))}
                  className={`rounded-full px-[13px] py-[7px] text-[13px] font-extrabold cursor-pointer border ${
                    goalInput.trim() === String(v) ? 'bg-[#FF6B35] border-[#FF6B35] text-black' : 'bg-[#0a0a0a] border-[#333]'
                  }`}
                >
                  {v >= 10000 ? `${v / 1000}km` : `${v}m`}
                </button>
              ))}
            </div>
            <div className="block mt-4 text-[11px] font-extrabold tracking-[.1em] uppercase text-[#999] text-center">Runs per day</div>
            <div className="mt-2 flex gap-2">
              {[
                { v: 1, sub: 'once a day' },
                { v: 2, sub: 'morning & afternoon' },
                { v: 3, sub: 'all day' },
              ].map((p) => (
                <button
                  key={p.v}
                  onClick={() => setRuns(p.v)}
                  className={`flex-1 bg-[#0a0a0a] border-2 rounded-[14px] py-2.5 pb-2 cursor-pointer ${p.v === count ? 'border-[#FF6B35]' : 'border-[#2a2a2e]'}`}
                  style={p.v === count ? { boxShadow: '0 0 0 2px rgba(255,107,53,.4)' } : undefined}
                >
                  <b className={`block text-[22px] ${p.v === count ? 'text-[#FF6B35]' : ''}`}>{p.v}</b>
                  <small className="fox-hint block text-[10px] font-bold mt-0.5">{p.sub}</small>
                </button>
              ))}
            </div>
            <div className="block mt-4 text-[11px] font-extrabold tracking-[.1em] uppercase text-[#999] text-center">Username</div>
            <div className="mt-2 flex gap-2">
              <input
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && saveName()}
                maxLength={16}
                autoComplete="nickname"
                placeholder="e.g. fox_runner"
                className="flex-1 min-w-0 bg-[#0a0a0a] border border-[#333] rounded-xl px-3 py-2.5 text-base font-bold text-center focus:outline-none focus:border-[#FF6B35]"
              />
              <button id="setNameSave" onClick={saveName} className="fox-btn-orange shrink-0 w-[76px] rounded-xl text-sm cursor-pointer">
                save
              </button>
            </div>
            <Link to="/schedule" className="block mt-3.5 text-center text-[#FF6B35] text-sm font-extrabold no-underline">
              edit run times →
            </Link>
            <button id="settingsClose" onClick={() => setSettingsOpen(false)} className="fox-btn-orange block w-full mt-4 rounded-[14px] text-base py-[11px] cursor-pointer">
              done ✓
            </button>
          </div>
        </div>
      )}

      {/* idle thirst overlay */}
      {thirsty && (
        <div className="fixed left-1/2 top-[36%] -translate-x-1/2 -translate-y-1/2 z-[1001] text-center pointer-events-none">
          <img src="./foxit-thirsty.png" alt="Foxit is thirsty" className="w-[min(58vw,210px)] block mx-auto" style={{ animation: 'fox-bounce 1s ease-in-out infinite', filter: 'drop-shadow(0 8px 32px rgba(46,124,246,.5))' }} />
          <div className="inline-block mt-2 bg-[#111] border-2 border-[#2E7CF6] font-black text-[15px] rounded-full px-[18px] py-2">Drink water! 💧</div>
        </div>
      )}

      {toastEl}
    </div>
  );
}
