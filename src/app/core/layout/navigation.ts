import { AuthStore } from '../auth/auth.store';
import { Permission, UserRole } from '../models/roles';

export interface AppNavigationItem {
  route: string;
  href?: string;
  label: string;
  icon: string;
  exact?: boolean;
  roles?: UserRole[];
  permissions?: Permission[];
}

export interface AppNavigationGroup {
  label: string;
  roles?: UserRole[];
  permissions?: Permission[];
  items: AppNavigationItem[];
}

export type NavigationItem = AppNavigationItem;

export const SCHOLAR_ROLES: UserRole[] = ['Scholar'];
export const REVIEW_ROLES: UserRole[] = ['ContentReviewer', 'Administrator', 'SuperAdministrator'];
export const MENTOR_ROLES: UserRole[] = ['Mentor', 'Administrator', 'SuperAdministrator'];
export const ADMIN_ROLES: UserRole[] = ['Administrator', 'SuperAdministrator'];

export const APP_NAVIGATION_GROUPS: readonly AppNavigationGroup[] = [
  {
    label: 'Scholar',
    roles: SCHOLAR_ROLES,
    items: [
      {
        route: '/dashboard',
        label: 'Dashboard',
        icon: 'space_dashboard',
        exact: true,
        permissions: ['scholar:access'],
      },
      { route: '/challenge/today', label: 'Today’s Challenge', icon: 'bolt', permissions: ['scholar:access'] },
      { route: '/learning-packs', label: 'Learning packs', icon: 'library_books', permissions: ['scholar:access'] },
      { route: '/capsules', label: 'Capsules', icon: 'auto_stories', permissions: ['scholar:access'] },
      { route: '/scenarios', label: 'Clinical Scenarios', icon: 'psychology', permissions: ['scholar:access'] },
      { route: '/rehearsal', label: 'Rehearsal', icon: 'fitness_center', permissions: ['scholar:access'] },
      { route: '/check-ins', label: 'Check-ins', icon: 'fact_check', permissions: ['scholar:access'] },
      { route: '/team', label: 'My Team', icon: 'groups', permissions: ['scholar:access'] },
      { route: '/readiness', label: 'Readiness', icon: 'monitoring', permissions: ['scholar:access'] },
      { route: '/rewards', label: 'Rewards', icon: 'emoji_events', permissions: ['scholar:access'] },
      { route: '/certificates', label: 'Certificates', icon: 'workspace_premium', permissions: ['scholar:access'] },
    ],
  },
  {
    label: 'Content review',
    roles: REVIEW_ROLES,
    items: [
      { route: '/review', label: 'Review dashboard', icon: 'rate_review', exact: true, permissions: ['content.read'] },
      { route: '/review/content', label: 'Review queue', icon: 'inbox', permissions: ['content.review'] },
      { route: '/review/questions', label: 'Questions', icon: 'quiz', permissions: ['content.read'] },
      { route: '/review/scenarios', label: 'Scenarios', icon: 'psychology_alt', permissions: ['content.read'] },
      { route: '/review/ai-drafts', label: 'AI drafts', icon: 'smart_toy', permissions: ['content.review'] },
      { route: '/review/history', label: 'Review history', icon: 'history', permissions: ['content.read'] },
      {
        route: '/review/import-learning-pack',
        label: 'Import learning pack',
        icon: 'upload_file',
        permissions: ['content.import'],
      },
    ],
  },
  {
    label: 'Mentor',
    roles: MENTOR_ROLES,
    items: [
      { route: '/mentor', label: 'Mentor dashboard', icon: 'school', exact: true, permissions: ['mentor.teams.read'] },
      { route: '/mentor/teams', label: 'Teams', icon: 'groups', permissions: ['mentor.teams.read'] },
      {
        route: '/mentor/support-requests',
        label: 'Support requests',
        icon: 'support_agent',
        permissions: ['mentor.support.read'],
      },
    ],
  },
  {
    label: 'Administration',
    roles: ADMIN_ROLES,
    items: [
      { route: '/admin', label: 'Admin dashboard', icon: 'admin_panel_settings', exact: true, roles: ADMIN_ROLES },
      { route: '/admin/users', label: 'Users', icon: 'manage_accounts', permissions: ['admin.users.read'] },
      { route: '/admin/challenges', label: 'Challenges', icon: 'flag' },
      { route: '/admin/cohorts', label: 'Cohorts', icon: 'groups_3' },
      { route: '/admin/learning-packs', label: 'Learning packs', icon: 'library_books' },
      { route: '/admin/learning-packs/import', label: 'Import content', icon: 'upload_file' },
      { route: '/admin/content-review', label: 'Content review', icon: 'rate_review' },
      { route: '/admin/reports', label: 'Reports', icon: 'analytics' },
      { route: '/admin/audit', label: 'Audit', icon: 'policy' },
      { route: '/admin/system-settings', label: 'System settings', icon: 'settings' },
    ],
  },
  {
    label: 'Account',
    items: [
      { route: '/notifications', label: 'Notifications', icon: 'notifications' },
      { route: '/profile', label: 'Profile', icon: 'account_circle' },
      { route: '/settings', label: 'Settings', icon: 'settings' },
      { route: '/notification-preferences', label: 'Notification preferences', icon: 'tune' },
    ],
  },
];

export const APP_NAVIGATION = APP_NAVIGATION_GROUPS.flatMap((group) => group.items).map((item) => ({
  ...item,
  href: item.route,
}));

export function canShowNavigationItem(store: AuthStore, item: AppNavigationItem | AppNavigationGroup): boolean {
  const user = store.user();
  if (!user) return false;
  const status = (user as { status?: string }).status;
  if (status && status !== 'Active') return false;
  return (!item.roles || store.hasRole(item.roles)) && (!item.permissions || store.hasPermission(item.permissions));
}
