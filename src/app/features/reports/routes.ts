import { Routes } from '@angular/router';
import { roleGuard } from '../../core/guards/role.guard';
export default [{ path: '', data: { roles: ['Administrator', 'SuperAdministrator'], title: 'Reports', apiPath: '/admin/reports' }, canActivate: [roleGuard], loadComponent: () => import('../admin/admin-reports.page').then((m) => m.AdminReportsPage) }] satisfies Routes;
