import { Routes } from '@angular/router';
import { FeaturePageComponent } from '../../shared/components/feature-page.component';

const data = {
  title: 'Readiness meter',
  description: 'Track readiness signals from your practice.',
  apiPath: '/readiness',
};

export default [{ path: '', component: FeaturePageComponent, data }] satisfies Routes;
