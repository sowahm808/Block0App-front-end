import { HttpErrorResponse } from '@angular/common/http';
import { describe, expect, it } from 'vitest';
import { buildRegistrationErrorMessage } from '../auth.pages';

describe('buildRegistrationErrorMessage', () => {
  it('surfaces the backend trace id for registration server errors', () => {
    const message = buildRegistrationErrorMessage(
      new HttpErrorResponse({
        status: 500,
        error: {
          title: 'An error occurred while processing your request.',
          traceId: '0HNN77FVV3NLL:00000002',
        },
      }),
    );

    expect(message).toContain('registration service had a problem');
    expect(message).toContain('Reference: 0HNN77FVV3NLL:00000002.');
  });

  it('uses validation messages returned by the backend', () => {
    const message = buildRegistrationErrorMessage(
      new HttpErrorResponse({
        status: 400,
        error: {
          errors: {
            Email: ['Email is already registered.'],
          },
        },
      }),
    );

    expect(message).toBe('Email is already registered.');
  });
});
