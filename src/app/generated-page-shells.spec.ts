import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const repoRoot = process.cwd();
const generatedShells = [
  'src/app/features/challenge/daily-announcement.component.ts',
  'src/app/features/challenge/daily-goal.component.ts',
  'src/app/features/challenge/rest-day-guidance.component.ts',
  'src/app/features/challenge/exam-day-checklist.component.ts',
  'src/app/features/challenge/challenge-day-progress.component.ts',
  'src/app/features/challenge/start-study-action.component.ts',
  'src/app/features/challenge/today-activity-list.component.ts',
  'src/app/features/challenge/today-challenge.page.ts',
  'src/app/features/content-review/approval-action-bar.component.ts',
  'src/app/features/content-review/question-review-preview.component.ts',
  'src/app/features/content-review/reference-review.component.ts',
  'src/app/features/content-review/review-status-filter.component.ts',
  'src/app/features/content-review/reviewer-comment.component.ts',
  'src/app/features/content-review/review-queue.page.ts',
  'src/app/features/notifications/notification-empty-state.component.ts',
  'src/app/features/notifications/notification-filter.component.ts',
  'src/app/features/notifications/notification-preferences.page.ts',
  'src/app/features/notifications/notification-channel-toggle.component.ts',
  'src/app/features/notifications/push-permission.component.ts',
  'src/app/features/notifications/notification-center.page.ts',
];

describe('generated page shells', () => {
  it.each(generatedShells)('%s keeps the hardened API shell contract', (filePath) => {
    const source = readFileSync(join(repoRoot, filePath), 'utf8');
    expect(source).toContain('b0-page-header');
    expect(source).toContain('b0-error-state');
    expect(source).toContain('b0-data-template');
    expect(source).toContain('readonly state$ = this.#route.data.pipe');
    expect(source).toContain("String(data['apiPath'] ?? '/health')");
    expect(source).toContain('catchError');
    expect(source).not.toContain('JSON.stringify');
    expect(source).not.toContain('| json');
  });
});
