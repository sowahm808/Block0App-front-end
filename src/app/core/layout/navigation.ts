import { AuthStore } from '../auth/auth.store';
import { Permission, UserRole } from '../models/roles';
import { environment } from '../../../environments/environment';

export interface AppNavigationItem {
  route: string;
  href?: string;
  label: string;
  icon: string;
  exact?: boolean;
  roles?: UserRole[];
  permissions?: Permission[];
  showInSidebar?: boolean;
  children?: AppNavigationItem[];
}

export interface AppNavigationGroup {
  label: string;
  roles?: UserRole[];
  permissions?: Permission[];
  items: AppNavigationItem[];
}

export type NavigationItem = AppNavigationItem;
export type AppNavigationLink = AppNavigationItem & { href: string };

export const SCHOLAR_ROLES: UserRole[] = ['Scholar'];
export const REVIEW_ROLES: UserRole[] = ['ContentReviewer', 'Administrator', 'SuperAdministrator'];
export const MENTOR_ROLES: UserRole[] = ['Mentor', 'Administrator', 'SuperAdministrator'];
export const ADMIN_ROLES: UserRole[] = ['Administrator', 'SuperAdministrator'];

export const APP_NAVIGATION_GROUPS: readonly AppNavigationGroup[] = [
  {
    label: 'Encouragement',
    permissions: ['whispers.access'],
    items: [
      {
        route: '/encouragement',
        label: 'Encouragement Center',
        icon: 'volunteer_activism',
        permissions: ['whispers.access'],
      },
    ],
  },
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
      {
        route: '/learning-packs',
        label: 'Learning Packs',
        icon: 'library_books',
        permissions: ['scholar:access'],
        children: [
          {
            route: '/learning-packs/:packId',
            label: 'Learning Pack Detail',
            icon: 'menu_book',
            permissions: ['scholar:access'],
            showInSidebar: false,
            children: [
              {
                route: '/capsule-attempts/:attemptId',
                label: 'Capsule Attempt',
                icon: 'quiz',
                permissions: ['scholar:access'],
                showInSidebar: false,
              },
            ],
          },
        ],
      },
      {
        route: '/scenarios',
        label: 'Clinical Scenarios',
        icon: 'psychology',
        permissions: ['scholar:access'],
        children: [
          {
            route: '/scenario-attempts/:attemptId',
            label: 'Scenario Attempt',
            icon: 'assignment_turned_in',
            permissions: ['scholar:access'],
            showInSidebar: false,
          },
        ],
      },
      { route: '/rehearsal', label: 'Rehearsal', icon: 'fitness_center', permissions: ['scholar:access'] },
      {
        route: '/check-ins',
        label: 'Check-Ins',
        icon: 'fact_check',
        permissions: ['scholar:access'],
        children: [
          { route: '/check-ins/morning', label: 'Morning', icon: 'wb_sunny', permissions: ['scholar:access'] },
          { route: '/check-ins/evening', label: 'Evening', icon: 'nights_stay', permissions: ['scholar:access'] },
          { route: '/check-ins/history', label: 'History', icon: 'history', permissions: ['scholar:access'] },
        ],
      },
      {
        route: '/team',
        label: 'My Team',
        icon: 'groups',
        permissions: ['scholar:access'],
        children: [
          { route: '/team/support', label: 'Support Requests', icon: 'support_agent', permissions: ['scholar:access'] },
        ],
      },
      { route: '/readiness', label: 'Readiness', icon: 'monitoring', permissions: ['scholar:access'] },
      {
        route: '/rewards',
        label: 'Rewards',
        icon: 'emoji_events',
        permissions: ['scholar:access'],
        children: [
          {
            route: '/raffle-entries',
            label: 'Raffle Entries',
            icon: 'confirmation_number',
            permissions: ['scholar:access'],
          },
        ],
      },
      { route: '/certificates', label: 'Certificates', icon: 'workspace_premium', permissions: ['scholar:access'] },
      { route: '/notifications', label: 'Notifications', icon: 'notifications', permissions: ['scholar:access'] },
      { route: '/profile', label: 'Profile', icon: 'account_circle', permissions: ['scholar:access'] },
      { route: '/settings', label: 'Settings', icon: 'settings', permissions: ['scholar:access'] },
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
    roles: [...REVIEW_ROLES, ...MENTOR_ROLES, ...ADMIN_ROLES],
    items: [
      { route: '/notifications', label: 'Notifications', icon: 'notifications' },
      { route: '/profile', label: 'Profile', icon: 'account_circle' },
      { route: '/settings', label: 'Settings', icon: 'settings' },
      { route: '/notification-preferences', label: 'Notification preferences', icon: 'tune' },
    ],
  },
];

function flattenNavigationItems(items: readonly AppNavigationItem[]): AppNavigationLink[] {
  return items.flatMap((item) => [{ ...item, href: item.route }, ...flattenNavigationItems(item.children ?? [])]);
}

export const APP_NAVIGATION: AppNavigationLink[] = APP_NAVIGATION_GROUPS.flatMap((group) =>
  flattenNavigationItems(group.items),
);

export function canShowNavigationItem(store: AuthStore, item: AppNavigationItem | AppNavigationGroup): boolean {
  if ('route' in item && item.route === '/encouragement' && !environment.features.encouragementCenter) return false;
  const user = store.user();
  if (!user) return false;
  const status = (user as { status?: string }).status;
  if (status && status !== 'Active') return false;
  return (!item.roles || store.hasRole(item.roles)) && (!item.permissions || store.hasPermission(item.permissions));
}
