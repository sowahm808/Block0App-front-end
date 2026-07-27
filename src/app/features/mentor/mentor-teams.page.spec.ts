import { describe, expect, it } from 'vitest';
import { normalizeMentorTeams } from './mentor-teams.page';

describe('normalizeMentorTeams', () => {
  it('normalizes the documented paged response', () => {
    expect(
      normalizeMentorTeams({ items: [{ id: 'team-1', name: 'Foundations', memberCount: 12, status: 'active' }] }),
    ).toEqual([
      expect.objectContaining({
        id: 'team-1',
        name: 'Foundations',
        memberCount: 12,
        needsAttentionCount: 0,
        status: 'active',
      }),
    ]);
  });

  it('supports legacy team aliases during backend rollout', () => {
    expect(
      normalizeMentorTeams({
        teams: [
          {
            teamId: 'team-2',
            name: 'North',
            scholarsCount: 7,
            atRiskCount: 2,
            challenge: { id: 'c-1', name: 'Exam prep' },
          },
        ],
      })[0],
    ).toEqual(
      expect.objectContaining({
        id: 'team-2',
        memberCount: 7,
        needsAttentionCount: 2,
        challengeId: 'c-1',
        challengeName: 'Exam prep',
      }),
    );
  });

  it('drops records that cannot provide a safe detail route', () => {
    expect(normalizeMentorTeams([{ name: 'Missing identifier' }, null])).toEqual([]);
  });
});
