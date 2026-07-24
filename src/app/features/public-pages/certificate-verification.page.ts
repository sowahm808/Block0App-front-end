import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs';
import { ApiService } from '../../core/api/api.service';
import { EmptyStateComponent } from '../../shared/ui/empty-state/empty-state.component';
import { ErrorStateComponent } from '../../shared/ui/error-state/error-state.component';
import { LoadingSkeletonComponent } from '../../shared/ui/loading-skeleton/loading-skeleton.component';
import { PageHeaderComponent } from '../../shared/ui/page-header/page-header.component';

type VerificationStatus = 'valid' | 'revoked' | 'invalid';

interface PublicCertificateVerificationResponse {
  status: VerificationStatus;
  scholarDisplayName?: string | null;
  challengeName?: string | null;
  issueDate?: string | null;
  certificateNumber?: string | null;
  issuingOrganization?: string | null;
  revocationDate?: string | null;
  correlationId?: string | null;
}

interface ScreenError {
  message: string;
  correlationId?: string | null;
}

const REQUIRED_MESSAGE = 'This field is required.';
const MAX_LENGTH_MESSAGE = 'Enter no more than 500 characters.';
const INVALID_MESSAGE = 'Use letters, numbers, and dashes only.';
const INVALID_RESULT_MESSAGE = 'No valid certificate was found for this verification code.';
const OFFLINE_MESSAGE = 'You are offline. Some information may be unavailable.';

