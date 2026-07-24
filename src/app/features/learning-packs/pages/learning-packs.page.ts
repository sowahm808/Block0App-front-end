import { AsyncPipe, DecimalPipe, NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatOptionModule } from '@angular/material/core';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { catchError, combineLatest, debounceTime, map, of, shareReplay, startWith } from 'rxjs';
import { LearningPacksService } from '../data-access/learning-packs.service';
import { LearningPack } from '../../../core/api/api.types';

type PackStatusFilter = 'all' | 'not_started' | 'in_progress' | 'completed' | 'locked';
type AvailabilityFilter = 'all' | 'available' | 'locked' | 'coming_soon';
type SortKey = 'recommended' | 'title' | 'topic' | 'progress_desc' | 'progress_asc';

interface LearningPackListVm {
  packs: LearningPack[];
  filteredPacks: LearningPack[];
  topics: string[];
  loading: boolean;
  error: unknown;
}

@Component({
  standalone: true,
  imports: [
    AsyncPipe,
    DecimalPipe,
    NgClass,
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatOptionModule,
    MatProgressBarModule,
    MatSelectModule,
  ],
  template: `<section class="grid gap-5" aria-labelledby="packs-title">
    <header>
      <p class="eyebrow">Study content</p>
      <h1 id="packs-title">Learning Packs</h1>
      <p>Find assigned packs, track capsule and question completion, and jump back into the right learning flow.</p>
    </header>

    <mat-card class="grid gap-4 p-4" aria-label="Learning pack filters">
      <div class="learning-pack-filters grid gap-3">
        <mat-form-field appearance="outline" floatLabel="always">
          <mat-label>Search</mat-label>
          <input matInput type="search" [formControl]="search" placeholder="Code, title, objective" />
        </mat-form-field>
        <mat-form-field appearance="outline" floatLabel="always">
          <mat-label>Topic</mat-label>
          <mat-select [formControl]="topic">
            <mat-option value="all">All topics</mat-option>
            @if (vm$ | async; as vm) {
              @for (option of vm.topics; track option) {
                <mat-option [value]="option">{{ option }}</mat-option>
              }
            }
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline" floatLabel="always">
          <mat-label>Status</mat-label>
          <mat-select [formControl]="status">
            <mat-option value="all">All</mat-option>
            <mat-option value="not_started">Not Started</mat-option>
            <mat-option value="in_progress">In Progress</mat-option>
            <mat-option value="completed">Completed</mat-option>
            <mat-option value="locked">Locked</mat-option>
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline" floatLabel="always">
          <mat-label>Availability</mat-label>
          <mat-select [formControl]="availability">
            <mat-option value="all">All availability</mat-option>
            <mat-option value="available">Available</mat-option>
            <mat-option value="locked">Locked</mat-option>
            <mat-option value="coming_soon">Coming soon</mat-option>
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline" floatLabel="always">
          <mat-label>Sort</mat-label>
          <mat-select [formControl]="sort">
            <mat-option value="recommended">Recommended</mat-option>
            <mat-option value="title">Title</mat-option>
            <mat-option value="topic">Topic</mat-option>
            <mat-option value="progress_desc">Progress: high to low</mat-option>
            <mat-option value="progress_asc">Progress: low to high</mat-option>
          </mat-select>
        </mat-form-field>
      </div>
    </mat-card>

    @if (vm$ | async; as vm) {
      @if (vm.loading) {
        <mat-card class="p-6">Loading learning packs…</mat-card>
      } @else if (vm.error) {
        <mat-card class="p-6"
          ><h2>Learning packs unavailable</h2>
          <p>{{ errorMessage(vm.error) }}</p>
          <button mat-stroked-button type="button" (click)="reload()">Retry</button></mat-card
        >
      } @else {
        <p class="m-0 text-sm text-[var(--b0-text-muted)]">
          Showing {{ vm.filteredPacks.length }} of {{ vm.packs.length }} learning packs.
        </p>
        <div class="grid gap-4 lg:grid-cols-2">
          @for (pack of vm.filteredPacks; track pack.id || pack.externalId || pack.title) {
            <mat-card class="grid gap-4 p-5">
              <div class="flex items-start justify-between gap-3">
                <div>
                  <p class="eyebrow m-0">{{ packCode(pack) }}</p>
                  <h2 class="m-0 text-2xl">{{ pack.title }}</h2>
                  <p class="m-0 text-sm font-bold text-[var(--b0-text-muted)]">{{ topicLabel(pack) }}</p>
                </div>
                <span class="rounded-full px-3 py-1 text-sm font-bold" [ngClass]="badgeClass(pack)">{{
                  availabilityLabel(pack)
                }}</span>
              </div>
              <p class="m-0">{{ objectives(pack) }}</p>
              <div class="grid gap-3 sm:grid-cols-3">
                <div>
                  <b>{{ completedCapsules(pack) }}</b>
                  <p class="m-0 text-sm text-[var(--b0-text-muted)]">of {{ totalCapsules(pack) }} capsules</p>
                </div>
                <div>
                  <b>{{ completedQuestions(pack) }}</b>
                  <p class="m-0 text-sm text-[var(--b0-text-muted)]">of {{ totalQuestions(pack) }} questions</p>
                </div>
                <div>
                  <b>{{ accuracyLabel(pack) }}</b>
                  <p class="m-0 text-sm text-[var(--b0-text-muted)]">accuracy</p>
                </div>
              </div>
              <div>
                <div class="mb-1 flex justify-between text-sm font-bold">
                  <span>{{ statusLabel(pack) }}</span
                  ><span>{{ progress(pack) | number: '1.0-0' }}%</span>
                </div>
                <mat-progress-bar [value]="progress(pack)" aria-label="Learning pack progress" />
              </div>
              <div class="flex flex-wrap gap-2">
                <a mat-flat-button color="primary" [disabled]="isLocked(pack)" [routerLink]="primaryLink(pack)">{{
                  primaryAction(pack)
                }}</a>
                <a mat-stroked-button [routerLink]="detailsLink(pack)">View Details</a>
              </div>
            </mat-card>
          } @empty {
            <mat-card class="p-6"
              ><h2>No learning packs match these filters</h2>
              <p>Try clearing search, topic, status, or availability filters.</p></mat-card
            >
          }
        </div>
      }
    }
  </section>`,
  styles: [
    `
      .learning-pack-filters {
        grid-template-columns: repeat(auto-fit, minmax(13.5rem, 1fr));
        align-items: start;
      }

      .learning-pack-filters mat-form-field {
        width: 100%;
        min-width: 0;
      }

      :host ::ng-deep .learning-pack-filters .mat-mdc-form-field-infix {
        width: 100%;
        min-width: 0;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LearningPacksPage {
  #packs = inject(LearningPacksService);
  search = new FormControl('', { nonNullable: true });
  topic = new FormControl('all', { nonNullable: true });
  status = new FormControl<PackStatusFilter>('all', { nonNullable: true });
  availability = new FormControl<AvailabilityFilter>('all', { nonNullable: true });
  sort = new FormControl<SortKey>('recommended', { nonNullable: true });

  #filters$ = combineLatest([
    this.search.valueChanges.pipe(startWith(this.search.value), debounceTime(150)),
    this.topic.valueChanges.pipe(startWith(this.topic.value)),
    this.status.valueChanges.pipe(startWith(this.status.value)),
    this.availability.valueChanges.pipe(startWith(this.availability.value)),
    this.sort.valueChanges.pipe(startWith(this.sort.value)),
  ]);

  vm$ = combineLatest([this.#packs.list().pipe(catchError((error) => of(error))), this.#filters$]).pipe(
    map(([packsOrError, filters]) => {
      if (!Array.isArray(packsOrError))
        return {
          packs: [],
          filteredPacks: [],
          topics: [],
          loading: false,
          error: packsOrError,
        } satisfies LearningPackListVm;
      const packs = packsOrError;
      const topics = [...new Set(packs.map((pack) => this.topicLabel(pack)).filter(Boolean))].sort();
      return {
        packs,
        filteredPacks: this.applyFilters(packs, filters),
        topics,
        loading: false,
        error: null,
      } satisfies LearningPackListVm;
    }),
    startWith({ packs: [], filteredPacks: [], topics: [], loading: true, error: null } satisfies LearningPackListVm),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  applyFilters(
    packs: LearningPack[],
    [search, topic, status, availability, sort]: [string, string, PackStatusFilter, AvailabilityFilter, SortKey],
  ) {
    const query = search.trim().toLowerCase();
    return [...packs]
      .filter(
        (pack) =>
          !query ||
          [this.packCode(pack), pack.title, this.topicLabel(pack), this.objectives(pack)]
            .join(' ')
            .toLowerCase()
            .includes(query),
      )
      .filter((pack) => topic === 'all' || this.topicLabel(pack) === topic)
      .filter((pack) => status === 'all' || this.normalizedStatus(pack) === status)
      .filter((pack) => availability === 'all' || this.normalizedAvailability(pack) === availability)
      .sort((a, b) => this.comparePacks(a, b, sort));
  }
  packCode(pack: LearningPack) {
    return pack.code ?? pack.externalId ?? (pack.dayNumber ? `LP${String(pack.dayNumber).padStart(2, '0')}` : 'LP');
  }
  topicLabel(pack: LearningPack) {
    return pack.topic ?? pack.audience ?? 'General';
  }
  objectives(pack: LearningPack) {
    return (
      pack.objectivesSummary ?? pack.description ?? 'Learning objectives will be shown when the pack is published.'
    );
  }
  totalCapsules(pack: LearningPack) {
    return pack.capsuleCount ?? pack.totalCapsules ?? 0;
  }
  completedCapsules(pack: LearningPack) {
    return pack.completedCapsules ?? 0;
  }
  totalQuestions(pack: LearningPack) {
    return pack.questionCount ?? pack.totalQuestions ?? 0;
  }
  completedQuestions(pack: LearningPack) {
    return pack.completedQuestions ?? 0;
  }
  progress(pack: LearningPack) {
    const explicit = pack.progressPercentage ?? pack.progress;
    if (typeof explicit === 'number') return Math.max(0, Math.min(100, explicit));
    const total = this.totalCapsules(pack);
    return total ? (this.completedCapsules(pack) / total) * 100 : 0;
  }
  accuracyLabel(pack: LearningPack) {
    if (pack.accuracyPermitted === false) return 'Hidden';
    const accuracy = pack.accuracyPercentage ?? pack.accuracy;
    return typeof accuracy === 'number' ? `${Math.round(accuracy)}%` : '—';
  }
  normalizedStatus(pack: LearningPack): PackStatusFilter {
    const raw = (pack.progressStatus ?? pack.status ?? '').toLowerCase().replace(/[ -]/g, '_');
    if (raw.includes('locked')) return 'locked';
    if (raw.includes('complete')) return 'completed';
    if (raw.includes('progress')) return 'in_progress';
    if (this.progress(pack) >= 100) return 'completed';
    if (this.progress(pack) > 0) return 'in_progress';
    return 'not_started';
  }
  normalizedAvailability(pack: LearningPack): AvailabilityFilter {
    const raw = (pack.availabilityStatus ?? pack.availability ?? pack.status ?? '').toLowerCase().replace(/[ -]/g, '_');
    if (raw.includes('coming')) return 'coming_soon';
    if (raw.includes('locked')) return 'locked';
    return 'available';
  }
  isLocked(pack: LearningPack) {
    return this.normalizedStatus(pack) === 'locked' || this.normalizedAvailability(pack) === 'locked';
  }
  statusLabel(pack: LearningPack) {
    return (
      {
        not_started: 'Not Started',
        in_progress: 'In Progress',
        completed: 'Completed',
        locked: 'Locked',
        all: 'All',
      } as const
    )[this.normalizedStatus(pack)];
  }
  availabilityLabel(pack: LearningPack) {
    return this.normalizedAvailability(pack) === 'coming_soon'
      ? 'Coming soon'
      : this.normalizedAvailability(pack) === 'locked'
        ? 'Locked'
        : 'Available';
  }
  badgeClass(pack: LearningPack) {
    return this.isLocked(pack) ? 'bg-slate-200 text-slate-700' : 'bg-emerald-100 text-emerald-800';
  }
  primaryAction(pack: LearningPack) {
    const status = this.normalizedStatus(pack);
    if (status === 'completed') return 'Review Pack';
    if (status === 'in_progress') return 'Continue Pack';
    return 'Start Pack';
  }
  primaryLink(pack: LearningPack) {
    return pack.continueUrl ?? `/learning-packs/${pack.id ?? pack.externalId ?? this.packCode(pack)}`;
  }
  detailsLink(pack: LearningPack) {
    return `/learning-packs/${pack.id ?? pack.externalId ?? this.packCode(pack)}`;
  }
  comparePacks(a: LearningPack, b: LearningPack, sort: SortKey) {
    if (sort === 'title') return a.title.localeCompare(b.title);
    if (sort === 'topic') return this.topicLabel(a).localeCompare(this.topicLabel(b)) || a.title.localeCompare(b.title);
    if (sort === 'progress_desc') return this.progress(b) - this.progress(a);
    if (sort === 'progress_asc') return this.progress(a) - this.progress(b);
    return this.packCode(a).localeCompare(this.packCode(b), undefined, { numeric: true });
  }
  reload() {
    window.location.reload();
  }
  errorMessage(error: unknown) {
    const status = (error as { status?: number })?.status;
    if (status === 401) return 'Please sign in again to recover your session.';
    if (status === 403) return 'You do not have permission to view these packs.';
    return 'The backend is unavailable. Please retry.';
  }
}
