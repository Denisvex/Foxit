// Centralised localStorage access. Keys must stay identical to the
// vanilla app so existing installs keep their data.

export const KEYS = {
  username: 'foxit_username',
  goalMeters: 'foxit_goal_meters',
  runsPerDay: 'foxit_runs_per_day',
  runTimes: 'foxit_run_times',
  spot: 'foxit_spot',
  expression: 'foxit_expression',
  material: 'foxit_material',
  log: 'foxit_log',
  voiceModel: 'foxit_voice_model',
  music: 'foxit_music',
} as const;

export function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw == null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function save(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable — app still works for the session */
  }
}

export function loadStr(key: string, fallback = ''): string {
  try {
    const raw = localStorage.getItem(key);
    return raw == null ? fallback : raw;
  } catch {
    return fallback;
  }
}

export function saveStr(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* ignore */
  }
}

export function doneKey(group: string): string {
  return `foxit_done_${group}`;
}
