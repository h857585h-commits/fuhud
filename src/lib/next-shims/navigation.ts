import { useLocation, useRouter as useTanstackRouter } from '@tanstack/react-router';
import { useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';

/** Router helpers with the Next.js surface the components were written against. */
export function useRouter() {
  const router = useTanstackRouter();
  const queryClient = useQueryClient();
  return useMemo(() => ({
    push: (href: string) => { router.history.push(href); },
    replace: (href: string) => { router.history.replace(href); },
    back: () => router.history.back(),
    refresh: () => { void queryClient.invalidateQueries({ queryKey: ['snapshot'] }); },
  }), [router, queryClient]);
}

export function usePathname() {
  return useLocation({ select: location => location.pathname });
}
