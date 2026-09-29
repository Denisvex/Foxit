import { useCallback, useRef, useState } from 'react';

/**
 * Per-page toast (orange pill, dark type). Usage:
 *   const { toast, toastEl } = useToast();
 *   toast('Saved!');
 *   ...
 *   {toastEl}
 */
export function useToast(timeout = 2200) {
  const [msg, setMsg] = useState<string | null>(null);
  const timer = useRef(0);

  const toast = useCallback(
    (m: string) => {
      setMsg(m);
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setMsg(null), timeout);
    },
    [timeout],
  );

  const toastEl = msg ? <div className="fox-toast">{msg}</div> : null;
  return { toast, toastEl };
}

export function esc(s: string): string {
  return s;
}
