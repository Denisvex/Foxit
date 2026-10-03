import { useEffect } from 'react';
import { t } from './i18n';
import { KEYS } from './store';

/**
 * Helper 1.0: when the helper1 voice model is active, every element
 * carrying a `data-hint` attribute gets a tiny explanatory chip.
 * No hint chips are ever added when another model is active, and no
 * listen buttons exist anywhere — voice lives only on Models.
 */
const HINTS: Record<string, string> = {
  runBtn: 'hints.run_btn',
  workoutsBtn: 'hints.workouts_btn',
  modelsBtn: 'hints.models_btn',
  spotsBtn: 'hints.spots_btn',
  mapToggle: 'hints.map_toggle',
  gpsBtn: 'hints.gps_btn',
  zoomIn: 'hints.zoom_in',
  zoomOut: 'hints.zoom_out',
  addBtn: 'hints.add_btn',
  startPointBtn: 'hints.start_point_btn',
  searchBtn: 'hints.search_btn',
  searchClose: 'hints.search_close',
  spotCancel: 'hints.spot_cancel',
  spotSave: 'hints.spot_save',
  profileClose: 'hints.profile_close',
  settingsBtn: 'hints.settings_btn',
  settingsClose: 'hints.settings_close',
  setNameSave: 'hints.set_name_save',
  goalSave: 'hints.goal_save',
};

export function hintFor(el: HTMLElement): string | null {
  if (el.dataset?.hint) return el.dataset.hint;
  const id = el.id || '';
  if (id && HINTS[id]) return t(HINTS[id]);
  const t2 = (el.textContent || '').trim().toLowerCase();
  // fall back to matching by visible label for links/buttons
  for (const [key, hkey] of Object.entries(HINTS)) {
    if (t2 && key.toLowerCase().startsWith(t2.slice(0, 4)) && t2.length > 3) return t(hkey);
  }
  return null;
}

export function helperActive(): boolean {
  try {
    return localStorage.getItem(KEYS.voiceModel) === 'helper1';
  } catch {
    return false;
  }
}

export function applyHelperHints(root: ParentNode = document): void {
  try {
    root.querySelectorAll('.helper-hint').forEach((n) => n.remove());
    if (!helperActive()) return;
    const els = root.querySelectorAll<HTMLElement>('button, a[href]');
    els.forEach((b) => {
      if (b.querySelector('.helper-hint')) return;
      const h = hintFor(b);
      if (!h) return;
      const s = document.createElement('span');
      s.className = 'helper-hint';
      s.textContent = h;
      const pos = getComputedStyle(b).position;
      if (pos === 'static') b.style.position = 'relative';
      b.appendChild(s);
    });
  } catch {
    /* ignore */
  }
}

/** React hook: (re-)apply helper chips whenever deps change. */
export function useHelperHints(deps: unknown[] = []): void {
  useEffect(() => {
    const t = window.setTimeout(() => applyHelperHints(document), 60);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
