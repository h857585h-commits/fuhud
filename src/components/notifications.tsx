'use client';
import { useState } from 'react';
import Link from '@/lib/next-shims/link';
import { Bell, Heart, MessageCircle, Users, UserPlus, Send, Flame, ShieldCheck, Trophy, Check, Trash2, Clapperboard } from 'lucide-react';
import { useApp } from './context';
import { EmptyState } from './ui';
import { profileOf } from './social';
import { RelTime } from './times';
import { UserName } from './badge';

const kindMeta: Record<string, { label: string; Icon: typeof Heart; className: string }> = {
  like: { label: 'إعجاب', Icon: Heart, className: 'text-red-300' },
  comment: { label: 'تعليق', Icon: MessageCircle, className: 'text-mint' },
  reply: { label: 'رد', Icon: MessageCircle, className: 'text-mint' },
  follow: { label: 'متابعة', Icon: Users, className: 'text-mint' },
  friend: { label: 'صداقة', Icon: UserPlus, className: 'text-gold' },
  message: { label: 'رسالة', Icon: Send, className: 'text-mint' },
  repost: { label: 'إعادة نشر', Icon: Clapperboard, className: 'text-gold' },
  group: { label: 'مجموعة', Icon: Users, className: 'text-gold' },
  moderation: { label: 'إدارة', Icon: ShieldCheck, className: 'text-mint' },
  match: { label: 'مباراة', Icon: Trophy, className: 'text-gold' },
};

export function NotificationsView() {
  const { data, act } = useApp();
  const [filter, setFilter] = useState<'all' | 'social' | 'messages' | 'match'>('all');
  const items = data.notifications.filter(n => {
    if (filter === 'all') return true;
    if (filter === 'messages') return n.kind === 'message' || n.kind === 'group';
    if (filter === 'match') return n.kind === 'match';
    return ['like', 'comment', 'reply', 'follow', 'friend', 'repost'].includes(n.kind);
  });
  const unread = data.notifications.filter(n => !n.read).length;
  if (!data.me) return <div className="panel"><EmptyState title="الإشعارات للأعضاء" description="سجّل دخولك لتصلك إعجابات التعليقات والمتابعات ورسائل المجموعة." /></div>;
  return <>
    <div className="page-heading"><div><div className="tagline"><Bell size={12} />كل ما يخصك في مكان واحد</div><h1>الإشعارات</h1><p>{unread ? `${unread} إشعار غير مقروء` : 'لا جديد الآن — تابع الملاعب.'}</p></div>
      <div className="flex gap-2">{unread > 0 && <button className="btn btn-secondary" onClick={() => act('notifications.read', { all: true })}><Check size={15} />تعليم الكل كمقروء</button>}
        <button className="btn btn-ghost" onClick={() => data.notifications.filter(n => !n.read).forEach(n => act('notifications.read', { id: n.id }, { silent: true }))}><Trash2 size={14} />تصفير القديم</button></div></div>
    <div className="tabs mb-4">{(['all', 'social', 'messages', 'match'] as const).map(k => <button key={k} className={`tab ${filter === k ? 'active' : ''}`} onClick={() => setFilter(k)}>{{ all: 'الكل', social: 'تفاعلات', messages: 'رسائل ومجموعات', match: 'مباريات وبطولات' }[k]}</button>)}</div>
    <div className="panel">
      {items.map(n => {
        const meta = kindMeta[n.kind] || { label: n.kind, Icon: Bell, className: 'text-mint' };
        const actor = profileOf(data, n.actorId);
        const Icon = meta.Icon;
        const body = <>
          <span className={`avatar !w-10 !h-10 shrink-0 overflow-hidden ${n.read ? '' : '!border-mint'}`}>{actor?.avatar ? <img src={actor.avatar} alt="" className="w-full h-full object-cover" /> : actor?.name?.[0] || <Icon size={16} />}</span>
          <span className="flex-1 min-w-0"><b className="text-xs block">{n.text}</b>{actor && <span className="mt-1 block"><UserName user={actor} size="sm" /></span>}
            <span className="text-[10px] muted flex items-center gap-2 mt-1"><Icon size={12} className={meta.className} />{meta.label} · <RelTime date={n.createdAt} />{n.kind === 'message' && <span className="flex items-center gap-1"><Flame size={11} className="text-gold" />streak نشط</span>}</span></span>
        </>;
        return n.href?.startsWith('/') ? <Link key={n.id} href={n.href} className={`notif-row ${n.read ? '' : 'unread'}`}>{body}</Link>
          : <div key={n.id} className={`notif-row ${n.read ? '' : 'unread'}`}>{body}</div>;
      })}
      {!items.length && <EmptyState title="لا إشعارات هنا" description="فعّل تفاعلك في الساحة، وستمتلئ هذه القائمة بالحياة." />}
    </div>
  </>;
}
