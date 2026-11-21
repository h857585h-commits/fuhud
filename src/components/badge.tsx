'use client';
import Link from '@/lib/next-shims/link';
import { useId } from 'react';
import { useApp } from './context';
import { BADGES, verifyLevelOf, VERIFY_LEVELS, type BadgeKey, type VerifyLevel } from '@/lib/perms';
import type { Snapshot } from '@/lib/data';

type MiniUser = {
  id?: number | null; name: string; username?: string; verified?: boolean; badge?: string; role?: string;
  badgeTeamId?: number | null; teamId?: number | null; verifiedAt?: string | null; verifiedNote?: string; verifiedByName?: string | null;
};

/**
 * Official verification seal: a shield with a level-coloured gradient, an
 * embossed check, a slow sheen, and a shine sweep on hover. The tooltip names
 * the issuer and date, so it reads as an issued credential — not a toggle.
 */
export function VerifyMark({ level = 'blue', size = 16, user, title }: { level?: VerifyLevel; size?: number; user?: MiniUser | null; title?: string }) {
  const uid = useId().replace(/:/g, '');
  const v = VERIFY_LEVELS[level] || VERIFY_LEVELS.blue;
  const gid = `vsh-${level}-${uid}`;
  const shine = `vsn-${uid}`;
  const issued = user?.verifiedAt ? new Date(user.verifiedAt).toLocaleDateString('ar-IQ', { day: 'numeric', month: 'long', year: 'numeric' }) : null;
  const tip = title || [
    'حساب موثق رسمياً من إدارة المنار',
    user?.verifiedByName ? `المُوثِّق: ${user.verifiedByName}` : '',
    issued ? `بتاريخ: ${issued}` : '',
    user?.verifiedNote ? `السبب: ${user.verifiedNote}` : '',
  ].filter(Boolean).join(' · ');
  return (
    <span className={`vseal vseal-${level}`} style={{ width: size, height: size * 1.14 }} tabIndex={0} role="img" aria-label={tip} data-tip={tip} title={tip}>
      <svg viewBox="0 0 24 27" aria-hidden>
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={v.ring[0]} /><stop offset="48%" stopColor={v.ring[1]} /><stop offset="100%" stopColor={v.ring[2]} />
          </linearGradient>
          <linearGradient id={shine} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffffff" stopOpacity=".55" /><stop offset="60%" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d="M12 1.2 21.6 5v9.1c0 6.4-9.6 11.7-9.6 11.7S2.4 20.5 2.4 14.1V5Z" fill={`url(#${gid})`} />
        <path d="M12 3.1 19.8 6.4v7.7c0 5.1-7.8 9.4-7.8 9.4s-7.8-4.3-7.8-9.4V6.4Z" fill="#0c1a16" opacity=".55" />
        <path d="M12 3.1 19.8 6.4v7.7c0 5.1-7.8 9.4-7.8 9.4s-7.8-4.3-7.8-9.4V6.4Z" fill={`url(#${shine})`} opacity=".22" />
        <path d="m7.9 13.4 2.9 2.9 5.6-6.1" fill="none" stroke="#f4fbf7" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <i className="vseal-sheen" aria-hidden />
    </span>
  );
}

/** The coloured identity chip that sits next to a member's name everywhere. */
export function BadgeChip({ user, size = 'md' }: { user?: MiniUser | null; size?: 'sm' | 'md' }) {
  if (!user?.badge) return null;
  const meta = (BADGES as Record<string, { label: string; Icon: string; className: string; withTeam?: boolean }>)[user.badge];
  if (!meta) return null;
  return <BadgeChipView className={`user-badge ${meta.className} ${size === 'sm' ? '!text-[8px] !px-1.5' : ''}`} icon={meta.Icon} label={meta.label} teamName={meta.withTeam ? user.badgeTeamId ?? user.teamId : undefined} />;
}
function BadgeChipView({ className, icon, label, teamName }: { className: string; icon: string; label: string; teamName?: number | null }) {
  const { data } = useApp();
  const team = teamName ? data.teams.find(t => t.id === teamName) : undefined;
  return <span className={className} title={team ? `${label} — ${team.name}` : label}>
    <span className="ub-icon" aria-hidden>{icon}</span>
    {team ? `${label} · ${team.name}` : label}
  </span>;
}

/** Full identity row: name + official seal + badge. */
export function UserName({ user, size = 'md', link = true, className = '' }: { user?: MiniUser | null; size?: 'sm' | 'md' | 'lg'; link?: boolean; className?: string }) {
  if (!user) return null;
  const level = verifyLevelOf(user as { role?: string; badge?: string; verified?: boolean });
  const body = (
    <span className={`uname uname-${size} ${className}`}>
      <b>{user.name}</b>
      {user.verified ? <VerifyMark level={level} size={size === 'lg' ? 21 : size === 'sm' ? 13 : 15} user={user} /> : <span className="uname-plain" aria-hidden />}
      <BadgeChip user={user} size={size === 'sm' ? 'sm' : 'md'} />
    </span>
  );
  return link && user.id ? <Link href={`/fans/${user.id}`} className="uname-link">{body}</Link> : body;
}

/** Resolves a member from the snapshot and renders them with their identity marks. */
export function UserNameById({ userId, name, size = 'md', sub }: { userId?: number | null; name?: string; size?: 'sm' | 'md' | 'lg'; sub?: React.ReactNode }) {
  const { data } = useApp();
  const found = data.profiles.find(p => p.id === userId) as (Snapshot['profiles'][number] & MiniUser) | undefined;
  const user: MiniUser | null = found ? { ...found } : name ? { name, id: userId ?? undefined } : null;
  if (!user) return null;
  return (
    <span className="uname-wrap">
      <UserName user={user} size={size} />
      {sub && <span className="uname-sub">{sub}</span>}
    </span>
  );
}

/** Compact official card used on public profiles — shows the issued credential. */
export function VerificationCard({ user }: { user?: MiniUser | null }) {
  if (!user?.verified) return null;
  const level = verifyLevelOf(user as { role?: string; badge?: string; verified?: boolean });
  const date = user.verifiedAt ? new Date(user.verifiedAt).toLocaleDateString('ar-IQ', { day: 'numeric', month: 'long', year: 'numeric' }) : null;
  return (
    <div className={`vcard vcard-${level}`}>
      <VerifyMark level={level} size={26} user={user} />
      <div className="flex-1 min-w-0">
        <b className="text-xs block">حساب موثق رسمياً</b>
        <p className="text-[10px] leading-6 mt-1 opacity-85">{user.verifiedNote || 'موثّق من إدارة منصة الفهود الرياضية لوضوح هويته في المنصة.'}</p>
        <span className="text-[9px] opacity-70 block mt-1">{user.verifiedByName ? `أصدرها ${user.verifiedByName}` : 'إدارة المنصة'}{date ? ` · ${date}` : ''}</span>
      </div>
      <span className={`vcard-level vcard-level-${level}`}>{VERIFY_LEVELS[level].label}</span>
    </div>
  );
}
