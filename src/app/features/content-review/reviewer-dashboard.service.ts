import { Injectable, inject } from '@angular/core';
import { ApiService } from '../../core/api/api.service';

export interface ReviewerDashboardDto {
  pendingReviews?: number;
  questionReviews?: number;
  scenarioReviews?: number;
  aiDrafts?: number;
  completedReviews?: number;
  imports?: number;
}

@Injectable({ providedIn: 'root' })
export class ReviewerDashboardService {
  readonly #api = inject(ApiService);
  getDashboard() { return this.#api.get<ReviewerDashboardDto>('/review/dashboard'); }
}
