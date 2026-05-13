export type FleetKpiId =
  | 'activeMachines'
  | 'criticalUnread'
  | 'onlineNodes'
  | 'upcomingMaintenance';

export interface FleetKpi {
  id: FleetKpiId;
  value: string;
  icon: string;
}
