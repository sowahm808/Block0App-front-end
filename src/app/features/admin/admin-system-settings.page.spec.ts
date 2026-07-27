import { describe, expect, it } from 'vitest';
import { normalizeSystemSettings } from '../../core/api/remaining-feature-api.services';
const settings: any = {
  version: 0,
  schemaVersion: 1,
  general: {
    applicationName: 'MindUnlocking',
    supportEmail: 'support@example.com',
    defaultLocale: 'en-US',
    defaultTimezone: 'UTC',
    dateFormat: 'yyyy-MM-dd',
  },
  academy: {
    academyName: 'MindUnlocking Academy',
    contactEmail: '',
    academicYearStart: '2026-01-01',
    defaultChallengeDurationDays: 30,
  },
  challenges: {
    defaultDurationDays: 30,
    allowLateCompletion: false,
    requireDailyCheckIn: true,
    maxActiveChallenges: 10,
  },
  learningPacks: { requireReviewBeforePublish: true, allowSelfEnrollment: false, defaultEstimatedMinutes: 30 },
  enrollment: {
    registrationEnabled: true,
    requireEmailVerification: true,
    invitationExpiryDays: 7,
    maximumActiveEnrollments: 100,
  },
  notifications: {
    emailEnabled: true,
    smsEnabled: false,
    pushEnabled: false,
    fromName: 'MindUnlocking',
    replyToEmail: '',
    digestTime: '09:00',
  },
  security: {
    sessionTimeoutMinutes: 60,
    passwordResetTimeoutMinutes: 60,
    maximumLoginAttempts: 5,
    auditRetentionDays: 365,
    requireMfaForAdministrators: false,
  },
  imports: { maximumUploadSizeMb: 100, extractionTimeoutSeconds: 300, allowedParserExtensions: ['csv', 'json'] },
  reports: {
    maximumExportRows: 100000,
    includePersonallyIdentifiableInformation: false,
    scheduledReportsEnabled: false,
  },
  integrations: { providers: { email: { configured: false, healthy: false } } },
  maintenance: { enabled: false, readOnly: false, banner: '', reason: '', startsAtUtc: null, endsAtUtc: null },
};
describe('system settings contract', () => {
  it('normalizes direct and wrapped settings', () => {
    expect(normalizeSystemSettings(settings)).toBe(settings);
    expect(normalizeSystemSettings({ data: settings })).toBe(settings);
    expect(normalizeSystemSettings({ settings })).toBe(settings);
  });
  it('rejects placeholders and malformed responses', () => {
    expect(() => normalizeSystemSettings({ items: [{ title: 'Record 1' }] } as any)).toThrow(/malformed|unsupported/);
  });
  it('contains no secret fields', () => {
    expect(JSON.stringify(settings)).not.toMatch(/password|privateKey|authToken|secret/i);
  });
});
