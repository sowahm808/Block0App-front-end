import { Routes } from '@angular/router';
import { roleGuard } from '../../core/guards/role.guard';

export default [
  {
    path: '',
    pathMatch: 'full',
    canActivate: [roleGuard],
    data: {
      roles: ['Scholar'],
      pageCategory: 'scholar',
      title: 'Scenario attempt',
      apiPath: '/scenario-attempts/:attemptId',
    },
    loadComponent: () => import('./scenario-attempt.page').then((m) => m.ScenarioAttemptPage),
  },
  {
    path: 'review',
    canActivate: [roleGuard],
    data: {
      roles: ['Scholar'],
      pageCategory: 'scholar',
      title: 'Scenario review',
      apiPath: '/scenario-attempts/:attemptId/review',
    },
    loadComponent: () => import('./scenario-review.page').then((m) => m.ScenarioReviewPage),
  },
] satisfies Routes;
