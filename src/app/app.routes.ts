import { Routes } from '@angular/router';

// IAM login vive en `iam/presentation/login-page`; la ruta se activará cuando conectes el flujo.
// import { authGuard } from './shared/guards/auth.guard';
// import { guestGuard } from './shared/guards/guest.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./shared/presentation/components/shell-layout/shell-layout').then((m) => m.ShellLayout),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'control-panel' },
      {
        path: 'control-panel',
        loadComponent: () =>
          import('./control-panel/presentation/control-panel-view/control-panel-view').then(
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
          import('./shared/presentation/profile-page/profile-page').then((m) => m.ProfilePage),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
