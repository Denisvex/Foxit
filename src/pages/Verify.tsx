import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import TabBar from '../components/TabBar';
import { doneKey, saveStr } from '../lib/store';
import { stopVoice, useAutoGreet } from '../lib/voice';
import { useHelperHints } from '../lib/helper';
import { FilesetResolver, PoseLandmarker } from '@mediapipe/tasks-vision';
import type { NormalizedLandmark } from '@mediapipe/tasks-vision';

type JointKey = 'hip' | 'knee' | 'ankle' | 'shoulder' | 'elbow' | 'wrist';
type FaceMode = 'jaw' | 'neck';

interface Plan {
  name: string;
  ex: string;
  target: number;
  down: number;
  up: number;
  joints?: [JointKey, JointKey, JointKey];
  min?: boolean;
  jacks?: boolean;
  faceMode?: FaceMode;
}

// exercise plan per muscle group: full-range joint oscillation = 1 valid rep
const PLANS: Record<string, Plan> = {
  legs: { name: 'Legs', ex: 'Squats', target: 10, down: 110, up: 160, joints: ['hip', 'knee', 'ankle'] },
  back: { name: 'Back', ex: 'Standing rows', target: 8, down: 140, up: 168, joints: ['shoulder', 'hip', 'knee'] },
  abs: { name: 'Abdomen', ex: 'Knee raises', target: 10, down: 125, up: 158, joints: ['shoulder', 'hip', 'knee'], min: true },
  arms: { name: 'Arms', ex: 'Arm curls', target: 10, down: 65, up: 150, joints: ['shoulder', 'elbow', 'wrist'] },
  shoulders: { name: 'Shoulders', ex: 'Overhead press', target: 8, down: 80, up: 160, joints: ['hip', 'shoulder', 'elbow'] },
  chest: { name: 'Chest', ex: 'Wall push', target: 8, down: 90, up: 160, joints: ['shoulder', 'elbow', 'wrist'] },
  glutes: { name: 'Glutes', ex: 'Standing kickbacks', target: 10, down: 130, up: 162, joints: ['shoulder', 'hip', 'knee'], min: true },
  fullbody: { name: 'Full body', ex: 'Squat press', target: 8, down: 110, up: 160, joints: ['hip', 'knee', 'ankle'] },
  cardio: { name: 'Cardio', ex: 'Jumping jacks', target: 15, down: 0.9, up: 1.6, jacks: true },
  face: { name: 'Face', ex: 'Jaw opens', target: 12, down: 1.0, up: 1.5, faceMode: 'jaw' },
  neck: { name: 'Neck', ex: 'Head nods', target: 10, down: 110, up: 160, faceMode: 'neck' },
};

const IDX = {
  nose: 0, lEye: 3, rEye: 4, lEar: 7, rEar: 8, lMouth: 9, rMouth: 10,
  lSh: 11, rSh: 12, lEl: 13, rEl: 14, lWr: 15, rWr: 16,
  lHip: 23, rHip: 24, lKnee: 25, rKnee: 26, lAnk: 27, rAnk: 28,
} as const;

const LINKS: Array<readonly [number, number]> = [
  [11, 12], [11, 13], [13, 15], [12, 14], [14, 16], [11, 23], [12, 24],
  [23, 24], [23, 25], [24, 26], [25, 27], [26, 28],
];
const FACE_LINKS: Array<readonly [number, number]> = [
  [3, 4], [0, 3], [0, 4], [7, 8], [0, 7], [0, 8], [9, 10], [0, 9], [0, 10],
  [7, 9], [8, 10], [7, 11], [8, 12],
];

const JOINT_IDX: Record<JointKey, readonly [number, number]> = {
  hip: [IDX.lHip, IDX.rHip],
  knee: [IDX.lKnee, IDX.rKnee],
  ankle: [IDX.lAnk, IDX.rAnk],
  shoulder: [IDX.lSh, IDX.rSh],
  elbow: [IDX.lEl, IDX.rEl],
  wrist: [IDX.lWr, IDX.rWr],
};

