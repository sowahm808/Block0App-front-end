import { HttpErrorResponse } from '@angular/common/http';
import { describe, expect, it } from 'vitest';
import { WhisperErrorMapperService } from './whisper-error-mapper.service';
describe('WhisperErrorMapperService', () => {
  it('maps RFC 7807 entitlement responses safely', () => {
    const result = new WhisperErrorMapperService().map(
      new HttpErrorResponse({
        status: 403,
        error: { status: 403, code: 'entitlement_required', detail: 'internal detail', traceId: 'trace-1' },
      }),
    );
    expect(result.kind).toBe('entitlement');
    expect(result.message).not.toContain('internal');
    expect(result.traceId).toBe('trace-1');
  });
  it('maps state conflicts', () =>
    expect(new WhisperErrorMapperService().map(new HttpErrorResponse({ status: 409 })).kind).toBe('conflict'));
});
