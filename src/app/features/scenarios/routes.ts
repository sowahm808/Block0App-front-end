import { Routes } from '@angular/router';
import { roleGuard } from '../../core/guards/role.guard';
export default [
{ path: '', canActivate: [roleGuard], data: { roles: ['Scholar'], pageCategory: 'scholar', title: 'Clinical scenarios', apiPath: '/scenarios/available' }, loadComponent: () => import('./scenario-list.page').then(m => m.ScenarioListPage) },
{ path: ':scenarioId', canActivate: [roleGuard], data: { roles: ['Scholar'], pageCategory: 'scholar', title: 'Scenario detail', apiPath: '/scenarios/:scenarioId' }, loadComponent: () => import('./scenario-detail.page').then(m => m.ScenarioDetailPage) },
{ path: '', canActivate: [roleGuard], data: { roles: ['Scholar'], pageCategory: 'scholar', title: 'Scenario attempt', apiPath: '/scenario-attempts/:attemptId/current' }, loadComponent: () => import('./scenario-attempt.page').then(m => m.ScenarioAttemptPage) },
{ path: 'review', canActivate: [roleGuard], data: { roles: ['Scholar'], pageCategory: 'scholar', title: 'Scenario review', apiPath: '/scenario-attempts/:attemptId/review' }, loadComponent: () => import('./scenario-review.page').then(m => m.ScenarioReviewPage) },
] satisfies Routes;
