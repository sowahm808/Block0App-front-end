import { HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ApiProblemDetails, WhisperError } from '../models/whisper.models';
@Injectable({ providedIn: 'root' })
export class WhisperErrorMapperService {
  map(error: unknown): WhisperError {
    const response = error instanceof HttpErrorResponse ? error : undefined;
    const problem =
      response?.error && typeof response.error === 'object' ? (response.error as ApiProblemDetails) : undefined;
    const status = response?.status ?? problem?.status ?? 0;
    const code = problem?.code ?? '';
    const kind: WhisperError['kind'] =
      status === 401
        ? 'authentication'
        : status === 403 && code === 'entitlement_required'
          ? 'entitlement'
          : status === 400 || status === 413
            ? 'validation'
            : status === 409
              ? 'conflict'
              : status === 429
                ? 'rate_limit'
                : status === 502
                  ? 'provider'
                  : [404, 410, 503].includes(status)
                    ? 'unavailable'
                    : 'unknown';
    const messages: Record<WhisperError['kind'], string> = {
      authentication: 'Please sign in again.',
      entitlement: 'Your account does not include this feature.',
      validation: 'Please correct the highlighted information.',
      conflict: 'This whisper changed. Refresh and try again.',
      rate_limit: 'Too many requests. Please wait and try again.',
      provider: 'A delivery provider is temporarily unavailable.',
      unavailable: status === 410 ? 'This recipient link is no longer available.' : 'This whisper is unavailable.',
      unknown: 'Something went wrong. Please try again.',
    };
    return {
      kind,
      status,
      message: messages[kind],
      traceId: problem?.traceId ?? problem?.correlationId,
      fieldErrors: problem?.errors,
    };
  }
}
