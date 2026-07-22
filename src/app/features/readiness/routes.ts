import { Routes } from '@angular/router';
import { roleGuard } from '../../core/guards/role.guard';
export default [{ path: '', canActivate: [roleGuard], data: { roles: ['Scholar'], pageCategory: 'scholar', title: 'Readiness', apiPath: '/readiness/current' }, loadComponent: () => import('./readiness-dashboard.page').then(m => m.ReadinessDashboardPage) }] satisfies Routes;
