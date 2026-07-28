import { HttpClient, HttpEventType, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { filter, map, switchMap } from 'rxjs';
import { WhisperApiService } from './whisper-api.service';
export interface UploadProgress {
  progress: number;
  complete: boolean;
}
@Injectable({ providedIn: 'root' })
export class WhisperUploadService {
  readonly #http = inject(HttpClient);
  readonly #api = inject(WhisperApiService);
  readonly allowedTypes = ['audio/mpeg', 'audio/mp4', 'audio/webm', 'audio/wav'];
  readonly maxBytes = 15 * 1024 * 1024;
  upload(whisperId: string, file: File) {
    if (!this.allowedTypes.includes(file.type)) throw new Error('Unsupported audio format.');
    if (file.size > this.maxBytes) throw new Error('Audio must be 15 MB or smaller.');
    return this.#api.requestUpload(whisperId, { fileName: file.name, mimeType: file.type, sizeBytes: file.size }).pipe(
      switchMap((ticket) =>
        this.#http
          .put(ticket.uploadUrl, file, {
            headers: new HttpHeaders(ticket.requiredHeaders),
            observe: 'events',
            reportProgress: true,
          })
          .pipe(
            filter((event) => event.type === HttpEventType.UploadProgress || event.type === HttpEventType.Response),
            map((event) => ({
              ticket,
              progress:
                event.type === HttpEventType.Response
                  ? 100
                  : Math.round((100 * event.loaded) / (event.total ?? file.size)),
              complete: event.type === HttpEventType.Response,
            })),
          ),
      ),
      switchMap((state) =>
        state.complete
          ? this.#api
              .completeUpload(whisperId, { uploadId: state.ticket.uploadId, sizeBytes: file.size, mimeType: file.type })
              .pipe(map(() => ({ progress: 100, complete: true })))
          : [state],
      ),
    );
  }
}
