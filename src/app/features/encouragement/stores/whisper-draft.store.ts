import { effect, inject, Injectable, signal } from '@angular/core';
import { AuthStore } from '../../../core/auth/auth.store';
import { WhisperInput } from '../models/whisper.models';
interface StoredDraft {
  version: 1;
  userId: string;
  draft: Partial<WhisperInput>;
  whisperId?: string;
}
@Injectable({ providedIn: 'root' })
export class WhisperDraftStore {
  readonly #auth = inject(AuthStore);
  readonly draft = signal<Partial<WhisperInput>>({});
  readonly whisperId = signal<string | undefined>(undefined);
  readonly #key = 'mua.encouragement.draft.v1';
  constructor() {
    this.restore();
    effect(() => {
      const user = this.#auth.user();
      if (!user) {
        this.clear();
        return;
      }
      const value: StoredDraft = { version: 1, userId: user.userId, draft: this.draft(), whisperId: this.whisperId() };
      sessionStorage.setItem(this.#key, JSON.stringify(value));
    });
  }
  update(draft: Partial<WhisperInput>, whisperId?: string) {
    this.draft.set(draft);
    this.whisperId.set(whisperId);
  }
  clear() {
    this.draft.set({});
    this.whisperId.set(undefined);
    sessionStorage.removeItem(this.#key);
  }
  restore() {
    try {
      const raw = sessionStorage.getItem(this.#key);
      if (!raw) return;
      const value = JSON.parse(raw) as StoredDraft;
      const userId = this.#auth.user()?.userId;
      if (value.version !== 1 || !userId || value.userId !== userId) {
        sessionStorage.removeItem(this.#key);
        return;
      }
      this.draft.set(value.draft);
      this.whisperId.set(value.whisperId);
    } catch {
      sessionStorage.removeItem(this.#key);
    }
  }
}
