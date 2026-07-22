import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';

export interface CursorPage<T> { items: T[]; nextCursor?: string; total?: number }
export interface IdempotentRequest { idempotencyKey: string }
export interface ApiRecord { id: string; [key: string]: unknown }

abstract class EndpointApi {
  protected readonly api = inject(ApiService);
  protected constructor(protected readonly root: string) {}
  list<T extends ApiRecord>(params?: Record<string, string | number | boolean>) { return this.api.get<CursorPage<T> | T[]>(this.root, params); }
  get<T>(id: string) { return this.api.get<T>(`${this.root}/${id}`); }
  post<T>(path = '', body: unknown = {}) { return this.api.post<T>(`${this.root}${path}`, body); }
  put<T>(path = '', body: unknown = {}) { return this.api.put<T>(`${this.root}${path}`, body); }
}

@Injectable({ providedIn: 'root' }) export class ScenarioApiService extends EndpointApi { constructor() { super('/scenarios'); } }
@Injectable({ providedIn: 'root' }) export class RehearsalApiService extends EndpointApi { constructor() { super('/rehearsals'); } }
@Injectable({ providedIn: 'root' }) export class CheckInHistoryApiService extends EndpointApi { constructor() { super('/check-ins/history'); } }
@Injectable({ providedIn: 'root' }) export class SupportRequestApiService extends EndpointApi { constructor() { super('/support-requests'); } }
@Injectable({ providedIn: 'root' }) export class ReadinessApiService extends EndpointApi { constructor() { super('/readiness'); } }
@Injectable({ providedIn: 'root' }) export class RewardApiService extends EndpointApi { constructor() { super('/rewards'); } }
@Injectable({ providedIn: 'root' }) export class RaffleApiService extends EndpointApi { constructor() { super('/raffle-entries'); } }
@Injectable({ providedIn: 'root' }) export class CertificateApiService extends EndpointApi { constructor() { super('/certificates'); } }
@Injectable({ providedIn: 'root' }) export class NotificationApiService extends EndpointApi { constructor() { super('/notifications'); } }
@Injectable({ providedIn: 'root' }) export class ProfileApiService extends EndpointApi { constructor() { super('/profile'); } }
@Injectable({ providedIn: 'root' }) export class MentorApiService extends EndpointApi { constructor() { super('/mentor'); } }
@Injectable({ providedIn: 'root' }) export class ContentReviewApiService extends EndpointApi { constructor() { super('/review'); } }
@Injectable({ providedIn: 'root' }) export class AdminDashboardApiService extends EndpointApi { constructor() { super('/admin/dashboard'); } }
@Injectable({ providedIn: 'root' }) export class AdminUserApiService extends EndpointApi { constructor() { super('/admin/users'); } }
@Injectable({ providedIn: 'root' }) export class AdminChallengeApiService extends EndpointApi { constructor() { super('/admin/challenges'); } }
@Injectable({ providedIn: 'root' }) export class AdminCohortApiService extends EndpointApi { constructor() { super('/admin/cohorts'); } }
@Injectable({ providedIn: 'root' }) export class AdminEnrollmentApiService extends EndpointApi { constructor() { super('/admin/enrollments'); } }
@Injectable({ providedIn: 'root' }) export class AdminTeamApiService extends EndpointApi { constructor() { super('/admin/teams'); } }
@Injectable({ providedIn: 'root' }) export class AdminLearningPackApiService extends EndpointApi { constructor() { super('/admin/learning-packs'); } }
@Injectable({ providedIn: 'root' }) export class AdminCapsuleApiService extends EndpointApi { constructor() { super('/admin/capsules'); } }
@Injectable({ providedIn: 'root' }) export class AdminQuestionApiService extends EndpointApi { constructor() { super('/admin/questions'); } }
@Injectable({ providedIn: 'root' }) export class AdminScenarioApiService extends EndpointApi { constructor() { super('/admin/scenarios'); } }
@Injectable({ providedIn: 'root' }) export class AdminContentWorkflowApiService extends EndpointApi { constructor() { super('/admin/content'); } }
@Injectable({ providedIn: 'root' }) export class AdminAnnouncementApiService extends EndpointApi { constructor() { super('/admin/announcements'); } }
@Injectable({ providedIn: 'root' }) export class AdminNotificationApiService extends EndpointApi { constructor() { super('/admin/notifications'); } }
@Injectable({ providedIn: 'root' }) export class AdminReadinessApiService extends EndpointApi { constructor() { super('/admin/readiness'); } }
@Injectable({ providedIn: 'root' }) export class AdminRewardApiService extends EndpointApi { constructor() { super('/admin/rewards'); } }
@Injectable({ providedIn: 'root' }) export class AdminRaffleApiService extends EndpointApi { constructor() { super('/admin/raffles'); } }
@Injectable({ providedIn: 'root' }) export class AdminCertificateApiService extends EndpointApi { constructor() { super('/admin/certificates'); } }
@Injectable({ providedIn: 'root' }) export class AdminReportApiService extends EndpointApi { constructor() { super('/admin/reports'); } }
@Injectable({ providedIn: 'root' }) export class AdminAuditApiService extends EndpointApi { constructor() { super('/admin/audit'); } }
@Injectable({ providedIn: 'root' }) export class AdminAiApiService extends EndpointApi { constructor() { super('/ai'); } }
@Injectable({ providedIn: 'root' }) export class AdminSystemSettingsApiService extends EndpointApi { constructor() { super('/admin/system-settings'); } }
@Injectable({ providedIn: 'root' }) export class AdminFeatureFlagApiService extends EndpointApi { constructor() { super('/admin/feature-flags'); } }
