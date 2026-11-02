'use client';
import type { SVGProps } from 'react';
import { useApp } from './context';

type SvgProps = SVGProps<SVGSVGElement>;
export function FacebookIcon(props: SvgProps) { return <svg viewBox="0 0 24 24" fill="currentColor" width={20} height={20} aria-hidden {...props}><path d="M13.5 21v-7h2.4l.4-3h-2.8V9.1c0-.9.3-1.5 1.6-1.5h1.3V4.9c-.3 0-1.2-.1-2.2-.1-2.2 0-3.7 1.3-3.7 3.8V11H8v3h2.5v7h3Z" /></svg>; }
export function InstagramIcon(props: SvgProps) { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} width={20} height={20} aria-hidden {...props}><rect x="3.5" y="3.5" width="17" height="17" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.2" cy="6.8" r=".9" fill="currentColor" stroke="none" /></svg>; }
export function WhatsappIcon(props: SvgProps) { return <svg viewBox="0 0 24 24" fill="currentColor" width={20} height={20} aria-hidden {...props}><path d="M12 3.2A8.7 8.7 0 0 0 3.4 12c0 1.6.5 3.2 1.3 4.5L3.2 21l4.7-1.4c1.3.8 2.7 1.2 4.1 1.2a8.7 8.7 0 0 0 8.7-8.8A8.7 8.7 0 0 0 12 3.2Zm0 15.9c-1.3 0-2.6-.4-3.7-1l-.3-.2-2.8.8.8-2.7-.2-.3a7 7 0 1 1 6.2 3.4Zm3.8-5.2c-.2-.1-1.2-.6-1.4-.7-.2-.1-.3-.1-.5.1-.1.2-.5.7-.7.8-.1.1-.3.1-.5 0a5.9 5.9 0 0 1-1.7-1 6.4 6.4 0 0 1-1.2-1.5c-.1-.2 0-.4.1-.5l.3-.4c.1-.1.1-.3.2-.4.1-.1 0-.3 0-.4l-.7-1.6c-.2-.4-.4-.4-.5-.4h-.4c-.1 0-.4 0-.6.3-.2.3-.7.7-.7 1.8s.8 2.1.9 2.2c.1.1 1.5 2.3 3.6 3.2.5.2.9.4 1.2.5.5.2.9.1 1.3.1.4-.1 1.2-.5 1.3-1 .2-.5.2-.9.1-1-.1-.1-.2-.2-.5-.3Z" /></svg>; }
export function TelegramIcon(props: SvgProps) { return <svg viewBox="0 0 24 24" fill="currentColor" width={20} height={20} aria-hidden {...props}><path d="M21.5 3.7 2.9 11c-.8.3-.8.9-.1 1.1l4.6 1.4 1.8 5.5c.2.7.4.9.9.5l2.6-2.5 4.5 3.3c.6.4 1.1.1 1.3-.6l2.6-12.7c.2-.7-.3-1-1-1ZM8.3 12.9l9.2-5.8c.5-.3.9-.1.6.2l-7.8 7-.3 3.2-1.7-4.6Z" /></svg>; }
export function YoutubeIcon(props: SvgProps) { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} width={20} height={20} aria-hidden {...props}><rect x="2.8" y="5.5" width="18.4" height="13" rx="3.5" /><path d="m10.2 9.5 4.6 2.5-4.6 2.5Z" fill="currentColor" stroke="none" /></svg>; }

export const socialMeta = [
  { key: 'facebook', label: 'فيسبوك', Icon: FacebookIcon },
  { key: 'instagram', label: 'إنستغرام', Icon: InstagramIcon },
  { key: 'whatsapp', label: 'واتساب', Icon: WhatsappIcon },
  { key: 'telegram', label: 'تيليجرام', Icon: TelegramIcon },
  { key: 'youtube', label: 'يوتيوب', Icon: YoutubeIcon },
] as const;
export type SocialKey = (typeof socialMeta)[number]['key'];
export type SocialEntry = { url: string; handle: string };
export type SocialMap = Record<SocialKey, SocialEntry>;

const fallbacks: Record<SocialKey, { url: string; handle: string }> = {
  facebook: { url: 'https://facebook.com', handle: '@ManarFootball' },
  instagram: { url: 'https://instagram.com', handle: '@manar.football' },
  whatsapp: { url: 'https://wa.me/9647000000000', handle: 'قناة الجماهير' },
  telegram: { url: 'https://t.me', handle: 't.me/manarfootball' },
  youtube: { url: 'https://youtube.com', handle: 'قصص الملعب' },
};

/** Priority: value saved from the dashboard → hosting env var → built-in fallback. */
export function resolveSocial(key: SocialKey, stored?: Partial<SocialEntry>): SocialEntry {
  const envUrl = ((import.meta.env as Record<string, string | undefined>)[`VITE_${key.toUpperCase()}_URL`] || "").trim();
  const url = (stored?.url || '').trim() || envUrl || fallbacks[key].url;
  const handle = (stored?.handle || '').trim() || fallbacks[key].handle;
  return { url, handle };
}

export function SocialButtons({ compact = false }: { compact?: boolean }) {
  const { data } = useApp(); const social = data.social as Partial<SocialMap> | undefined;
  return <div className={compact ? 'flex gap-2' : 'flex flex-wrap gap-3'}>
    {socialMeta.map(({ key, label, Icon }) => {
      const { url, handle } = resolveSocial(key, social?.[key]);
      return <a key={key} href={url} target="_blank" rel="noopener noreferrer" className={compact ? 'icon-btn !border-mint/20 hover:!border-mint' : 'panel !p-0 flex items-center gap-3 px-4 py-3 hover:border-mint/50 hover:-translate-y-0.5 transition-all'} aria-label={`${label} — ${handle}`} title={label}>
        <Icon /><span className="text-xs">{label}{!compact && <span className="block text-[9px] muted">{handle}</span>}</span>
      </a>;
    })}
  </div>;
}
