import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { describe, expect, it } from 'vitest';
import { ApiService } from '../../../core/api/api.service';
import { LearningPacksService } from './learning-packs.service';

describe('LearningPacksService', () => {
  it.each([
    [[{ title: 'Direct' }]],
    [{ items: [{ title: 'Items' }] }],
    [{ learningPacks: [{ title: 'Named' }] }],
    [{ data: { items: [{ title: 'Nested' }] } }],
  ])('normalizes supported learning-pack list responses', (response) => {
    TestBed.configureTestingModule({ providers: [{ provide: ApiService, useValue: { get: () => of(response) } }] });
    let titles: string[] = [];
    TestBed.inject(LearningPacksService)
      .list()
      .subscribe((packs) => (titles = packs.map((pack) => pack.title)));
    expect(titles).toHaveLength(1);
  });
});
