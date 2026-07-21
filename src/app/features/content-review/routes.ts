import { Routes } from '@angular/router';
import { FeaturePageComponent } from '../../shared/components/feature-page.component';
import { ImportLearningPackPage } from '../admin/pages/import-learning-pack.page';

const data = {
  title: 'Content review',
  description: 'Review, approve, and improve learning content.',
  apiPath: '/admin/content',
};

export default [
  { path: '', component: FeaturePageComponent, data },
  { path: 'import-learning-pack', component: ImportLearningPackPage },
  { path: ':id', component: FeaturePageComponent, data },
] satisfies Routes;
