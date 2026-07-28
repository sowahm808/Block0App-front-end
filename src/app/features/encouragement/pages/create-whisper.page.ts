import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { finalize } from 'rxjs';
import { PageHeaderComponent } from '../../../shared/ui/page-header/page-header.component';
import { WhisperInput } from '../models/whisper.models';
import { WhisperApiService } from '../services/whisper-api.service';
import { WhisperDraftStore } from '../stores/whisper-draft.store';
import { e164Validator, externalContactValidator } from '../validators/whisper.validators';
@Component({
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    PageHeaderComponent,
  ],
  template: `<b0-page-header
      title="Create a whisper"
      description="Write the intent; the backend will generate a private draft for review."
    />
    <form class="b0-card grid gap-4 md:grid-cols-2" [formGroup]="form" (ngSubmit)="generate()">
      <mat-form-field
        ><mat-label>Recipient type</mat-label
        ><mat-select formControlName="recipientType"
          ><mat-option value="internal">MUA recipient</mat-option
          ><mat-option value="external">External recipient</mat-option></mat-select
        ></mat-form-field
      >
      @if (form.controls.recipientType.value === 'internal') {
        <mat-form-field
          ><mat-label>MUA user ID</mat-label><input matInput formControlName="recipientMuaUserId" autocomplete="off"
        /></mat-form-field>
      }
      <mat-form-field
        ><mat-label>Recipient name</mat-label><input matInput formControlName="recipientName" /></mat-form-field
      ><mat-form-field
        ><mat-label>Preferred address name</mat-label
        ><input matInput formControlName="preferredAddressName" /></mat-form-field
      ><mat-form-field
        ><mat-label>Gender</mat-label
        ><mat-select formControlName="recipientGender"
          ><mat-option value="female">Female</mat-option><mat-option value="male">Male</mat-option></mat-select
        ></mat-form-field
      >
      @if (form.controls.recipientType.value === 'external') {
        <mat-form-field
          ><mat-label>Email</mat-label
          ><input matInput type="email" formControlName="email" autocomplete="email" /></mat-form-field
        ><mat-form-field
          ><mat-label>Phone (E.164)</mat-label
          ><input matInput formControlName="phone" placeholder="+15551234567" autocomplete="tel" /><mat-error
            >Use +, country code, and number.</mat-error
          ></mat-form-field
        >
      }
      <mat-form-field
        ><mat-label>Whisper type</mat-label><input matInput formControlName="whisperType" /></mat-form-field
      ><mat-form-field><mat-label>Wrap style</mat-label><input matInput formControlName="wrapStyle" /></mat-form-field
      ><mat-form-field
        ><mat-label>Delivery format</mat-label
        ><mat-select formControlName="deliveryFormat"
          ><mat-option value="text">Text</mat-option><mat-option value="audio">Audio</mat-option
          ><mat-option value="text_audio">Text and audio</mat-option></mat-select
        ></mat-form-field
      ><mat-form-field class="md:col-span-2"
        ><mat-label>What do you want to encourage?</mat-label
        ><textarea matInput rows="5" formControlName="senderIntent"></textarea
        ><mat-hint>20–2000 characters</mat-hint></mat-form-field
      >
      @if (error()) {
        <p role="alert" class="md:col-span-2">{{ error() }}</p>
      }
      <button mat-flat-button class="md:col-span-2" [disabled]="form.invalid || submitting()">
        {{ submitting() ? 'Generating…' : 'Generate whisper' }}
      </button>
    </form>`,
})
export class CreateWhisperPage {
  readonly #api = inject(WhisperApiService);
  readonly #router = inject(Router);
  readonly #draft = inject(WhisperDraftStore);
  readonly submitting = signal(false);
  readonly error = signal('');
  readonly form = new FormGroup(
    {
      recipientType: new FormControl<'internal' | 'external'>('internal', { nonNullable: true }),
      recipientMuaUserId: new FormControl(''),
      recipientName: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
      preferredAddressName: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
      recipientGender: new FormControl<'male' | 'female'>('female', { nonNullable: true }),
      email: new FormControl('', Validators.email),
      phone: new FormControl('', e164Validator),
      whisperType: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
      wrapStyle: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
      deliveryFormat: new FormControl<'text' | 'audio' | 'text_audio'>('text', { nonNullable: true }),
      senderIntent: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, Validators.minLength(20), Validators.maxLength(2000)],
      }),
    },
    { validators: [externalContactValidator] },
  );
  generate() {
    if (this.form.invalid || this.submitting()) return;
    const v = this.form.getRawValue();
    const input: WhisperInput = {
      recipientType: v.recipientType,
      recipientMuaUserId: v.recipientMuaUserId || undefined,
      externalRecipient:
        v.recipientType === 'external'
          ? {
              name: v.recipientName,
              preferredAddressName: v.preferredAddressName,
              gender: v.recipientGender,
              email: v.email || undefined,
              phone: v.phone || undefined,
            }
          : undefined,
      recipientName: v.recipientName,
      preferredAddressName: v.preferredAddressName,
      recipientGender: v.recipientGender,
      whisperType: v.whisperType,
      wrapStyle: v.wrapStyle,
      deliveryFormat: v.deliveryFormat,
      senderIntent: v.senderIntent,
      sourceApplication: 'mua',
    };
    this.submitting.set(true);
    this.#draft.update(input);
    this.#api
      .generate(input)
      .pipe(finalize(() => this.submitting.set(false)))
      .subscribe({
        next: (w) => {
          this.#draft.update(input, w.id);
          void this.#router.navigate(['/encouragement/review', w.id]);
        },
        error: () => this.error.set('We could not generate this whisper. Check the information and try again.'),
      });
  }
}
