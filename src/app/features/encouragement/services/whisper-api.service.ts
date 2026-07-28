import { inject, Injectable } from '@angular/core';
import { ApiService } from '../../../core/api/api.service';
import {
  AudioUploadCompletionRequest,
  AudioUploadRequest,
  AudioUploadResponse,
  ConsentDeliveryResponse,
  GeneratedContent,
  PublicUnwrapResponse,
  WhisperHistoryFilters,
  WhisperInput,
  WhisperListResponse,
  WhisperRecord,
} from '../models/whisper.models';
@Injectable({ providedIn: 'root' })
export class WhisperApiService {
  readonly #api = inject(ApiService);
  #id(value: string) {
    return encodeURIComponent(value);
  }
  generate(input: WhisperInput) {
    return this.#api.post<WhisperRecord>('/whispers/generate', input);
  }
  list(filters: WhisperHistoryFilters = {}) {
    return this.#api.get<WhisperListResponse>('/whispers', filters as Record<string, string | number | boolean>);
  }
  get(id: string) {
    return this.#api.get<WhisperRecord>(`/whispers/${this.#id(id)}`);
  }
  updateContent(id: string, content: GeneratedContent) {
    return this.#api.patch<WhisperRecord>(`/whispers/${this.#id(id)}/content`, content);
  }
  regenerate(id: string) {
    return this.#api.post<WhisperRecord>(`/whispers/${this.#id(id)}/regenerate`, {});
  }
  confirm(id: string) {
    return this.#api.post<WhisperRecord>(`/whispers/${this.#id(id)}/confirm`, {});
  }
  requestUpload(id: string, request: AudioUploadRequest) {
    return this.#api.post<AudioUploadResponse>(`/whispers/${this.#id(id)}/audio-upload-url`, request);
  }
  completeUpload(id: string, request: AudioUploadCompletionRequest) {
    return this.#api.post<WhisperRecord>(`/whispers/${this.#id(id)}/audio-upload-complete`, request);
  }
  sendConsent(id: string) {
    return this.#api.post<ConsentDeliveryResponse>(`/whispers/${this.#id(id)}/send-consent`, {});
  }
  unwrap(token: string) {
    return this.#api.get<PublicUnwrapResponse>(`/public/whispers/unwrap/${this.#id(token)}`);
  }
  accept(token: string) {
    return this.#api.post<PublicUnwrapResponse>(`/public/whispers/unwrap/${this.#id(token)}/accept`, {});
  }
  listened(token: string) {
    return this.#api.post<void>(`/public/whispers/unwrap/${this.#id(token)}/listened`, {});
  }
}
