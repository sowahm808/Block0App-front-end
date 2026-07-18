import { Injectable, inject } from '@angular/core';
import { ApiService } from '../../../core/api/api.service';
import { QuestionSubmitRequest, QuestionSubmitResult, W1QuestionDto } from '../../../core/api/api.types';
@Injectable({ providedIn: 'root' })
export class QuestionsService {
  #api = inject(ApiService);
  getAttempt(id: string) {
    return this.#api.get<W1QuestionDto>(`/question-attempts/${id}`);
  }
  submit(id: string, body: QuestionSubmitRequest) {
    return this.#api.post<QuestionSubmitResult>(`/question-attempts/${id}/submit`, body);
  }
}
