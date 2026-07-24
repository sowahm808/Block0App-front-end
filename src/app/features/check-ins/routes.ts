import { Routes } from '@angular/router';
import { roleGuard } from '../../core/guards/role.guard';
import { CheckInPage } from './pages/check-in.page';
export default [
  { path: '', component: CheckInPage, data: { roles: ['Scholar'], title: 'Check-in' }, canActivate: [roleGuard] },
  {
    path: 'morning',
    component: CheckInPage,
    data: { roles: ['Scholar'], title: 'Morning Check-In' },
    canActivate: [roleGuard],
  },
  {
    path: 'evening',
    component: CheckInPage,
    data: { roles: ['Scholar'], title: 'Evening Check-In', kind: 'evening' },
    canActivate: [roleGuard],
  },
  {
    path: 'history',
    data: { roles: ['Scholar'], title: 'Check-in history', apiPath: '/check-ins/history' },
    canActivate: [roleGuard],
    loadComponent: () => import('./check-in-history.page').then((m) => m.CheckInHistoryPage),
  },
] satisfies Routes;
