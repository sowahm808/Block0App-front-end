import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
export const e164Validator: ValidatorFn = (control: AbstractControl): ValidationErrors | null =>
  !control.value || /^\+[1-9]\d{7,14}$/.test(String(control.value)) ? null : { e164: true };
export const externalContactValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null =>
  control.get('recipientType')?.value !== 'external' || control.get('email')?.value || control.get('phone')?.value
    ? null
    : { externalContactRequired: true };
