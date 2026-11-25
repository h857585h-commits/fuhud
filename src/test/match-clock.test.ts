import { describe, it, expect } from 'vitest';
import { matchClockLabel } from '@/components/times';
const start = '2026-01-01T10:00:00Z', at = (min: number) => new Date(start).getTime() + min * 60000 + 1000;
describe('match clock', () => {
  it('first half counts minutes', () => expect(matchClockLabel({ status: 'live', minute: 0, clockPeriod: 'first', clockStartedAt: start }, 45, at(10))).toBe('11′'));
  it('past 45 is added time', () => expect(matchClockLabel({ status: 'live', minute: 0, clockPeriod: 'first', clockStartedAt: start }, 45, at(46))).toBe('45+2′'));
  it('halftime stops the clock', () => expect(matchClockLabel({ status: 'live', minute: 45, clockPeriod: 'half', clockStartedAt: null }, 45, at(99))).toBe('استراحة'));
  it('second half continues from half length', () => expect(matchClockLabel({ status: 'live', minute: 45, clockPeriod: 'second', clockStartedAt: start }, 45, at(50))).toBe('90+6′'));
});
