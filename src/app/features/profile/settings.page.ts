import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTabsModule } from '@angular/material/tabs';
import { RouterLink } from '@angular/router';
import { PageHeaderComponent } from '../../shared/ui/page-header/page-header.component';

type ThemePreference = 'light' | 'dark' | 'system';
type TextSizePreference = 'standard' | 'large' | 'extra-large';
type StudyTimePreference = 'early-morning' | 'morning' | 'afternoon' | 'evening' | 'late-night';
type ReminderTiming = 'none' | '15-minutes' | '30-minutes' | '1-hour' | 'evening-before';

interface ScholarSettingsForm {
  theme: ThemePreference;
  reducedMotion: boolean;
  textSize: TextSizePreference;
  highContrast: boolean;
  largerText: boolean;
  reduceAnimation: boolean;
  screenReaderOptimization: boolean;
  keyboardNavigationHelp: boolean;
  preferredStudyTime: StudyTimePreference;
  defaultDailyGoal: number;
  reminderTiming: ReminderTiming;
  showTimer: boolean;
  confirmBeforeAnswerSubmission: boolean;
}

@Component({
  selector: 'b0-settings',
  standalone: true,
  imports: [
    FormsModule,
    RouterLink,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatRadioModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatTabsModule,
    PageHeaderComponent,
  ],
  template: `
    <section class="settings-page" aria-labelledby="settings-title">
      <b0-page-header
        title="Scholar settings"
        description="Personalize appearance, accessibility, study defaults, privacy, and account support for your Block Zero study flow."
      />

      <mat-tab-group animationDuration="160ms" mat-stretch-tabs="false" fitInkBarToContent aria-label="Scholar settings sections">
        <mat-tab label="Appearance">
          <mat-card class="settings-card">
            <mat-card-header>
              <mat-icon mat-card-avatar aria-hidden="true">palette</mat-icon>
              <mat-card-title>Appearance</mat-card-title>
              <mat-card-subtitle>Choose how the app looks and how much motion it uses.</mat-card-subtitle>
            </mat-card-header>
            <mat-card-content class="settings-stack">
              <fieldset class="settings-fieldset">
                <legend>Theme</legend>
                <mat-radio-group [(ngModel)]="settings.theme" aria-label="Theme preference">
                  <mat-radio-button value="light">Light theme</mat-radio-button>
                  <mat-radio-button value="dark">Dark theme</mat-radio-button>
                  <mat-radio-button value="system">System theme</mat-radio-button>
                </mat-radio-group>
              </fieldset>

              <mat-slide-toggle [(ngModel)]="settings.reducedMotion">Reduced motion</mat-slide-toggle>

              <mat-form-field appearance="outline">
                <mat-label>Text-size preference</mat-label>
                <mat-select [(ngModel)]="settings.textSize">
                  <mat-option value="standard">Standard</mat-option>
                  <mat-option value="large">Large</mat-option>
                  <mat-option value="extra-large">Extra large</mat-option>
                </mat-select>
              </mat-form-field>
            </mat-card-content>
          </mat-card>
        </mat-tab>

        <mat-tab label="Accessibility">
          <mat-card class="settings-card">
            <mat-card-header>
              <mat-icon mat-card-avatar aria-hidden="true">accessibility_new</mat-icon>
              <mat-card-title>Accessibility</mat-card-title>
              <mat-card-subtitle>Support visual, motion, assistive technology, and keyboard needs.</mat-card-subtitle>
            </mat-card-header>
            <mat-card-content class="settings-grid">
              <mat-slide-toggle [(ngModel)]="settings.highContrast">High contrast</mat-slide-toggle>
              <mat-slide-toggle [(ngModel)]="settings.largerText">Larger text</mat-slide-toggle>
              <mat-slide-toggle [(ngModel)]="settings.reduceAnimation">Reduce animation</mat-slide-toggle>
              <mat-slide-toggle [(ngModel)]="settings.screenReaderOptimization">Screen-reader optimization</mat-slide-toggle>
              <mat-slide-toggle [(ngModel)]="settings.keyboardNavigationHelp">Keyboard-navigation help</mat-slide-toggle>
            </mat-card-content>
          </mat-card>
        </mat-tab>

        <mat-tab label="Study preferences">
          <mat-card class="settings-card">
            <mat-card-header>
              <mat-icon mat-card-avatar aria-hidden="true">school</mat-icon>
              <mat-card-title>Study preferences</mat-card-title>
              <mat-card-subtitle>Set defaults that shape daily challenges and practice sessions.</mat-card-subtitle>
            </mat-card-header>
            <mat-card-content class="settings-grid two-column">
              <mat-form-field appearance="outline">
                <mat-label>Preferred study time</mat-label>
                <mat-select [(ngModel)]="settings.preferredStudyTime">
                  <mat-option value="early-morning">Early morning</mat-option>
                  <mat-option value="morning">Morning</mat-option>
                  <mat-option value="afternoon">Afternoon</mat-option>
                  <mat-option value="evening">Evening</mat-option>
                  <mat-option value="late-night">Late night</mat-option>
                </mat-select>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Default daily goal</mat-label>
                <input matInput type="number" min="1" max="200" [(ngModel)]="settings.defaultDailyGoal" />
                <span matTextSuffix>questions</span>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Reminder timing</mat-label>
                <mat-select [(ngModel)]="settings.reminderTiming">
                  <mat-option value="none">No reminder</mat-option>
                  <mat-option value="15-minutes">15 minutes before</mat-option>
                  <mat-option value="30-minutes">30 minutes before</mat-option>
                  <mat-option value="1-hour">1 hour before</mat-option>
                  <mat-option value="evening-before">Evening before</mat-option>
                </mat-select>
              </mat-form-field>

              <div class="toggle-stack">
                <mat-slide-toggle [(ngModel)]="settings.showTimer">Show timer</mat-slide-toggle>
                <mat-slide-toggle [(ngModel)]="settings.confirmBeforeAnswerSubmission">
                  Confirmation before answer submission
                </mat-slide-toggle>
              </div>
            </mat-card-content>
          </mat-card>
        </mat-tab>

        <mat-tab label="Privacy">
          <mat-card class="settings-card">
            <mat-card-header>
              <mat-icon mat-card-avatar aria-hidden="true">shield</mat-icon>
              <mat-card-title>Privacy</mat-card-title>
              <mat-card-subtitle>Review privacy resources and request account data when backend support is enabled.</mat-card-subtitle>
            </mat-card-header>
            <mat-card-content class="action-list">
              <a mat-stroked-button routerLink="/privacy"><mat-icon aria-hidden="true">policy</mat-icon> Privacy policy</a>
              <button mat-stroked-button type="button" (click)="showDataSummary.set(true)">
                <mat-icon aria-hidden="true">summarize</mat-icon> Data-use summary
              </button>
              <button mat-stroked-button type="button" disabled aria-describedby="download-data-status">
                <mat-icon aria-hidden="true">download</mat-icon> Download-data request
              </button>
              <p id="download-data-status" class="supporting-copy">
                Disabled until the backend exposes an authenticated data export request endpoint.
              </p>
              @if (showDataSummary()) {
                <div class="summary-panel" role="status">
                  Block Zero uses profile, study activity, readiness, reward, and support data to personalize the learning
                  experience, operate cohorts, issue certificates, and improve support workflows.
                </div>
              }
            </mat-card-content>
          </mat-card>
        </mat-tab>

        <mat-tab label="Account support">
          <mat-card class="settings-card">
            <mat-card-header>
              <mat-icon mat-card-avatar aria-hidden="true">support_agent</mat-icon>
              <mat-card-title>Account-support request</mat-card-title>
              <mat-card-subtitle>Tell the support team what you need help with.</mat-card-subtitle>
            </mat-card-header>
            <mat-card-content class="settings-stack">
              <mat-form-field appearance="outline">
                <mat-label>Support topic</mat-label>
                <mat-select [(ngModel)]="supportTopic">
                  <mat-option value="account-access">Account access</mat-option>
                  <mat-option value="cohort-or-progress">Cohort or progress</mat-option>
                  <mat-option value="privacy-or-data">Privacy or data</mat-option>
                  <mat-option value="technical-issue">Technical issue</mat-option>
                </mat-select>
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>How can we help?</mat-label>
                <textarea matInput rows="5" [(ngModel)]="supportMessage" placeholder="Share relevant details."></textarea>
              </mat-form-field>
              <button mat-flat-button color="primary" type="button" disabled>Submit support request</button>
              <p class="supporting-copy">Submission is disabled until the backend account-support endpoint is available.</p>
            </mat-card-content>
          </mat-card>
        </mat-tab>
      </mat-tab-group>
    </section>
  `,
  styles: [`
    .settings-page { display: grid; gap: 1.5rem; }
    .settings-card { margin-top: 1rem; }
    .settings-stack, .action-list { display: grid; gap: 1rem; padding-top: 1rem; }
    .settings-grid { display: grid; gap: 1rem; padding-top: 1rem; }
    .two-column { grid-template-columns: repeat(auto-fit, minmax(16rem, 1fr)); align-items: start; }
    .settings-fieldset { border: 1px solid var(--b0-border); border-radius: var(--b0-radius-md); padding: 1rem; }
    .settings-fieldset legend { padding: 0 0.5rem; font-weight: 700; }
    mat-radio-group, .toggle-stack { display: grid; gap: 0.75rem; }
    .action-list { justify-items: start; }
    .supporting-copy { margin: 0; color: var(--b0-text-muted); max-width: 48rem; }
    .summary-panel { border: 1px solid var(--b0-border); border-radius: var(--b0-radius-md); background: color-mix(in srgb, var(--b0-primary) 10%, transparent); padding: 1rem; max-width: 48rem; }
    mat-form-field { width: 100%; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsPage {
  readonly showDataSummary = signal(false);
  supportTopic = 'account-access';
  supportMessage = '';

  settings: ScholarSettingsForm = {
    theme: 'system',
    reducedMotion: false,
    textSize: 'standard',
    highContrast: false,
    largerText: false,
    reduceAnimation: false,
    screenReaderOptimization: false,
    keyboardNavigationHelp: true,
    preferredStudyTime: 'evening',
    defaultDailyGoal: 25,
    reminderTiming: '30-minutes',
    showTimer: true,
    confirmBeforeAnswerSubmission: true,
  };
}
