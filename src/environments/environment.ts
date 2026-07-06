import { INJECTED_API_BASE_URLS } from '../app/shared/infrastructure/api-bases.inject';

/**
 * Production environment configuration.
 *
 * @remarks
 * API base URLs are injected at build time via `scripts/inject-api-bases.mjs`.
 */
export const environment = {
  production: true,
  appTitle: 'InfraTrack',
  apiBaseUrl: INJECTED_API_BASE_URLS.identity,
  apiBases: INJECTED_API_BASE_URLS,
  iamSignInEndpointPath: '/authentication/sign-in',
  usersEndpointPath: '/users',
  operatorsEndpointPath: '/operators',
  machineryEndpointPath: '/machinery',
  iotNodesEndpointPath: '/iot-nodes',
  telemetryDataEndpointPath: '/telemetry-data',
  alertsEndpointPath: '/alerts',
  maintenanceRecordsEndpointPath: '/maintenance-records',
  staffEndpointPath: '/staff',
  subscriptionsEndpointPath: '/subscriptions',
};
