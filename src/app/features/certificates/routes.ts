import { Routes } from '@angular/router';
import { FeaturePageComponent } from '../../shared/components/feature-page.component';

const data = {
  title: 'Certificates',
  description: 'View earned certificates and credential progress.',
  apiPath: '/certificates',
};

export default [
  { path: '', component: FeaturePageComponent, data },
  { path: ':id', component: FeaturePageComponent, data },
] satisfies Routes;
