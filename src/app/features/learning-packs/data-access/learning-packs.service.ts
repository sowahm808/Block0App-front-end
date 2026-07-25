import { Injectable, inject } from '@angular/core';
import { map } from 'rxjs';
import { ApiService } from '../../../core/api/api.service';
import { LearningPack } from '../../../core/api/api.types';

export interface LearningPackListResponse {
  items?: LearningPack[];
  learningPacks?: LearningPack[];
  data?: LearningPack[] | { items?: LearningPack[]; learningPacks?: LearningPack[] };
}

@Injectable({ providedIn: 'root' })
export class LearningPacksService {
  #api = inject(ApiService);
  list() {
    return this.#api
      .get<LearningPack[] | LearningPackListResponse>('/learning-packs')
      .pipe(map((response) => this.#listItems(response)));
  }
  detail(packId: string) {
    return this.#api.get<LearningPack>(`/learning-packs/${encodeURIComponent(packId)}`);
  }

  #listItems(response: LearningPack[] | LearningPackListResponse): LearningPack[] {
    if (Array.isArray(response)) return response;
    if (Array.isArray(response.items)) return response.items;
    if (Array.isArray(response.learningPacks)) return response.learningPacks;
    if (Array.isArray(response.data)) return response.data;
    return response.data?.items ?? response.data?.learningPacks ?? [];
  }
}