interface Pt {
  x: number;
  y: number;
}

function ang(a: Pt, b: Pt, c: Pt): number {
  const v1x = a.x - b.x;
  const v1y = a.y - b.y;
  const v2x = c.x - b.x;
  const v2y = c.y - b.y;
  const d = Math.max(1e-6, Math.hypot(v1x, v1y) * Math.hypot(v2x, v2y));
  return (
    Math.acos(Math.min(1, Math.max(-1, (v1x * v2x + v1y * v2y) / d))) *
    (180 / Math.PI)
  );
}

function metric(lm: NormalizedLandmark[], plan: Plan): { v: number; vis: number } {
  if (plan.faceMode === 'jaw') {
    // mouth drop vs eye width — self-calibrates to your face in the loop
    const io =
      Math.hypot(lm[IDX.lEye].x - lm[IDX.rEye].x, lm[IDX.lEye].y - lm[IDX.rEye].y) || 1e-6;
    const v =
      ((lm[IDX.lMouth].y + lm[IDX.rMouth].y) / 2 - lm[IDX.nose].y) / io;
    const vis = Math.min(
      lm[IDX.nose].visibility ?? 1,
      lm[IDX.lEye].visibility ?? 1,
      lm[IDX.rEye].visibility ?? 1,
      lm[IDX.lMouth].visibility ?? 1,
      lm[IDX.rMouth].visibility ?? 1,
    );
    return { v, vis };
  }
  if (plan.faceMode === 'neck') {
    // chin tucks change the nose–ear–shoulder angle
    const a1 = ang(lm[IDX.nose], lm[IDX.lEar], lm[IDX.lSh]);
    const b1 = ang(lm[IDX.nose], lm[IDX.rEar], lm[IDX.rSh]);
    const v = (a1 + b1) / 2;
    const vis = Math.min(
      ...[IDX.nose, IDX.lEar, IDX.rEar, IDX.lSh, IDX.rSh].map(
        (i) => lm[i].visibility ?? 1,
      ),
    );
    return { v, vis };
  }
  if (plan.jacks) {
    const sw =
      Math.hypot(lm[IDX.lSh].x - lm[IDX.rSh].x, lm[IDX.lSh].y - lm[IDX.rSh].y) || 1e-6;
    const wd = Math.hypot(lm[IDX.lWr].x - lm[IDX.rWr].x, lm[IDX.lWr].y - lm[IDX.rWr].y);
    return {
      v: wd / sw,
      vis: Math.min(lm[IDX.lWr].visibility ?? 1, lm[IDX.rWr].visibility ?? 1),
    };
  }
  const joints = plan.joints ?? (['hip', 'knee', 'ankle'] as [JointKey, JointKey, JointKey]);
  const [ja, jb, jc] = joints;
  const m1 = ang(lm[JOINT_IDX[ja][0]], lm[JOINT_IDX[jb][0]], lm[JOINT_IDX[jc][0]]);
  const m2 = ang(lm[JOINT_IDX[ja][1]], lm[JOINT_IDX[jb][1]], lm[JOINT_IDX[jc][1]]);
  const v = plan.min ? Math.min(m1, m2) : (m1 + m2) / 2;
  const vis = Math.min(
    lm[JOINT_IDX[ja][0]].visibility ?? 1,
    lm[JOINT_IDX[jb][0]].visibility ?? 1,
    lm[JOINT_IDX[jc][0]].visibility ?? 1,
    lm[JOINT_IDX[ja][1]].visibility ?? 1,
    lm[JOINT_IDX[jb][1]].visibility ?? 1,
    lm[JOINT_IDX[jc][1]].visibility ?? 1,
  );
  return { v, vis };
}

