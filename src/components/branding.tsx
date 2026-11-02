'use client';
import { useEffect } from 'react';
import { useApp } from './context';
import { Brand } from './ui';

/**
 * Applies developer-controlled branding (name, logo, colours, favicon, footer)
 * to the running page. CSS variables are also inlined server-side for first paint.
 */
export function BrandingEffects() {
  const { data } = useApp();
  const b = (data.branding || {}) as Record<string, string>;
  useEffect(() => {
    const name = b.siteName?.trim() || 'كرة المنار';
    document.title = document.title.includes('|') ? document.title : `${name} | نبض الكرة الشعبية في الناصرية`;
    if (b.favicon?.trim() || b.logo?.trim()) {
      const href = b.favicon?.trim() || b.logo.trim();
      let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
      if (!link) { link = document.createElement('link'); link.rel = 'icon'; document.head.appendChild(link); }
      link.href = href;
    }
    if (b.themeColor?.trim()) document.querySelector('meta[name="theme-color"]')?.setAttribute('content', b.themeColor.trim());
  }, [b.siteName, b.favicon, b.logo, b.themeColor]);
  return null;
}

export function SiteBrand({ small = false }: { small?: boolean }) {
  const { data } = useApp();
  const b = (data.branding || {}) as Record<string, string>;
  return <div className="brand">
    {b.logo?.trim() ? <img src={b.logo.trim()} alt="شعار المنصة" width={small ? 34 : 42} height={small ? 38 : 46} style={{ objectFit: 'contain', background: 'transparent' }} /> : <img src="/icon.svg" alt="شعار كرة المنار" width={small ? 34 : 42} height={small ? 38 : 46} />}
    <div>
      <div className="brand-name">{b.siteName?.trim() || 'كرة المنار'}</div>
      <div className="brand-sub">{b.siteNameEn?.trim() || 'MANAR FOOTBALL'}</div>
    </div>
  </div>;
}

export function SiteFooter() {
  const { data } = useApp();
  const b = (data.branding || {}) as Record<string, string>;
  const year = new Date().getFullYear();
  return <footer className="site-footer">
    <span>{b.footerText?.trim() || `© ${year} ${b.siteName?.trim() || 'كرة المنار'}. جميع الحقوق محفوظة.`}</span>
    {b.contact?.trim() && <a href={b.contact.trim().startsWith('mailto') || b.contact.includes('@') ? `mailto:${b.contact.trim()}` : b.contact.trim()} className="flex items-center gap-1.5 hover:text-mint">تواصل معنا · {b.contact.trim()}</a>}
    <span className="flex items-center gap-1.5"><span className="live-dot mint" />{b.tagline?.trim() || 'صُنع بشغف لأهل الناصرية'}</span>
  </footer>;
}
