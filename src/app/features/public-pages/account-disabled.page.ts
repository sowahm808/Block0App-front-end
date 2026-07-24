import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

import { AuthService } from '../../core/auth/auth.service';

const SUPPORT_EMAIL = 'support@mindunlockingacademy.com';

@Component({
  selector: 'b0-account-disabled',
  standalone: true,
  imports: [RouterLink, MatButtonModule, MatCardModule, MatIconModule],
  template: `
    <main class="mx-auto grid min-h-screen max-w-4xl content-center gap-6 px-6 py-16 text-[var(--b0-text)]">
      <a class="brand-lockup" routerLink="/" aria-label="Mind Unlocking Academy home">
        <span class="brand-mark" aria-hidden="true">M</span>
        <span class="font-black">Mind Unlocking Academy</span>
      </a>

      <mat-card class="overflow-hidden rounded-[2rem] border border-amber-200 bg-white/95 shadow-[var(--b0-shadow-sm)]">
        <div class="border-b border-amber-100 bg-amber-50 px-8 py-6">
          <p class="m-0 text-sm font-black uppercase tracking-[0.22em] text-amber-700">Account access restricted</p>
          <h1 class="mt-3 text-4xl font-black tracking-tight text-slate-950">We cannot open this account right now.</h1>
          <p class="mt-4 max-w-3xl text-lg leading-8 text-slate-700">
            For your safety and the safety of the Block Zero community, this account is currently restricted from
            accessing learner, mentor, and administrator workspaces.
          </p>
        </div>

        <mat-card-content class="grid gap-6 p-8">
          <section class="rounded-3xl border border-slate-200 bg-slate-50 p-5" aria-labelledby="safe-explanation-heading">
            <div class="flex gap-4">
              <mat-icon class="text-amber-600" aria-hidden="true">lock</mat-icon>
              <div>
                <h2 id="safe-explanation-heading" class="m-0 text-xl font-black text-slate-950">What this means</h2>
                <p class="mt-2 text-sm leading-6 text-slate-600">
                  Access may be limited while the support team verifies account status, enrollment eligibility, or
                  security signals. We do not display private administrative notes or internal suspension details on
                  this screen.
                </p>
              </div>
            </div>
          </section>

          <section class="grid gap-4 md:grid-cols-2" aria-label="Support details">
            <div class="rounded-3xl border border-slate-200 p-5">
              <p class="m-0 text-xs font-black uppercase tracking-[0.18em] text-slate-500">Account email</p>
              <p class="mt-2 break-words text-lg font-bold text-slate-950">{{ accountEmail }}</p>
              <p class="mt-2 text-sm text-slate-600">Include this email when contacting support so we can find your account.</p>
            </div>

            <div class="rounded-3xl border border-slate-200 p-5">
              <p class="m-0 text-xs font-black uppercase tracking-[0.18em] text-slate-500">Reference ID</p>
              <p class="mt-2 break-words font-mono text-lg font-bold text-slate-950">{{ referenceId }}</p>
              <p class="mt-2 text-sm text-slate-600">Share this ID if it appears in your browser or support message.</p>
            </div>
          </section>

          <section class="rounded-3xl border border-indigo-100 bg-indigo-50 p-5" aria-labelledby="support-heading">
            <h2 id="support-heading" class="m-0 text-xl font-black text-slate-950">How to get help</h2>
            <ol class="mt-3 grid gap-2 pl-5 text-sm leading-6 text-slate-700">
              <li>Contact support from the button below using the affected account email.</li>
              <li>Include the reference ID if one is available.</li>
              <li>Do not send passwords, payment details, or sensitive personal records.</li>
            </ol>
          </section>
        </mat-card-content>

        <mat-card-actions class="flex flex-wrap gap-3 px-8 pb-8">
          <a mat-raised-button color="primary" [href]="supportHref">Contact Support</a>
          <button mat-stroked-button color="primary" type="button" (click)="signOut()">Sign Out</button>
        </mat-card-actions>
      </mat-card>
    </main>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccountDisabledPage {
  readonly #auth = inject(AuthService);
  readonly #router = inject(Router);
  readonly #route = inject(ActivatedRoute);

  readonly accountEmail = this.#readQueryValue(['email', 'accountEmail', 'userEmail']) || 'Not available';
  readonly referenceId = this.#readQueryValue(['referenceId', 'correlationId', 'traceId', 'requestId']) || 'Not available';
  readonly supportHref = this.#buildSupportHref();

  signOut(): void {
    this.#auth.logout().subscribe({
      complete: () => void this.#router.navigateByUrl('/login'),
      error: () => void this.#router.navigateByUrl('/login'),
    });
  }

  #readQueryValue(keys: string[]): string {
    for (const key of keys) {
      const value = this.#route.snapshot.queryParamMap.get(key)?.trim();

      if (value) return value;
    }

    return '';
  }

  #buildSupportHref(): string {
    const subject = encodeURIComponent('Account access restricted');
    const body = encodeURIComponent(
      `Hello Support,\n\nMy account access is restricted.\n\nAccount email: ${this.accountEmail}\nReference ID: ${this.referenceId}\n\nPlease let me know what information you need from me.`,
    );

    return `mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`;
  }
}
