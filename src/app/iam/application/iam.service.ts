import { computed, Injectable, signal } from '@angular/core';

const SESSION_KEY = 'infratrack_session';
const PREVIEW_KEY = 'infratrack_preview_user_id';

export interface IamSession {
  username: string;
  userId: number;
  loggedInAt: number;
  role: 'owner' | 'admin';
}

/** Random MockAPI user id (1–7) for toolbar preview when there is no IAM session. */
export function assignRandomPreviewUserId(): void {
  try {
    const id = Math.floor(Math.random() * 7) + 1;
    localStorage.setItem(PREVIEW_KEY, String(id));
  } catch {
    /* ignore */
  }
}

export function seedPreviewProfileUserId(): void {
  try {
    if (!sessionStorage.getItem(SESSION_KEY) && localStorage.getItem(PREVIEW_KEY) == null) {
      assignRandomPreviewUserId();
    }
  } catch {
    /* ignore */
  }
}

@Injectable({ providedIn: 'root' })
export class IamService {
  private readonly session = signal<IamSession | null>(this.readSession());

  readonly isAuthenticated = computed(() => this.session() !== null);
  readonly username = computed(() => this.session()?.username ?? null);
  readonly role = computed(() => this.session()?.role ?? null);
  readonly isAdmin = computed(() => this.role() === 'admin');
  readonly isOwner = computed(() => this.role() === 'owner');
  readonly sessionData = computed(() => this.session());

  login(username: string, _password: string, userId = 1, role: 'owner' | 'admin' = 'admin'): boolean {
    const trimmed = username.trim();
    if (!trimmed) {
      return false;
    }
    const payload: IamSession = { username: trimmed, userId, loggedInAt: Date.now(), role };
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(payload));
    this.session.set(payload);
    localStorage.removeItem(PREVIEW_KEY);
    return true;
  }

  logout(): void {
    sessionStorage.removeItem(SESSION_KEY);
    this.session.set(null);
    assignRandomPreviewUserId();
  }

  private readSession(): IamSession | null {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) {
      return null;
    }
    try {
      const parsed = JSON.parse(raw) as Partial<IamSession> & { username?: string; role?: string };
      if (!parsed.username) {
        return null;
      }
      const userId = typeof parsed.userId === 'number' && Number.isFinite(parsed.userId) ? parsed.userId : 1;
      const role = parsed.role === 'owner' || parsed.role === 'admin' ? parsed.role : 'admin';
      return {
        username: parsed.username,
        userId,
        loggedInAt: typeof parsed.loggedInAt === 'number' ? parsed.loggedInAt : Date.now(),
        role: role as 'owner' | 'admin',
      };
    } catch {
      sessionStorage.removeItem(SESSION_KEY);
      return null;
    }
  }
}
