import { Routes } from '@angular/router';
import { permissionGuard } from '../../core/guards/permission.guard';
import { environment } from '../../../environments/environment';
const enabled = () => environment.features.encouragementCenter;
export default <Routes>[
  {
    path: '',
    canActivate: [permissionGuard],
    data: { permissions: ['whispers.read_own'] },
    loadComponent: () => import('./pages/encouragement-dashboard.page').then((m) => m.EncouragementDashboardPage),
  },
  {
    path: 'create',
    canActivate: [permissionGuard],
    data: { permissions: ['whispers.create'] },
    canMatch: [enabled],
    loadComponent: () => import('./pages/create-whisper.page').then((m) => m.CreateWhisperPage),
  },
  {
    path: 'review/:whisperId',
    canActivate: [permissionGuard],
    data: { permissions: ['whispers.create'] },
    loadComponent: () => import('./pages/review-whisper.page').then((m) => m.ReviewWhisperPage),
  },
  {
    path: 'sent/:whisperId',
    canActivate: [permissionGuard],
    data: { permissions: ['whispers.read_own'] },
    loadComponent: () => import('./pages/whisper-sent.page').then((m) => m.WhisperSentPage),
  },
  {
    path: ':whisperId',
    canActivate: [permissionGuard],
    data: { permissions: ['whispers.read_own'] },
    loadComponent: () => import('./pages/whisper-detail.page').then((m) => m.WhisperDetailPage),
  },
];
