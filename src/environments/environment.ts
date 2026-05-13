export const environment = {
  production: false,
  // IAM / Users API (misma base que `MOCK_API_BASE_URLS.identity` + recurso `/users`)
  iamApiUrl: 'https://6a02a56d0d92f63dd253dd53.mockapi.io/api/v1',
  iamEndpoint: '/users',
  
  // Telemetry / IoT Nodes API
  telemetryApiUrl: 'https://6a02a70a0d92f63dd253e074.mockapi.io/api/v1',
  telemetryEndpoint: '/telemetryData',
  iotNodesEndpoint: '/iotNodes',
  
  // Subscriptions / Establishments
  subscriptionsApiUrl: 'https://6a0246a80d92f63dd2537cd5.mockapi.io/api/v1',
  subscriptionsEndpoint: '/subscriptions',
  establishmentsEndpoint: '/establishments',
  
  // Other Modules
  operatorsApiUrl: 'https://6a02a56d0d92f63dd253dd53.mockapi.io/api/v1',
  operatorsEndpoint: '/operators',
  
  logisticsApiUrl: 'https://6a02a56d0d92f63dd253dd53.mockapi.io/api/v1',
  transportsEndpoint: '/transports'
};
