import { Routes } from '@angular/router';
import { ShellComponent } from './core/layout/shell.component';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';
import { roleMatchGuard } from './core/guards/role-match.guard';
import { guestGuard } from './core/guards/guest.guard';
import { LandingPage } from './features/auth/landing.page';
import { LoginPage, RegisterPage, SimpleAuthPage } from './features/auth/auth.pages';
export const routes: Routes = [
  { path: '', pathMatch: 'full', component: LandingPage },
  { path: 'login', component: LoginPage, canActivate: [guestGuard] },
  { path: 'register', component: RegisterPage, canActivate: [guestGuard] },
  { path: 'forgot-password', component: SimpleAuthPage },
  { path: 'reset-password', component: SimpleAuthPage },
  { path: 'verify-email', component: SimpleAuthPage },
  { path: 'unauthorized', component: SimpleAuthPage },
  { path: 'account-disabled', loadComponent: () => import('./features/public-pages/account-disabled.page').then((m) => m.AccountDisabledPage) },
  { path: 'terms', data: { title: 'Terms of use', description: 'Review the participation expectations, acceptable use guidelines, and learner responsibilities for the Block Zero Ready challenge.' }, loadComponent: () => import('./features/public-pages/public-info.page').then((m) => m.PublicInfoPage) },
  { path: 'privacy', data: { title: 'Privacy policy', description: 'Learn how Mind Unlocking Academy handles challenge account data, readiness signals, certificates, and support communications.' }, loadComponent: () => import('./features/public-pages/public-info.page').then((m) => m.PublicInfoPage) },
  { path: 'support', data: { title: 'Support', description: 'Get help with enrollment, sign-in, cohort access, certificates, or daily challenge participation.' }, loadComponent: () => import('./features/public-pages/public-info.page').then((m) => m.PublicInfoPage) },
  { path: 'certificate/verify/:verificationCode', data: { apiPath: '/public/certificates/verify/:verificationCode' }, loadComponent: () => import('./features/public-pages/certificate-verification.page').then((m) => m.CertificateVerificationPage) },
  { path: 'not-found', loadComponent: () => import('./features/public-pages/not-found.page').then((m) => m.NotFoundPage) },
  { path: 'server-error', loadComponent: () => import('./features/public-pages/server-error.page').then((m) => m.ServerErrorPage) },
  {
    path: '',
    component: ShellComponent,
    canActivate: [authGuard],
    children: [
      { path: 'dashboard', loadChildren: () => import('./features/dashboard/routes') },
      { path: 'challenge', loadChildren: () => import('./features/challenge/routes') },
      { path: 'learning-packs', loadChildren: () => import('./features/learning-packs/routes') },
      { path: 'capsules', loadChildren: () => import('./features/capsules/routes') },
      { path: 'scenarios', canMatch: [roleMatchGuard], data: { roles: ['Scholar'] }, loadChildren: () => import('./features/scenarios/routes') },
      { path: 'scenario-attempts/:attemptId', canMatch: [roleMatchGuard], data: { roles: ['Scholar'] }, loadChildren: () => import('./features/scenarios/routes') },
      { path: 'rehearsal', canMatch: [roleMatchGuard], data: { roles: ['Scholar'] }, loadChildren: () => import('./features/rehearsal/routes') },
      { path: 'check-ins', loadChildren: () => import('./features/check-ins/routes') },
      { path: 'team', loadChildren: () => import('./features/teams/routes') },
      { path: 'readiness', canMatch: [roleMatchGuard], data: { roles: ['Scholar'] }, loadChildren: () => import('./features/readiness/routes') },
      { path: 'rewards', canMatch: [roleMatchGuard], data: { roles: ['Scholar'] }, loadChildren: () => import('./features/rewards/routes') },
      { path: 'raffle-entries', canMatch: [roleMatchGuard], data: { roles: ['Scholar'], title: 'Raffle entries', apiPath: '/raffle-entries' }, loadComponent: () => import('./features/rewards/raffle-entries.page').then((m) => m.RaffleEntriesPage) },
      { path: 'certificates', canMatch: [roleMatchGuard], data: { roles: ['Scholar'] }, loadChildren: () => import('./features/certificates/routes') },
      { path: 'notifications', loadChildren: () => import('./features/notifications/routes') },
      { path: 'profile', loadChildren: () => import('./features/profile/routes') },
      { path: 'settings', data: { title: 'Settings', pageCategory: 'account', apiPath: '/profile' }, loadComponent: () => import('./features/profile/settings.page').then((m) => m.SettingsPage) },
      { path: 'notification-preferences', data: { title: 'Notification preferences', pageCategory: 'account', apiPath: '/notification-preferences' }, loadComponent: () => import('./features/notifications/notification-preferences.page').then((m) => m.NotificationPreferencesPage) },
      {
        path: 'mentor',
        canMatch: [roleMatchGuard],
        canActivate: [roleGuard],
        data: { roles: ['Mentor', 'Administrator', 'SuperAdministrator'] },
        loadChildren: () => import('./features/mentor/routes'),
      },
      {
        path: 'review',
        canMatch: [roleMatchGuard],
        canActivate: [roleGuard],
        data: { roles: ['ContentReviewer', 'Administrator', 'SuperAdministrator'] },
        loadChildren: () => import('./features/content-review/routes'),
      },
      {
        path: 'admin',
        canActivate: [roleGuard],
        data: { roles: ['Administrator', 'SuperAdministrator'] },
        loadChildren: () => import('./features/admin/routes'),
      },
    ],
  },
  {
    path: '**',
    loadComponent: () => import('./features/public-pages/not-found.page').then((m) => m.NotFoundPage),
  },
];
