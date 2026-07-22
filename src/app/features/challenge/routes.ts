import { Routes } from '@angular/router';
import { roleGuard } from '../../core/guards/role.guard';
export default [{ path: 'today', canActivate: [roleGuard], data: { roles: ['Scholar'], pageCategory: 'scholar', title: "Today's challenge", apiPath: '/challenges/current/today' }, loadComponent: () => import('./today-challenge.page').then(m => m.TodayChallengePage) }] satisfies Routes;
