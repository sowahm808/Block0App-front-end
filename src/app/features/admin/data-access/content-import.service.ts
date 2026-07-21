import { Injectable, inject } from '@angular/core';
import { ApiService } from '../../../core/api/api.service';
import { LearningPackImportRequest, LearningPackImportSummary } from '../../../core/api/api.types';

@Injectable({ providedIn: 'root' })
export class ContentImportService {
  #api = inject(ApiService);
  importLearningPack(body: LearningPackImportRequest) {
    return this.#api.post<LearningPackImportSummary>('/admin/content/import-learning-pack', body);
  }
}
