import { computed, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';

import { UserRole } from '../domain/model/user.entity';
import { SignInCommand } from '../domain/model/sign-in.command';
import { SignUpCommand } from '../domain/model/sign-up.command';
import { IamApi } from '../infrastructure/iam-api';
import { SignInResource } from '../infrastructure/sign-in-response';

const SESSION_KEY = 'infratrack_session';
const PREVIEW_KEY = 'infratrack_preview_user_id';
const TOKEN_KEY = 'token';

export interface IamSession {
  username: string;
  userId: number;
  loggedInAt: number;
  role: 'owner' | 'admin';
}

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
export class IamStore {
  private readonly session = signal<IamSession | null>(this.readSession());
  private readonly authBusySignal = signal(false);

  readonly isAuthenticated = computed(() => this.session() !== null);
  readonly isSignedIn = this.isAuthenticated;
  readonly authBusy = this.authBusySignal.asReadonly();
  readonly username = computed(() => this.session()?.username ?? null);
  readonly role = computed(() => this.session()?.role ?? null);
  readonly isAdmin = computed(() => this.role() === 'admin');
  readonly isOwner = computed(() => this.role() === 'owner');
  readonly sessionData = computed(() => this.session());
  readonly currentToken = computed(() =>
    this.isSignedIn() ? localStorage.getItem(TOKEN_KEY) : null,
  );

  constructor(private readonly iamApi: IamApi) {}

  signIn(
    signInCommand: SignInCommand,
    router: Router,
    options?: {
      expectedRole?: 'owner' | 'admin';
      onError?: (reason?: 'auth' | 'wrongEntity' | 'provision') => void;
      afterAuth?: (resource: SignInResource) => Observable<void>;
    },
  ): void {
    this.authBusySignal.set(true);
    this.iamApi.signIn(signInCommand).subscribe({
      next: (resource) => {
        const role = this.resolveRole(resource.role);
        if (options?.expectedRole && role !== options.expectedRole) {
          this.authBusySignal.set(false);
          this.clearSession(false);
          options.onError?.('wrongEntity');
          return;
        }
        this.applySignIn(resource, role);
        const finish = (ok: boolean, reason: 'auth' | 'provision' = 'auth') => {
          this.authBusySignal.set(false);
          if (!ok) {
            this.clearSession(true);
            options?.onError?.(reason);
            return;
          }
          void router.navigateByUrl(this.homeUrlForRole(role));
        };
        if (options?.afterAuth) {
          options.afterAuth(resource).subscribe({
            next: () => finish(true),
            error: () => finish(false, 'provision'),
          });
          return;
        }
        finish(true);
      },
      error: () => {
        this.authBusySignal.set(false);
        this.clearSession(false);
        options?.onError?.('auth');
      },
    });
  }

  /**
   * Registers a user and routes to the sign-in flow on success (learning-center pattern).
   */
  signUp(
    signUpCommand: SignUpCommand,
    router: Router,
    options?: { loginUrl?: string; onError?: () => void },
  ): void {
    this.authBusySignal.set(true);
    this.iamApi.signUp(signUpCommand).subscribe({
      next: () => {
        this.authBusySignal.set(false);
        void router.navigateByUrl(options?.loginUrl ?? '/iam/sign-in');
      },
      error: () => {
        this.authBusySignal.set(false);
        options?.onError?.();
      },
    });
  }

  signOut(router: Router): void {
    this.clearSession(true);
    assignRandomPreviewUserId();
    void router.navigateByUrl('/iam/sign-in');
  }

  logout(): void {
    this.clearSession(true);
    assignRandomPreviewUserId();
  }

  private applySignIn(resource: SignInResource, role: 'owner' | 'admin'): void {
    localStorage.setItem(TOKEN_KEY, resource.token);
    this.persistSession(resource.username, resource.id, role);
  }

  private homeUrlForRole(role: 'owner' | 'admin'): string {
    return role === 'owner' ? '/control-panel' : '/operacion';
  }

  private persistSession(username: string, userId: number, role: 'owner' | 'admin'): void {
    const payload: IamSession = { username, userId, loggedInAt: Date.now(), role };
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(payload));
    this.session.set(payload);
    localStorage.removeItem(PREVIEW_KEY);
  }

  private clearSession(removeToken: boolean): void {
    sessionStorage.removeItem(SESSION_KEY);
    this.session.set(null);
    if (removeToken) {
      localStorage.removeItem(TOKEN_KEY);
    }
  }

  private resolveRole(raw?: string): 'owner' | 'admin' {
    if (raw === 'owner' || raw === 'admin') {
      return raw;
    }
    if (raw === 'ROLE_OWNER') {
      return 'owner';
    }
    if (raw === 'ROLE_ADMIN') {
      return 'admin';
    }
    return 'admin';
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
      const userId =
        typeof parsed.userId === 'number' && Number.isFinite(parsed.userId) ? parsed.userId : 1;
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

/** @deprecated Use {@link UserRole} from the domain entity. */
export type { UserRole };
