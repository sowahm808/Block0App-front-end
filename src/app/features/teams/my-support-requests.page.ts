import { AsyncPipe, DatePipe, NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTabsModule } from '@angular/material/tabs';
import { RouterLink } from '@angular/router';
import { catchError, map, of, startWith } from 'rxjs';
import { SupportRequestsApiService } from '../../core/api/feature-api.services';
import { PageHeaderComponent } from '../../shared/ui/page-header/page-header.component';

interface SupportRequestCard {
  id: string;
  subject: string;
  category: string;
  submittedDate: string;
  status: 'Submitted' | 'Assigned' | 'In Progress' | 'Waiting for Scholar' | 'Resolved' | 'Closed';
  assignedMentor: string;
  lastUpdate: string;
}

const CATEGORIES = ['Academic', 'Technical', 'Motivation', 'Time management', 'Challenge access', 'Personal', 'Other'] as const;
const URGENCY = ['Low', 'Normal', 'High'] as const;
const RESPONSE_METHODS = ['In-app message', 'Email', 'Phone'] as const;

@Component({
  selector: 'b0-my-support-requests',
  standalone: true,
  imports: [
    AsyncPipe,
    DatePipe,
    NgTemplateOutlet,
    ReactiveFormsModule,
    RouterLink,
    PageHeaderComponent,
    MatButtonModule,
    MatCardModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatTabsModule,
  ],
  template: `<section class="grid gap-5">
    <b0-page-header title="My Support Requests" description="Submit a new support request or review open and resolved requests." />

    <mat-tab-group mat-stretch-tabs="false" animationDuration="0ms">
      <mat-tab label="New Request">
        <form class="mt-5 grid gap-4" [formGroup]="form" (ngSubmit)="submit()">
          <mat-card class="grid gap-4 p-4 sm:p-6">
            <div class="grid gap-4 md:grid-cols-2">
              <mat-form-field appearance="outline"><mat-label>Support category</mat-label><mat-select formControlName="category" required>@for (category of categories; track category) { <mat-option [value]="category">{{ category }}</mat-option> }</mat-select></mat-form-field>
              <mat-form-field appearance="outline"><mat-label>Urgency</mat-label><mat-select formControlName="urgency" required>@for (item of urgencyValues; track item) { <mat-option [value]="item">{{ item }}</mat-option> }</mat-select></mat-form-field>
            </div>
            <mat-form-field appearance="outline"><mat-label>Subject</mat-label><input matInput formControlName="subject" required maxlength="120" /></mat-form-field>
            <mat-form-field appearance="outline"><mat-label>Description</mat-label><textarea matInput formControlName="description" required rows="6"></textarea></mat-form-field>
            <mat-form-field appearance="outline"><mat-label>Preferred response method</mat-label><mat-select formControlName="preferredResponseMethod"><mat-option value="">No preference</mat-option>@for (method of responseMethods; track method) { <mat-option [value]="method">{{ method }}</mat-option> }</mat-select></mat-form-field>
            <mat-checkbox formControlName="allowMentorContact">Allow mentor to contact me</mat-checkbox>
            <p class="rounded-2xl bg-slate-50 p-3 text-sm text-slate-600">Use this form for academic, technical, motivation, time management, challenge access, personal, or other program support. Do not include emergency language unless an escalation protocol is enabled.</p>
            <div class="flex flex-wrap gap-2"><button mat-flat-button type="submit" [disabled]="form.invalid">Submit Support Request</button><a mat-button routerLink="/team">Cancel</a></div>
          </mat-card>
        </form>
      </mat-tab>

      <mat-tab label="Open Requests">
        <div class="mt-5 grid gap-4 md:grid-cols-2">
          @if (vm$ | async; as vm) {
            @for (request of openRequests(vm.requests); track request.id) { <ng-container [ngTemplateOutlet]="requestCard" [ngTemplateOutletContext]="{ $implicit: request }" /> } @empty { <mat-card class="p-4">No open support requests.</mat-card> }
          }
        </div>
      </mat-tab>

      <mat-tab label="Resolved Requests">
        <div class="mt-5 grid gap-4 md:grid-cols-2">
          @if (vm$ | async; as vm) {
            @for (request of resolvedRequests(vm.requests); track request.id) { <ng-container [ngTemplateOutlet]="requestCard" [ngTemplateOutletContext]="{ $implicit: request }" /> } @empty { <mat-card class="p-4">No resolved support requests.</mat-card> }
          }
        </div>
      </mat-tab>
    </mat-tab-group>

    <ng-template #requestCard let-request>
      <mat-card class="grid gap-3 p-4 sm:p-6">
        <div><h2 class="text-xl font-black">{{ request.subject }}</h2><p class="text-sm text-slate-500">{{ request.category }} · {{ request.submittedDate | date: 'mediumDate' }}</p></div>
        <dl class="grid gap-2 text-sm">
          <div class="flex justify-between gap-3"><dt>Status</dt><dd class="font-bold">{{ request.status }}</dd></div>
          <div class="flex justify-between gap-3"><dt>Assigned mentor</dt><dd class="font-bold">{{ request.assignedMentor }}</dd></div>
          <div class="flex justify-between gap-3"><dt>Last update</dt><dd class="font-bold">{{ request.lastUpdate | date: 'medium' }}</dd></div>
        </dl>
      </mat-card>
    </ng-template>
  </section>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MySupportRequestsPage {
  #api = inject(SupportRequestsApiService);
  #fb = inject(FormBuilder);
  categories = CATEGORIES;
  urgencyValues = URGENCY;
  responseMethods = RESPONSE_METHODS;
  form = this.#fb.group({
    category: ['Academic', Validators.required],
    subject: ['', Validators.required],
    description: ['', Validators.required],
    urgency: ['Normal', Validators.required],
    preferredResponseMethod: [''],
    allowMentorContact: [false],
  });
  vm$ = this.#api.mine<unknown>().pipe(
    map((data) => ({ requests: this.#requests(data), loading: false })),
    catchError(() => of({ requests: [], loading: false })),
    startWith({ requests: [], loading: true }),
  );

  submit() {
    if (this.form.invalid) return;
    this.#api.create(this.form.getRawValue()).subscribe(() => this.form.reset({ category: 'Academic', urgency: 'Normal', preferredResponseMethod: '', allowMentorContact: false }));
  }

  openRequests(requests: SupportRequestCard[]) { return requests.filter((request) => !['Resolved', 'Closed'].includes(request.status)); }
  resolvedRequests(requests: SupportRequestCard[]) { return requests.filter((request) => ['Resolved', 'Closed'].includes(request.status)); }

  #requests(data: unknown): SupportRequestCard[] {
    const records = Array.isArray(data) ? data : this.#record(data)['items'];
    return Array.isArray(records) ? records.map((record, index) => this.#request(record, index)) : [];
  }

  #request(value: unknown, index: number): SupportRequestCard {
    const record = this.#record(value);
    return {
      id: this.#text(record['id'], String(index)),
      subject: this.#text(record['subject'], 'Support request'),
      category: this.#text(record['category'], 'Other'),
      submittedDate: this.#text(record['submittedDate'] ?? record['createdAt'], new Date().toISOString()),
      status: this.#status(record['status']),
      assignedMentor: this.#text(record['assignedMentor'] ?? record['mentorName'], 'Unassigned'),
      lastUpdate: this.#text(record['lastUpdate'] ?? record['updatedAt'], new Date().toISOString()),
    };
  }

  #record(value: unknown): Record<string, unknown> { return typeof value === 'object' && value !== null && !Array.isArray(value) ? value as Record<string, unknown> : {}; }
  #text(value: unknown, fallback: string): string { return typeof value === 'string' && value.trim() ? value : typeof value === 'number' ? String(value) : fallback; }
  #status(value: unknown): SupportRequestCard['status'] {
    return value === 'Submitted' || value === 'Assigned' || value === 'In Progress' || value === 'Waiting for Scholar' || value === 'Resolved' || value === 'Closed' ? value : 'Submitted';
  }
}
