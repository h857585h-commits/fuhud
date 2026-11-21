'use client';
import { useEffect } from 'react';
import { useApp } from './context';
import { useRouterState } from '@tanstack/react-router';
import { resolveBranding } from '@/lib/brand';

/**
 * Applies developer-controlled branding (name, logo, colours, favicon, footer)
 * to the running page. CSS variables are also inlined server-side for first paint.
 */
export function BrandingEffects() {
  const { data } = useApp();
  const b = resolveBranding(data.branding);
  const pathname = useRouterState({ select: state => state.location.pathname });
  useEffect(() => {
    const pageTitle = pathname === '/' ? b.siteName : document.title.split('|')[0]?.trim();
    document.title = pathname === '/' ? `${b.siteName} | ${b.tagline}` : `${pageTitle || b.siteName} | ${b.siteName}`;
    document.querySelector('meta[property="og:title"]')?.setAttribute('content', document.title);
    if (pathname === '/' || pathname === '/about') {
      for (const selector of ['meta[name="description"]', 'meta[property="og:description"]']) document.querySelector(selector)?.setAttribute('content', b.description);
    }
    document.querySelector('meta[name="apple-mobile-web-app-title"]')?.setAttribute('content', b.siteName);
    if (b.favicon?.trim() || b.logo?.trim()) {
      const href = b.favicon?.trim() || b.logo.trim();
      let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
      if (!link) { link = document.createElement('link'); link.rel = 'icon'; document.head.appendChild(link); }
      link.href = href;
    }
    if (b.themeColor?.trim()) document.querySelector('meta[name="theme-color"]')?.setAttribute('content', b.themeColor.trim());
  }, [pathname, b.siteName, b.tagline, b.description, b.favicon, b.logo, b.themeColor]);
  useEffect(() => {
    const link = document.querySelector<HTMLLinkElement>('link[rel="manifest"]');
    if (!link) return;
    const icon = b.thumbnail?.trim();
    const manifest = {
      name: b.siteName, short_name: b.siteName, lang: 'ar', dir: 'rtl', start_url: '/', scope: '/', display: 'standalone',
      background_color: b.background || '#10241e', theme_color: b.themeColor || b.background || '#10241e',
      icons: icon ? [{ src: icon, sizes: 'any', purpose: 'any' }] : [{ src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' }, { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' }],
    };
    const original = link.href;
    const url = URL.createObjectURL(new Blob([JSON.stringify(manifest)], { type: 'application/manifest+json' }));
    link.href = url;
    return () => { link.href = original; URL.revokeObjectURL(url); };
  }, [b.siteName, b.thumbnail, b.background, b.themeColor]);
  return null;
}

export function SiteBrand({ small = false }: { small?: boolean }) {
  const { data } = useApp();
  const b = resolveBranding(data.branding);
  return <div className="brand">
    <img src={b.logo?.trim() || '/icon.svg'} alt={`شعار ${b.siteName}`} width={small ? 34 : 42} height={small ? 38 : 46} className="shrink-0 object-contain" />
    <div className="min-w-0">
      <div className="brand-name whitespace-normal leading-7">{b.siteName}</div>
      <div className="brand-sub">{b.siteNameEn}</div>
    </div>
  </div>;
}

export function SiteFooter() {
  const { data } = useApp();
  const b = resolveBranding(data.branding);
  const year = new Date().getFullYear();
  return <footer className="site-footer">
    <span>{b.footerText?.trim() || `© ${year} ${b.siteName}. جميع الحقوق محفوظة.`}</span>
    {b.contact?.trim() && <a href={b.contact.trim().startsWith('mailto') || b.contact.includes('@') ? `mailto:${b.contact.trim()}` : b.contact.trim()} className="flex items-center gap-1.5 hover:text-mint">تواصل معنا · {b.contact.trim()}</a>}
    <span className="flex items-center gap-1.5"><span className="live-dot mint" />{b.tagline}</span>
  </footer>;
}
