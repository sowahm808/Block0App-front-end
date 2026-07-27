import { DatePipe, NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, HostListener, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { finalize } from 'rxjs';
import { AdminSystemSettingsApiService } from '../../core/api/remaining-feature-api.services';
import { SystemSettings, UpdateSystemSettingsRequest } from '../../core/api/api.types';
import { AuthStore } from '../../core/auth/auth.store';
import { environment } from '../../../environments/environment';
import { PageHeaderComponent } from '../../shared/ui/page-header/page-header.component';
import { LoadingSkeletonComponent } from '../../shared/ui/loading-skeleton/loading-skeleton.component';
import { ErrorStateComponent } from '../../shared/ui/error-state/error-state.component';
import { ConfirmationDialogComponent } from '../../shared/ui/confirmation-dialog/confirmation-dialog.component';

type ApiState<T> = { status: 'loading' } | { status: 'loaded'; data: T } | { status: 'error'; message: string };
type Category =
  | 'general'
  | 'academy'
  | 'challenges'
  | 'learningPacks'
  | 'enrollment'
  | 'notifications'
  | 'security'
  | 'imports'
  | 'reports'
  | 'integrations'
  | 'maintenance'
  | 'environment';
const CATEGORY_LABELS: Record<Category, string> = {
  general: 'General',
  academy: 'Academy',
  challenges: 'Challenges',
  learningPacks: 'Learning Packs',
  enrollment: 'Enrollment',
  notifications: 'Notifications',
  security: 'Security',
  imports: 'Imports & Uploads',
  reports: 'Reports',
  integrations: 'Integrations',
  maintenance: 'Maintenance',
  environment: 'Environment',
};

@Component({
  selector: 'b0-admin-system-settings',
  standalone: true,
  imports: [
    DatePipe,
    NgTemplateOutlet,
    RouterLink,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatCheckboxModule,
    MatDialogModule,
    MatDividerModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatListModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatSnackBarModule,
    PageHeaderComponent,
    LoadingSkeletonComponent,
    ErrorStateComponent,
  ],
  template: `
    <b0-page-header
      title="System Settings"
      description="Manage academy defaults, platform behavior, security policies, and operational limits."
    />
    @switch (state().status) {
      @case ('loading') {
        <b0-loading-skeleton [rows]="8" />
      }
      @case ('error') {
        <b0-error-state [message]="errorMessage()" (retry)="refresh()" />
      }
      @case ('loaded') {
        <div class="workspace">
          <mat-card class="navigation">
            <mat-form-field appearance="outline"
              ><mat-label>Search settings</mat-label><mat-icon matPrefix>search</mat-icon
              ><input matInput [value]="search()" (input)="search.set($any($event.target).value)"
            /></mat-form-field>
            <mat-form-field class="mobile-category"
              ><mat-label>Category</mat-label
              ><mat-select [value]="selected()" (selectionChange)="selected.set($event.value)">
                @for (item of filteredCategories(); track item.key) {
                  <mat-option [value]="item.key">{{ item.label }}</mat-option>
                }
              </mat-select></mat-form-field
            >
            <mat-nav-list class="desktop-category" aria-label="Settings categories">
              @for (item of filteredCategories(); track item.key) {
                <a mat-list-item [activated]="selected() === item.key" (click)="selected.set(item.key)"
                  ><mat-icon matListItemIcon>{{ item.icon }}</mat-icon
                  ><span matListItemTitle>{{ item.label }}</span></a
                >
              }
            </mat-nav-list>
            <mat-divider />
            <p class="meta">
              <strong>{{ settings()?.environment?.deploymentName || 'Environment' }}</strong
              ><br />API: {{ apiBaseUrl }}<br />
              @if (settings()?.updatedAtUtc) {
                Last updated {{ settings()?.updatedAtUtc | date: 'medium' }}
              }
            </p>
            <a mat-button routerLink="/admin/feature-flags"><mat-icon>flag</mat-icon>Feature Flags</a>
            <a mat-button routerLink="/admin/audit"><mat-icon>history</mat-icon>Audit Log</a>
          </mat-card>
          <form [formGroup]="form" class="content" (ngSubmit)="saveSettings()">
            <mat-card
              ><mat-card-header
                ><mat-card-title>{{ categoryLabels[selected()] }}</mat-card-title
                ><mat-card-subtitle>{{ description() }}</mat-card-subtitle></mat-card-header
              ><mat-card-content>
                @if (!canUpdate()) {
                  <p class="notice" role="status">
                    <mat-icon>visibility</mat-icon> Read-only access. Contact an administrator to update settings.
                  </p>
                }
                @switch (selected()) {
                  @case ('general') {
                    <div formGroupName="general" class="fields">
                      <ng-container
                        *ngTemplateOutlet="
                          text;
                          context: { $implicit: 'applicationName', label: 'Application name', required: true }
                        "
                      /><ng-container
                        *ngTemplateOutlet="
                          text;
                          context: { $implicit: 'supportEmail', label: 'Support email', type: 'email' }
                        "
                      /><ng-container
                        *ngTemplateOutlet="
                          text;
                          context: {
                            $implicit: 'defaultTimezone',
                            label: 'Default timezone',
                            hint: 'IANA name, for example UTC',
                          }
                        "
                      /><ng-container
                        *ngTemplateOutlet="
                          text;
                          context: { $implicit: 'defaultLocale', label: 'Default locale', hint: 'For example en-US' }
                        "
                      /><ng-container
                        *ngTemplateOutlet="text; context: { $implicit: 'dateFormat', label: 'Date format' }"
                      />
                    </div>
                  }
                  @case ('academy') {
                    <div formGroupName="academy" class="fields">
                      <ng-container
                        *ngTemplateOutlet="text; context: { $implicit: 'academyName', label: 'Academy name' }"
                      /><ng-container
                        *ngTemplateOutlet="
                          text;
                          context: { $implicit: 'contactEmail', label: 'Contact email', type: 'email' }
                        "
                      /><ng-container
                        *ngTemplateOutlet="
                          text;
                          context: { $implicit: 'academicYearStart', label: 'Academic year start', type: 'date' }
                        "
                      /><ng-container
                        *ngTemplateOutlet="
                          number;
                          context: {
                            $implicit: 'defaultChallengeDurationDays',
                            label: 'Default challenge duration (days)',
                          }
                        "
                      />
                    </div>
                  }
                  @case ('challenges') {
                    <div formGroupName="challenges" class="fields">
                      <ng-container
                        *ngTemplateOutlet="
                          number;
                          context: { $implicit: 'defaultDurationDays', label: 'Default duration (days)' }
                        "
                      /><ng-container
                        *ngTemplateOutlet="
                          number;
                          context: { $implicit: 'maxActiveChallenges', label: 'Maximum active challenges' }
                        "
                      /><mat-slide-toggle formControlName="allowLateCompletion">Allow late completion</mat-slide-toggle
                      ><mat-slide-toggle formControlName="requireDailyCheckIn">Require daily check-in</mat-slide-toggle>
                    </div>
                  }
                  @case ('learningPacks') {
                    <div formGroupName="learningPacks" class="fields toggles">
                      <mat-slide-toggle formControlName="requireReviewBeforePublish"
                        >Require review before publishing</mat-slide-toggle
                      ><mat-slide-toggle formControlName="allowSelfEnrollment">Allow self-enrollment</mat-slide-toggle
                      ><ng-container
                        *ngTemplateOutlet="
                          number;
                          context: { $implicit: 'defaultEstimatedMinutes', label: 'Default estimated minutes' }
                        "
                      />
                    </div>
                  }
                  @case ('enrollment') {
                    <div formGroupName="enrollment" class="fields toggles">
                      <mat-slide-toggle formControlName="registrationEnabled">Registration enabled</mat-slide-toggle
                      ><mat-slide-toggle formControlName="requireEmailVerification"
                        >Require email verification</mat-slide-toggle
                      ><ng-container
                        *ngTemplateOutlet="
                          number;
                          context: { $implicit: 'invitationExpiryDays', label: 'Invitation expiry (days)' }
                        "
                      /><ng-container
                        *ngTemplateOutlet="
                          number;
                          context: { $implicit: 'maximumActiveEnrollments', label: 'Maximum active enrollments' }
                        "
                      />
                    </div>
                  }
                  @case ('notifications') {
                    <div formGroupName="notifications" class="fields toggles">
                      <mat-slide-toggle formControlName="emailEnabled">Email notifications</mat-slide-toggle
                      ><mat-slide-toggle formControlName="smsEnabled">SMS notifications</mat-slide-toggle
                      ><mat-slide-toggle formControlName="pushEnabled">Push notifications</mat-slide-toggle
                      ><ng-container
                        *ngTemplateOutlet="text; context: { $implicit: 'fromName', label: 'From name' }"
                      /><ng-container
                        *ngTemplateOutlet="
                          text;
                          context: { $implicit: 'replyToEmail', label: 'Reply-to email', type: 'email' }
                        "
                      /><ng-container
                        *ngTemplateOutlet="
                          text;
                          context: { $implicit: 'digestTime', label: 'Digest time', type: 'time' }
                        "
                      />
                    </div>
                  }
                  @case ('security') {
                    <div formGroupName="security" class="fields">
                      <mat-slide-toggle formControlName="requireMfaForAdministrators"
                        >Require administrative MFA</mat-slide-toggle
                      ><ng-container
                        *ngTemplateOutlet="
                          number;
                          context: { $implicit: 'sessionTimeoutMinutes', label: 'Session timeout (minutes)' }
                        "
                      /><ng-container
                        *ngTemplateOutlet="
                          number;
                          context: { $implicit: 'maximumLoginAttempts', label: 'Maximum login attempts' }
                        "
                      /><ng-container
                        *ngTemplateOutlet="
                          number;
                          context: {
                            $implicit: 'passwordResetTimeoutMinutes',
                            label: 'Password reset timeout (minutes)',
                          }
                        "
                      /><ng-container
                        *ngTemplateOutlet="
                          number;
                          context: { $implicit: 'auditRetentionDays', label: 'Audit retention (days)' }
                        "
                      />
                      <p class="safe">
                        <mat-icon>lock</mat-icon> Credentials and provider secrets are managed separately and are never
                        displayed here.
                      </p>
                    </div>
                  }
                  @case ('imports') {
                    <div formGroupName="imports" class="fields">
                      <ng-container
                        *ngTemplateOutlet="
                          number;
                          context: { $implicit: 'maximumUploadSizeMb', label: 'Maximum upload size (MB)' }
                        "
                      /><ng-container
                        *ngTemplateOutlet="
                          text;
                          context: {
                            $implicit: 'allowedParserExtensions',
                            label: 'Allowed parser extensions',
                            hint: 'Comma-separated extensions',
                          }
                        "
                      /><ng-container
                        *ngTemplateOutlet="
                          number;
                          context: { $implicit: 'extractionTimeoutSeconds', label: 'Extraction timeout (seconds)' }
                        "
                      />
                    </div>
                  }
                  @case ('reports') {
                    <div formGroupName="reports" class="fields">
                      <ng-container
                        *ngTemplateOutlet="
                          number;
                          context: { $implicit: 'maximumExportRows', label: 'Maximum export rows' }
                        "
                      /><mat-slide-toggle formControlName="includePersonallyIdentifiableInformation"
                        >Include personally identifiable information</mat-slide-toggle
                      ><mat-slide-toggle formControlName="scheduledReportsEnabled"
                        >Scheduled reports enabled</mat-slide-toggle
                      >
                    </div>
                  }
                  @case ('integrations') {
                    <div class="fields">
                      @for (provider of providerEntries(); track provider.name) {
                        <div class="provider">
                          <strong>{{ provider.name }}</strong
                          ><span
                            >{{ provider.configured ? 'Configured' : 'Not configured' }} ·
                            {{ provider.healthy ? 'Healthy' : 'Unavailable' }}</span
                          >
                        </div>
                      }
                      <p class="safe">
                        Provider configuration and health are read-only. Secrets are not returned by this endpoint.
                      </p>
                    </div>
                  }
                  @case ('maintenance') {
                    <div formGroupName="maintenance" class="fields">
                      <mat-slide-toggle formControlName="enabled">Maintenance enabled</mat-slide-toggle
                      ><mat-slide-toggle formControlName="readOnly">Platform read-only mode</mat-slide-toggle
                      ><ng-container
                        *ngTemplateOutlet="text; context: { $implicit: 'banner', label: 'User-facing banner' }"
                      /><ng-container
                        *ngTemplateOutlet="text; context: { $implicit: 'reason', label: 'Maintenance reason' }"
                      /><ng-container
                        *ngTemplateOutlet="text; context: { $implicit: 'startsAtUtc', label: 'Starts at (UTC)' }"
                      /><ng-container
                        *ngTemplateOutlet="text; context: { $implicit: 'endsAtUtc', label: 'Ends at (UTC)' }"
                      />
                      <p class="notice">
                        Administrators retain bypass access. The backend must enforce blocked write operations.
                      </p>
                    </div>
                  }
                  @case ('environment') {
                    <dl class="environment">
                      @for (item of environmentEntries(); track item.key) {
                        <div>
                          <dt>{{ item.key }}</dt>
                          <dd>{{ item.value || 'Not reported' }}</dd>
                        </div>
                      }
                    </dl>
                  }
                }
              </mat-card-content>
              @if (selected() !== 'environment' && selected() !== 'integrations') {
                <mat-card-actions
                  ><button mat-button type="button" (click)="resetCategory()" [disabled]="!canReset() || busy()">
                    Reset this category
                  </button></mat-card-actions
                >
              }
            </mat-card>
            <div class="action-bar" aria-live="polite">
              <span
                ><mat-icon>{{ form.dirty ? 'edit' : 'check_circle' }}</mat-icon
                >{{ form.dirty ? 'Unsaved changes' : 'All changes saved' }}</span
              >
              <div>
                <button mat-button type="button" (click)="discardChanges()" [disabled]="!form.dirty || busy()">
                  Discard</button
                ><button
                  mat-stroked-button
                  type="button"
                  (click)="validateSettings()"
                  [disabled]="form.invalid || !form.dirty || busy() || !canValidate()"
                >
                  Validate</button
                ><button
                  mat-flat-button
                  type="submit"
                  [disabled]="form.invalid || !form.dirty || busy() || !canUpdate()"
                >
                  Save changes
                </button>
              </div>
            </div>
          </form>
        </div>
      }
    }
    <ng-template #text let-name let-label="label" let-hint="hint" let-type="type"
      ><mat-form-field
        ><mat-label>{{ label }}</mat-label
        ><input matInput [formControlName]="name" [type]="type || 'text'" /><mat-hint>{{ hint }}</mat-hint>
        @if (formControl(name).invalid && formControl(name).touched) {
          <mat-error>Enter a valid {{ label.toLowerCase() }}.</mat-error>
        }
      </mat-form-field></ng-template
    >
    <ng-template #number let-name let-label="label"
      ><mat-form-field
        ><mat-label>{{ label }}</mat-label
        ><input matInput type="number" [formControlName]="name" />
        @if (formControl(name).invalid && formControl(name).touched) {
          <mat-error>Enter a value within the allowed range.</mat-error>
        }
      </mat-form-field></ng-template
    >
  `,
  styles: [
    `
      :host {
        display: block;
        max-width: 1440px;
        margin: auto;
      }
      .workspace {
        display: grid;
        grid-template-columns: 280px minmax(0, 1fr);
        gap: 1.25rem;
      }
      .navigation {
        position: sticky;
        top: 1rem;
        height: max-content;
        padding: 1rem;
      }
      .navigation mat-form-field {
        width: 100%;
      }
      .mobile-category {
        display: none;
      }
      .meta {
        font-size: 0.85rem;
        line-height: 1.7;
        color: var(--mat-sys-on-surface-variant);
      }
      .content {
        min-width: 0;
      }
      .content mat-card {
        margin-bottom: 5.5rem;
      }
      .fields {
        display: grid;
        grid-template-columns: repeat(2, minmax(220px, 1fr));
        gap: 1rem;
        padding: 1.5rem 0;
      }
      .toggles mat-slide-toggle,
      .fields > mat-slide-toggle {
        padding: 0.75rem 0;
      }
      .notice,
      .safe {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.8rem;
        border-radius: 0.5rem;
        background: var(--mat-sys-surface-container);
      }
      .environment {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 1rem;
      }
      .environment div {
        padding: 1rem;
        background: var(--mat-sys-surface-container);
        border-radius: 0.5rem;
      }
      .environment dt {
        font-weight: 600;
      }
      .environment dd {
        margin: 0.4rem 0 0;
        overflow-wrap: anywhere;
      }
      .action-bar {
        position: sticky;
        bottom: 0;
        z-index: 5;
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 1rem;
        padding: 1rem;
        background: var(--mat-sys-surface);
        box-shadow: 0 -3px 12px #0002;
        border-radius: 0.75rem;
      }
      .action-bar span {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }
      .action-bar button {
        margin-left: 0.5rem;
      }
      @media (max-width: 800px) {
        .workspace {
          grid-template-columns: 1fr;
        }
        .navigation {
          position: static;
        }
        .desktop-category {
          display: none;
        }
        .mobile-category {
          display: block;
        }
        .fields,
        .environment {
          grid-template-columns: 1fr;
        }
        .action-bar {
          flex-direction: column;
          align-items: stretch;
        }
        .action-bar div {
          display: flex;
        }
        .action-bar button {
          flex: 1;
        }
        .content mat-card {
          margin-bottom: 1rem;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminSystemSettingsPage {
  readonly #fb = inject(FormBuilder).nonNullable;
  readonly #api = inject(AdminSystemSettingsApiService);
  readonly #auth = inject(AuthStore);
  readonly #snack = inject(MatSnackBar);
  readonly #dialog = inject(MatDialog);
  readonly state = signal<ApiState<SystemSettings>>({ status: 'loading' });
  readonly settings = signal<SystemSettings | null>(null);
  readonly selected = signal<Category>('general');
  readonly search = signal('');
  readonly busy = signal(false);
  readonly apiBaseUrl = environment.apiBaseUrl;
  readonly categoryLabels = CATEGORY_LABELS;
  readonly categories = [
    ['general', 'settings', 'Academy name locale timezone'],
    ['academy', 'school', 'registration verification roles'],
    ['challenges', 'emoji_events', 'duration overlap publication'],
    ['learningPacks', 'menu_book', 'approval draft availability capsules'],
    ['enrollment', 'groups', 'capacity approval transfer'],
    ['notifications', 'notifications', 'email SMS reminders'],
    ['security', 'security', 'MFA session login audit'],
    ['imports', 'upload_file', 'upload extension extraction validation'],
    ['reports', 'analytics', 'export date cache'],
    ['integrations', 'hub', 'provider status storage'],
    ['maintenance', 'construction', 'read-only banner availability'],
    ['environment', 'dns', 'version deployment API Firebase'],
  ] as const;
  readonly filteredCategories = computed(() => {
    const q = this.search().trim().toLowerCase();
    return this.categories
      .filter(([key, , terms]) => !q || `${key} ${CATEGORY_LABELS[key]} ${terms}`.toLowerCase().includes(q))
      .map(([key, icon]) => ({ key: key as Category, icon, label: CATEGORY_LABELS[key] }));
  });
  readonly form = this.#fb.group({
    general: this.#fb.group({
      applicationName: ['', Validators.required],
      supportEmail: ['', Validators.email],
      defaultLocale: ['en-US', Validators.required],
      defaultTimezone: ['UTC', Validators.required],
      dateFormat: ['yyyy-MM-dd', Validators.required],
    }),
    academy: this.#fb.group({
      academyName: ['', Validators.required],
      contactEmail: ['', Validators.email],
      academicYearStart: '',
      defaultChallengeDurationDays: [30, [Validators.min(1), Validators.max(365)]],
    }),
    challenges: this.#fb.group({
      defaultDurationDays: [30, [Validators.min(1), Validators.max(365)]],
      allowLateCompletion: false,
      requireDailyCheckIn: true,
      maxActiveChallenges: [10, Validators.min(1)],
    }),
    learningPacks: this.#fb.group({
      requireReviewBeforePublish: true,
      allowSelfEnrollment: false,
      defaultEstimatedMinutes: [30, Validators.min(1)],
    }),
    enrollment: this.#fb.group({
      registrationEnabled: true,
      requireEmailVerification: true,
      invitationExpiryDays: [7, Validators.min(1)],
      maximumActiveEnrollments: [100, Validators.min(1)],
    }),
    notifications: this.#fb.group({
      emailEnabled: true,
      smsEnabled: false,
      pushEnabled: false,
      fromName: '',
      replyToEmail: ['', Validators.email],
      digestTime: '09:00',
    }),
    security: this.#fb.group({
      sessionTimeoutMinutes: [60, [Validators.min(5), Validators.max(1440)]],
      passwordResetTimeoutMinutes: [60, [Validators.min(5), Validators.max(1440)]],
      maximumLoginAttempts: [5, [Validators.min(1), Validators.max(20)]],
      auditRetentionDays: [365, [Validators.min(30), Validators.max(3650)]],
      requireMfaForAdministrators: false,
    }),
    imports: this.#fb.group({
      maximumUploadSizeMb: [100, [Validators.min(1), Validators.max(500)]],
      extractionTimeoutSeconds: [300, [Validators.min(10), Validators.max(900)]],
      allowedParserExtensions: 'csv,json,pdf,docx,txt,xlsx',
    }),
    reports: this.#fb.group({
      maximumExportRows: [100000, [Validators.min(1), Validators.max(1000000)]],
      includePersonallyIdentifiableInformation: false,
      scheduledReportsEnabled: false,
    }),
    maintenance: this.#fb.group({
      enabled: false,
      readOnly: false,
      banner: '',
      reason: '',
      startsAtUtc: '',
      endsAtUtc: '',
    }),
  });
  constructor() {
    this.loadSettings();
  }
  canUpdate() {
    return this.#auth.hasPermission(['system-settings.update']);
  }
  canValidate() {
    return this.#auth.hasPermission(['system-settings.validate']) || this.canUpdate();
  }
  canReset() {
    return this.#auth.hasPermission(['system-settings.reset']);
  }
  errorMessage() {
    const s = this.state();
    return s.status === 'error' ? s.message : '';
  }
  description() {
    return (
      {
        general: 'Core identity and regional defaults.',
        academy: 'Registration and role defaults.',
        challenges: 'Defaults applied to newly created challenges.',
        learningPacks: 'Publishing and content-size policies.',
        enrollment: 'Cohort enrollment defaults.',
        notifications: 'Default delivery channels and reminder timing.',
        security: 'Authentication and audit policy. Sensitive values are never exposed.',
        imports: 'Limits must also be enforced by the API and hosting proxy.',
        reports: 'Report ranges, exports, and caching.',
        integrations: 'Read-only provider availability. Manage credentials outside this workspace.',
        maintenance: 'Safeguards for planned maintenance and write restrictions.',
        environment: 'Read-only deployment and service metadata.',
      } as Record<Category, string>
    )[this.selected()];
  }
  loadSettings() {
    this.state.set({ status: 'loading' });
    this.#api.getSettings().subscribe({
      next: (s) => {
        this.apply(s);
        this.state.set({ status: 'loaded', data: s });
      },
      error: (e) =>
        this.state.set({
          status: 'error',
          message: e instanceof Error ? e.message : 'Unable to load system settings.',
        }),
    });
  }
  refresh() {
    this.loadSettings();
  }
  apply(s: SystemSettings) {
    this.settings.set(s);
    const editable = { ...s };
    this.form.patchValue({
      ...editable,
      imports: { ...s.imports, allowedParserExtensions: s.imports.allowedParserExtensions.join(',') },
      maintenance: {
        ...s.maintenance,
        startsAtUtc: s.maintenance.startsAtUtc ?? '',
        endsAtUtc: s.maintenance.endsAtUtc ?? '',
      },
    });
    this.form.markAsPristine();
    if (!this.canUpdate()) this.form.disable({ emitEvent: false });
    else this.form.enable({ emitEvent: false });
  }
  payload(): UpdateSystemSettingsRequest {
    const raw = this.form.getRawValue();
    return {
      version: this.settings()!.version,
      settings: {
        ...raw,
        imports: {
          ...raw.imports,
          allowedParserExtensions: raw.imports.allowedParserExtensions
            .split(',')
            .map((x) => x.trim().replace(/^\./, ''))
            .filter(Boolean),
        },
      },
    };
  }
  validateSettings() {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    this.busy.set(true);
    this.#api
      .validateSettings(this.payload())
      .pipe(finalize(() => this.busy.set(false)))
      .subscribe({
        next: (r) =>
          this.#snack.open(
            r.valid ? 'Settings are valid.' : r.errors?.map((e) => e.message).join(' ') || 'Validation failed.',
            'Dismiss',
            { duration: 5000 },
          ),
        error: () => this.#snack.open('Server validation could not be completed.', 'Dismiss'),
      });
  }
  saveSettings() {
    this.form.markAllAsTouched();
    if (this.form.invalid || !this.form.dirty || !this.canUpdate()) return;
    if (
      (this.form.controls.maintenance.controls.enabled.value ||
        this.form.controls.maintenance.controls.readOnly.value) &&
      !this.form.controls.maintenance.controls.reason.value.trim()
    ) {
      this.form.controls.maintenance.controls.reason.setErrors({ required: true });
      this.selected.set('maintenance');
      return;
    }
    if (
      this.form.controls.notifications.controls.smsEnabled.value &&
      !this.settings()?.integrations.providers['sms']?.healthy
    ) {
      this.#snack.open('SMS cannot be enabled until its provider is healthy.', 'Dismiss');
      return;
    }
    const proceed = () => {
      this.busy.set(true);
      this.#api
        .updateSettings(this.payload())
        .pipe(finalize(() => this.busy.set(false)))
        .subscribe({
          next: (s) => {
            this.apply(s);
            this.state.set({ status: 'loaded', data: s });
            this.#snack.open('System settings saved.', 'Dismiss', { duration: 4000 });
          },
          error: (e: HttpErrorResponse) =>
            this.#snack
              .open(
                e.status === 409
                  ? 'Settings changed by another administrator. Reload current settings before saving.'
                  : 'Settings could not be saved.',
                'Reload',
                { duration: 8000 },
              )
              .onAction()
              .subscribe(() => this.refresh()),
        });
    };
    if (this.form.controls.maintenance.controls.enabled.value || this.form.controls.maintenance.controls.readOnly.value)
      this.#dialog
        .open(ConfirmationDialogComponent, {
          data: {
            title: 'Confirm platform restriction',
            message: 'This can block user activity. Administrators retain bypass access. Continue?',
            confirmLabel: 'Enable and save',
            destructive: true,
          },
        })
        .afterClosed()
        .subscribe((ok) => {
          if (ok) proceed();
        });
    else proceed();
  }
  discardChanges() {
    const s = this.settings();
    if (s) this.apply(s);
  }
  resetCategory() {
    this.#dialog
      .open(ConfirmationDialogComponent, {
        data: {
          title: `Reset ${CATEGORY_LABELS[this.selected()]}`,
          message: 'Replace this category with server defaults? This action is audited.',
          confirmLabel: 'Reset category',
          destructive: true,
        },
      })
      .afterClosed()
      .subscribe((ok) => {
        if (!ok) return;
        this.busy.set(true);
        this.#api
          .resetCategory(this.selected(), this.settings()!.version)
          .pipe(finalize(() => this.busy.set(false)))
          .subscribe({
            next: (s) => {
              this.apply(s);
              this.#snack.open('Category reset to defaults.', 'Dismiss');
            },
            error: () => this.#snack.open('Category could not be reset.', 'Dismiss'),
          });
      });
  }
  providerEntries() {
    return Object.entries(this.settings()?.integrations.providers ?? {}).map(([name, status]) => ({ name, ...status }));
  }
  environmentEntries() {
    const e = this.settings()?.environment ?? {};
    return Object.entries({ ...e, apiBaseUrl: e.apiBaseUrl ?? this.apiBaseUrl }).map(([key, value]) => ({
      key: key.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase()),
      value,
    }));
  }
  formControl(name: string) {
    return (
      (
        this.form.controls[
          this.selected() as Exclude<Category, 'environment' | 'integrations'>
        ] as import('@angular/forms').FormGroup
      ).get(name) ?? this.form.controls.general.controls.applicationName
    );
  }
  hasUnsavedChanges() {
    return this.form.dirty;
  }
  @HostListener('window:beforeunload', ['$event']) beforeUnload(event: BeforeUnloadEvent) {
    if (this.form.dirty) {
      event.preventDefault();
      event.returnValue = '';
    }
  }
}
