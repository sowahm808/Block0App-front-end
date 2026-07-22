import { Routes } from '@angular/router';
import { permissionGuard } from '../../core/guards/permission.guard';
const data = { roles: ['ContentReviewer', 'Administrator', 'SuperAdministrator'], pageCategory: 'content-review' };
export default [
  { path: 'import-learning-pack', data: { ...data, title: 'Import learning pack', apiPath: '/admin/content/import-learning-pack' }, loadComponent: () => import('../admin/pages/import-learning-pack.page').then(m => m.ImportLearningPackPage) },
  { path: '', data: { ...data, title: 'Review dashboard', apiPath: '/review/dashboard', permissions: ['content.read'] }, canActivate: [permissionGuard], loadComponent: () => import('./review-dashboard.page').then(m => m.ReviewDashboardPage) },
  { path: 'content', data: { ...data, title: 'Review queue', apiPath: '/review/content', permissions: ['content.review'] }, canActivate: [permissionGuard], loadComponent: () => import('./review-queue.page').then(m => m.ReviewQueuePage) },
  { path: 'questions', data: { ...data, title: 'Question reviews', apiPath: '/review/questions', permissions: ['content.read'] }, canActivate: [permissionGuard], loadComponent: () => import('./review-queue.page').then(m => m.ReviewQueuePage) },
  { path: 'questions/:questionId', data: { ...data, title: 'Question review', apiPath: '/review/questions/:questionId', permissions: ['content.review'] }, canActivate: [permissionGuard], loadComponent: () => import('./question-review.page').then(m => m.QuestionReviewPage) },
  { path: 'scenarios', data: { ...data, title: 'Scenario reviews', apiPath: '/review/scenarios', permissions: ['content.read'] }, canActivate: [permissionGuard], loadComponent: () => import('./review-queue.page').then(m => m.ReviewQueuePage) },
  { path: 'scenarios/:scenarioId', data: { ...data, title: 'Scenario review', apiPath: '/review/scenarios/:scenarioId', permissions: ['content.review'] }, canActivate: [permissionGuard], loadComponent: () => import('./scenario-review.page').then(m => m.ScenarioReviewPage) },
  { path: 'ai-drafts', data: { ...data, title: 'AI drafts', apiPath: '/review/ai-drafts', permissions: ['content.review'] }, canActivate: [permissionGuard], loadComponent: () => import('./ai-draft-review-queue.page').then(m => m.AiDraftReviewQueuePage) },
  { path: 'ai-drafts/:draftId', data: { ...data, title: 'AI draft review', apiPath: '/review/ai-drafts/:draftId', permissions: ['content.review'] }, canActivate: [permissionGuard], loadComponent: () => import('./ai-draft-review.page').then(m => m.AiDraftReviewPage) },
  { path: 'history', data: { ...data, title: 'Review history', apiPath: '/review/history', permissions: ['content.read'] }, canActivate: [permissionGuard], loadComponent: () => import('./review-history.page').then(m => m.ReviewHistoryPage) },
] satisfies Routes;
