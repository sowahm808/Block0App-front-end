import { Routes } from '@angular/router';
import { FeaturePageComponent } from '../../shared/components/feature-page.component';

const data = { title: 'Reports', description: 'Analyze program outcomes and engagement.', apiPath: '/reports' };

export default [
  { path: '', component: FeaturePageComponent, data },
  { path: ':id', component: FeaturePageComponent, data },
] satisfies Routes;
