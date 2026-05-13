import { MachineryApiDto } from '../../shared/infratrack-api.dto';

const LS_KEY = 'infratrack_machinery_overlay_v1';

export interface MachineryLocalOverlay {
  /** Ocultar filas del GET aunque el servidor las siga devolviendo (DELETE falló o solo “borrado local”). */
  deletedIds: number[];
  /** Sustituciones o altas locales (PUT 404 o creación sin POST). Clave = id numérico como string. */
  byId: Record<string, MachineryApiDto>;
}

export function emptyMachineryOverlay(): MachineryLocalOverlay {
  return { deletedIds: [], byId: {} };
}

export function coerceMachineryId(v: unknown): number {
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
}

export function readMachineryOverlay(): MachineryLocalOverlay {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) {
      return emptyMachineryOverlay();
    }
    const parsed = JSON.parse(raw) as Partial<MachineryLocalOverlay>;
    return {
      deletedIds: Array.isArray(parsed.deletedIds) ? parsed.deletedIds.map((x) => coerceMachineryId(x)) : [],
      byId: parsed.byId && typeof parsed.byId === 'object' ? (parsed.byId as Record<string, MachineryApiDto>) : {},
    };
  } catch {
    return emptyMachineryOverlay();
  }
}

export function writeMachineryOverlay(overlay: MachineryLocalOverlay): void {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(overlay));
  } catch {
    /* ignore */
  }
}

/** Fusiona GET /machinery con overlay persistente. */
export function mergeMachineryFleet(api: MachineryApiDto[], overlay: MachineryLocalOverlay): MachineryApiDto[] {
  const del = new Set(overlay.deletedIds);
  const map = new Map<number, MachineryApiDto>();
  for (const m of api) {
    const id = coerceMachineryId(m.id);
    if (id <= 0 || del.has(id)) {
      continue;
    }
    map.set(id, m);
  }
  for (const v of Object.values(overlay.byId)) {
    const id = coerceMachineryId(v.id);
    if (id <= 0 || del.has(id)) {
      continue;
    }
    map.set(id, { ...v, id });
  }
  return [...map.values()].sort((a, b) => coerceMachineryId(a.id) - coerceMachineryId(b.id));
}

/** Tras un GET exitoso: quita `deletedIds` que ya no aplican y limpia `byId` en conflicto con borrados. */
export function pruneOverlayWithApi(api: MachineryApiDto[], overlay: MachineryLocalOverlay): MachineryLocalOverlay {
  const apiIds = new Set(api.map((m) => coerceMachineryId(m.id)));
  const deletedIds = overlay.deletedIds.filter((id) => apiIds.has(id));
  const byId = { ...overlay.byId };
  for (const k of Object.keys(byId)) {
    const id = coerceMachineryId(byId[k].id);
    if (deletedIds.includes(id)) {
      delete byId[k];
    }
  }
  return { deletedIds, byId };
}
