import { Routes } from '@angular/router';
import { roleGuard } from '../../core/guards/role.guard';
export default [
{ path: '', canActivate: [roleGuard], data: { roles: ['Scholar'], pageCategory: 'scholar', title: 'Rewards', apiPath: '/rewards' }, loadComponent: () => import('./rewards.page').then(m => m.RewardsPage) },
{ path: 'raffle-entries', redirectTo: '/raffle-entries', pathMatch: 'full' },
] satisfies Routes;
