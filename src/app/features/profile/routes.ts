import { Routes } from '@angular/router';
export default [{ path: '', data: { title: 'Profile', pageCategory: 'account', apiPath: '/profile' }, loadComponent: () => import('./profile.page').then(m => m.ProfilePage) }] satisfies Routes;
