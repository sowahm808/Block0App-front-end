import { describe, expect, it } from 'vitest';
import { normalizeCohortList } from './admin-cohort-list.page';

const cohort = { id: 'c1', name: 'August cohort', challengeTitle: 'Block Zero Ready' };
describe('normalizeCohortList', () => {
  it('supports direct arrays and known wrappers', () => {
    expect(normalizeCohortList([cohort])).toEqual([cohort]);
    expect(normalizeCohortList({ items: [cohort] })).toEqual([cohort]);
    expect(normalizeCohortList({ data: [cohort] })).toEqual([cohort]);
    expect(normalizeCohortList({ cohorts: [cohort], nextCursor: 'next' })).toEqual([cohort]);
  });
  it('preserves an explicitly empty response', () => expect(normalizeCohortList({ items: [] })).toEqual([]));
  it('rejects malformed wrappers instead of showing an empty state', () =>
    expect(() => normalizeCohortList({})).toThrow('Malformed cohort-list response.'));
});
