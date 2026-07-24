import { Routes } from '@angular/router';
import { roleGuard } from '../../core/guards/role.guard';

export default [
  {
    path: '',
    pathMatch: 'full',
    canActivate: [roleGuard],
    data: { roles: ['Scholar'], pageCategory: 'scholar', title: 'Clinical scenarios', apiPath: '/scenarios' },
    loadComponent: () => import('./scenario-list.page').then((m) => m.ScenarioListPage),
  },
  {
    path: ':scenarioId',
    canActivate: [roleGuard],
    data: { roles: ['Scholar'], pageCategory: 'scholar', title: 'Scenario detail', apiPath: '/scenarios/:scenarioId' },
    loadComponent: () => import('./scenario-detail.page').then((m) => m.ScenarioDetailPage),
  },
] satisfies Routes;
