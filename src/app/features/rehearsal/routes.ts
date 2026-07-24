import { Routes } from '@angular/router';
import { roleGuard } from '../../core/guards/role.guard';

export default [
  { path: '', canActivate: [roleGuard], data: { roles: ['Scholar'], pageCategory: 'scholar', title: 'Rehearsal', apiPath: '/rehearsals/available' }, loadComponent: () => import('./rehearsal-overview.page').then((m) => m.RehearsalOverviewPage) },
  { path: ':attemptId/summary', canActivate: [roleGuard], data: { roles: ['Scholar'], pageCategory: 'scholar', title: 'Rehearsal summary', apiPath: '/rehearsal-attempts/:attemptId/summary' }, loadComponent: () => import('./rehearsal-summary.page').then((m) => m.RehearsalSummaryPage) },
  { path: ':attemptId', canActivate: [roleGuard], data: { roles: ['Scholar'], pageCategory: 'scholar', title: 'Rehearsal session', apiPath: '/rehearsal-attempts/:attemptId' }, loadComponent: () => import('./rehearsal-session.page').then((m) => m.RehearsalSessionPage) },
] satisfies Routes;
