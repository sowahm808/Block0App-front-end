import { Routes } from '@angular/router';
import { FeaturePageComponent } from '../../shared/components/feature-page.component';

const data = { title: 'Audit log', description: 'Inspect security and workflow events.', apiPath: '/audit' };

export default [
  { path: '', component: FeaturePageComponent, data },
  { path: ':id', component: FeaturePageComponent, data },
] satisfies Routes;
