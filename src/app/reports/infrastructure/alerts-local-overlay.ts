import { AlertApiDto } from '../../shared/infratrack-api.dto';

const LS_KEY = 'infratrack_alerts_overlay_v1';

export interface AlertsLocalOverlay {
  /** Sustituciones por id (p. ej. isAcknowledged tras PUT 404). */
  byId: Record<string, AlertApiDto>;
}

export function emptyAlertsOverlay(): AlertsLocalOverlay {
  return { byId: {} };
}

export function readAlertsOverlay(): AlertsLocalOverlay {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) {
      return emptyAlertsOverlay();
    }
    const parsed = JSON.parse(raw) as Partial<AlertsLocalOverlay>;
    return {
      byId: parsed.byId && typeof parsed.byId === 'object' ? (parsed.byId as Record<string, AlertApiDto>) : {},
    };
  } catch {
    return emptyAlertsOverlay();
  }
}

export function writeAlertsOverlay(overlay: AlertsLocalOverlay): void {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(overlay));
  } catch {
    /* ignore */
  }
}

export function mergeAlertsWithOverlay(api: AlertApiDto[], overlay: AlertsLocalOverlay): AlertApiDto[] {
  return api.map((a) => {
    const id = String(a.id);
    const o = overlay.byId[id];
    return o ? { ...a, ...o, id: a.id } : a;
  });
}

export function pruneAlertsOverlay(api: AlertApiDto[], overlay: AlertsLocalOverlay): AlertsLocalOverlay {
  const ids = new Set(api.map((a) => a.id));
  const byId: Record<string, AlertApiDto> = {};
  for (const [k, v] of Object.entries(overlay.byId)) {
    const n = Number(k);
    if (ids.has(n)) {
      byId[k] = v;
    }
  }
  return { byId };
}
