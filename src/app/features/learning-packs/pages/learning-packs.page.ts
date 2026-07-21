import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { catchError, combineLatest, map, of, startWith } from 'rxjs';
import { LearningPacksService } from '../data-access/learning-packs.service';
import { DashboardService } from '../../dashboard/data-access/dashboard.service';
import { LearningPack } from '../../../core/api/api.types';

@Component({
  standalone: true,
  imports: [AsyncPipe, RouterLink, MatButtonModule, MatCardModule],
  template: `<section class="grid gap-5" aria-labelledby="packs-title">
    <header><p class="eyebrow">Study content</p><h1 id="packs-title">Learning packs</h1><p>Assigned and published learning collections from your Block Zero plan.</p></header>
    @if (vm$ | async; as vm) {
      @if (vm.loading) { <mat-card class="p-6">Loading learning packs…</mat-card> }
      @else if (vm.error) { <mat-card class="p-6"><h2>Learning packs unavailable</h2><p>{{ errorMessage(vm.error) }}</p><button mat-stroked-button type="button" (click)="reload()">Retry</button></mat-card> }
      @else {
        @if (vm.continueUrl) { <mat-card class="p-5"><h2>Ready for today?</h2><p>Continue with the next assigned capsule.</p><a mat-flat-button color="primary" [routerLink]="capsuleLink(vm.continueUrl)">Continue today’s capsule</a></mat-card> }
        <div class="grid gap-4 md:grid-cols-2">
          @for (pack of vm.packs; track pack.id || pack.externalId || pack.title) {
            <mat-card class="grid gap-2 p-5">
              <div class="flex items-start justify-between gap-3"><h2 class="m-0">{{ pack.title }}</h2>@if (pack.status) { <span class="rounded-full bg-slate-100 px-3 py-1 text-sm font-bold">{{ pack.status }}</span> }</div>
              @if (pack.description) { <p>{{ pack.description }}</p> }
              <p class="m-0 text-sm text-[var(--b0-text-muted)]">@if (pack.dayNumber) { Day {{ pack.dayNumber }} · }@if (pack.estimatedMinutes) { {{ pack.estimatedMinutes }} min · }@if (pack.capsuleCount) { {{ pack.capsuleCount }} capsules · }@if (pack.questionCount) { {{ pack.questionCount }} questions }</p>
              @if (pack.resources?.length) { <ul>@for (resource of pack.resources; track resource) { <li>{{ resource }}</li> }</ul> }
              @if (pack.continueUrl) { <a mat-button [routerLink]="capsuleLink(pack.continueUrl)">Continue pack</a> }
            </mat-card>
          } @empty { <mat-card class="p-6"><h2>No learning packs yet</h2><p>Your assigned or published packs will appear here when they are available.</p></mat-card> }
        </div>
      }
    }
  </section>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LearningPacksPage {
  #packs = inject(LearningPacksService);
  #dashboard = inject(DashboardService);

  vm$ = combineLatest([
    this.#packs.list().pipe(catchError((error) => of(error))),
    this.#dashboard.getDashboard().pipe(catchError(() => of(null))),
  ]).pipe(
    map(([packsOrError, dashboard]) =>
      Array.isArray(packsOrError)
        ? { packs: packsOrError, loading: false, error: null, continueUrl: dashboard?.continueUrl }
        : { packs: [] as LearningPack[], loading: false, error: packsOrError, continueUrl: dashboard?.continueUrl },
    ),
    startWith({ packs: [] as LearningPack[], loading: true, error: null, continueUrl: undefined }),
  );

  reload() {
    window.location.reload();
  }
  capsuleLink(url: string) {
    return url.startsWith('/capsules/') ? url : `/capsules/${url.split('/').filter(Boolean).pop() ?? url}`;
  }
  errorMessage(error: unknown) {
    const status = (error as { status?: number })?.status;
    if (status === 401) return 'Please sign in again to recover your session.';
    if (status === 403) return 'You do not have permission to view these packs.';
    return 'The backend is unavailable. Please retry.';
  }
}
