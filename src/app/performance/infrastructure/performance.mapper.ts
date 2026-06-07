import {
  AlertApiDto,
  MachineryApiDto,
  OperatorApiDto,
  TelemetryDataApiDto,
} from '../../shared/infratrack-api.dto';
import { EfficiencySnapshot } from '../domain/model/efficiency-snapshot.model';

export interface PerformanceAlertVm {
  timestamp: string;
  machineLabel: string;
  typeKey: string;
  severity: string;
}

export interface PerformanceOperatorVm {
  id: number;
  userId: number;
  fullName: string;
  licenseNumber: string;
  phone: string;
  status: string;
}

/** % de unidades con alerta `idle_excess` (aprox. participación de ralentí vs flota). */
export function computeIdleSharePercent(alerts: AlertApiDto[], machineryCount: number): number {
  const idle = alerts.filter((a) => String(a.type).toLowerCase() === 'idle_excess').length;
  if (machineryCount > 0) {
    return Math.min(100, Math.round((idle / machineryCount) * 100));
  }
  if (alerts.length > 0) {
    return Math.min(100, Math.round((idle / alerts.length) * 100));
  }
  return 0;
}

/** Cobertura de operadores con estado `active` (perfil operativo). */
export function computeActiveOperatorCoverage(operators: OperatorApiDto[]): number {
  if (!operators.length) {
    return 0;
  }
  const active = operators.filter((o) => String(o.status).toLowerCase() === 'active').length;
  return Math.round((active / operators.length) * 100);
}

/** Media de `fuelLevelPct` vs objetivo 75% (plan de referencia). */
export function computeFuelVarianceVsPlan(telemetry: TelemetryDataApiDto[]): number {
  if (!telemetry.length) {
    return 0;
  }
  const sum = telemetry.reduce((s, t) => s + (typeof t.fuelLevelPct === 'number' ? t.fuelLevelPct : 0), 0);
  const avg = sum / telemetry.length;
  return Math.round((avg - 75) * 10) / 10;
}

export function buildSnapshot(
  alerts: AlertApiDto[],
  telemetry: TelemetryDataApiDto[],
  machinery: MachineryApiDto[],
  operators: OperatorApiDto[],
): EfficiencySnapshot {
  return {
    excessiveIdleSharePercent: computeIdleSharePercent(alerts, machinery.length),
    topOperatorEfficiencyPercent: computeActiveOperatorCoverage(operators),
    fuelVarianceVersusPlanPercent: computeFuelVarianceVsPlan(telemetry),
  };
}

const PERF_ALERT_TYPES = new Set(['idle_excess', 'fuel_theft', 'maintenance', 'geofence']);

export function buildPerformanceAlertRows(
  alerts: AlertApiDto[],
  machinery: MachineryApiDto[],
  max = 12,
): PerformanceAlertVm[] {
  const plate = (id: number) => machinery.find((m) => m.id === id)?.plateNumber ?? `ID ${id}`;
  return alerts
    .filter((a) => PERF_ALERT_TYPES.has(String(a.type)))
    .sort((a, b) => String(b.timestamp).localeCompare(String(a.timestamp)))
    .slice(0, max)
    .map((a) => ({
      timestamp: String(a.timestamp ?? ''),
      machineLabel: plate(a.machineryId),
      typeKey: String(a.type),
      severity: String(a.severity),
    }));
}

export function buildOperatorRows(operators: OperatorApiDto[]): PerformanceOperatorVm[] {
  return operators.map((o) => ({
    id: o.id,
    userId: o.userId,
    fullName: o.fullName,
    licenseNumber: o.licenseNumber,
    phone: o.phone,
    status: String(o.status),
  }));
}
