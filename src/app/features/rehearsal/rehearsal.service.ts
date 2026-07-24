import { Injectable, inject } from '@angular/core';
import { ApiService } from '../../core/api/api.service';
import { QuestionSubmitRequest, QuestionSubmitResult } from '../../core/api/api.types';
import { RehearsalAttemptDto, RehearsalOverviewDto, RehearsalSummaryDto } from './rehearsal.models';

@Injectable({ providedIn: 'root' })
export class RehearsalService {
  #api = inject(ApiService);

  overview() {
    return this.#api.get<RehearsalOverviewDto>('/rehearsals/available');
  }

  resume(attemptId: string) {
    return this.#api.get<RehearsalAttemptDto>(`/rehearsal-attempts/${attemptId}`);
  }

  start(sessionId: string) {
    return this.#api.post<{ attemptId: string; resumeUrl?: string }>(`/rehearsals/${sessionId}/start`, {});
  }

  submitQuestion(attemptId: string, questionAttemptId: string, body: QuestionSubmitRequest) {
    return this.#api.post<QuestionSubmitResult>(`/rehearsal-attempts/${attemptId}/questions/${questionAttemptId}/submit`, body);
  }

  acknowledgeMemory(attemptId: string, questionAttemptId: string) {
    return this.#api.post<void>(`/rehearsal-attempts/${attemptId}/questions/${questionAttemptId}/memory-pearl/acknowledge`, {});
  }

  next(attemptId: string) {
    return this.#api.post<void>(`/rehearsal-attempts/${attemptId}/next`, {});
  }

  summary(attemptId: string) {
    return this.#api.get<RehearsalSummaryDto>(`/rehearsal-attempts/${attemptId}/summary`);
  }
}