// Is this actually a person, or a pillow pretending to be one?
// Background junk gives small, lopsided, half-invisible skeletons — real bodies don't.
function plausible(
  lm: NormalizedLandmark[],
  wlm: Array<{ x: number; y: number }> | null,
  plan: Plan,
): number | false {
  if (plan.faceMode) {
    // face workout: judge by the head, not the body — bring the camera close
    if ((lm[IDX.nose].visibility ?? 0) < 0.4) return false;
    if ((lm[IDX.lEye].visibility ?? 0) < 0.4 || (lm[IDX.rEye].visibility ?? 0) < 0.4)
      return false;
    const face = Math.hypot(lm[IDX.lEye].x - lm[IDX.rEye].x, lm[IDX.lEye].y - lm[IDX.rEye].y);
    if (face < 0.03 || face > 0.75) return false; // head must be a decent size in frame
    if (
      plan.faceMode === 'jaw' &&
      ((lm[IDX.lMouth].visibility ?? 0) < 0.4 || (lm[IDX.rMouth].visibility ?? 0) < 0.4)
    )
      return false;
    if (plan.faceMode === 'neck') {
      if ((lm[IDX.lEar].visibility ?? 0) < 0.35 || (lm[IDX.rEar].visibility ?? 0) < 0.35)
        return false;
      if ((lm[IDX.lSh].visibility ?? 0) < 0.35 || (lm[IDX.rSh].visibility ?? 0) < 0.35)
        return false;
    }
    return face;
  }
  // 1) overall + head confidence: a lump on the bed rarely yields a sure face
  const mean = lm.reduce((a, p) => a + (p.visibility ?? 1), 0) / Math.max(1, lm.length);
  if (mean < 0.45) return false;
  if ((lm[0].visibility ?? 0) < 0.35) return false;
  // 2) shoulders & hips must be seen
  const core = [IDX.lSh, IDX.rSh, IDX.lHip, IDX.rHip];
  if (core.some((i) => (lm[i].visibility ?? 0) < 0.5)) return false;
  const ms = { x: (lm[IDX.lSh].x + lm[IDX.rSh].x) / 2, y: (lm[IDX.lSh].y + lm[IDX.rSh].y) / 2 };
  const mh = { x: (lm[IDX.lHip].x + lm[IDX.rHip].x) / 2, y: (lm[IDX.lHip].y + lm[IDX.rHip].y) / 2 };
  const torso = Math.hypot(ms.x - mh.x, ms.y - mh.y);
  if (torso < 0.1) return false; // too small in frame = background object
  // 3) the person must be big enough to count (not a background smudge)
  const ys = [IDX.lSh, IDX.rSh, IDX.lHip, IDX.rHip, IDX.lKnee, IDX.rKnee].map(
    (i) => lm[i].y,
  );
  if (Math.max(...ys) - Math.min(...ys) < 0.2) return false;
  // 4) real proportions: shoulder/hip width present, torso straight
  const sw = Math.hypot(lm[IDX.lSh].x - lm[IDX.rSh].x, lm[IDX.lSh].y - lm[IDX.rSh].y);
  const hw = Math.hypot(lm[IDX.lHip].x - lm[IDX.rHip].x, lm[IDX.lHip].y - lm[IDX.rHip].y);
  if (sw < 0.035 || hw < 0.03) return false;
  const lT = Math.hypot(lm[IDX.lSh].x - lm[IDX.lHip].x, lm[IDX.lSh].y - lm[IDX.lHip].y);
  const rT = Math.hypot(lm[IDX.rSh].x - lm[IDX.rHip].x, lm[IDX.rSh].y - lm[IDX.rHip].y);
  if (Math.max(lT, rT) / Math.max(1e-6, Math.min(lT, rT)) > 2.4) return false; // lopsided torso = junk
  // 5) metric sanity from 3D world landmarks: a human torso is ~0.15-1.1m
  if (wlm && wlm[IDX.lSh] && wlm[IDX.lHip]) {
    const wt = Math.hypot(
      (wlm[IDX.lSh].x + wlm[IDX.rSh].x) / 2 - (wlm[IDX.lHip].x + wlm[IDX.rHip].x) / 2,
      (wlm[IDX.lSh].y + wlm[IDX.rSh].y) / 2 - (wlm[IDX.lHip].y + wlm[IDX.rHip].y) / 2,
    );
    if (wt < 0.15 || wt > 1.1) return false;
  }
  return torso;
}

