import { Routes } from '@angular/router';
import { LearningPackDetailPage } from './pages/learning-pack-detail.page';
import { LearningPacksPage } from './pages/learning-packs.page';
export default [
  { path: '', component: LearningPacksPage },
  { path: ':packId', component: LearningPackDetailPage },
] satisfies Routes;
