import { Routes } from '@angular/router';
import { authGuard } from '../../core/guards/auth.guard';
import { permissionGuard } from '../../core/guards/permission.guard';
import { DashboardPage } from './pages/dashboard.page';
import { Permission } from '../../core/models/roles';

export default [
  {
    path: '',
    component: DashboardPage,
    canActivate: [authGuard, permissionGuard],
    data: {
      permissions: ['scholar:access'] satisfies Permission[],
    },
  },
] satisfies Routes;