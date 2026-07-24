import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, Inject, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { catchError, map, of, startWith } from 'rxjs';
import { TeamsApiService } from '../../../core/api/feature-api.services';

interface TeamDashboard {
  teamName: string;
  cohort: string;
  mentor: string;
  progress: string;
  summary: TeamSummary;
  members: TeamMember[];
}

interface TeamSummary {
  membersActiveToday: string;
  teamTargetCompleted: string;
  totalStreakDays: string;
  encouragementActivity: string;
}

interface TeamMember {
  id: string;
  displayName: string;
  avatarUrl?: string;
  initials: string;
  completedToday: boolean;
  studyStreak: number;
  participation: 'Active today' | 'Recently active' | 'Needs check-in';
  helpRequest?: 'Help requested' | 'No help request' | 'Hidden';
}

interface TeamVm {
  data: TeamDashboard;
  loading: boolean;
  error: boolean;
}

type TeamAction = 'Encourage' | 'Check On' | 'Celebrate';

const FALLBACK_TEAM: TeamDashboard = {
  teamName: 'Block Zero Team',
  cohort: 'Current cohort',
  mentor: 'Assigned mentor',
  progress: 'On track',
  summary: {
    membersActiveToday: '0 active today',
    teamTargetCompleted: 'Not reported',
    totalStreakDays: '0 days',
    encouragementActivity: 'No encouragement yet',
  },
  members: [],
};

