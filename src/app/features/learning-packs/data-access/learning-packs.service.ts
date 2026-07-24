import { Injectable, inject } from '@angular/core';
import { ApiService } from '../../../core/api/api.service';
import { LearningPack } from '../../../core/api/api.types';

@Injectable({ providedIn: 'root' })
export class LearningPacksService {
  #api = inject(ApiService);
  list() {
    return this.#api.get<LearningPack[]>('/learning-packs');
  }
  detail(packId: string) {
    return this.#api.get<LearningPack>(`/learning-packs/${encodeURIComponent(packId)}`);
  }
}
