import { Routes } from '@angular/router';
import { FeaturePageComponent } from '../../shared/components/feature-page.component';

const data = { title: 'Profile', description: 'Manage your account profile and app identity.', apiPath: '/auth/me' };

export default [
  { path: '', component: FeaturePageComponent, data },
  { path: ':id', component: FeaturePageComponent, data },
] satisfies Routes;
