export function dateKey(date = new Date()) { return new Date(date.getTime() + 3 * 3600000).toISOString().slice(0, 10); }
export function shiftDate(days: number) { const d = new Date(); d.setDate(d.getDate() + days); return dateKey(d); }
/**
 * The Replit build auto-seeded demo content on first request. On Lovable Cloud the site
 * starts empty (real data is imported from the old database); the first account to sign
 * in becomes the platform owner.
 */
export function seedEnabled() { return false; }
export async function ensureSeeded() {}
