import { Injectable, inject } from '@angular/core';
import { map, Observable } from 'rxjs';
import { ApiService } from '../../core/api/api.service';
import { ContentReviewDetailResponse, ContentReviewItem } from '../../core/api/api.types';

@Injectable({ providedIn: 'root' })
export class ContentReviewService {
  readonly #api = inject(ApiService);

  get(reviewId: string): Observable<ContentReviewItem> {
    return this.#api
      .get<ContentReviewDetailResponse>(this.#reviewPath(reviewId))
      .pipe(map((response) => this.#unwrap(response)));
  }

  approve(reviewId: string, notes: string): Observable<ContentReviewItem> {
    return this.#action(reviewId, 'approve', notes);
  }

  requestChanges(reviewId: string, notes: string): Observable<ContentReviewItem> {
    return this.#action(reviewId, 'request-changes', notes);
  }

  reject(reviewId: string, notes: string): Observable<ContentReviewItem> {
    return this.#action(reviewId, 'reject', notes);
  }

  #action(reviewId: string, action: string, notes: string): Observable<ContentReviewItem> {
    return this.#api
      .post<ContentReviewDetailResponse>(`${this.#reviewPath(reviewId)}/${action}`, { notes })
      .pipe(map((response) => this.#unwrap(response)));
  }

  #reviewPath(reviewId: string): string {
    return `/review/content/${encodeURIComponent(reviewId)}`;
  }

  #unwrap(response: ContentReviewDetailResponse): ContentReviewItem {
    const item = 'data' in response ? response.data : response;
    if (!item?.id || !item.content) throw new Error('The review service returned a malformed response.');
    return item;
  }
}