@Component({
  selector: 'b0-certificate-verification',
  standalone: true,
  imports: [
    DatePipe,
    ReactiveFormsModule,
    PageHeaderComponent,
    LoadingSkeletonComponent,
    EmptyStateComponent,
    ErrorStateComponent,
  ],
  template: `
    <b0-page-header
      title="Public Certificate Verification"
      description="Confirm a Block Zero certificate without exposing private scholar data."
    />

    @if (offline()) {
      <section class="mb-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900" role="status">
        {{ offlineMessage }}
      </section>
    }

    <section class="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <form class="space-y-4" novalidate (ngSubmit)="submit()">
        @if (formError(); as error) {
          <div
            class="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900"
            role="alert"
            tabindex="-1"
          >
            <p class="font-semibold">We could not verify this certificate.</p>
            <p>{{ error.message }}</p>
            @if (error.correlationId) {
              <p class="mt-2 font-mono text-xs">Support correlation ID: {{ error.correlationId }}</p>
            }
          </div>
        }

        <div>
          <label class="block text-sm font-semibold text-slate-900" for="verificationCode">
            Verification code <span class="text-rose-600" aria-label="required">*</span>
          </label>
          <input
            id="verificationCode"
            class="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 font-mono text-sm uppercase tracking-wide focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 disabled:bg-slate-100"
            type="text"
            autocomplete="off"
            maxlength="500"
            [formControl]="verificationCode"
            [attr.aria-invalid]="verificationCode.invalid && verificationCode.touched"
            [attr.aria-describedby]="
              verificationCode.invalid && verificationCode.touched ? 'verificationCode-error' : null
            "
            [disabled]="saving()"
          />
          @if (verificationCode.invalid && verificationCode.touched) {
            <p id="verificationCode-error" class="mt-2 text-sm text-rose-700">{{ verificationCodeError() }}</p>
          }
        </div>

        <button
          class="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-sm disabled:cursor-not-allowed disabled:bg-slate-400"
          type="submit"
          [disabled]="saving() || verificationCode.invalid"
        >
          {{ saving() ? 'Verifying…' : 'Verify certificate' }}
        </button>
      </form>
    </section>

    <section class="mt-6" aria-live="polite">
      @if (loading()) {
        <p class="mb-3 text-sm font-medium text-slate-700">Loading public certificate verification details…</p>
        <b0-loading-skeleton [rows]="5" label="Loading certificate verification" />
      } @else if (screenError(); as error) {
        <b0-error-state
          title="Certificate verification unavailable"
          [message]="error.message"
          [correlationId]="error.correlationId ?? undefined"
          (retry)="retry()"
        />
      } @else if (!result()) {
        <b0-empty-state
          icon="workspace_premium"
          title="Enter a verification code"
          message="Use the public verification code printed on the certificate."
        >
          <button
            class="mt-4 rounded-lg border border-indigo-200 px-4 py-2 text-sm font-semibold text-indigo-700"
            type="button"
            (click)="focusSearch()"
          >
            Search by verification code
          </button>
        </b0-empty-state>
      } @else if (result()?.status === 'invalid') {
        <section class="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm" role="status">
          <h2 class="text-xl font-bold text-slate-950">Invalid result</h2>
          <p class="mt-2 text-slate-700">{{ invalidResultMessage }}</p>
        </section>
      } @else if (result()?.status === 'revoked') {
        <section class="rounded-3xl border border-rose-200 bg-rose-50 p-6 shadow-sm" role="status">
          <p class="text-sm font-semibold uppercase tracking-wide text-rose-700">Certificate revoked</p>
          <h2 class="mt-1 text-2xl font-bold text-rose-950">This certificate is no longer valid.</h2>
          @if (result()?.revocationDate) {
            <p class="mt-3 text-rose-900">Revocation date: {{ result()?.revocationDate | date: 'mediumDate' }}</p>
          }
          @if (result()?.correlationId) {
            <p class="mt-3 font-mono text-xs text-rose-900">Support correlation ID: {{ result()?.correlationId }}</p>
          }
        </section>
      } @else {
        <section class="rounded-3xl border border-emerald-200 bg-emerald-50 p-6 shadow-sm" role="status">
          <p class="text-sm font-semibold uppercase tracking-wide text-emerald-700">Valid certificate status</p>
          <h2 class="mt-1 text-2xl font-bold text-emerald-950">Certificate verified</h2>
          <dl class="mt-6 grid gap-4 sm:grid-cols-2">
            <div>
              <dt>Scholar display name</dt>
              <dd>{{ result()?.scholarDisplayName || 'Public display name unavailable' }}</dd>
            </div>
            <div>
              <dt>Challenge name</dt>
              <dd>{{ result()?.challengeName || 'Challenge unavailable' }}</dd>
            </div>
            <div>
              <dt>Issue date</dt>
              <dd>{{ result()?.issueDate | date: 'mediumDate' }}</dd>
            </div>
            <div>
              <dt>Certificate number</dt>
              <dd class="font-mono">{{ result()?.certificateNumber || 'Unavailable' }}</dd>
            </div>
            <div>
              <dt>Issuing organization</dt>
              <dd>{{ result()?.issuingOrganization || 'Mind Unlocking Academy' }}</dd>
            </div>
          </dl>
        </section>
      }
    </section>
  `,
  styles: [
    `
      dt {
        @apply text-xs font-semibold uppercase text-slate-600;
      }
      dd {
        @apply mt-1 text-sm font-semibold text-slate-950;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CertificateVerificationPage {
  #api = inject(ApiService);
  #route = inject(ActivatedRoute);
  #router = inject(Router);
  readonly verificationCode = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.maxLength(500), Validators.pattern(/^[A-Za-z0-9-]+$/)],
  });
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly result = signal<PublicCertificateVerificationResponse | null>(null);
  readonly formError = signal<ScreenError | null>(null);
  readonly screenError = signal<ScreenError | null>(null);
  readonly submittedCode = signal<string | null>(null);
  readonly offline = signal(typeof navigator !== 'undefined' ? !navigator.onLine : false);
  readonly invalidResultMessage = INVALID_RESULT_MESSAGE;
  readonly offlineMessage = OFFLINE_MESSAGE;
  readonly verificationCodeError = computed(() => {
    if (this.verificationCode.hasError('required')) return REQUIRED_MESSAGE;
    if (this.verificationCode.hasError('maxlength')) return MAX_LENGTH_MESSAGE;
    return INVALID_MESSAGE;
  });

  constructor() {
    const routeCode = this.#route.snapshot.paramMap.get('verificationCode') ?? '';
    this.verificationCode.setValue(routeCode);
    if (routeCode) this.verify(routeCode, true);
  }

  submit() {
    this.verificationCode.markAsTouched();
    if (this.verificationCode.invalid || this.saving()) return;
    this.verify(this.verificationCode.value, false);
  }

  retry() {
    const code = this.submittedCode() || this.verificationCode.value;
    if (code) this.verify(code, true);
  }

  focusSearch() {
    document.getElementById('verificationCode')?.focus();
  }

  verify(rawCode: string, initialLoad: boolean) {
    const code = rawCode.trim();
    if (!code) return;
    this.submittedCode.set(code);
    this.formError.set(null);
    this.screenError.set(null);
    if (initialLoad) this.loading.set(true);
    this.saving.set(true);
    this.#api
      .get<PublicCertificateVerificationResponse>(`/public/certificates/verify/${encodeURIComponent(code)}`)
      .pipe(
        finalize(() => {
          this.loading.set(false);
          this.saving.set(false);
        }),
      )
      .subscribe({
        next: (response) => {
          this.result.set(response?.status ? response : { status: 'invalid' });
          void this.#router.navigate(['/certificate/verify', code], { replaceUrl: true });
        },
        error: (error: unknown) => {
          const parsed = this.#parseError(error);
          if (initialLoad) this.screenError.set(parsed);
          else this.formError.set(parsed);
          this.result.set(null);
        },
      });
  }

  #parseError(error: unknown): ScreenError {
    if (error instanceof HttpErrorResponse) {
      const correlationId = error.headers?.get('x-correlation-id') ?? error.error?.correlationId ?? null;
      if (error.status === 404) return { message: INVALID_RESULT_MESSAGE, correlationId };
      if (error.status === 409)
        return {
          message: 'This action has already been completed. The latest information has been loaded.',
          correlationId,
        };
      if (error.status === 412)
        return { message: 'This record was updated elsewhere. Reload it before continuing.', correlationId };
      if (error.status === 429)
        return { message: 'Too many requests were submitted. Please wait and try again.', correlationId };
      if (error.status === 0) return { message: OFFLINE_MESSAGE, correlationId };
      return { message: error.error?.message || 'Unable to verify this certificate right now.', correlationId };
    }
    return { message: 'Unable to verify this certificate right now.' };
  }
}
