import { Routes } from '@angular/router';
import { FeaturePageComponent } from '../../shared/components/feature-page.component';
import { ImportLearningPackPage } from './pages/import-learning-pack.page';

const data = {
  title: 'Admin console',
  description: 'Review content, user access, and operational controls.',
  apiPath: '/admin/content',
};

export default [
  { path: '', component: FeaturePageComponent, data },
  { path: 'content/import-learning-pack', component: ImportLearningPackPage },
  { path: ':id', component: FeaturePageComponent, data },
] satisfies Routes;
