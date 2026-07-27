import { CanDeactivateFn } from '@angular/router';
import { AdminSystemSettingsPage } from './admin-system-settings.page';
export const systemSettingsUnsavedGuard: CanDeactivateFn<AdminSystemSettingsPage> = (component) =>
  !component.hasUnsavedChanges() || confirm('You have unsaved system-setting changes. Leave without saving?');