@Component({
  standalone: true,
  imports: [AsyncPipe, MatButtonModule, MatCardModule, MatDialogModule],
  template: `<section class="grid gap-5" aria-labelledby="team-title">
    <div class="feature-hero">
      <div class="grid gap-3">
        <p class="eyebrow">/team</p>
        @if (vm$ | async; as vm) {
          <h1 id="team-title" class="text-3xl font-black tracking-tight sm:text-4xl">{{ vm.data.teamName }}</h1>
          <p class="max-w-3xl leading-7 text-slate-600">
            Cohort: <strong>{{ vm.data.cohort }}</strong> · Mentor: <strong>{{ vm.data.mentor }}</strong> · Team progress:
            <strong>{{ vm.data.progress }}</strong>
          </p>
          <p class="max-w-3xl text-sm leading-6 text-slate-500">
            Privacy-first team dashboard: this page shows only participation, streaks, encouragement, completion status,
            and authorized help-request indicators. It does not show answers, scores, confidence ratings, detailed weaknesses,
            or private support details.
          </p>
        }
      </div>
    </div>

    @if (vm$ | async; as vm) {
      @if (vm.loading) {
        <mat-card class="p-4 sm:p-6">Loading team dashboard…</mat-card>
      } @else {
        @if (vm.error) {
          <p class="rounded-2xl bg-amber-50 p-4 text-amber-900">Team API is unavailable, so example-safe placeholders are shown.</p>
        }

        <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          @for (card of summaryCards(vm.data.summary); track card.label) {
            <mat-card class="p-4">
              <p class="text-sm font-semibold uppercase tracking-wide text-slate-500">{{ card.label }}</p>
              <p class="mt-2 text-2xl font-black">{{ card.value }}</p>
            </mat-card>
          }
        </div>

        <div class="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
          @for (member of vm.data.members; track member.id) {
            <mat-card class="grid gap-4 p-4 sm:p-6">
              <div class="flex items-center gap-3">
                @if (member.avatarUrl) {
                  <img class="size-14 rounded-full object-cover" [src]="member.avatarUrl" [alt]="member.displayName + ' avatar'" />
                } @else {
                  <div class="grid size-14 place-items-center rounded-full bg-indigo-100 font-black text-indigo-700">{{ member.initials }}</div>
                }
                <div>
                  <h2 class="text-xl font-black">{{ member.displayName }}</h2>
                  <p class="text-sm text-slate-500">{{ member.participation }}</p>
                </div>
              </div>
              <dl class="grid gap-2 text-sm">
                <div class="flex justify-between gap-3"><dt>Today’s completion status</dt><dd class="font-bold">{{ member.completedToday ? 'Completed' : 'Not completed yet' }}</dd></div>
                <div class="flex justify-between gap-3"><dt>Study streak</dt><dd class="font-bold">{{ member.studyStreak }} days</dd></div>
                <div class="flex justify-between gap-3"><dt>Participation indicator</dt><dd class="font-bold">{{ member.participation }}</dd></div>
                @if (member.helpRequest && member.helpRequest !== 'Hidden') {
                  <div class="flex justify-between gap-3"><dt>Help-request indicator</dt><dd class="font-bold">{{ member.helpRequest }}</dd></div>
                }
              </dl>
              <div class="flex flex-wrap gap-2">
                <button mat-button type="button" (click)="openAction('Encourage', member)">Encourage</button>
                <button mat-button type="button" (click)="openAction('Check On', member)">Check On</button>
                <button mat-button type="button" (click)="openAction('Celebrate', member)">Celebrate</button>
              </div>
            </mat-card>
          } @empty {
            <mat-card class="p-4 sm:p-6">No team members are available yet.</mat-card>
          }
        </div>
      }
    }
  </section>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TeamPage {
  #api = inject(TeamsApiService);
  #dialog = inject(MatDialog);

  vm$ = this.#api.list<unknown>().pipe(
    map((data) => ({ data: this.#toDashboard(data), loading: false, error: false })),
    catchError(() => of({ data: FALLBACK_TEAM, loading: false, error: true })),
    startWith({ data: FALLBACK_TEAM, loading: true, error: false }),
  );

  summaryCards(summary: TeamSummary) {
    return [
      { label: 'Members active today', value: summary.membersActiveToday },
      { label: 'Team target completed', value: summary.teamTargetCompleted },
      { label: 'Total streak days', value: summary.totalStreakDays },
      { label: 'Encouragement activity', value: summary.encouragementActivity },
    ];
  }

  openAction(action: TeamAction, member: TeamMember) {
    this.#dialog.open(TeamActionDialogComponent, { data: { action, member }, width: '34rem' });
  }

  #toDashboard(data: unknown): TeamDashboard {
    const record = this.#record(data);
    const members = this.#members(record['members'] ?? record['items']);
    return {
      teamName: this.#text(record['teamName'] ?? record['name'], FALLBACK_TEAM.teamName),
      cohort: this.#text(record['cohort'] ?? record['cohortName'], FALLBACK_TEAM.cohort),
      mentor: this.#text(record['mentor'] ?? record['mentorName'], FALLBACK_TEAM.mentor),
      progress: this.#text(record['progress'] ?? record['teamProgress'], FALLBACK_TEAM.progress),
      summary: {
        membersActiveToday: this.#text(record['membersActiveToday'], `${members.filter((m) => m.participation === 'Active today').length} active today`),
        teamTargetCompleted: this.#text(record['teamTargetCompleted'], FALLBACK_TEAM.summary.teamTargetCompleted),
        totalStreakDays: this.#text(record['totalStreakDays'], `${members.reduce((sum, member) => sum + member.studyStreak, 0)} days`),
        encouragementActivity: this.#text(record['encouragementActivity'], FALLBACK_TEAM.summary.encouragementActivity),
      },
      members,
    };
  }

  #members(value: unknown): TeamMember[] {
    return Array.isArray(value) ? value.map((item, index) => this.#member(item, index)) : [];
  }

  #member(value: unknown, index: number): TeamMember {
    const record = this.#record(value);
    const displayName = this.#text(record['displayName'] ?? record['name'], `Teammate ${index + 1}`);
    return {
      id: this.#text(record['id'], String(index)),
      displayName,
      avatarUrl: this.#optionalText(record['avatarUrl']),
      initials: this.#initials(displayName),
      completedToday: Boolean(record['completedToday'] ?? record['todayCompleted']),
      studyStreak: Number(record['studyStreak'] ?? record['streakDays'] ?? 0),
      participation: this.#participation(record['participation'] ?? record['participationIndicator']),
      helpRequest: this.#help(record['helpRequest'] ?? record['helpRequestIndicator']),
    };
  }

  #record(value: unknown): Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value) ? value as Record<string, unknown> : {};
  }

  #text(value: unknown, fallback: string): string { return typeof value === 'string' && value.trim() ? value : typeof value === 'number' ? String(value) : fallback; }
  #optionalText(value: unknown): string | undefined { return typeof value === 'string' && value.trim() ? value : undefined; }
  #initials(name: string): string { return name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase(); }
  #participation(value: unknown): TeamMember['participation'] { return value === 'Recently active' || value === 'Needs check-in' ? value : 'Active today'; }
  #help(value: unknown): TeamMember['helpRequest'] { return value === 'Help requested' || value === 'No help request' ? value : 'Hidden'; }
}

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, MatButtonModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatSelectModule],
  template: `<h2 mat-dialog-title>{{ data.action }} {{ data.member.displayName }}</h2>
    <form [formGroup]="form" (ngSubmit)="save()">
      <mat-dialog-content class="grid gap-3">
        @if (data.action === 'Encourage') {
          <mat-form-field appearance="outline"><mat-label>Message template</mat-label><mat-select formControlName="template"><mat-option value="Keep going">Keep going</mat-option><mat-option value="Great consistency">Great consistency</mat-option><mat-option value="You have got this">You have got this</mat-option></mat-select></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Optional note</mat-label><textarea matInput formControlName="message" rows="4"></textarea></mat-form-field>
        } @else if (data.action === 'Check On') {
          <mat-form-field appearance="outline"><mat-label>Message</mat-label><textarea matInput formControlName="message" rows="5"></textarea></mat-form-field>
        } @else {
          <mat-form-field appearance="outline"><mat-label>Select achievement</mat-label><mat-select formControlName="achievement"><mat-option value="Daily target completed">Daily target completed</mat-option><mat-option value="Streak milestone">Streak milestone</mat-option><mat-option value="Team encouragement">Team encouragement</mat-option></mat-select></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Optional message</mat-label><textarea matInput formControlName="message" rows="4"></textarea></mat-form-field>
        }
        <p class="rounded-2xl bg-slate-50 p-3 text-sm text-slate-600">Privacy warning: do not include answers, scores, confidence ratings, detailed weaknesses, or private support details in team messages.</p>
      </mat-dialog-content>
      <mat-dialog-actions align="end"><button mat-button type="button" mat-dialog-close>Cancel</button><button mat-flat-button type="submit">Send</button></mat-dialog-actions>
    </form>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TeamActionDialogComponent {
  #fb = inject(FormBuilder);
  form = this.#fb.group({ template: ['Keep going'], message: [''], achievement: ['Daily target completed'] });
  constructor(@Inject(MAT_DIALOG_DATA) public data: { action: TeamAction; member: TeamMember }, private readonly dialogRef: MatDialogRef<TeamActionDialogComponent>) {}
  save() { this.dialogRef.close(this.form.value); }
}
