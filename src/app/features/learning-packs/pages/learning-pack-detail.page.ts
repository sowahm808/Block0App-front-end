import { AsyncPipe, DecimalPipe, NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { catchError, map, of, shareReplay, startWith, switchMap } from 'rxjs';
import { LearningPack, LearningPackCapsule } from '../../../core/api/api.types';
import { LearningPacksService } from '../data-access/learning-packs.service';

interface LearningPackDetailVm {
  pack: LearningPack | null;
  loading: boolean;
  error: unknown;
}

@Component({
  standalone: true,
  imports: [AsyncPipe, DecimalPipe, NgClass, RouterLink, MatButtonModule, MatCardModule, MatProgressBarModule],
  template: `<section class="grid gap-5" aria-labelledby="pack-detail-title">
    @if (vm$ | async; as vm) {
      @if (vm.loading) {
        <mat-card class="p-6">Loading learning pack…</mat-card>
      } @else if (vm.error || !vm.pack) {
        <mat-card class="grid gap-3 p-6">
          <p class="eyebrow m-0">Learning Pack Detail</p>
          <h1 id="pack-detail-title">Learning pack unavailable</h1>
          <p>{{ errorMessage(vm.error) }}</p>
          <a mat-stroked-button routerLink="/learning-packs">Return to Learning Packs</a>
        </mat-card>
      } @else {
        <header class="grid gap-3">
          <a class="text-sm font-bold" routerLink="/learning-packs">← Return to Learning Packs</a>
          <div class="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p class="eyebrow m-0">{{ packCode(vm.pack) }} · {{ topicLabel(vm.pack) }}</p>
              <h1 id="pack-detail-title" class="m-0">{{ vm.pack.title }}</h1>
            </div>
            <span class="rounded-full px-3 py-1 text-sm font-bold" [ngClass]="statusClass(vm.pack)">{{ statusLabel(vm.pack) }}</span>
          </div>
          <div>
            <div class="mb-1 flex justify-between text-sm font-bold">
              <span>Completion</span><span>{{ progress(vm.pack) | number: '1.0-0' }}%</span>
            </div>
            <mat-progress-bar [value]="progress(vm.pack)" aria-label="Learning pack completion percentage" />
          </div>
        </header>

        <div class="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
          <mat-card class="grid gap-4 p-5">
            <section aria-labelledby="objectives-title">
              <h2 id="objectives-title">Learning objectives</h2>
              <ul class="m-0 grid gap-2 pl-5">
                @for (objective of objectiveList(vm.pack); track objective) {
                  <li>{{ objective }}</li>
                }
              </ul>
            </section>
            <section aria-labelledby="summary-title">
              <h2 id="summary-title">Pack summary</h2>
              <p class="m-0">{{ summary(vm.pack) }}</p>
            </section>
          </mat-card>

          <mat-card class="grid gap-4 p-5" aria-label="Pack summary metrics">
            <div class="detail-metrics grid gap-3">
              <div><b>{{ totalCapsules(vm.pack) }}</b><span>Total capsules</span></div>
              <div><b>{{ completedCapsules(vm.pack) }}</b><span>Completed capsules</span></div>
              <div><b>{{ totalQuestions(vm.pack) }}</b><span>Total questions</span></div>
              <div><b>{{ completedQuestions(vm.pack) }}</b><span>Questions answered</span></div>
              <div><b>{{ studyTime(vm.pack) }}</b><span>Estimated study time</span></div>
            </div>
            <div class="flex flex-wrap gap-2">
              <a mat-flat-button color="primary" [disabled]="isLocked(vm.pack)" [routerLink]="nextCapsuleLink(vm.pack)">Start Next Capsule</a>
              <a mat-stroked-button [disabled]="!activeCapsuleLink(vm.pack) || isLocked(vm.pack)" [routerLink]="activeCapsuleLink(vm.pack)">Continue Active Capsule</a>
              <a mat-stroked-button routerLink="/learning-packs">Return to Learning Packs</a>
            </div>
          </mat-card>
        </div>

        <section aria-labelledby="capsules-title" class="grid gap-3">
          <h2 id="capsules-title">Capsule list</h2>
          @for (capsule of capsules(vm.pack); track capsule.id || capsule.externalId || capsule.sequence) {
            <mat-card class="capsule-row grid gap-3 p-4">
              <div>
                <p class="eyebrow m-0">Capsule {{ capsuleNumber(capsule) }}</p>
                <h3 class="m-0">{{ capsule.title }}</h3>
              </div>
              <div class="text-sm"><b>{{ capsuleQuestionCount(capsule) }}</b> questions</div>
              <span class="rounded-full px-3 py-1 text-sm font-bold" [ngClass]="capsuleStatusClass(capsule)">{{ capsuleStatusLabel(capsule) }}</span>
              <div class="text-sm text-[var(--b0-text-muted)]">{{ completionDate(capsule) }}</div>
              <a mat-flat-button color="primary" [disabled]="isCapsuleLocked(capsule)" [routerLink]="capsuleLink(capsule)">{{ capsuleAction(capsule) }}</a>
            </mat-card>
          } @empty {
            <mat-card class="p-6">Capsules will appear here when the backend returns the pack detail.</mat-card>
          }
        </section>
      }
    }
  </section>`,
  styles: [`
    .detail-metrics { grid-template-columns: repeat(auto-fit, minmax(9rem, 1fr)); }
    .detail-metrics div { border: 1px solid var(--b0-border); border-radius: 0.75rem; padding: 0.75rem; }
    .detail-metrics b { display: block; font-size: 1.4rem; }
    .detail-metrics span { color: var(--b0-text-muted); font-size: 0.875rem; }
    .capsule-row { grid-template-columns: minmax(12rem, 1fr) auto auto auto auto; align-items: center; }
    @media (max-width: 800px) { .capsule-row { grid-template-columns: 1fr; } }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LearningPackDetailPage {
  #route = inject(ActivatedRoute);
  #packs = inject(LearningPacksService);
  vm$ = this.#route.paramMap.pipe(
    map((params) => params.get('packId') ?? params.get('learningPackId') ?? ''),
    switchMap((packId) => this.#packs.detail(packId).pipe(map((pack) => ({ pack, loading: false, error: null })), catchError((error) => of({ pack: null, loading: false, error })))),
    startWith({ pack: null, loading: true, error: null } satisfies LearningPackDetailVm),
    shareReplay({ bufferSize: 1, refCount: true }),
  );
  packCode(pack: LearningPack) { return pack.code ?? pack.externalId ?? (pack.dayNumber ? `LP${String(pack.dayNumber).padStart(2, '0')}` : 'LP'); }
  topicLabel(pack: LearningPack) { return pack.topic ?? pack.audience ?? 'General'; }
  objectiveList(pack: LearningPack) { return pack.objectives?.length ? pack.objectives : [pack.objectivesSummary ?? 'Learning objectives will be shown when the pack is published.']; }
  summary(pack: LearningPack) { return pack.summary ?? pack.description ?? 'Pack summary will be shown when details are available.'; }
  totalCapsules(pack: LearningPack) { return pack.capsuleCount ?? pack.totalCapsules ?? pack.capsules?.length ?? 0; }
  completedCapsules(pack: LearningPack) { return pack.completedCapsules ?? pack.capsules?.filter((c) => this.normalizedCapsuleStatus(c) === 'completed').length ?? 0; }
  totalQuestions(pack: LearningPack) { return pack.questionCount ?? pack.totalQuestions ?? pack.capsules?.reduce((sum, c) => sum + this.capsuleQuestionCount(c), 0) ?? 0; }
  completedQuestions(pack: LearningPack) { return pack.completedQuestions ?? pack.questionsAnswered ?? 0; }
  studyTime(pack: LearningPack) { const minutes = pack.estimatedStudyMinutes ?? pack.estimatedMinutes; return minutes ? `${minutes} min` : '—'; }
  progress(pack: LearningPack) { const explicit = pack.progressPercentage ?? pack.progress; return typeof explicit === 'number' ? Math.max(0, Math.min(100, explicit)) : this.totalCapsules(pack) ? (this.completedCapsules(pack) / this.totalCapsules(pack)) * 100 : 0; }
  normalizedStatus(pack: LearningPack) { const raw = (pack.progressStatus ?? pack.status ?? '').toLowerCase().replace(/[ -]/g, '_'); if (raw.includes('locked')) return 'locked'; if (raw.includes('complete')) return 'completed'; if (raw.includes('progress')) return 'in_progress'; return this.progress(pack) > 0 ? 'in_progress' : 'not_started'; }
  statusLabel(pack: LearningPack) { return ({ not_started: 'Not Started', in_progress: 'In Progress', completed: 'Completed', locked: 'Locked' } as const)[this.normalizedStatus(pack)]; }
  statusClass(pack: LearningPack) { return this.isLocked(pack) ? 'bg-slate-200 text-slate-700' : 'bg-emerald-100 text-emerald-800'; }
  isLocked(pack: LearningPack) { return this.normalizedStatus(pack) === 'locked' || (pack.availabilityStatus ?? pack.availability ?? '').toLowerCase().includes('locked'); }
  capsules(pack: LearningPack) { return pack.capsules ?? []; }
  capsuleNumber(capsule: LearningPackCapsule) { return capsule.sequence ?? capsule.capsuleNumber ?? '—'; }
  capsuleQuestionCount(capsule: LearningPackCapsule) { return capsule.questionCount ?? capsule.totalQuestions ?? 0; }
  normalizedCapsuleStatus(capsule: LearningPackCapsule) { const raw = (capsule.progressStatus ?? capsule.status ?? '').toLowerCase().replace(/[ -]/g, '_'); if (raw.includes('locked')) return 'locked'; if (raw.includes('complete')) return 'completed'; if (raw.includes('progress') || raw.includes('active')) return 'in_progress'; return 'not_started'; }
  capsuleStatusLabel(capsule: LearningPackCapsule) { return ({ not_started: 'Not Started', in_progress: 'In Progress', completed: 'Completed', locked: 'Locked' } as const)[this.normalizedCapsuleStatus(capsule)]; }
  capsuleStatusClass(capsule: LearningPackCapsule) { return this.normalizedCapsuleStatus(capsule) === 'locked' ? 'bg-slate-200 text-slate-700' : 'bg-blue-100 text-blue-800'; }
  isCapsuleLocked(capsule: LearningPackCapsule) { return this.normalizedCapsuleStatus(capsule) === 'locked'; }
  completionDate(capsule: LearningPackCapsule) { return capsule.completedAtUtc ?? capsule.completedAt ?? 'Not completed'; }
  capsuleAction(capsule: LearningPackCapsule) { return this.normalizedCapsuleStatus(capsule) === 'in_progress' ? 'Continue' : 'Start'; }
  capsuleLink(capsule: LearningPackCapsule) { return capsule.continueUrl ?? capsule.startUrl ?? `/capsules/${capsule.id ?? capsule.externalId}`; }
  nextCapsuleLink(pack: LearningPack) { return pack.nextCapsuleUrl ?? pack.continueUrl ?? this.capsuleLink(this.capsules(pack).find((c) => this.normalizedCapsuleStatus(c) !== 'completed') ?? {} as LearningPackCapsule); }
  activeCapsuleLink(pack: LearningPack) { return pack.activeCapsuleUrl ?? pack.continueUrl ?? this.capsules(pack).find((c) => this.normalizedCapsuleStatus(c) === 'in_progress')?.continueUrl ?? null; }
  errorMessage(error: unknown) { const status = (error as { status?: number })?.status; if (status === 404) return 'This learning pack was not found.'; if (status === 403) return 'You do not have permission to view this pack.'; return 'The backend is unavailable. Please retry.'; }
}
