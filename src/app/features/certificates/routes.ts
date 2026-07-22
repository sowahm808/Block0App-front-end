import { Routes } from '@angular/router';
import { roleGuard } from '../../core/guards/role.guard';
export default [{ path: '', canActivate: [roleGuard], data: { roles: ['Scholar'], pageCategory: 'scholar', title: 'Certificates', apiPath: '/certificates' }, loadComponent: () => import('./certificates.page').then(m => m.CertificatesPage) }] satisfies Routes;
