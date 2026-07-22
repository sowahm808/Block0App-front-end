import { Routes } from '@angular/router';
import { roleGuard } from '../../core/guards/role.guard';
export default [{ path: '', data: { roles: ['Administrator', 'SuperAdministrator'], title: 'Audit', apiPath: '/admin/audit' }, canActivate: [roleGuard], loadComponent: () => import('../admin/admin-audit.page').then((m) => m.AdminAuditPage) }] satisfies Routes;
