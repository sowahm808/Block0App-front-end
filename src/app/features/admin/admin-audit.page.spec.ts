import { describe, expect, it } from 'vitest';
import { AdminAuditEvent } from '../../core/api/api.types';
import { actionLabel, normalizeAuditResponse, redactAuditValue } from './audit-event.utils';
import { AdminAuditPage } from './admin-audit.page';

const event: AdminAuditEvent = {
  id: 'evt-1', action: 'learning_pack_assigned', actorId: 'uid-internal', actorDisplayName: 'Ada Admin', actorEmail: 'ada@example.test', entityType: 'learningPack', entityId: 'pack-1', entityTitle: 'Cardiology Foundations', category: 'assignment', outcome: 'success', createdAtUtc: '2026-07-25T13:47:00Z', before: { password: 'old', title: 'Old title' }, after: { password: 'new', title: 'New title' }, changedFields: ['title'],
};

describe('admin audit workspace contracts', () => {
  it('normalizes every supported response shape', () => {
    expect(normalizeAuditResponse([event]).items).toEqual([event]);
    for (const key of ['items', 'data', 'auditEvents', 'events'] as const) expect(normalizeAuditResponse({ [key]: [event], nextCursor: 'next' }).nextCursor).toBe('next');
  });

  it('rejects malformed responses instead of showing an empty state', () => {
    expect(() => normalizeAuditResponse({ total: 4 })).toThrow(/supported event array/);
  });

  it('humanizes known and unknown actions', () => {
    expect(actionLabel('learning_pack_assigned')).toBe('Assigned learning pack');
    expect(actionLabel('custom_policy_updated')).toBe('Custom policy updated');
  });

  it('redacts sensitive nested values while preserving useful changes', () => {
    expect(redactAuditValue(event.before)).toEqual({ password: '[REDACTED]', title: 'Old title' });
    expect(redactAuditValue({ metadata: { authorizationHeader: 'Bearer secret', safe: true } })).toEqual({ metadata: { authorizationHeader: '[REDACTED]', safe: true } });
  });

  it('does not use the generic renderer, health fallback, or browser reload', () => {
    const source = String(AdminAuditPage);
    expect(source).not.toContain('DataTemplateComponent');
    expect(source).not.toContain('Record 1');
    expect(source).not.toContain('/health');
    expect(source).not.toContain('window.location.reload');
  });
});
