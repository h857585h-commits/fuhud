import { useSyncExternalStore } from 'react';

/**
 * Client-only localStorage values, read through useSyncExternalStore so the
 * server render and the first client render agree (no hydration mismatch) and
 * no setState-in-effect gymnastics is needed.
 */
const listeners = new Set<() => void>();
if (typeof window !== 'undefined') {
  window.addEventListener('storage', () => listeners.forEach(l => l()));
  window.addEventListener('manar-local', () => listeners.forEach(l => l()));
}
const subscribe = (cb: () => void) => { listeners.add(cb); return () => listeners.delete(cb); };

export function localSet(key: string, value: string | null) {
  try { if (value === null) localStorage.removeItem(key); else localStorage.setItem(key, value); } catch { /* private mode */ }
  window.dispatchEvent(new Event('manar-local'));
}

export function useLocalString(key: string): string | null {
  return useSyncExternalStore(
    subscribe,
    () => { try { return localStorage.getItem(key); } catch { return null; } },
    () => null,
  );
}

export function useLocalFlag(key: string): boolean {
  const value = useLocalString(key);
  return value === '1' || value === 'true';
}

export function useLocalJson<T>(key: string, fallback: T): T {
  const raw = useLocalString(key);
  if (raw === null) return fallback;
  try { return JSON.parse(raw) as T; } catch { return fallback; }
}