function drawFrame(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  video: HTMLVideoElement,
  lm: NormalizedLandmark[] | null,
  plan: Plan,
): void {
  const W = canvas.width;
  const H = canvas.height;
  ctx.save();
  ctx.scale(-1, 1);
  ctx.drawImage(video, -W, 0, W, H);
  ctx.restore();
  if (!lm) return;
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#FF6B35';
  ctx.beginPath();
  (plan.faceMode ? FACE_LINKS : LINKS).forEach(([a, b]) => {
    ctx.moveTo(W - lm[a].x * W, lm[a].y * H);
    ctx.lineTo(W - lm[b].x * W, lm[b].y * H);
  });
  ctx.stroke();
  ctx.fillStyle = '#2E7CF6';
  lm.forEach((p) => {
    ctx.beginPath();
    ctx.arc(W - p.x * W, p.y * H, 4, 0, 7);
    ctx.fill();
  });
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export default function Verify() {
  const [params] = useSearchParams();
  const group = params.get('group') ?? 'legs';
  const customName = (params.get('custom') ?? '').trim().slice(0, 24);
  const motionKey = params.get('motion') ?? '';

  const plan = useMemo<Plan>(() => {
    const base = PLANS[group] ?? PLANS.legs;
    if (!customName) return base;
    const m = PLANS[motionKey] ?? PLANS.legs;
    return { ...m, name: customName, ex: customName };
  }, [group, customName, motionKey]);

  const [goal, setGoal] = useState(plan.target);
  const [reps, setReps] = useState(0);
  const [active, setActive] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [denied, setDenied] = useState(false);
  const [done, setDone] = useState(false);
  const [phaseHtml, setPhaseHtml] = useState('Tap <b>start</b> to begin');
  const [runId, setRunId] = useState(0);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const controlsRef = useRef<{ stop: (unverified: boolean) => void } | null>(null);
  const liveRef = useRef(0);
  const planRef = useRef(plan);
  planRef.current = plan;
  const goalRef = useRef(goal);
  goalRef.current = goal;

  useAutoGreet(
    `${plan.name} — ${plan.ex} × ${plan.target} Full range only: photo uploads can't count.`,
  );
  useHelperHints([active, denied, done]);

  // Camera + rAF + landmarker lifecycle. runId 0 = idle: no camera until Start.
  useEffect(() => {
    if (runId === 0) return;
    // StrictMode-safe: never run two setups for the same session.
    if (liveRef.current === runId) return;
    liveRef.current = runId;

    let cancelled = false;
    let stream: MediaStream | null = null;
    let video: HTMLVideoElement | null = null;
    let raf = 0;
    let landmarker: PoseLandmarker | null = null;

    let repCount = 0;
    let phase: 'up' | 'down' = 'up';
    let tDown = 0;
    let lastT = 0;
    let lastLm: NormalizedLandmark[] | null = null;
    let okFrames = 0;
    let armed = false;
    let lockTorso = 0;
    let jawRef: number | null = null;
    let lastPhase = '';

    const planSnap = planRef.current;
    const g = goalRef.current;
    const exLower = planSnap.ex.toLowerCase();
    const safeEx = escapeHtml(planSnap.ex);

    const say = (html: string) => {
      if (cancelled || html === lastPhase) return;
      lastPhase = html;
      setPhaseHtml(html);
    };

    const stopTracks = () => {
      try {
        stream?.getTracks().forEach((t) => t.stop());
      } catch {
        /* ignore */
      }
      stream = null;
    };

    const teardownLoop = () => {
      try {
        cancelAnimationFrame(raf);
      } catch {
        /* ignore */
      }
      raf = 0;
      stopTracks();
    };

    const teardownAll = () => {
      teardownLoop();
      if (landmarker) {
        try {
          landmarker.close();
        } catch {
          /* ignore */
        }
        landmarker = null;
      }
    };

    const doFinish = () => {
      teardownAll();
      saveStr(
        customName ? doneKey('custom') : doneKey(group),
        String(Date.now()),
      );
      setReps(g);
      setDone(true);
      setActive(false);
      if (!cancelled) setPhaseHtml(`<b>Verified!</b> ${safeEx} × ${g}`);
    };

    const doStop = (unverified: boolean) => {
      cancelled = true;
      teardownAll();
      setActive(false);
      if (unverified) {
        lastPhase = '';
        setPhaseHtml('Stopped — reps only count with live verification');
      }
    };

    controlsRef.current = { stop: doStop };

    const ensureLandmarker = async (): Promise<PoseLandmarker> => {
      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/wasm',
      );
      const LITE =
        'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task';
      const FULL =
        'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/1/pose_landmarker_full.task';
      const mk = (delegate: 'CPU' | 'GPU', model: string) =>
        PoseLandmarker.createFromOptions(vision, {
          baseOptions: { modelAssetPath: model, delegate },
          runningMode: 'VIDEO',
          numPoses: 1,
          minPoseDetectionConfidence: 0.5,
          minPosePresenceConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });
      try {
        return await mk('GPU', FULL);
      } catch {
        try {
          return await mk('CPU', FULL);
        } catch {
          return await mk('CPU', LITE);
        }
      }
    };

    const loop = () => {
      if (cancelled) return;
      raf = requestAnimationFrame(loop);
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d') ?? null;
      if (!canvas || !ctx) return;
      if (video && video.readyState >= 2 && landmarker) {
        const now = performance.now();
        if (now - lastT > 90) {
          lastT = now;
          try {
            const r = landmarker.detectForVideo(video, now);
            const cand = (r.landmarks && r.landmarks[0]) || null;
            const wcand = (r.worldLandmarks && r.worldLandmarks[0]) || null;
            const t = cand ? plausible(cand, wcand, planSnap) : 0;
            if (t) {
              // lock only on a body that stays the same size frame-to-frame (flickering junk jumps around)
              if (lockTorso && Math.abs(t - lockTorso) / lockTorso > 0.5) okFrames = 0;
              lockTorso = t;
              okFrames++;
              lastLm = cand;
              if (okFrames >= 6) armed = true; // 6 steady frames = locked onto a real person
            } else {
              okFrames = 0;
              lockTorso = 0;
              jawRef = null;
              lastLm = cand;
              armed = false; // blob or flicker — never counted
            }
          } catch {
            /* detection hiccup */
          }
        }
        drawFrame(ctx, canvas, video, armed ? lastLm : null, planSnap);
        if (!armed) {
          say(
            lastLm
              ? 'Locking on — hold still a moment'
              : planSnap.faceMode
                ? 'Bring your face into frame — eyes & mouth visible'
                : 'Fit your whole body in frame — I only count real people',
          );
          return;
        }
        const lm = lastLm;
        if (!lm) return;
        const { v, vis } = metric(lm, planSnap);
        if (vis < 0.5) {
          armed = false;
          okFrames = 0;
          lockTorso = 0;
          jawRef = null;
          say('I can barely see you — better light or move closer');
          return;
        }
        let downTh = planSnap.down;
        let upTh = planSnap.up;
        let niceDown = 'depth';
        if (planSnap.faceMode === 'jaw') {
          if (jawRef === null) jawRef = v;
          if (phase === 'down') jawRef = Math.min(jawRef, v); // calibrate to your closed mouth
          downTh = jawRef * 1.18;
          upTh = jawRef * 1.55;
          niceDown = 'mouth';
        } else if (planSnap.faceMode === 'neck') {
          niceDown = 'chin';
        }
        if (phase === 'up' && v <= downTh) {
          phase = 'down';
          tDown = now;
          say(`Good ${exLower} ${niceDown}! Now extend`);
        } else if (phase === 'down' && v >= upTh && now - tDown > 250) {
          phase = 'up';
          repCount++;
          setReps(repCount);
          if (repCount >= g) {
            doFinish();
            return;
          }
          say(`Rep <b>${repCount}</b> counted! ${g - repCount} to go`);
        } else if (phase === 'up') {
          say(`Do a full ${exLower} — I'll count it`);
        }
      }
    };

    const setup = async () => {
      setDenied(false);
      // CAMERA permission requested ONLY here, at workout start
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 720 }, height: { ideal: 1280 } },
          audio: false,
        });
      } catch {
        if (!cancelled) {
          setDenied(true);
          setPhaseHtml('Camera needed for live verification');
          setActive(false);
        }
        return;
      }
      if (cancelled) {
        stopTracks();
        return;
      }
      lastPhase = '';
      setPhaseHtml('Loading on-device pose model…');
      try {
        landmarker = await ensureLandmarker();
      } catch {
        stopTracks();
        if (!cancelled) {
          setPhaseHtml('Pose model needs internet once to load');
          setActive(false);
        }
        return;
      }
      if (cancelled) {
        teardownAll();
        return;
      }
      video = document.createElement('video');
      video.srcObject = stream;
      video.muted = true;
      video.playsInline = true;
      try {
        await video.play();
      } catch {
        /* play() rejected — readyState gate in the loop covers it */
      }
      const canvas = canvasRef.current;
      if (cancelled || !canvas) {
        teardownAll();
        if (!cancelled) setActive(false);
        return;
      }
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      repCount = 0;
      phase = 'up';
      lastLm = null;
      okFrames = 0;
      armed = false;
      lockTorso = 0;
      jawRef = null;
      setReps(0);
      setHasStarted(true);
      setActive(true);
      lastT = 0;
      lastPhase = '';
      setPhaseHtml(`Live! Do full-range ${exLower} — ${g} to verify`);
      loop();
    };

    setup();

    return () => {
      cancelled = true;
      teardownAll();
      if (controlsRef.current?.stop === doStop) controlsRef.current = null;
      if (liveRef.current === runId) liveRef.current = 0;
      stopVoice();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runId]);

  const handleStart = () => {
    setDenied(false);
    setDone(false);
    setReps(0);
    setRunId((id) => id + 1);
    setActive(true);
  };

  const handleStop = () => {
    controlsRef.current?.stop(true);
  };

  const changeGoal = (d: number) => {
    if (active) return;
    setGoal((prev) => Math.min(50, Math.max(5, prev + d)));
  };

  return (
    <div className="fox-app">
      <div className="fox-scroll">
      <div className="mx-auto w-full max-w-[400px] text-center">
        <div className="mb-2.5 flex items-center justify-between">
          <Link to="/workouts" className="text-[13px] font-extrabold text-[#999] no-underline">
            ← workouts
          </Link>
          <b className="text-[17px] tracking-tight">
            fox<span className="text-[#FF6B35]">it</span>
          </b>
          <span style={{ width: 74 }} />
        </div>

        <div className="mb-3 rounded-2xl border border-[#222] bg-[#111] px-3.5 py-3 text-sm">
          <b className="text-[#FF6B35]">
            {plan.name} — {plan.ex} × {goal}
          </b>
          <br />
          Full range only: photo uploads can&apos;t count.
        </div>

        <div
          className="relative mx-auto w-auto max-w-full overflow-hidden rounded-[20px] border-2 border-[#2a2a2e] bg-black"
          style={{ height: 'min(58dvh,150vw)', aspectRatio: '3/4' }}
        >
          <canvas
            ref={canvasRef}
            className="block h-full w-full"
            style={{ objectFit: 'cover' }}
          />
          {!hasStarted && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2.5 bg-[#0d0d10]">
              <img
                className="h-[130px] w-[130px] object-contain"
                style={{ filter: 'drop-shadow(0 8px 32px rgba(255,107,53,.35))' }}
                src="./foxit-asking.png"
                alt="Foxit waiting for camera"
              />
              <p className="px-6 text-[13px] text-[#999]">
                Camera stays OFF until you tap start.
                <br />
                Nothing is recorded or uploaded — pose runs on-device.
              </p>
            </div>
          )}
          {hasStarted && (
            <div className="absolute inset-x-2.5 bottom-2.5 rounded-[14px] border border-[#333] bg-[rgba(10,10,12,.85)] px-3 py-2 text-[13px] font-bold">
              <span dangerouslySetInnerHTML={{ __html: phaseHtml }} />
            </div>
          )}
        </div>

        <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-[#1a1a1a]">
          <i
            className="block h-full rounded-full transition-[width] duration-300"
            style={{
              width: `${Math.min(100, (reps / goal) * 100)}%`,
              background: 'linear-gradient(90deg,#2E7CF6,#FF6B35)',
            }}
          />
        </div>

        <div className="mt-3 flex items-center justify-center gap-3">
          <small className="text-[11px] font-extrabold uppercase tracking-[0.1em] text-[#999]">
            reps
          </small>
          <button
            id="repMinus"
            data-hint="fewer reps"
            aria-label="fewer reps"
            onClick={() => changeGoal(-1)}
            disabled={active}
            className="h-11 w-11 cursor-pointer rounded-full border-2 border-[#333] bg-[#111] text-xl font-black text-white active:border-[#FF6B35] disabled:opacity-35"
          >
            −
          </button>
          <div className="min-w-12 text-[26px] font-black">
            {active ? `${reps}/${goal}` : `${goal}`}
          </div>
          <button
            id="repPlus"
            data-hint="more reps"
            aria-label="more reps"
            onClick={() => changeGoal(1)}
            disabled={active}
            className="h-11 w-11 cursor-pointer rounded-full border-2 border-[#333] bg-[#111] text-xl font-black text-white active:border-[#FF6B35] disabled:opacity-35"
          >
            +
          </button>
        </div>

        <div className="mt-3 flex gap-2">
          <button
            id="startBtn"
            data-hint="begin live check"
            onClick={handleStart}
            disabled={active}
            className="fox-btn-primary flex h-14 flex-1 cursor-pointer items-center justify-center gap-2 rounded-2xl text-[17px] disabled:opacity-40"
            style={{ textShadow: '0 1px 4px rgba(0,0,0,.4)' }}
          >
            start ●
          </button>
          <button
            id="stopBtn"
            data-hint="end session"
            onClick={handleStop}
            disabled={!active}
            className="flex h-14 flex-1 cursor-pointer items-center justify-center gap-2 rounded-2xl border-2 border-[#333] bg-[#111] text-[17px] font-black text-white active:translate-y-0.5 disabled:opacity-40"
          >
            stop ■
          </button>
        </div>

        {denied && (
          <div className="mt-3 rounded-2xl border-2 border-[#FF6B35] bg-[#1a120e] p-3.5 text-left text-sm">
            <b className="text-[#FF6B35]">Camera blocked.</b>
            <br />
            Live verification is required for this workout — uploaded photos can&apos;t count.
            Please allow camera access (tap the lock icon in the address bar → Camera → Allow)
            and try again.
          </div>
        )}

        {done && (
          <div className="mt-3 rounded-2xl border-2 border-[#2E7CF6] bg-[#0e1a12] p-4">
            <img
              src="./foxit-running.png"
              alt="Foxit celebrating"
              className="mx-auto mb-1.5 block h-[90px] w-[90px] object-contain"
              style={{ filter: 'drop-shadow(0 8px 24px rgba(46,124,246,.5))' }}
            />
            <b className="text-lg text-[#2E7CF6]">Workout verified!</b>
            <div className="text-sm">
              {plan.ex} × {goal} verified live — no photos, all you!
            </div>
            <Link to="/workouts" className="mt-2.5 inline-block font-extrabold text-[#FF6B35] no-underline">
              ← back to workouts
            </Link>
          </div>
        )}

        <div className="mt-3 text-xs text-[#777]">
          <b className="text-[#999]">Private by design:</b> live preview only, pose detection
          runs 100% on-device, zero footage saved or sent anywhere.
        </div>
      </div>
      </div>
      <TabBar />
    </div>
  );
}
