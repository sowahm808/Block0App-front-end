import { Routes } from '@angular/router';
import { permissionGuard } from '../../core/guards/permission.guard';
const data = { roles: ['Mentor', 'Administrator', 'SuperAdministrator'], pageCategory: 'mentor' };
export default [
  { path: '', data: { ...data, title: 'Mentor dashboard', apiPath: '/mentor/dashboard', permissions: ['mentor.teams.read'] }, canActivate: [permissionGuard], loadComponent: () => import('./mentor-dashboard.page').then(m => m.MentorDashboardPage) },
  { path: 'teams', data: { ...data, title: 'Mentor teams', apiPath: '/mentor/teams', permissions: ['mentor.teams.read'] }, canActivate: [permissionGuard], loadComponent: () => import('./mentor-teams.page').then(m => m.MentorTeamsPage) },
  { path: 'teams/:teamId', data: { ...data, title: 'Mentor team detail', apiPath: '/mentor/teams/:teamId', permissions: ['mentor.teams.read'] }, canActivate: [permissionGuard], loadComponent: () => import('./mentor-team-detail.page').then(m => m.MentorTeamDetailPage) },
  { path: 'support-requests', data: { ...data, title: 'Mentor support', apiPath: '/mentor/support-requests', permissions: ['mentor.support.read'] }, canActivate: [permissionGuard], loadComponent: () => import('./mentor-support-requests.page').then(m => m.MentorSupportRequestsPage) },
  { path: 'support-requests/:requestId', data: { ...data, title: 'Support request', apiPath: '/mentor/support-requests/:requestId', permissions: ['mentor.support.manage'] }, canActivate: [permissionGuard], loadComponent: () => import('./mentor-support-request-detail.page').then(m => m.MentorSupportRequestDetailPage) },
  { path: 'scholars/:scholarId', data: { ...data, title: 'Scholar summary', apiPath: '/mentor/scholars/:scholarId', permissions: ['mentor.progress.read'] }, canActivate: [permissionGuard], loadComponent: () => import('./mentor-scholar-summary.page').then(m => m.MentorScholarSummaryPage) },
] satisfies Routes;
