import { Routes } from '@angular/router';
import { CapsulePage } from './pages/capsule.page';
import { CapsulesIndexPage } from './pages/capsules-index.page';

export default [
  { path: '', pathMatch: 'full', component: CapsulesIndexPage },
  { path: ':capsuleAttemptId', component: CapsulePage },
] satisfies Routes;
