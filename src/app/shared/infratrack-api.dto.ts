/**
 * Bases MockAPI.io acordadas para InfraTrack.
 * Angular no lee `.env` por defecto: ajusta aquí las URLs o alinea con `.env.desarrollo`.
 *
 * **Usuarios y operadores** usan `identity` (GET `/users`, `/operators`) → proyecto MockAPI
 * `InfraTrack_us_op` (misma base que `operations` aquí).
 */
export const MOCK_API_BASE_URLS = {
  controlPanel: 'https://6a02a9550d92f63dd253e48d.mockapi.io/api/v1',
  assetManagement: 'https://6a02a7340d92f63dd253e0e6.mockapi.io/api/v1',
  telemetry: 'https://6a02a70a0d92f63dd253e074.mockapi.io/api/v1',
  operations: 'https://6a02a56d0d92f63dd253dd53.mockapi.io/api/v1',
  subscriptions: 'https://69fb34c188a7af0ecca8aca0.mockapi.io/api/v1',
  /** users + operators (MockAPI proyecto InfraTrack_us_op). */
  identity: 'https://6a02a56d0d92f63dd253dd53.mockapi.io/api/v1',
} as const;

export type MockApiBaseKey = keyof typeof MOCK_API_BASE_URLS;
