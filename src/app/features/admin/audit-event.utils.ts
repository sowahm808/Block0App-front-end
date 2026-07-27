import { AdminAuditEvent, AdminAuditListResponse } from '../../core/api/api.types';

export interface NormalizedAuditPage {
  items: AdminAuditEvent[];
  total: number;
  nextCursor?: string;
}

export const ACTION_LABELS: Record<string, string> = {
  approved: 'Approved content',
  rejected: 'Rejected content',
  changes_requested: 'Requested content changes',
  learning_pack_assigned: 'Assigned learning pack',
  learning_pack_unassigned: 'Removed learning-pack assignment',
  user_created: 'Created user',
  user_suspended: 'Suspended user',
  user_reactivated: 'Reactivated user',
  cohort_created: 'Created cohort',
  cohort_updated: 'Updated cohort',
  cohort_member_added: 'Added cohort member',
  cohort_member_removed: 'Removed cohort member',
  challenge_published: 'Published challenge',
  challenge_archived: 'Archived challenge',
  failed_login: 'Failed login',
  access_denied: 'Access denied',
  role_changed: 'Changed role',
  session_revoked: 'Revoked session',
  bulk_export: 'Exported records',
};

export function actionLabel(action: string): string {
  if (ACTION_LABELS[action]) return ACTION_LABELS[action];
  const words = action.replace(/[^a-zA-Z0-9]+/g, ' ').trim().toLowerCase();
  return words ? words.charAt(0).toUpperCase() + words.slice(1) : 'Unknown action';
}

export function normalizeAuditResponse(response: AdminAuditListResponse | AdminAuditEvent[]): NormalizedAuditPage {
  if (Array.isArray(response)) return { items: response, total: response.length };
  if (!response || typeof response !== 'object') throw new Error('The audit endpoint returned an invalid response.');
  const items = response.items ?? response.data ?? response.auditEvents ?? response.events;
  if (!Array.isArray(items)) throw new Error('The audit endpoint response does not contain a supported event array.');
  return { items, total: response.total ?? items.length, nextCursor: response.nextCursor };
}

const SENSITIVE_KEY = /password|passcode|token|secret|private.?key|authorization|cookie|reset.?link|session/i;

export function redactAuditValue(value: unknown, key = ''): unknown {
  if (SENSITIVE_KEY.test(key)) return '[REDACTED]';
  if (Array.isArray(value)) return value.map((item) => redactAuditValue(item));
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value as Record<string, unknown>).map(([childKey, child]) => [childKey, redactAuditValue(child, childKey)]));
  }
  return value;
}

export function displayValue(value: unknown): string {
  if (value === undefined) return '—';
  if (value === null) return 'None';
  if (typeof value === 'object') return JSON.stringify(redactAuditValue(value));
  return String(value);
}
