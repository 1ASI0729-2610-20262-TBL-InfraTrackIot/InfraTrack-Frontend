import { MOCK_API_BASE_URLS } from './mock-api-bases';

/**
 * Rutas REST por entidad (MockAPI).
 */
export const INFRATRACK_API = {
  users: `${MOCK_API_BASE_URLS.identity}/users`,
  operators: `${MOCK_API_BASE_URLS.identity}/operators`,
  machinery: `${MOCK_API_BASE_URLS.assetManagement}/machinery`,
  iotNodes: `${MOCK_API_BASE_URLS.assetManagement}/iotNodes`,
  telemetryData: `${MOCK_API_BASE_URLS.telemetry}/telemetryData`,
  alerts: `${MOCK_API_BASE_URLS.controlPanel}/alerts`,
  maintenanceRecords: `${MOCK_API_BASE_URLS.assetManagement}/maintenanceRecords`,
  subscriptions: `${MOCK_API_BASE_URLS.subscriptions}/subscriptions`,
} as const;
