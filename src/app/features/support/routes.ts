import { Routes } from '@angular/router';
import { roleGuard } from '../../core/guards/role.guard';
export default [
  { path: '', data: { roles: ['Scholar'], title: 'My support requests', apiPath: '/support-requests/mine' }, canActivate: [roleGuard], loadComponent: () => import('../teams/my-support-requests.page').then((m) => m.MySupportRequestsPage) },
  { path: ':requestId', data: { roles: ['Scholar'], title: 'Support request', apiPath: '/support-requests/mine' }, canActivate: [roleGuard], loadComponent: () => import('../teams/support-request-detail.page').then((m) => m.SupportRequestDetailPage) },
] satisfies Routes;
