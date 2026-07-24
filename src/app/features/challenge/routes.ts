import { Routes } from '@angular/router';
import { roleGuard } from '../../core/guards/role.guard';

export default [
  { path: '', pathMatch: 'full', redirectTo: 'program' },
  {
    path: 'program',
    canActivate: [roleGuard],
    data: {
      roles: ['Scholar'],
      pageCategory: 'scholar',
      title: '21-day Block Zero program',
      apiPath: '/challenges/current/program',
    },
    loadComponent: () => import('./pages/program-structure.page').then((m) => m.ProgramStructurePage),
  },
  {
    path: 'today',
    canActivate: [roleGuard],
    data: {
      roles: ['Scholar'],
      pageCategory: 'scholar',
      title: "Today's challenge",
      apiPath: '/challenges/current/today',
    },
    loadComponent: () => import('./today-challenge.page').then((m) => m.TodayChallengePage),
  },
] satisfies Routes;
