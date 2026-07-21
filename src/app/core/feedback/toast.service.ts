import { Injectable, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
@Injectable({ providedIn: 'root' })
export class ToastService {
  readonly #snack = inject(MatSnackBar);
  success(message: string) {
    this.#open(message, 'success');
  }
  error(message: string) {
    this.#open(message, 'error');
  }
  info(message: string) {
    this.#open(message, 'info');
  }
  #open(message: string, panelClass: string) {
    this.#snack.open(message, 'Dismiss', { duration: 5000, panelClass: [`toast-${panelClass}`] });
  }
}
