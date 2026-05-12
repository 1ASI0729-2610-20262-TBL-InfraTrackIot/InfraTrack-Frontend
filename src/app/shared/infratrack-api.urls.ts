import { OperatorApiDto, UserApiDto } from '../infrastructure/dto/infratrack-api.dto';

function coerceNumber(v: unknown): number | null {
  if (typeof v === 'number' && Number.isFinite(v)) {
    return v;
  }
  if (typeof v === 'string' && v.trim() !== '') {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

/** Acepta respuestas MockAPI aunque `id` venga como string u optional fields falten. */
export function normalizeUserDto(raw: unknown): UserApiDto | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return null;
  }
  const o = raw as Record<string, unknown>;
  const id = coerceNumber(o['id']);
  if (id == null) {
    return null;
  }
  const username = String(o['username'] ?? o['userName'] ?? '').trim();
  if (!username) {
    return null;
  }
  const email = String(o['email'] ?? '').trim() || `${username}@placeholder.local`;
  const role = String(o['role'] ?? 'technician');
  const isActive = o['isActive'] === undefined ? true : Boolean(o['isActive']);
  const createdAt =
    typeof o['createdAt'] === 'string' && o['createdAt'].length > 0
      ? o['createdAt']
      : new Date().toISOString();
  const passwordHash = String(o['passwordHash'] ?? '');
  return { id, username, email, passwordHash, role, isActive, createdAt };
}

export function pickUserFromList(body: unknown, userId: number): UserApiDto | null {
  if (!Array.isArray(body)) {
    return null;
  }
  for (const item of body) {
    const u = normalizeUserDto(item);
    if (u && u.id === userId) {
      return u;
    }
  }
  return null;
}

export function normalizeOperatorDto(raw: unknown): OperatorApiDto | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return null;
  }
  const o = raw as Record<string, unknown>;
  const id = coerceNumber(o['id']);
  const userId = coerceNumber(o['userId']);
  if (id == null || userId == null) {
    return null;
  }
  const fullName = String(o['fullName'] ?? '').trim();
  if (!fullName) {
    return null;
  }
  const licenseNumber = String(o['licenseNumber'] ?? '').trim() || '—';
  const phone = String(o['phone'] ?? '').trim() || '—';
  const status = String(o['status'] ?? 'active');
  return { id, userId, fullName, licenseNumber, phone, status };
}

export function pickOperatorForUser(body: unknown, userId: number): OperatorApiDto | null {
  if (!Array.isArray(body)) {
    return null;
  }
  for (const item of body) {
    const op = normalizeOperatorDto(item);
    if (op && op.userId === userId) {
      return op;
    }
  }
  return null;
}
