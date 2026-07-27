import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { describe, expect, it } from 'vitest';
import { ApiService } from '../../../core/api/api.service';
import { AuthStore } from '../../../core/auth/auth.store';
import { LearningPacksService } from './learning-packs.service';

describe('LearningPacksService', () => {
  it.each([
    [[{ title: 'Direct' }]],
    [{ items: [{ title: 'Items' }] }],
    [{ learningPacks: [{ title: 'Named' }] }],
    [{ data: { items: [{ title: 'Nested' }] } }],
    [{ results: [{ title: 'Results' }] }],
    [{ data: { value: [{ title: 'Nested value' }] } }],
  ])('normalizes supported learning-pack list responses', (response) => {
    TestBed.configureTestingModule({ providers: [{ provide: ApiService, useValue: { get: () => of(response) } }] });
    let titles: string[] = [];
    TestBed.inject(LearningPacksService)
      .list()
      .subscribe((packs) => (titles = packs.map((pack) => pack.title)));
    expect(titles).toHaveLength(1);
  });

  it('uses the administrative collection endpoint for administrators', () => {
    const paths: string[] = [];
    TestBed.configureTestingModule({
      providers: [
        {
          provide: ApiService,
          useValue: {
            get: (path: string) => {
              paths.push(path);
              return of([]);
            },
          },
        },
      ],
    });
    TestBed.inject(AuthStore).setUser({
      userId: 'admin-1',
      email: 'admin@example.test',
      displayName: 'Admin',
      permissions: [],
      emailVerified: true,
      mfaEnabled: true,
      roles: ['Administrator'],
    });

    TestBed.inject(LearningPacksService).list().subscribe();

    expect(paths).toEqual(['/admin/learning-packs']);
  });

  it('uses the user collection endpoint for non-administrator roles', () => {
    const paths: string[] = [];
    TestBed.configureTestingModule({
      providers: [
        {
          provide: ApiService,
          useValue: {
            get: (path: string) => {
              paths.push(path);
              return of([]);
            },
          },
        },
      ],
    });
    TestBed.inject(AuthStore).setUser({
      userId: 'mentor-1',
      email: 'mentor@example.test',
      displayName: 'Mentor',
      permissions: [],
      emailVerified: true,
      mfaEnabled: true,
      roles: ['Mentor'],
    });

    TestBed.inject(LearningPacksService).list().subscribe();

    expect(paths).toEqual(['/learning-packs']);
  });
});
