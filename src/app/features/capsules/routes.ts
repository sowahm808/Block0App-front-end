import { Routes } from '@angular/router';
import { CapsulePage } from './pages/capsule.page';

export default [
  { path: ':capsuleAttemptId', component: CapsulePage },
] satisfies Routes;
