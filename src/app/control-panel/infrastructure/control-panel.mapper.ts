import {
  AlertApiDto,
  IotNodeApiDto,
  MachineryApiDto,
  MaintenanceRecordApiDto,
  TelemetryDataApiDto,
} from '../../shared/infratrack-api.dto';
import { DashboardAlert } from '../domain/model/dashboard-alert.model';
import { FleetKpi } from '../domain/model/fleet-kpi.model';

export interface MaintenanceRowVm {
  id: number;
  machineName: string;
  serviceDate: string;
  cost: number;
}

export interface MapMarkerView {
  lat: number;
  lng: number;
  label: string;
  status: string;
}

export function buildKpis(alerts: AlertApiDto[], machinery: MachineryApiDto[]): FleetKpi[] {
  return [
    { id: 'activeMachines', value: `${machinery.filter(m => m.currentStatus === 'active').length}`, icon: 'precision_manufacturing' },
    { id: 'fuelAlerts', value: `${alerts.filter(a => a.type === 'fuel_theft').length}`, icon: 'local_gas_station' },
    { id: 'idleMachines', value: `${machinery.filter(m => m.currentStatus === 'idle').length}`, icon: 'pause_circle' },
    { id: 'efficiencyRate', value: '87%', icon: 'trending_up' },
  ];
}

export function buildDashboardAlerts(
  alerts: AlertApiDto[],
  machinery: MachineryApiDto[],
  locale: string,
): DashboardAlert[] {
  return alerts.map((a) => {
    const m = machinery.find((x) => x.id === a.machineryId);
    return {
      timeAgo: a.timestamp, // simplification
      machineName: m ? `${m.brand} ${m.model} (${m.plateNumber})` : `Machine #${a.machineryId}`,
      alertType: a.type,
      severity: a.severity as 'warning' | 'critical',
      status: a.isAcknowledged ? 'resolved' : 'active',
    };
  });
}

export function buildMapMarkers(
  alerts: AlertApiDto[],
  machinery: MachineryApiDto[],
  telemetry: TelemetryDataApiDto[],
  iotNodes: IotNodeApiDto[],
): MapMarkerView[] {
  return machinery.map(m => ({
    lat: -12.0464 + Math.random() * 0.1 - 0.05,
    lng: -77.0428 + Math.random() * 0.1 - 0.05,
    label: `${m.brand} ${m.model} (${m.plateNumber})`,
    status: m.currentStatus,
  }));
}

export function buildMaintenanceRows(
  records: MaintenanceRecordApiDto[],
  machinery: MachineryApiDto[],
): MaintenanceRowVm[] {
  return records.map(r => {
    const m = machinery.find(x => x.id === r.machineryId);
    return {
      id: r.id,
      machineName: m ? `${m.brand} ${m.model} (${m.plateNumber})` : `Machine #${r.machineryId}`,
      serviceDate: r.serviceDate,
      cost: r.costPen,
    };
  });
}
