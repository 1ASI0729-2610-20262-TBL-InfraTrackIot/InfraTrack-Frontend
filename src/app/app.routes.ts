import { Routes } from '@angular/router';

import { ownerGuard } from './shared/guards/owner.guard';

// IAM login vive en `iam/presentation/login-page`; la ruta se activará cuando conectes el flujo.
// import { authGuard } from './shared/guards/auth.guard';
// import { guestGuard } from './shared/guards/guest.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./shared/shell-layout').then((m) => m.ShellLayout),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'control-panel' },
      {
        path: 'control-panel',
        loadComponent: () =>
          import('./control-panel/control-panel-view').then(
            (m) => m.ControlPanelView,
          ),
      },
      {
        path: 'asset-management',
        loadComponent: () =>
          import('./asset-management/presentation/asset-management-view/asset-management-view').then(
            (m) => m.AssetManagementView,
          ),
      },
      {
        path: 'telemetry',
        loadComponent: () =>
          import('./telemetry/presentation/telemetry-view/telemetry-view').then((m) => m.TelemetryView),
      },
      {
        path: 'reports-analytics',
        loadComponent: () =>
          import('./reports/presentation/reports-view/reports-view').then((m) => m.ReportsView),
      },
      {
        path: 'performance',
        loadComponent: () =>
          import('./performance/presentation/performance-view/performance-view').then(
            (m) => m.PerformanceView,
          ),
      },
      {
        path: 'configuration',
        loadComponent: () =>
          import('./configuration/presentation/configuration-view/configuration-view').then(
            (m) => m.ConfigurationView,
          ),
      },
      {
        path: 'profile',
        loadComponent: () =>
          import('./shared/profile-page').then((m) => m.ProfilePage),
      },
      {
        path: 'subscription-plans',
        canActivate: [ownerGuard],
        loadComponent: () =>
          import('./shared/subscription-plans-page/subscription-plans-page').then(
            (m) => m.SubscriptionPlansPage,
          ),
      },
    ],
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./iam/presentation/login-page/login-page').then((m) => m.LoginPage),
  },
  { path: '**', redirectTo: 'login' },
];
