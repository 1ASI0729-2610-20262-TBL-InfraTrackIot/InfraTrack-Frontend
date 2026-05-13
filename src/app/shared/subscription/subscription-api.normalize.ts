import { SubscriptionApiDto } from '../infratrack-api.dto';

function num(v: unknown): number | undefined {
  if (typeof v === 'number' && Number.isFinite(v)) {
    return v;
  }
  if (typeof v === 'string' && v.trim() !== '') {
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
  }
  return undefined;
}

function str(v: unknown): string | undefined {
  return typeof v === 'string' && v.trim() ? v.trim() : undefined;
}

function bool(v: unknown): boolean | undefined {
  if (typeof v === 'boolean') {
    return v;
  }
  if (v === 'true' || v === 1) {
    return true;
  }
  if (v === 'false' || v === 0) {
    return false;
  }
  return undefined;
}

export function normalizeSubscriptionRow(raw: unknown): SubscriptionApiDto | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return null;
  }
  const o = raw as Record<string, unknown>;
  const id = num(o['id']);
  if (id == null) {
    return null;
  }
  const plan = str(o['plan']) ?? str(o['planName']) ?? str(o['tier']) ?? str(o['name']);
  const planName = str(o['planName']) ?? plan;
  return {
    id,
    userId: num(o['userId']),
    plan,
    planName,
    pricePen: num(o['pricePen']) ?? num(o['price']) ?? num(o['monthlyPrice']),
    maxMachinery: num(o['maxMachinery']) ?? num(o['max_machinery']),
    startDate: str(o['startDate']) ?? str(o['startsAt']) ?? str(o['createdAt']),
    endDate: str(o['endDate']) ?? str(o['expiresAt']) ?? str(o['renewalDate']),
    autoRenew: bool(o['autoRenew']) ?? bool(o['auto_renew']),
    status: str(o['status']) ?? str(o['state']),
    createdAt: str(o['createdAt']),
  };
}

export function subscriptionListFromBody(body: unknown): unknown[] {
  if (Array.isArray(body)) {
    return body;
  }
  if (body && typeof body === 'object' && Array.isArray((body as Record<string, unknown>)['data'])) {
    return (body as Record<string, unknown>)['data'] as unknown[];
  }
  return [];
}

/** GET /subscriptions?userId=… o lista completa: elige fila del usuario o activa. */
export function pickSubscriptionForUser(rows: unknown[], userId: number): SubscriptionApiDto | null {
  const parsed = rows.map(normalizeSubscriptionRow).filter((x): x is SubscriptionApiDto => x != null);
  if (!parsed.length) {
    return null;
  }
  const forUser = parsed.filter((s) => s.userId === userId);
  const pool = forUser.length ? forUser : parsed;
  const active = pool.find((s) => String(s.status ?? '').toLowerCase() === 'active');
  return active ?? pool[0];
}
