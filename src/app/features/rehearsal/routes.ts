import { Routes } from '@angular/router';
import { FeaturePageComponent } from '../../shared/components/feature-page.component';

const data = {
  title: 'Rehearsal',
  description: 'Practice scenario rehearsal and feedback loops.',
  apiPath: '/rehearsal',
};

export default [
  { path: '', component: FeaturePageComponent, data },
  { path: ':id', component: FeaturePageComponent, data },
] satisfies Routes;
