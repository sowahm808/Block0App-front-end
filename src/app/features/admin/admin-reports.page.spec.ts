import { describe, expect, it } from 'vitest';
import { normalizeReportList } from '../../core/api/remaining-feature-api.services';
import { AdminReportsPage } from './admin-reports.page';

describe('Admin reporting workspace', () => {
  it('normalizes direct arrays and supported wrappers', () => {
    expect(normalizeReportList([{ id: 'one' }]).items).toEqual([{ id: 'one' }]);
    expect(normalizeReportList({ items: [{ id: 'two' }], total: 9 }).total).toBe(9);
    expect(normalizeReportList({ data: [{ id: 'three' }] }).items).toEqual([{ id: 'three' }]);
  });

  it('rejects malformed list responses rather than showing an empty report', () => {
    expect(() => normalizeReportList({})).toThrow(/items or data array/);
  });

  it('uses a dedicated reports page without generic cards, health fallback, or reload', () => {
    const source = String(AdminReportsPage);
    expect(source).not.toContain('DataTemplateComponent');
    expect(source).not.toContain('/health');
    expect(source).not.toContain('location.reload');
  });
});
