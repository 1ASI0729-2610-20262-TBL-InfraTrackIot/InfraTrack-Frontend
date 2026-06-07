import { INJECTED_API_BASE_URLS as b } from '../app/shared/api-bases.inject';

/** Referencia para módulos que lean `environment` (las URLs siguen el mismo origen que `MOCK_API_BASE_URLS`). */
export const environment = {
  production: false,
  iamApiUrl: b.identity,
  iamEndpoint: '/users',

  telemetryApiUrl: b.telemetry,
  telemetryEndpoint: '/telemetryData',
  iotNodesEndpoint: '/iotNodes',

  subscriptionsApiUrl: b.subscriptions,
  subscriptionsEndpoint: '/subscriptions',
  establishmentsEndpoint: '/establishments',

  operatorsApiUrl: b.operations,
  operatorsEndpoint: '/operators',

  logisticsApiUrl: b.operations,
  transportsEndpoint: '/transports',
};
