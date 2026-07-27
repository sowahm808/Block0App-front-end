import { Injectable, inject } from '@angular/core';
import { map } from 'rxjs';
import { ApiService } from './api.service';
import {
  AdminChallenge,
  AdminAuditEvent,
  AdminAuditListResponse,
  AdminChallengeListResponse,
  AdminCohortListItem,
  AdminCohortListResponse,
  AdminLearningPack,
  AdminLearningPackListResponse,
  AdminUser,
  AdminUserListResponse,
  BulkLearningPackAssignmentRequest,
  LearningPackAssignmentResponse,
  SaveAdminCohortRequest,
  AdminReportOverview,
  ChallengeReportRow,
  CohortReportRow,
  LearningPackReportRow,
  QuestionReportRow,
  ReportListResponse,
  ReportQueryParams,
  ScholarReportRow,
  SystemSettings, SystemSettingsHistoryResponse, SystemSettingsResponse,
  SystemSettingsValidationResult, UpdateSystemSettingsRequest,
} from './api.types';

export function normalizeReportList<T>(response: ReportListResponse<T> | T[]): { items: T[]; total: number; nextCursor?: string; updatedAtUtc?: string } {
  if (Array.isArray(response)) return { items: response, total: response.length };
  if (!response || typeof response !== 'object') throw new Error('The reporting endpoint returned an invalid response.');
  const items = response.items ?? response.data;
  if (!Array.isArray(items)) throw new Error('The reporting endpoint response must contain an items or data array.');
  return { items, total: response.total ?? items.length, nextCursor: response.nextCursor, updatedAtUtc: response.updatedAtUtc };
}

export interface CursorPage<T> {
  items: T[];
  nextCursor?: string;
  total?: number;
}
export interface IdempotentRequest {
  idempotencyKey: string;
}
export interface ApiRecord {
  id: string;
  [key: string]: unknown;
}

abstract class EndpointApi {
  protected readonly api = inject(ApiService);
  protected constructor(protected readonly root: string) {}
  list<T extends ApiRecord>(params?: Record<string, string | number | boolean>) {
    return this.api.get<CursorPage<T> | T[]>(this.root, params);
  }
  get<T>(id: string) {
    return this.api.get<T>(`${this.root}/${id}`);
  }
  post<T>(path = '', body: unknown = {}) {
    return this.api.post<T>(`${this.root}${path}`, body);
  }
  put<T>(path = '', body: unknown = {}) {
    return this.api.put<T>(`${this.root}${path}`, body);
  }
}

