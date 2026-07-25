import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { ContentImportService } from '../data-access/content-import.service';
import { ReviewLearningPackImportPage } from './review-learning-pack-import.page';

const draft = { learningPack: { externalId: 'pack-1', title: 'Pack one' }, capsules: [] };

function importRecord(overrides: Record<string, unknown> = {}) {
  return {
    importId: 'import-1',
    sourceFileName: 'pack.docx',
    status: 'validated',
    draft,
    validationErrors: [],
    ...overrides,
  };
}

async function setup(record = importRecord()) {
  const service = {
    detail: vi.fn(() => of(record)),
    save: vi.fn(() => of(record)),
    validate: vi.fn(() => of(record)),
    commit: vi.fn(() => of({ created: 1, updated: 0, skipped: 0, failed: 0 })),
  };
  await TestBed.configureTestingModule({
    imports: [ReviewLearningPackImportPage],
    providers: [
      provideNoopAnimations(),
      provideRouter([]),
      { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => 'import-1' } } } },
      { provide: ContentImportService, useValue: service },
    ],
  }).compileComponents();
  const fixture = TestBed.createComponent(ReviewLearningPackImportPage);
  fixture.detectChanges();
  return { fixture, component: fixture.componentInstance, service };
}

describe('ReviewLearningPackImportPage', () => {
  it('enables commit for a validated API record when the optional valid flag is omitted', async () => {
    const { fixture, component } = await setup();

    expect(component.canCommit()).toBe(true);
    const commitButton = [...fixture.nativeElement.querySelectorAll('button')].find((button: HTMLButtonElement) =>
      button.textContent?.includes('Commit draft content'),
    ) as HTMLButtonElement;
    expect(commitButton.disabled).toBe(false);
  });

  it('keeps commit blocked for explicit validation failure or validation errors', async () => {
    const { component } = await setup(importRecord({ valid: false }));
    expect(component.canCommit()).toBe(false);

    component.record.set(importRecord({ validationErrors: ['Missing question'] }));
    expect(component.canCommit()).toBe(false);
  });

  it('completes the commit flow and prevents a duplicate commit', async () => {
    const { fixture, component, service } = await setup();

    component.commit();
    fixture.detectChanges();

    expect(service.commit).toHaveBeenCalledWith('import-1');
    expect(component.summary()).toEqual({ created: 1, updated: 0, skipped: 0, failed: 0 });
    expect(component.record()?.status).toBe('completed');
    expect(component.canCommit()).toBe(false);
    expect(fixture.nativeElement.textContent).toContain('Commit complete');
  });
});
