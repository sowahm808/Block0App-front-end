import { Routes } from '@angular/router';import { FeaturePageComponent } from '../../shared/components/feature-page.component';
export default [{path:'',component:FeaturePageComponent},{path:':id',component:FeaturePageComponent}] satisfies Routes;
