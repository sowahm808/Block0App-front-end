import { Routes } from '@angular/router';
import { FeaturePageComponent } from '../../shared/components/feature-page.component';

const data = {
  title: 'Content review',
  description: 'Review, approve, and improve learning content.',
  apiPath: '/admin/content',
};

export default [
  { path: '', component: FeaturePageComponent, data },
  { path: ':id', component: FeaturePageComponent, data },
] satisfies Routes;