@Injectable({ providedIn: 'root' })
export class ScenarioApiService extends EndpointApi {
  constructor() {
    super('/scenarios');
  }
}
@Injectable({ providedIn: 'root' })
export class RehearsalApiService extends EndpointApi {
  constructor() {
    super('/rehearsals');
  }
}
@Injectable({ providedIn: 'root' })
export class CheckInHistoryApiService extends EndpointApi {
  constructor() {
    super('/check-ins/history');
  }
}
@Injectable({ providedIn: 'root' })
export class SupportRequestApiService extends EndpointApi {
  constructor() {
    super('/support-requests');
  }
}
@Injectable({ providedIn: 'root' })
export class ReadinessApiService extends EndpointApi {
  constructor() {
    super('/readiness');
  }
}
@Injectable({ providedIn: 'root' })
export class RewardApiService extends EndpointApi {
  constructor() {
    super('/rewards');
  }
}
@Injectable({ providedIn: 'root' })
export class RaffleApiService extends EndpointApi {
  constructor() {
    super('/raffle-entries');
  }
}
@Injectable({ providedIn: 'root' })
export class CertificateApiService extends EndpointApi {
  constructor() {
    super('/certificates');
  }
}
@Injectable({ providedIn: 'root' })
export class NotificationApiService extends EndpointApi {
  constructor() {
    super('/notifications');
  }
}
@Injectable({ providedIn: 'root' })
export class ProfileApiService extends EndpointApi {
  constructor() {
    super('/profile');
  }
}
@Injectable({ providedIn: 'root' })
export class MentorApiService extends EndpointApi {
  constructor() {
    super('/mentor');
  }
}
@Injectable({ providedIn: 'root' })
export class ContentReviewApiService extends EndpointApi {
  constructor() {
    super('/review');
  }
}
@Injectable({ providedIn: 'root' })
export class AdminDashboardApiService extends EndpointApi {
  constructor() {
    super('/admin/dashboard');
  }
}
@Injectable({ providedIn: 'root' })
export class AdminUserApiService extends EndpointApi {
  constructor() {
    super('/admin/users');
  }
  users(params?: Record<string, string | number | boolean>) {
    return this.api.get<AdminUserListResponse | AdminUser[]>(this.root, params);
  }
}
@Injectable({ providedIn: 'root' })
export class AdminChallengeApiService extends EndpointApi {
  constructor() {
    super('/admin/challenges');
  }
  challenges(params?: Record<string, string | number | boolean>) {
    return this.api.get<AdminChallengeListResponse | AdminChallenge[]>(this.root, params);
  }
  publish(id: string) {
    return this.api.post<AdminChallenge>(`${this.root}/${encodeURIComponent(id)}/publish`, {});
  }
  archive(id: string) {
    return this.api.post<AdminChallenge>(`${this.root}/${encodeURIComponent(id)}/archive`, {});
  }
}
@Injectable({ providedIn: 'root' })
export class AdminCohortApiService extends EndpointApi {
  constructor() {
    super('/admin/cohorts');
  }
  cohorts(params?: Record<string, string | number | boolean>) {
    return this.api.get<AdminCohortListResponse | AdminCohortListItem[]>(this.root, params);
  }
  create(body: SaveAdminCohortRequest) {
    return this.api.post<AdminCohortListItem>(this.root, body);
  }
  update(id: string, body: SaveAdminCohortRequest) {
    return this.api.put<AdminCohortListItem>(`${this.root}/${encodeURIComponent(id)}`, body);
  }
  transition(id: string, status: string, version?: number) {
    return this.api.post<AdminCohortListItem>(`${this.root}/${encodeURIComponent(id)}/status`, { status, version });
  }
  duplicate(id: string) {
    return this.api.post<AdminCohortListItem>(`${this.root}/${encodeURIComponent(id)}/duplicate`, {});
  }
}
@Injectable({ providedIn: 'root' })
export class AdminEnrollmentApiService extends EndpointApi {
  constructor() {
    super('/admin/enrollments');
  }
  assignLearningPacks(body: BulkLearningPackAssignmentRequest) {
    return this.api.post<LearningPackAssignmentResponse>(`${this.root}/learning-pack-assignments`, body);
  }
}
@Injectable({ providedIn: 'root' })
export class AdminTeamApiService extends EndpointApi {
  constructor() {
    super('/admin/teams');
  }
}
@Injectable({ providedIn: 'root' })
export class AdminLearningPackApiService extends EndpointApi {
  constructor() {
    super('/admin/learning-packs');
  }
  catalog(params?: Record<string, string | number | boolean>) {
    return this.api.get<AdminLearningPackListResponse | AdminLearningPack[]>(this.root, params);
  }
  assign(packId: string, scholarIds: string[]) {
    return this.api.post<LearningPackAssignmentResponse>(`${this.root}/${encodeURIComponent(packId)}/assignments`, {
      scholarIds,
    });
  }
}
@Injectable({ providedIn: 'root' })
export class AdminCapsuleApiService extends EndpointApi {
  constructor() {
    super('/admin/capsules');
  }
}
@Injectable({ providedIn: 'root' })
export class AdminQuestionApiService extends EndpointApi {
  constructor() {
    super('/admin/questions');
  }
}
@Injectable({ providedIn: 'root' })
export class AdminScenarioApiService extends EndpointApi {
  constructor() {
    super('/admin/scenarios');
  }
}
@Injectable({ providedIn: 'root' })
export class AdminContentWorkflowApiService extends EndpointApi {
  constructor() {
    super('/admin/content');
  }
}
@Injectable({ providedIn: 'root' })
export class AdminAnnouncementApiService extends EndpointApi {
  constructor() {
    super('/admin/announcements');
  }
}
@Injectable({ providedIn: 'root' })
export class AdminNotificationApiService extends EndpointApi {
  constructor() {
    super('/admin/notifications');
  }
}
@Injectable({ providedIn: 'root' })
export class AdminReadinessApiService extends EndpointApi {
  constructor() {
    super('/admin/readiness');
  }
}
@Injectable({ providedIn: 'root' })
export class AdminRewardApiService extends EndpointApi {
  constructor() {
    super('/admin/rewards');
  }
}
@Injectable({ providedIn: 'root' })
export class AdminRaffleApiService extends EndpointApi {
  constructor() {
    super('/admin/raffles');
  }
}
@Injectable({ providedIn: 'root' })
export class AdminCertificateApiService extends EndpointApi {
  constructor() {
    super('/admin/certificates');
  }
}
@Injectable({ providedIn: 'root' })
export class AdminReportApiService extends EndpointApi {
  readonly #reportsApi = inject(ApiService);
  constructor() { super('/admin/reports'); }
  overview(params: ReportQueryParams) { return this.#reportsApi.get<AdminReportOverview>('/admin/reports/overview', params); }
  scholars(params: ReportQueryParams) { return this.#list<ScholarReportRow>('/admin/reports/scholars', params); }
  cohorts(params: ReportQueryParams) { return this.#list<CohortReportRow>('/admin/reports/cohorts', params); }
  challenges(params: ReportQueryParams) { return this.#list<ChallengeReportRow>('/admin/reports/challenges', params); }
  learningPacks(params: ReportQueryParams) { return this.#list<LearningPackReportRow>('/admin/reports/learning-packs', params); }
  questions(params: ReportQueryParams) { return this.#list<QuestionReportRow>('/admin/reports/questions', params); }
  #list<T>(path: string, params: ReportQueryParams) {
    return this.#reportsApi.get<ReportListResponse<T> | T[]>(path, params).pipe(map((response) => normalizeReportList<T>(response)));
  }
}
@Injectable({ providedIn: 'root' })
export class AdminAuditApiService {
  readonly #auditApi = inject(ApiService);
  list(params?: Record<string, string | number | boolean>) {
    return this.#auditApi.get<AdminAuditListResponse | AdminAuditEvent[]>('/admin/audit', params);
  }
  detail(eventId: string) {
    return this.#auditApi.get<AdminAuditEvent>(`/admin/audit/${encodeURIComponent(eventId)}`);
  }
  export(params?: Record<string, string | number | boolean>) {
    return this.#auditApi.download('/admin/audit/export', params);
  }
}
@Injectable({ providedIn: 'root' })
export class AdminAiApiService extends EndpointApi {
  constructor() {
    super('/ai');
  }
}
export function normalizeSystemSettings(response: SystemSettings | SystemSettingsResponse | Array<{ key: string; value: unknown }> | { items: Array<{ key: string; value: unknown }> }): SystemSettings {
  let candidate: unknown = response;
  if (!Array.isArray(response) && response && typeof response === 'object') {
    const wrapper = response as SystemSettingsResponse & { items?: Array<{ key: string; value: unknown }> };
    candidate = wrapper.data ?? wrapper.settings ?? wrapper.items ?? response;
  }
  if (Array.isArray(candidate)) {
    const expanded: Record<string, unknown> = {};
    for (const entry of candidate) {
      if (!entry || typeof entry.key !== 'string' || !('value' in entry)) throw new Error('The system-settings endpoint returned a malformed key/value list.');
      const parts = entry.key.split('.'); let cursor = expanded;
      parts.forEach((part: string, index: number) => { if (index === parts.length - 1) cursor[part] = entry.value; else cursor = (cursor[part] ??= {}) as Record<string, unknown>; });
    }
    candidate = expanded;
  }
  const value = candidate as Partial<SystemSettings> | null;
  const required = ['general', 'academy', 'challenges', 'learningPacks', 'enrollment', 'notifications', 'security', 'imports', 'reports', 'integrations', 'maintenance'] as const;
  if (!value || typeof value !== 'object' || typeof value.version !== 'number' || required.some((key) => !value[key] || typeof value[key] !== 'object')) {
    throw new Error('The system-settings endpoint returned an unsupported response. No settings were changed.');
  }
  return value as SystemSettings;
}

@Injectable({ providedIn: 'root' })
export class AdminSystemSettingsApiService {
  readonly #api = inject(ApiService);
  getSettings() { return this.#api.get<SystemSettings | SystemSettingsResponse | Array<{ key: string; value: unknown }> | { items: Array<{ key: string; value: unknown }> }>('/admin/system-settings').pipe(map(normalizeSystemSettings)); }
  validateSettings(request: UpdateSystemSettingsRequest) { return this.#api.post<SystemSettingsValidationResult>('/admin/system-settings/validate', request); }
  updateSettings(request: UpdateSystemSettingsRequest) { return this.#api.put<SystemSettings | SystemSettingsResponse>('/admin/system-settings', request).pipe(map(normalizeSystemSettings)); }
  resetCategory(category: string, version: number) { return this.#api.post<SystemSettings | SystemSettingsResponse>('/admin/system-settings/reset', { category, version }).pipe(map(normalizeSystemSettings)); }
  history(params?: Record<string, string | number | boolean>) { return this.#api.get<SystemSettingsHistoryResponse>('/admin/system-settings/history', params); }
}
@Injectable({ providedIn: 'root' })
export class AdminFeatureFlagApiService extends EndpointApi {
  constructor() {
    super('/admin/feature-flags');
  }
}
