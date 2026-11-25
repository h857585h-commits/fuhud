'use client';
import { useSyncExternalStore, useEffect, useState } from 'react';

/** True only after hydration — lets relative/clock text render without a mismatch. */
const noopSubscribe = () => () => {};
export function useMounted() {
  return useSyncExternalStore(noopSubscribe, () => true, () => false);
}

const DAY = 86400000;
function relative(date: string | Date) {
  const diff = (Date.now() - new Date(date).getTime()) / 1000;
  if (diff < 60) return 'الآن';
  if (diff < 3600) return `منذ ${Math.floor(diff / 60)} دقيقة`;
  if (diff < DAY) return `منذ ${Math.floor(diff / 3600)} ساعة`;
  if (diff < 7 * DAY) return `منذ ${Math.floor(diff / DAY)} يوم`;
  return new Date(date).toLocaleDateString('ar-IQ', { day: 'numeric', month: 'short' });
}

/** Relative time that is stable on the server and precise once mounted. */
export function RelTime({ date, className = '' }: { date: string | Date; className?: string }) {
  const mounted = useMounted();
  const iso = typeof date === 'string' ? date : date.toISOString();
  const stable = new Date(date).toLocaleDateString('ar-IQ', { day: 'numeric', month: 'short' });
  return <span className={className} suppressHydrationWarning>{mounted ? relative(iso) : stable}</span>;
}

/** Wall-clock time (messages) — client-only, falls back to the date pre-hydration. */
export function ClockText({ date }: { date: string | Date }) {
  const mounted = useMounted();
  if (!mounted) return <span suppressHydrationWarning>{new Date(date).toLocaleDateString('ar-IQ', { day: 'numeric', month: 'short' })}</span>;
  return <span suppressHydrationWarning>{new Date(date).toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit' })}</span>;
}

/** Live match clock label, ticking from the stored half start; past the half length shows added time (45+2). */
export function matchClockLabel(m: { status: string; minute: number; clockPeriod?: string | null; clockStartedAt?: string | null }, half: number, now: number) {
  if (m.clockPeriod === 'half') return 'استراحة';
  if ((m.clockPeriod === 'first' || m.clockPeriod === 'second') && m.clockStartedAt) {
    const elapsed = Math.max(0, Math.floor((now - new Date(m.clockStartedAt).getTime()) / 60000)) + 1;
    const base = m.clockPeriod === 'first' ? 0 : half, limit = base + half, minute = base + elapsed;
    return minute > limit ? `${limit}+${minute - limit}′` : `${minute}′`;
  }
  return `${m.minute}′`;
}
export function MatchClock({ match, half }: { match: Parameters<typeof matchClockLabel>[0]; half: number }) {
  const mounted = useMounted(); const [now, setNow] = useState(() => Date.now());
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 10000); return () => clearInterval(t); }, []);
  return <span suppressHydrationWarning>{mounted ? matchClockLabel(match, half, now) : `${match.minute}′`}</span>;
}
