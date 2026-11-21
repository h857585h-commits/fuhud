'use client';
import { useEffect, useMemo, useState } from 'react';
import { useLocalString, localSet } from '@/lib/use-local';
import { ArrowLeft, ArrowRight, Bell, Check, Moon, SkipForward, Sparkles, Star, Users, Sun } from 'lucide-react';
import { useApp } from './context';
import { resolveBranding } from '@/lib/brand';
import { TeamCrest } from './ui';
import { playerStats } from '@/lib/stats';

const KEY = '***';

/**
 * First-run welcome flow: three screens (welcome → preferences → favourite
 * teams/players). Stored locally so it never nags again, and pushed to the
 * member account (preferences) when signed in.
 */
export function Onboarding() {
  const { data, act } = useApp();
  const seen = useLocalString(KEY) === 'done';
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [teams, setTeams] = useState<number[]>([]);
  const [players, setPlayers] = useState<number[]>([]);
  const [notifs, setNotifs] = useState(true);
  const [goals, setGoals] = useState(true);
  const [newsAlerts, setNewsAlerts] = useState(true);
  const themePref = useLocalString('manar-theme');
  const [dark, setDark] = useState(themePref === null ? true : themePref !== 'light');
  const b = resolveBranding(data.branding);
  const siteName = b.siteName?.trim() || 'منصة الفهود الرياضية';
  const tagline = b.onboardingTagline?.trim() || 'منصة الفرق الشعبية في الفهود';
  const heroLine = b.onboardingWelcome?.trim() || 'أهلاً بك في مدرّج الفهود';

  function finish() {
    localSet(KEY, 'done');
    setOpen(false);
    if (data.me) void act('user.preferences', { favoriteTeams: teams, favoritePlayers: players, settings: { notifications: notifs, goals, newsAlerts, theme: dark ? 'dark' : 'light' } }, { silent: true });
  }
  useEffect(() => {
    if (seen) return;
    // Re-read at fire time: a flag set by a previous visit must always win.
    const timer = setTimeout(() => {
      let done = false;
      try { done = localStorage.getItem(KEY) === 'done'; } catch { /* private mode → show once per load */ }
      if (!done) setOpen(true);
    }, 450);
    return () => clearTimeout(timer);
  }, [seen]);
  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = 'hidden';
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') finish(); };
    document.addEventListener('keydown', key);
    return () => { document.body.style.overflow = ''; document.removeEventListener('keydown', key); };
  }, [open]);

  const topPlayers = useMemo(() => playerStats(data).sort((a, b2) => b2.goals - a.goals || b2.assists - a.assists).slice(0, 12), [data]);
  function applyTheme(value: boolean) {
    setDark(value);
    document.documentElement.dataset.theme = value ? 'dark' : 'light';
    document.documentElement.classList.toggle('theme-light', !value);
    localSet('manar-theme', value ? 'dark' : 'light');
  }
  if (!open) return null;
  const screens = 3;
  return <div className="onb-backdrop" role="dialog" aria-modal="true" aria-label={`الترحيب في ${siteName}`}>
    <div className="onb-card">
      <button className="icon-btn onb-skip" onClick={finish} aria-label="تخطي"><SkipForward size={15} />تخطي</button>
      {step === 0 && <div className="onb-screen">
        <div className="onb-logo"><img src={b.logo?.trim() || '/icon.svg'} alt="" width={74} height={84} /></div>
        <span className="badge badge-gold mb-3"><Sparkles size={12} />أول زيارة لك</span>
        <h1 className="onb-title">{heroLine}</h1>
        <p className="onb-sub">{siteName} — {tagline}.</p>
        <div className="onb-features">{[['مباريات مباشرة ونتائج', Users], ['بوسترات جاهزة للمشاركة', Star], ['ساحة وجماهير', Bell]].map(([label, Icon], i) => { const C = Icon as typeof Users; return <div key={i} className="onb-feature"><C size={17} className="mint" /><span>{label as string}</span></div>; })}</div>
      </div>}

      {step === 1 && <div className="onb-screen">
        <h2 className="onb-title !text-2xl">إعداداتك العامة</h2>
        <p className="onb-sub">تقدر تغيّرها لاحقاً في أي وقت — هذا مجرد ضبط أولي مريح.</p>
        <div className="onb-option">
          <div><b className="text-sm">لغة الواجهة</b><span className="block text-[11px] muted mt-1">العربية مع اتجاه كامل من اليمين لليسار</span></div>
          <span className="badge badge-green">العربية · RTL</span>
        </div>
        <div className="onb-option">
          <div><b className="text-sm flex items-center gap-2"><Moon size={15} className="mint" />الوضع الليلي</b><span className="block text-[11px] muted mt-1">مريح للعين في سهرات الملعب</span></div>
          <button className={`onb-switch ${dark ? 'on' : ''}`} onClick={() => applyTheme(!dark)} role="switch" aria-checked={dark}><span />{dark ? <Moon size={12} /> : <Sun size={12} />}</button>
        </div>
        <div className="onb-option">
          <div><b className="text-sm flex items-center gap-2"><Bell size={15} className="gold" />الإشعارات</b><span className="block text-[11px] muted mt-1">تنبيهات الأهداف وأخبار فريقك ومبارياته</span></div>
          <button className={`onb-switch ${notifs ? 'on' : ''}`} onClick={() => setNotifs(v => !v)} role="switch" aria-checked={notifs}><span /></button>
        </div>
        {notifs && <div className="grid sm:grid-cols-2 gap-2">
          <label className="onb-check"><input type="checkbox" checked={goals} onChange={e => setGoals(e.target.checked)} />أهداف فريقي أولاً بأول</label>
          <label className="onb-check"><input type="checkbox" checked={newsAlerts} onChange={e => setNewsAlerts(e.target.checked)} />أخبار ومنشورات من أتابعهم</label>
        </div>}
      </div>}

      {step === 2 && <div className="onb-screen">
        <h2 className="onb-title !text-2xl">من تشجع؟ ومن تتابع؟</h2>
        <p className="onb-sub">اختر فرقك ولاعبيك المفضلين — بنرتّب لك الصفحة الأولى على مزاجك.</p>
        <span className="text-[11px] muted font-bold">الفرق {teams.length ? `(${teams.length})` : ''}</span>
        <div className="onb-teams">{data.teams.map(t => <button key={t.id} className={`onb-team ${teams.includes(t.id) ? 'on' : ''}`} onClick={() => setTeams(v => v.includes(t.id) ? v.filter(x => x !== t.id) : [...v, t.id])}>
          <TeamCrest team={t} size={40} /><span>{t.name}</span>{teams.includes(t.id) && <Check size={13} className="mint" />}
        </button>)}</div>
        <span className="text-[11px] muted font-bold mt-4 block">اللاعبون المفضلون {players.length ? `(${players.length})` : ''}</span>
        <div className="onb-players">{topPlayers.map(pl => <button key={pl.id} className={`onb-player ${players.includes(pl.id) ? 'on' : ''}`} onClick={() => setPlayers(v => v.includes(pl.id) ? v.filter(x => x !== pl.id) : [...v, pl.id])}>
          <span className="num mint font-bold">#{pl.number}</span><span className="flex-1 text-start truncate">{pl.name}</span>
          <span className="text-[10px] muted">{data.teams.find(t => t.id === pl.teamId)?.name}</span>{pl.goals > 0 && <span className="badge badge-green !text-[8px]">{pl.goals} هدف</span>}
          {players.includes(pl.id) && <Check size={13} className="mint" />}
        </button>)}</div>
      </div>}

      <div className="onb-foot">
        <div className="onb-dots">{Array.from({ length: screens }).map((_, i) => <button key={i} className={`onb-dot ${i === step ? 'on' : ''}`} onClick={() => setStep(i)} aria-label={`الشاشة ${i + 1}`} />)}</div>
        <div className="flex gap-2">
          {step > 0 && <button className="btn btn-ghost btn-sm" onClick={() => setStep(s => s - 1)}><ArrowRight size={14} />رجوع</button>}
          {step < screens - 1 ? <button className="btn btn-primary btn-sm" onClick={() => setStep(s => s + 1)}>التالي<ArrowLeft size={14} /></button>
            : <button className="btn btn-gold btn-sm" onClick={finish}><Check size={15} />ابدأ رحلتي</button>}
        </div>
      </div>
    </div>
  </div>;
}
