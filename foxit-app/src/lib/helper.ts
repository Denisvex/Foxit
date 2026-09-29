import { useEffect } from 'react';
import { KEYS } from './store';

/**
 * Helper 1.0: when the helper1 voice model is active, every element
 * carrying a `data-hint` attribute gets a tiny explanatory chip.
 * No hint chips are ever added when another model is active, and no
 * listen buttons exist anywhere — voice lives only on Models.
 */
const HINTS: Record<string, string> = {
  runBtn: 'start a run',
  workoutsBtn: 'open workouts',
  modelsBtn: 'open models & voices',
  spotsBtn: 'show your spots',
  mapToggle: 'map controls',
  gpsBtn: 'jump to my location',
  zoomIn: 'zoom in',
  zoomOut: 'zoom out',
  addBtn: 'save a new spot',
  startPointBtn: 'set run start',
  searchBtn: 'search places',
  searchClose: 'close search',
  spotCancel: 'cancel',
  spotSave: 'save spot',
  profileClose: 'close profile',
  settingsBtn: 'open settings',
  settingsClose: 'close settings',
  setNameSave: 'save name',
  goalSave: 'save goal',
};

export function hintFor(el: HTMLElement): string | null {
  if (el.dataset?.hint) return el.dataset.hint;
  const id = el.id || '';
  if (id && HINTS[id]) return HINTS[id];
  const t = (el.textContent || '').trim().toLowerCase();
  // fall back to matching by visible label for links/buttons
  for (const [key, h] of Object.entries(HINTS)) {
    if (t && key.toLowerCase().startsWith(t.slice(0, 4)) && t.length > 3) return h;
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
