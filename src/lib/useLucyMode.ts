import { useState, useEffect } from 'react';

export type LucyRuntimeMode =
  | "frozen"
  | "safe"
  | "agent-active"
  | "hyperburn-stress"
  | "hyperburn-calm"
  | "emergency-rollback";

export function useLucyMode() {
  const [mode, setMode] = useState<LucyRuntimeMode>("safe");

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(window.location.origin);
        const current = res.headers.get("x-lucy-mode") as LucyRuntimeMode;
        if (current) setMode(current);
      } catch (err) {
        // ignore network error silently
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return mode;
}
