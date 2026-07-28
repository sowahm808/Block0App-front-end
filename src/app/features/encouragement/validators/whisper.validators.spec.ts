import { FormControl, FormGroup } from '@angular/forms';
import { describe, expect, it } from 'vitest';
import { e164Validator, externalContactValidator } from './whisper.validators';
describe('whisper validators', () => {
  it('requires explicit E.164 country code', () => {
    expect(e164Validator(new FormControl('5551234567'))).toEqual({ e164: true });
    expect(e164Validator(new FormControl('+15551234567'))).toBeNull();
  });
  it('requires external contact', () => {
    const group = new FormGroup({
      recipientType: new FormControl('external'),
      email: new FormControl(''),
      phone: new FormControl(''),
    });
    expect(externalContactValidator(group)).toEqual({ externalContactRequired: true });
  });
});
