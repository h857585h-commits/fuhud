'use client';
import { useEffect, useRef, type ReactNode, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { X, Shield, Sun, Star, Stars, Flame, Crown, Zap, Trophy, ArrowLeft, Inbox, LoaderCircle, type LucideIcon } from 'lucide-react';
import type { Team } from '@/lib/data';

export function Brand({ small = false }: { small?: boolean }) { return <div className="brand"><img src="/icon.svg" alt="شعار منصة الفهود الرياضية" width={small ? 34 : 42} height={small ? 38 : 46} /><div><div className="brand-name">منصة الفهود الرياضية</div><div className="brand-sub">الفهود الرياضية</div></div></div>; }
const emblems: Record<string, LucideIcon> = { shield: Shield, sun: Sun, star: Star, stars: Stars, flame: Flame, crown: Crown, zap: Zap, trophy: Trophy };
export function TeamCrest({ team, size = 48, className = '' }: { team?: Partial<Pick<Team, 'name' | 'color' | 'emblem' | 'logo'>>; size?: number; className?: string }) {
  const color = team?.color || '#78dfab'; const Icon = emblems[team?.emblem || 'shield'] || Shield;
  return <div className={`crest ${className}`} style={{ width: size, height: size * 1.14, color, '--crest-text': `${Math.max(7, size * .115)}px` } as CSSProperties} aria-label={`شعار ${team?.name || 'الفريق'}`}>{team?.logo ? <img src={team.logo} alt="" draggable={false} style={{ width: '88%', height: '88%', objectFit: 'contain', background: 'transparent' }} /> : <><svg viewBox="0 0 80 92" fill="none"><path d="M40 3 73 15 69 53Q65 73 40 88 15 73 11 53L7 15Z" fill={color + '16'} stroke={color} strokeWidth="2.3" /><path d="M40 9 67 20 63 52Q59 68 40 81 21 68 17 52L13 20Z" stroke={color} strokeOpacity=".35" strokeWidth="1" /><path d="m29 75 11 6 11-6" stroke={color} strokeOpacity=".5" /></svg><Icon className="crest-icon" strokeWidth={1.65} /><span className="crest-name">{team?.name || 'الفريق'}</span></>}</div>;
}
export function SectionHead({ title, icon: Icon, children }: { title: string; icon?: LucideIcon; children?: ReactNode }) { return <div className="section-head"><h2>{Icon && <Icon size={19} className="mint" />}{title}</h2>{children}</div>; }
export function PageHeading({ title, description, eyebrow, children }: { title: string; description?: string; eyebrow?: string; children?: ReactNode }) { return <div className="page-heading"><div>{eyebrow && <div className="tagline">{eyebrow}</div>}<h1>{title}</h1>{description && <p>{description}</p>}</div>{children}</div>; }
export function EmptyState({ title = 'لا توجد بيانات هنا بعد', description, children }: { title?: string; description?: string; children?: ReactNode }) { return <div className="empty"><Inbox size={35} strokeWidth={1.3} /><h3>{title}</h3>{description && <p className="text-xs max-w-sm">{description}</p>}{children}</div>; }
export function FullLink({ href, children }: { href: string; children: ReactNode }) { return <a href={href} className="text-link">{children}<ArrowLeft size={14} /></a>; }
export function Spinner({ size = 17 }: { size?: number }) { return <LoaderCircle size={size} className="spinner" />; }
export function FormField({ label, children, hint, full = false }: { label: string; children: ReactNode; hint?: string; full?: boolean }) { return <label className={`field ${full ? 'full' : ''}`}><span>{label}</span>{children}{hint && <small>{hint}</small>}</label>; }
export function Modal({ title, children, onClose, wide = false }: { title: string; children: ReactNode; onClose: () => void; wide?: boolean }) {
  const ref = useRef<HTMLDivElement>(null); const closeRef = useRef(onClose);
  useEffect(() => { closeRef.current = onClose; });
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null; const overflow = document.body.style.overflow; document.body.style.overflow = 'hidden';
    const timeout = setTimeout(() => ref.current?.querySelector<HTMLElement>('button, input, select, textarea, [tabindex="0"]')?.focus(), 40);
    const handle = (e: KeyboardEvent) => { if (e.key === 'Escape') closeRef.current(); if (e.key === 'Tab') { const elements = ref.current?.querySelectorAll<HTMLElement>('button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex="0"]'); if (!elements?.length) return; const first = elements[0], last = elements[elements.length - 1]; if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); } else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); } } };
    document.addEventListener('keydown', handle); return () => { clearTimeout(timeout); document.body.style.overflow = overflow; document.removeEventListener('keydown', handle); previous?.focus(); };
  }, []);
  return createPortal(<div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}><div ref={ref} className={`modal ${wide ? 'modal-wide' : ''}`} role="dialog" aria-modal="true" aria-label={title}><div className="modal-head"><h2>{title}</h2><button className="icon-btn" onClick={onClose} aria-label="إغلاق النافذة"><X size={18} /></button></div><div className="modal-body">{children}</div></div></div>, document.body);
}
export function FormDots({ form }: { form: string[] }) { return <div className="flex items-center" dir="ltr" aria-label={form.map(f => f === 'W' ? 'فوز' : f === 'D' ? 'تعادل' : 'خسارة').join('، ')}>{form.map((f, i) => <span key={i} className={`form-dot form-${f}`} title={f === 'W' ? 'فوز' : f === 'D' ? 'تعادل' : 'خسارة'}>{f === 'W' ? 'ف' : f === 'D' ? 'ت' : 'خ'}</span>)}</div>; }
