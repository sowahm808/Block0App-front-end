import { Routes } from '@angular/router';
import { LearningPacksPage } from './pages/learning-packs.page';
export default [
  { path: '', component: LearningPacksPage },
  { path: ':learningPackId', component: LearningPacksPage },
] satisfies Routes;
