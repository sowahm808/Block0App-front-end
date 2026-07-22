import { Injectable, inject } from '@angular/core';
import { ApiService } from '../../core/api/api.service';

export interface MentorDashboardDto {
  teams?: number;
  activeTeams?: number;
  supportRequests?: number;
  openSupportRequests?: number;
  scholars?: number;
  atRiskScholars?: number;
}

@Injectable({ providedIn: 'root' })
export class MentorDashboardService {
  readonly #api = inject(ApiService);
  getDashboard() { return this.#api.get<MentorDashboardDto>('/mentor/dashboard'); }
}
