import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { AbstractControl, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
@Component({
  selector: 'b0-form-field-error',
  standalone: true,
  imports: [ReactiveFormsModule, MatFormFieldModule],
  template: `@if (message()) {
    <mat-error>{{ message() }}</mat-error>
  }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormFieldErrorComponent {
  control = input.required<AbstractControl>();
  label = input('This field');
  message() {
    const c = this.control();
    if (!(c.touched || c.dirty) || !c.errors) return '';
    if (c.hasError('required')) return `${this.label()} is required.`;
    if (c.hasError('email')) return 'Enter a valid email address.';
    if (c.hasError('minlength')) return `${this.label()} is too short.`;
    if (c.hasError('min')) return `${this.label()} is below the allowed minimum.`;
    if (c.hasError('max')) return `${this.label()} is above the allowed maximum.`;
    if (c.hasError('maxlength')) return `${this.label()} is too long.`;
    return `${this.label()} is invalid.`;
  }
}
