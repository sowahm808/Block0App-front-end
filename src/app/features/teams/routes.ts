import { Routes } from '@angular/router';
import { roleGuard } from '../../core/guards/role.guard';
import { TeamPage } from './pages/team.page';
export default [
  { path: '', component: TeamPage, data: { roles: ['Scholar'], title: 'Team' }, canActivate: [roleGuard] },
  { path: 'support', data: { roles: ['Scholar'], title: 'My support requests', apiPath: '/support-requests/mine' }, canActivate: [roleGuard], loadComponent: () => import('./my-support-requests.page').then((m) => m.MySupportRequestsPage) },
  { path: 'support/:requestId', data: { roles: ['Scholar'], title: 'Support request', apiPath: '/support-requests/mine' }, canActivate: [roleGuard], loadComponent: () => import('./support-request-detail.page').then((m) => m.SupportRequestDetailPage) },
] satisfies Routes;
