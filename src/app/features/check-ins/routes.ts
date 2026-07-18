import { Routes } from '@angular/router';
import { CheckInPage } from './pages/check-in.page';
export default [
  { path: 'morning', component: CheckInPage, data: { kind: 'morning' } },
  { path: 'evening', component: CheckInPage, data: { kind: 'evening' } },
] satisfies Routes;
