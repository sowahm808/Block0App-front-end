import { Routes } from '@angular/router';
import { FeaturePageComponent } from '../../shared/components/feature-page.component';

const data = {
  title: 'Challenge hub',
  description: 'Browse active challenge days and study milestones.',
  apiPath: '/challenges',
};

export default [
  { path: '', component: FeaturePageComponent, data },
  { path: ':id', component: FeaturePageComponent, data },
] satisfies Routes;
