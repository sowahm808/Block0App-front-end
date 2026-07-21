import { Routes } from '@angular/router';
import { CapsulePage } from './pages/capsule.page';

export default [
  { path: '', component: CapsulePage },
  { path: ':id', component: CapsulePage },
] satisfies Routes;
