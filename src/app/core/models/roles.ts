export type UserRole = 'Scholar' | 'Mentor' | 'ContentReviewer' | 'Administrator' | 'SuperAdministrator';
export type Permission = string;

export interface CurrentUser {
  userId: string;
  email: string;
  displayName: string;
  permissions: Permission[];
  emailVerified: boolean;
  mfaEnabled: boolean;
  roles?: UserRole[];
}
