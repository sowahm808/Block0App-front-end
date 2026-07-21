import { Permission, UserRole } from '../models/roles';

export interface NavigationItem {
  href: string;
  label: string;
  icon: string;
  exact?: boolean;
  roles?: UserRole[];
  permissions?: Permission[];
}

export const APP_NAVIGATION: readonly NavigationItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: 'space_dashboard', exact: true, permissions: ['scholar:access'] },
  { href: '/challenge/program', label: 'Program', icon: 'route', permissions: ['scholar:access'] },
  { href: '/challenge/today', label: 'Today', icon: 'bolt', permissions: ['scholar:access'] },
  { href: '/learning-packs', label: 'Learning packs', icon: 'library_books', permissions: ['scholar:access'] },
  { href: '/scenarios', label: 'Scenarios', icon: 'psychology', permissions: ['scholar:access'] },
  { href: '/team', label: 'Team', icon: 'groups', permissions: ['scholar:access'] },
  { href: '/readiness', label: 'Readiness', icon: 'monitoring', permissions: ['scholar:access'] },
  { href: '/notifications', label: 'Updates', icon: 'notifications', permissions: ['scholar:access'] },
  { href: '/profile', label: 'Profile', icon: 'account_circle' },
  { href: '/mentor', label: 'Mentor', icon: 'school', roles: ['Mentor'] },
  { href: '/review', label: 'Review', icon: 'rate_review', roles: ['ContentReviewer'] },
  { href: '/admin', label: 'Admin', icon: 'admin_panel_settings', roles: ['Administrator', 'SuperAdministrator'] },
];
