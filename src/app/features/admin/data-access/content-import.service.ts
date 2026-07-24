import { Injectable, inject } from '@angular/core';
import { ApiService } from '../../../core/api/api.service';
import {
  LearningPackImportList,
  LearningPackImportRecord,
  LearningPackImportRequest,
  LearningPackImportSummary,
} from '../../../core/api/api.types';

@Injectable({ providedIn: 'root' })
export class ContentImportService {
  #api = inject(ApiService);
  list(cursor?: string) {
    return this.#api.get<LearningPackImportList | LearningPackImportRecord[]>('/admin/learning-packs/imports', {
      limit: 20,
      ...(cursor ? { cursor } : {}),
    });
  }
  upload(file: File) {
    const form = new FormData();
    form.append('file', file, file.name);
    return this.#api.post<LearningPackImportRecord>('/admin/learning-packs/imports', form);
  }
  detail(importId: string) {
    return this.#api.get<LearningPackImportRecord>(`/admin/learning-packs/imports/${encodeURIComponent(importId)}`);
  }
  save(importId: string, draft: LearningPackImportRequest) {
    return this.#api.put<LearningPackImportRecord>(
      `/admin/learning-packs/imports/${encodeURIComponent(importId)}/draft`,
      draft,
    );
  }
  validate(importId: string) {
    return this.#api.post<LearningPackImportRecord>(
      `/admin/learning-packs/imports/${encodeURIComponent(importId)}/validate`,
      {},
    );
  }
  commit(importId: string) {
    return this.#api.post<LearningPackImportSummary>(
      `/admin/learning-packs/imports/${encodeURIComponent(importId)}/commit`,
      {},
    );
  }
}
