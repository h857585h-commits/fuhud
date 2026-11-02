import type { Snapshot, Match, Team, Player } from './data';
export type TeamStats = { teamId: number; played: number; won: number; drawn: number; lost: number; gf: number; ga: number; gd: number; points: number; form: string[] };
export function calculateTable(matches: Match[], teams: Team[], tournamentId?: number, group?: string): TeamStats[] {
  const selected = matches.filter(m => m.status === 'finished' && (!tournamentId || m.tournamentId === tournamentId) && (!group || m.group === group));
  return teams.map(t => {
    const played = selected.filter(m => m.homeId === t.id || m.awayId === t.id);
    const row: TeamStats = { teamId: t.id, played: played.length, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, gd: 0, points: 0, form: [] };
    played.forEach(m => { const gf = m.homeId === t.id ? m.homeScore : m.awayScore; const ga = m.homeId === t.id ? m.awayScore : m.homeScore; row.gf += gf; row.ga += ga; if (gf > ga) row.won++; else if (gf < ga) row.lost++; else row.drawn++; row.form.push(gf > ga ? 'W' : gf < ga ? 'L' : 'D'); });
    row.form = row.form.slice(-5); row.gd = row.gf - row.ga; row.points = row.won * 3 + row.drawn; return row;
  }).sort((a, b) => b.points - a.points || b.gd - a.gd || b.gf - a.gf || a.teamId - b.teamId);
}
export type PlayerStats = Player & { goals: number; assists: number; yellow: number; red: number; played: number; cleanSheets: number };
export function playerStats(data: Pick<Snapshot, 'players' | 'events' | 'matches' | 'lineups'>, tournamentId?: number): PlayerStats[] {
  const matches = data.matches.filter(m => m.status === 'finished' && (!tournamentId || m.tournamentId === tournamentId)); const ids = new Set(matches.map(m => m.id));
  return data.players.map(p => {
    const events = data.events.filter(e => e.playerId === p.id && ids.has(e.matchId)); const appearances = data.lineups.filter(l => l.teamId === p.teamId && ids.has(l.matchId) && l.positions.some(pos => pos.playerId === p.id)); const eventAppearances = new Set(events.map(e => e.matchId)); appearances.forEach(l => eventAppearances.add(l.matchId));
    const cleanSheets = appearances.filter(l => { const m = matches.find(m => m.id === l.matchId)!; return ['GK', 'DEF'].includes(p.position) && (m.homeId === p.teamId ? m.awayScore : m.homeScore) === 0; }).length;
    return { ...p, goals: events.filter(e => e.type === 'goal').length, assists: data.events.filter(e => e.assistId === p.id && ids.has(e.matchId)).length, yellow: events.filter(e => e.type === 'yellow').length, red: events.filter(e => e.type === 'red').length, played: eventAppearances.size, cleanSheets };
  });
}
export const positionLabels: Record<string, string> = { GK: 'حارس مرمى', DEF: 'مدافع', MID: 'وسط', FW: 'مهاجم' };
export const statusLabels: Record<string, string> = { scheduled: 'لم تبدأ', live: 'مباشر الآن', finished: 'انتهت', active: 'جارية', upcoming: 'قادمة' };
export function arabicDate(date: string, options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long' }) { return new Date(`${date.slice(0, 10)}T12:00:00`).toLocaleDateString('ar-IQ-u-nu-latn', options); }
export function arabicTime(time: string) { const [h, m] = time.split(':').map(Number); return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'م' : 'ص'}`; }
export function getTeam(data: Pick<Snapshot, 'teams'>, id: number) { return data.teams.find(t => t.id === id); }
export function getPlayer(data: Pick<Snapshot, 'players'>, id?: number | null) { return data.players.find(p => p.id === id); }
