import { Component, inject, input, output, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { finalize } from 'rxjs';
import { WhisperUploadService } from '../services/whisper-upload.service';
@Component({
  selector: 'b0-audio-upload',
  standalone: true,
  imports: [MatButtonModule],
  template: `<section aria-labelledby="audio-heading">
    <h2 id="audio-heading">Audio</h2>
    <input
      #picker
      type="file"
      accept="audio/mpeg,audio/mp4,audio/webm,audio/wav"
      (change)="select($event)"
      aria-describedby="audio-help"
    />
    <p id="audio-help">MP3, MP4, WebM, or WAV; up to 15 MB.</p>
    @if (uploading()) {
      <p role="status">Uploading: {{ progress() }}%</p>
    }
    @if (error()) {
      <p role="alert">{{ error() }}</p>
    }
    <button mat-button type="button" [disabled]="!file() || uploading()" (click)="upload()">Upload audio</button>
  </section>`,
})
export class AudioUploadComponent {
  readonly whisperId = input.required<string>();
  readonly completed = output<void>();
  readonly #u = inject(WhisperUploadService);
  readonly file = signal<File | null>(null);
  readonly uploading = signal(false);
  readonly progress = signal(0);
  readonly error = signal('');
  select(event: Event) {
    this.file.set((event.target as HTMLInputElement).files?.[0] ?? null);
    this.error.set('');
  }
  upload() {
    const file = this.file();
    if (!file || this.uploading()) return;
    this.uploading.set(true);
    try {
      this.#u
        .upload(this.whisperId(), file)
        .pipe(finalize(() => this.uploading.set(false)))
        .subscribe({
          next: (s) => {
            this.progress.set(s.progress);
            if (s.complete) this.completed.emit();
          },
          error: () => this.error.set('The upload failed or expired. Please retry.'),
        });
    } catch (e) {
      this.uploading.set(false);
      this.error.set(e instanceof Error ? e.message : 'Invalid audio.');
    }
  }
}
