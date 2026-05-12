import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';

import { INFRATRACK_API } from './infratrack-api.urls';
import { OperatorApiDto, UserApiDto, UserRole } from './infratrack-api.dto';
import {
  normalizeUserDto,
  pickOperatorForUser,
  pickUserFromList,
} from './user-profile.normalize';
import { assignRandomPreviewUserId, IamService } from '../iam/application/iam.service';

/**
 * Bases MockAPI.io acordadas para InfraTrack.
 */
export const MOCK_API_BASE_URLS = {
  controlPanel: 'https://6a02a9550d92f63dd253e48d.mockapi.io/api/v1',
  assetManagement: 'https://6a02a7340d92f63dd253e0e6.mockapi.io/api/v1',
  telemetry: 'https://6a02a70a0d92f63dd253e074.mockapi.io/api/v1',
  operations: 'https://6a02a56d0d92f63dd253dd53.mockapi.io/api/v1',
  subscriptions: 'https://69fb34c188a7af0ecca8aca0.mockapi.io/api/v1',
  identity: 'https://6a02a56d0d92f63dd253dd53.mockapi.io/api/v1',
} as const;

export type MockApiBaseKey = keyof typeof MOCK_API_BASE_URLS;


const DEMO_ROLES: UserRole[] = ['admin', 'owner', 'technician'];

function buildSyntheticUser(id: number): UserApiDto {
  const role = DEMO_ROLES[(id - 1) % DEMO_ROLES.length];
  const stamp = new Date(Date.UTC(2025, 0, 5 + (id % 20), 10, 30, 0)).toISOString();
  return {
    id,
    username: `demo_user_${id}`,
    email: `usuario${id}@infratrack.demo`,
    passwordHash: '—',
    role,
    isActive: true,
    createdAt: stamp,
  };
}

function buildSyntheticOperator(userId: number): OperatorApiDto {
  return {
    id: 900 + userId,
    userId,
    fullName: `Operador ${userId}`,
    licenseNumber: `Q1-${2000 + userId}`,
    phone: `+51 900 ${String(800000 + userId * 97).slice(-6)}`,
    status: 'active',
  };
}

@Injectable({ providedIn: 'root' })
export class UserProfileStore {
  private readonly http = inject(HttpClient);
  private readonly iam = inject(IamService);

  /** Endpoint GET usado para usuarios (mostrar en ayuda si hay 404). */
  readonly usersApiUrl = INFRATRACK_API.users;
  readonly operatorsApiUrl = INFRATRACK_API.operators;

  private ephemeralPreviewId: number | null = null;

  private readonly userSignal = signal<UserApiDto | null>(null);
  private readonly operatorSignal = signal<OperatorApiDto | null>(null);
  private readonly loadingSignal = signal(false);
  private readonly previewUserIdSignal = signal<number | null>(null);
  private readonly fromApiSignal = signal(false);
  private readonly operatorFromApiSignal = signal(false);

  readonly user = computed(() => this.userSignal());
  readonly operator = computed(() => this.operatorSignal());
  readonly loading = computed(() => this.loadingSignal());
  readonly previewUserId = computed(() => this.previewUserIdSignal());
  readonly isOfflineDemo = computed(() => !this.fromApiSignal());
  readonly operatorIsDemo = computed(() => !this.operatorFromApiSignal());
  readonly hasProfile = computed(() => this.userSignal() !== null);

  load(): void {
    let userId = this.resolveUserId();
    if (userId == null) {
      assignRandomPreviewUserId();
      userId = this.resolveUserId();
    }
    if (userId == null) {
      this.ephemeralPreviewId = Math.floor(Math.random() * 7) + 1;
      userId = this.ephemeralPreviewId;
    }
    this.previewUserIdSignal.set(userId);
    this.fromApiSignal.set(false);
    this.operatorFromApiSignal.set(false);
    this.userSignal.set(buildSyntheticUser(userId));
    this.operatorSignal.set(buildSyntheticOperator(userId));
    this.loadingSignal.set(true);

    this.fetchUser$(userId)
      .pipe(
        switchMap((apiUser) => {
          const resolved = apiUser ?? buildSyntheticUser(userId);
          return this.fetchOperatorForUser$(resolved.id).pipe(
            map((apiOp) => ({ apiUser, resolved, apiOp })),
          );
        }),
      )
      .subscribe(({ apiUser, resolved, apiOp }) => {
        this.fromApiSignal.set(!!apiUser);
        this.userSignal.set(resolved);
        this.operatorFromApiSignal.set(!!apiOp);
        this.operatorSignal.set(apiOp ?? buildSyntheticOperator(resolved.id));
        this.loadingSignal.set(false);
      });
  }

  clear(): void {
    this.userSignal.set(null);
    this.operatorSignal.set(null);
    this.fromApiSignal.set(false);
    this.operatorFromApiSignal.set(false);
    this.ephemeralPreviewId = null;
  }

  /** MockAPI suele listar bien aunque GET /users/:id falle; probamos lista primero y luego detalle. */
  private fetchUser$(userId: number): Observable<UserApiDto | null> {
    const base = INFRATRACK_API.users;
    const fromList = this.http.get<unknown>(base).pipe(
      map((body) => pickUserFromList(body, userId)),
      catchError(() => of(null)),
    );
    const fromId = this.http.get<unknown>(`${base}/${userId}`).pipe(
      map((body) => normalizeUserDto(body)),
      catchError(() => of(null)),
    );
    return fromList.pipe(switchMap((u) => (u ? of(u) : fromId)));
  }

  private fetchOperatorForUser$(userId: number): Observable<OperatorApiDto | null> {
    return this.http.get<unknown>(INFRATRACK_API.operators).pipe(
      map((body) => pickOperatorForUser(body, userId)),
      catchError(() => of(null)),
    );
  }

  private resolveUserId(): number | null {
    const fromSession = this.iam.sessionData()?.userId;
    if (fromSession != null && Number.isFinite(fromSession)) {
      return fromSession;
    }
    const raw = localStorage.getItem('infratrack_preview_user_id');
    const n = Number(raw);
    if (Number.isFinite(n) && n > 0) {
      return n;
    }
    if (this.ephemeralPreviewId != null) {
      return this.ephemeralPreviewId;
    }
    return null;
  }
}
