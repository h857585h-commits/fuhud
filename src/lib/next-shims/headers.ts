import { getCookie, setCookie, deleteCookie } from '@tanstack/react-start/server';

type CookieOptions = { httpOnly?: boolean; secure?: boolean; sameSite?: 'lax' | 'strict' | 'none'; maxAge?: number; path?: string; expires?: Date };

/** Cookie jar with the same surface the ported server code expects. */
export async function cookies() {
  return {
    get(name: string) { const value = getCookie(name); return value === undefined ? undefined : { name, value }; },
    set(name: string, value: string, options: CookieOptions = {}) { setCookie(name, value, { ...options, secure: options.secure ?? true }); },
    delete(name: string) { deleteCookie(name); },
  };
}
