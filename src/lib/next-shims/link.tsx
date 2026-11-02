import { forwardRef, type AnchorHTMLAttributes, type ReactNode } from 'react';
import { Link as RouterLink } from '@tanstack/react-router';

type Props = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> & { href: string; prefetch?: boolean; scroll?: boolean; replace?: boolean; children?: ReactNode };

/** Next.js-style <Link href="..."> on top of the TanStack router. */
const Link = forwardRef<HTMLAnchorElement, Props>(function Link({ href, prefetch: _prefetch, scroll: _scroll, replace, ...rest }, ref) {
  if (/^(https?:|mailto:|tel:|whatsapp:|#)/i.test(href) || rest.target === '_blank') return <a ref={ref} href={href} {...rest} />;
  const url = new URL(href, 'http://local');
  const search = Object.fromEntries(url.searchParams.entries());
  return <RouterLink ref={ref} to={url.pathname as never} search={(Object.keys(search).length ? search : undefined) as never} hash={url.hash ? url.hash.slice(1) : undefined} replace={replace} {...(rest as Record<string, unknown>)} />;
});
export default Link;
