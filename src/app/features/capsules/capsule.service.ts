import { Injectable, inject } from '@angular/core';
import { ApiService } from '../../core/api/api.service';
import { CapsuleResumeDto, CapsuleStartResponse, QuestionSubmitRequest, QuestionSubmitResult } from '../../core/api/api.types';

@Injectable({ providedIn: 'root' })
export class CapsuleService {
  #api = inject(ApiService);

  start(capsuleId: string, idempotencyKey: string) {
    return this.#api.post<CapsuleStartResponse>(`/capsules/${encodeURIComponent(capsuleId)}/start`, {}, {
      headers: { 'Idempotency-Key': idempotencyKey },
    });
  }

  resume(capsuleAttemptId: string) {
    return this.#api.get<CapsuleResumeDto>(`/capsule-attempts/${capsuleAttemptId}/resume`);
  }

  submitQuestion(capsuleAttemptId: string, questionAttemptId: string, body: QuestionSubmitRequest) {
    return this.#api.post<QuestionSubmitResult>(
      `/capsule-attempts/${capsuleAttemptId}/question-attempts/${questionAttemptId}/submit`,
      body,
    );
  }

  next(capsuleAttemptId: string) {
    return this.#api.post<CapsuleResumeDto>(`/capsule-attempts/${capsuleAttemptId}/next`, {});
  }
}
