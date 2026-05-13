import {
  AlertApiDto,
  IotNodeApiDto,
  MachineryApiDto,
  MaintenanceRecordApiDto,
  TelemetryDataApiDto,
} from '../../shared/infratrack-api.dto';
import { DashboardAlert, DashboardAlertSeverity } from '../domain/model/dashboard-alert.model';
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

export interface MapMarkerProjected extends MapMarkerView {
  px: number;
  py: number;
}

function countUpcomingMaintenance(records: MaintenanceRecordApiDto[]): number {
  const start = Date.now();
  return records.filter((r) => {
    const t = Date.parse(r.nextServiceDate);
    return Number.isFinite(t) && t >= start;
  }).length;
}

export function buildKpis(
  alerts: AlertApiDto[],
  machinery: MachineryApiDto[],
  iotNodes: IotNodeApiDto[],
  maintenanceRecords: MaintenanceRecordApiDto[],
): FleetKpi[] {
  const activeMachinery = machinery.filter((m) => m.currentStatus === 'active').length;
  const criticalUnread = alerts.filter((a) => !a.isAcknowledged && a.severity === 'critical').length;
  const onlineNodes = iotNodes.filter((n) => n.connectionStatus === 'online').length;
  const upcoming = countUpcomingMaintenance(maintenanceRecords);

  return [
    {
      id: 'activeMachines',
      value: String(activeMachinery),
      icon: 'precision_manufacturing',
    },
    {
      id: 'criticalUnread',
      value: String(criticalUnread),
      icon: 'notification_important',
    },
    {
      id: 'onlineNodes',
      value: String(onlineNodes),
      icon: 'sensors',
    },
    {
      id: 'upcomingMaintenance',
      value: String(upcoming),
      icon: 'build_circle',
    },
  ];
}

function formatAlertTime(iso: string, locale: string): string {
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) {
    return iso;
  }
  return d.toLocaleString(locale === 'es' ? 'es-PE' : 'en-US', {
    dateStyle: 'short',
    timeStyle: 'short',
  });
}

function toSeverity(sev: string): DashboardAlertSeverity {
  return sev === 'critical' ? 'critical' : 'warning';
}

export function buildRecentDashboardAlerts(
  alerts: AlertApiDto[],
  machinery: MachineryApiDto[],
  locale: string,
  limit = 5,
): DashboardAlert[] {
  const sorted = [...alerts].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );
  return sorted.slice(0, limit).map((a) => {
    const m = machinery.find((x) => x.id === a.machineryId);
    return {
      id: a.id,
      timestamp: a.timestamp,
      timeLabel: formatAlertTime(a.timestamp, locale),
      machineName: m ? `${m.brand} ${m.model} (${m.plateNumber})` : `Machine #${a.machineryId}`,
      alertType: a.type,
      description: a.description ?? '',
      severity: toSeverity(a.severity),
      status: a.isAcknowledged ? 'resolved' : 'active',
      isAcknowledged: a.isAcknowledged,
    };
  });
}

function latestTelemetryByNode(telemetry: TelemetryDataApiDto[]): Map<number, TelemetryDataApiDto> {
  const sorted = [...telemetry].sort(
    (a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime(),
  );
  const map = new Map<number, TelemetryDataApiDto>();
  for (const t of sorted) {
    if (!map.has(t.nodeId)) {
      map.set(t.nodeId, t);
    }
  }
  return map;
}

/** Posición estable si no hay telemetría (Lima + dispersión por id). */
function fallbackCoords(m: MachineryApiDto): { lat: number; lng: number } {
  const seed = ((m.id * 9301 + 49297) % 233280) / 233280;
  const seed2 = ((m.id * 7919 + 1) % 99991) / 99991;
  return {
    lat: -12.056 + seed * 0.12 - 0.06,
    lng: -77.042 + seed2 * 0.12 - 0.06,
  };
}

export function buildMapMarkers(
  _alerts: AlertApiDto[],
  machinery: MachineryApiDto[],
  telemetry: TelemetryDataApiDto[],
  iotNodes: IotNodeApiDto[],
): MapMarkerView[] {
  const latestByNode = latestTelemetryByNode(telemetry);
  return machinery.map((m) => {
    const nodes = iotNodes.filter((n) => n.machineryId === m.id);
    let best: TelemetryDataApiDto | null = null;
    for (const n of nodes) {
      const t = latestByNode.get(n.id);
      if (
        t &&
        Number.isFinite(t.latitude) &&
        Number.isFinite(t.longitude) &&
        Math.abs(t.latitude) <= 90 &&
        Math.abs(t.longitude) <= 180
      ) {
        if (!best || new Date(t.recordedAt).getTime() > new Date(best.recordedAt).getTime()) {
          best = t;
        }
      }
    }
    const label = `${m.brand} ${m.model} (${m.plateNumber})`;
    if (best) {
      return { lat: best.latitude, lng: best.longitude, label, status: m.currentStatus };
    }
    const fb = fallbackCoords(m);
    return { lat: fb.lat, lng: fb.lng, label, status: m.currentStatus };
  });
}

export function projectMarkersForMiniMap(markers: MapMarkerView[]): MapMarkerProjected[] {
  if (!markers.length) {
    return [];
  }
  const lats = markers.map((m) => m.lat);
  const lngs = markers.map((m) => m.lng);
  let minLat = Math.min(...lats);
  let maxLat = Math.max(...lats);
  let minLng = Math.min(...lngs);
  let maxLng = Math.max(...lngs);
  const pad = 0.008;
  if (maxLat === minLat) {
    minLat -= pad;
    maxLat += pad;
  }
  if (maxLng === minLng) {
    minLng -= pad;
    maxLng += pad;
  }
  const dLat = maxLat - minLat || 1;
  const dLng = maxLng - minLng || 1;
  return markers.map((m) => ({
    ...m,
    px: ((m.lng - minLng) / dLng) * 100,
    py: (1 - (m.lat - minLat) / dLat) * 100,
  }));
}

export function buildMaintenanceRows(
  records: MaintenanceRecordApiDto[],
  machinery: MachineryApiDto[],
): MaintenanceRowVm[] {
  return records.map((r) => {
    const m = machinery.find((x) => x.id === r.machineryId);
    return {
      id: r.id,
      machineName: m ? `${m.brand} ${m.model} (${m.plateNumber})` : `Machine #${r.machineryId}`,
      serviceDate: r.serviceDate,
      cost: r.costPen,
    };
  });
}
