import { Routes } from '@angular/router';
export default [
{ path: '', data: { title: 'Notifications', pageCategory: 'account', apiPath: '/notifications' }, loadComponent: () => import('./notification-center.page').then(m => m.NotificationCenterPage) },
] satisfies Routes;
