'use client';
import { useSyncExternalStore } from 'react';
import { localSet } from '@/lib/use-local';
import { Sun, Moon } from 'lucide-react';
const subscribe = (cb: () => void) => { const obs = new MutationObserver(cb); obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] }); return () => obs.disconnect(); };
const getSnapshot = () => document.documentElement.dataset.theme === 'light';
const getServerSnapshot = () => false;

export function ThemeToggle() {
  const light = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  function toggle() {
    const next = !light;
    document.documentElement.dataset.theme = next ? 'light' : 'dark';
    document.documentElement.classList.toggle('theme-light', next);
    localSet('manar-theme', next ? 'light' : 'dark');
  }
  return <button onClick={toggle} className="icon-btn theme-toggle" aria-label={light ? 'تحويل إلى الوضع الليلي' : 'تحويل إلى الوضع النهاري'} title={light ? 'الوضع الليلي' : 'الوضع النهاري'}>{light ? <Moon size={17} /> : <Sun size={17} />}</button>;
}
