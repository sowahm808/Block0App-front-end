import { AsyncPipe, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { BehaviorSubject, catchError, map, Observable, of, startWith, switchMap } from 'rxjs';
import { ApiService } from '../../core/api/api.service';
import { EmptyStateComponent } from '../../shared/ui/empty-state/empty-state.component';
import { ErrorStateComponent } from '../../shared/ui/error-state/error-state.component';
import { LoadingSkeletonComponent } from '../../shared/ui/loading-skeleton/loading-skeleton.component';
import { PageHeaderComponent } from '../../shared/ui/page-header/page-header.component';

type RequirementStatus = 'complete' | 'incomplete' | 'in_progress';
type CertificateStatus = 'active' | 'pending' | 'revoked' | 'expired';
type GenerationState = 'idle' | 'generating' | 'generated' | 'error';

interface ApiState<T> {
  status: 'loading' | 'loaded' | 'empty' | 'error';
  data?: T;
  message?: string;
}

interface CertificateRequirement {
  id: string;
  label: string;
  status: RequirementStatus;
  progressCurrent: number;
  progressTarget: number;
  eligible: boolean;
}

interface CertificateRecord {
  scholarName: string;
  challengeName: string;
  certificateNumber: string;
  issueDate: string;
  verificationCode: string;
  status: CertificateStatus | string;
  downloadUrl?: string;
  verificationUrl?: string;
}

interface CertificatesViewModel {
  eligible: boolean;
  generationState: GenerationState;
  generationMessage?: string;
  requirements: CertificateRequirement[];
  certificate?: CertificateRecord | null;
}

interface CertificatesResponse extends Partial<CertificatesViewModel> {
  eligibility?: Partial<CertificatesViewModel> & { checklist?: CertificateRequirement[]; items?: CertificateRequirement[] };
  checklist?: CertificateRequirement[];
  items?: CertificateRequirement[];
}

const REQUIRED_REQUIREMENTS: CertificateRequirement[] = [
  { id: 'knowledge_questions', label: 'Required knowledge questions', status: 'incomplete', progressCurrent: 0, progressTarget: 1, eligible: false },
  { id: 'clinical_scenarios', label: 'Required clinical scenarios', status: 'incomplete', progressCurrent: 0, progressTarget: 1, eligible: false },
  { id: 'rehearsal_completion', label: 'Rehearsal completion', status: 'incomplete', progressCurrent: 0, progressTarget: 1, eligible: false },
  { id: 'w3_acknowledgements', label: 'W3 acknowledgements', status: 'incomplete', progressCurrent: 0, progressTarget: 1, eligible: false },
  { id: 'required_check_ins', label: 'Required check-ins', status: 'incomplete', progressCurrent: 0, progressTarget: 1, eligible: false },
  { id: 'final_readiness_check', label: 'Final readiness check', status: 'incomplete', progressCurrent: 0, progressTarget: 1, eligible: false },
];

@Component({
  selector: 'b0-certificates',
  standalone: true,
  imports: [AsyncPipe, DatePipe, EmptyStateComponent, ErrorStateComponent, LoadingSkeletonComponent, PageHeaderComponent],
  template: `
    <b0-page-header
      title="Certificates"
      description="Review certificate eligibility, generate your credential, and access verification details."
    />

    @if (state$ | async; as state) {
      @if (state.status === 'loading') {
        <b0-loading-skeleton [rows]="6" />
      } @else if (state.status === 'error') {
        <b0-error-state [message]="state.message || 'Unable to load certificate status.'" (retry)="reload()" />
      } @else if (state.status === 'empty') {
        <b0-empty-state title="No certificate status available" message="Certificate eligibility appears here once backend progress data is available." />
      } @else {
        <section class="space-y-6" aria-label="Certificate dashboard">
          <div class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div class="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <p class="text-sm font-semibold uppercase tracking-wide text-indigo-600">Eligibility panel</p>
                <h2 class="mt-1 text-2xl font-bold text-slate-950">Certificate readiness checklist</h2>
                <p class="mt-2 text-sm text-slate-600">All required learning, clinical, acknowledgement, check-in, and readiness items must be complete before generation.</p>
              </div>
              <span [class]="eligibleBadgeClass(state.data!.eligible)">{{ state.data!.eligible ? 'Eligible' : 'Not eligible' }}</span>
            </div>

            <div class="mt-5 grid gap-3">
              @for (item of state.data!.requirements; track item.id) {
                <article class="rounded-xl border border-slate-200 p-4">
                  <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 class="font-semibold text-slate-950">{{ item.label }}</h3>
                      <p class="mt-1 text-sm text-slate-600">Progress: {{ item.progressCurrent }} / {{ item.progressTarget }}</p>
                    </div>
                    <div class="flex flex-wrap gap-2">
                      <span [class]="statusBadgeClass(item.status)">{{ statusLabel(item.status) }}</span>
                      <span [class]="eligibleBadgeClass(item.eligible)">{{ item.eligible ? 'Eligible' : 'Not eligible' }}</span>
                    </div>
                  </div>
                  <div class="mt-3 h-2 overflow-hidden rounded-full bg-slate-100" aria-label="Checklist progress">
                    <div class="h-full rounded-full bg-indigo-600" [style.width.%]="progressPercent(item)"></div>
                  </div>
                </article>
              }
            </div>
          </div>

          <div class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 class="text-xl font-bold text-slate-950">Generate Certificate</h2>
                <p class="mt-1 text-sm text-slate-600">Generation state: {{ generationLabel(state.data!.generationState) }}</p>
                @if (state.data!.generationMessage) { <p class="mt-1 text-sm text-slate-500">{{ state.data!.generationMessage }}</p> }
              </div>
              <div class="flex flex-wrap gap-2">
                <span [class]="generationBadgeClass(state.data!.generationState)">{{ generationLabel(state.data!.generationState) }}</span>
                <button type="button" class="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-indigo-300" (click)="reload()">Refresh</button>
                <button type="button" class="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300" [disabled]="!state.data!.eligible || state.data!.generationState === 'generating'" (click)="generateCertificate()">
                  {{ state.data!.generationState === 'generating' ? 'Generation in progress' : 'Generate Certificate' }}
                </button>
              </div>
            </div>
          </div>

          @if (state.data!.certificate; as certificate) {
            <article class="rounded-2xl border border-indigo-100 bg-gradient-to-br from-white to-indigo-50 p-6 shadow-sm" aria-label="Certificate card">
              <div class="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <p class="text-sm font-semibold uppercase tracking-wide text-indigo-600">Certificate card</p>
                  <h2 class="mt-1 text-2xl font-bold text-slate-950">{{ certificate.challengeName }}</h2>
                  <p class="mt-1 text-slate-700">Issued to {{ certificate.scholarName }}</p>
                </div>
                <span [class]="certificateStatusClass(certificate.status)">{{ certificate.status }}</span>
              </div>
              <dl class="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div><dt class="text-xs font-semibold uppercase text-slate-500">Certificate number</dt><dd class="mt-1 font-mono text-sm text-slate-950">{{ certificate.certificateNumber }}</dd></div>
                <div><dt class="text-xs font-semibold uppercase text-slate-500">Issue date</dt><dd class="mt-1 text-sm text-slate-950">{{ certificate.issueDate | date: 'mediumDate' }}</dd></div>
                <div><dt class="text-xs font-semibold uppercase text-slate-500">Verification code</dt><dd class="mt-1 font-mono text-sm text-slate-950">{{ certificate.verificationCode }}</dd></div>
                <div><dt class="text-xs font-semibold uppercase text-slate-500">Status</dt><dd class="mt-1 text-sm text-slate-950">{{ certificate.status }}</dd></div>
              </dl>
              <div class="mt-6 flex flex-wrap gap-2">
                <a class="rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white" [href]="certificate.downloadUrl || downloadPath(certificate)" target="_blank" rel="noopener">Download PDF</a>
                <button type="button" class="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700" (click)="copyVerificationCode(certificate.verificationCode)">Copy Verification Code</button>
                <a class="rounded-lg border border-indigo-200 px-4 py-2 text-sm font-semibold text-indigo-700" [href]="certificate.verificationUrl || verificationPath(certificate)" target="_blank" rel="noopener">Open Verification Page</a>
              </div>
            </article>
          }
        </section>
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CertificatesPage {
  #api = inject(ApiService);
  #reload$ = new BehaviorSubject<void>(undefined);
  #generationState$ = new BehaviorSubject<{ state: GenerationState; message?: string }>({ state: 'idle' });

  readonly state$: Observable<ApiState<CertificatesViewModel>> = this.#reload$.pipe(
    switchMap(() =>
      this.#api.get<CertificatesResponse>('/certificates').pipe(
        map((result) => this.#normalize(result)),
        map((data) => ({ status: 'loaded', data }) satisfies ApiState<CertificatesViewModel>),
        startWith({ status: 'loading' } satisfies ApiState<CertificatesViewModel>),
        catchError((error: unknown) => of({ status: 'error', message: error instanceof Error ? error.message : 'Backend endpoint is unavailable.' } satisfies ApiState<CertificatesViewModel>)),
      ),
    ),
  );

  reload() { this.#reload$.next(); }

  generateCertificate() {
    this.#generationState$.next({ state: 'generating', message: 'Certificate generation in progress.' });
    this.reload();
    this.#api.post<unknown>('/certificates/generate', {}).pipe(catchError(() => of(null))).subscribe((result) => {
      this.#generationState$.next(result ? { state: 'generated', message: 'Certificate generated. Refreshing status.' } : { state: 'error', message: 'Generation failed. Refresh and try again.' });
      this.reload();
    });
  }

  copyVerificationCode(code: string) { void navigator.clipboard?.writeText(code); }
  downloadPath(c: CertificateRecord) { return `/api/certificates/${encodeURIComponent(c.certificateNumber)}/pdf`; }
  verificationPath(c: CertificateRecord) { return `/certificate/verify/${encodeURIComponent(c.verificationCode)}`; }
  progressPercent(item: CertificateRequirement) { return item.progressTarget > 0 ? Math.min(100, Math.round((item.progressCurrent / item.progressTarget) * 100)) : 0; }
  statusLabel(status: RequirementStatus) { return status === 'in_progress' ? 'Progress' : status === 'complete' ? 'Complete' : 'Incomplete'; }
  generationLabel(state: GenerationState) { return ({ idle: 'Ready to generate', generating: 'Generation in progress', generated: 'Generated', error: 'Generation error' })[state]; }
  statusBadgeClass(status: RequirementStatus) { return `rounded-full px-3 py-1 text-xs font-semibold ${status === 'complete' ? 'bg-emerald-100 text-emerald-700' : status === 'in_progress' ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'}`; }
  eligibleBadgeClass(eligible: boolean) { return `rounded-full px-3 py-1 text-xs font-semibold ${eligible ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`; }
  generationBadgeClass(state: GenerationState) { return `rounded-full px-3 py-1 text-xs font-semibold ${state === 'generating' ? 'bg-amber-100 text-amber-700' : state === 'error' ? 'bg-rose-100 text-rose-700' : 'bg-indigo-100 text-indigo-700'}`; }
  certificateStatusClass(status: string) { return `rounded-full px-3 py-1 text-xs font-semibold ${status.toLowerCase() === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'}`; }

  #normalize(result: CertificatesResponse): CertificatesViewModel {
    const requirements = result.requirements ?? result.eligibility?.requirements ?? result.checklist ?? result.eligibility?.checklist ?? result.items ?? result.eligibility?.items ?? REQUIRED_REQUIREMENTS;
    const eligible = result.eligible ?? result.eligibility?.eligible ?? requirements.every((item) => item.eligible || item.status === 'complete');
    const generation = this.#generationState$.value;
    return { eligible, generationState: generation.state, generationMessage: generation.message ?? result.generationMessage, requirements, certificate: result.certificate ?? null };
  }
}
