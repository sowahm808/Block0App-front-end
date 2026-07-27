import { Injectable, inject } from '@angular/core';
import { map } from 'rxjs';
import { ApiService } from '../../../core/api/api.service';
import { LearningPack } from '../../../core/api/api.types';
import { AuthStore } from '../../../core/auth/auth.store';

export interface LearningPackListResponse {
  items?: LearningPack[];
  learningPacks?: LearningPack[];
  results?: LearningPack[];
  value?: LearningPack[];
  data?:
    | LearningPack[]
    | {
        items?: LearningPack[];
        learningPacks?: LearningPack[];
        results?: LearningPack[];
        value?: LearningPack[];
      };
}

@Injectable({ providedIn: 'root' })
export class LearningPacksService {
  #api = inject(ApiService);
  #auth = inject(AuthStore);

  list() {
    return this.#api
      .get<LearningPack[] | LearningPackListResponse>(this.#collectionPath())
      .pipe(map((response) => this.#listItems(response)));
  }
  detail(packId: string) {
    return this.#api.get<LearningPack>(`/learning-packs/${encodeURIComponent(packId)}`);
  }

  #listItems(response: LearningPack[] | LearningPackListResponse): LearningPack[] {
    if (Array.isArray(response)) return response;
    if (Array.isArray(response.items)) return response.items;
    if (Array.isArray(response.learningPacks)) return response.learningPacks;
    if (Array.isArray(response.results)) return response.results;
    if (Array.isArray(response.value)) return response.value;
    if (Array.isArray(response.data)) return response.data;
    return response.data?.items ?? response.data?.learningPacks ?? response.data?.results ?? response.data?.value ?? [];
  }

  #collectionPath() {
    return this.#auth.hasRole(['Administrator', 'SuperAdministrator']) ? '/admin/learning-packs' : '/learning-packs';
  }
}
