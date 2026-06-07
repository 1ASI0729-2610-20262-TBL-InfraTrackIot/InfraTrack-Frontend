import { DatePipe, DecimalPipe, UpperCasePipe } from '@angular/common';
import { Component, DestroyRef, inject, signal, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Router } from '@angular/router';
import { MatButton } from '@angular/material/button';
import { TranslatePipe } from '@ngx-translate/core';
import { forkJoin, of, type Observable } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';

import { IamService } from '../iam/application/iam.service';
import { INFRATRACK_API } from './infratrack-api.urls';
import type { SubscriptionApiDto, UserApiDto } from './infratrack-api.dto';
import { normalizeUserDto, pickUserFromList } from './user-profile.normalize';
import {
  pickSubscriptionForUser,
  subscriptionListFromBody,
} from './subscription/subscription-api.normalize';

const PREVIEW_KEY = 'infratrack_preview_user_id';

/** Vista mínima para la plantilla del perfil. */
export interface ProfileViewData {
  id: number;
  name: string;
  email: string;
  role: string;
  created_at: string;
  photo: string | null;
}

@Component({
  selector: 'app-profile-page',
  standalone: true,
  imports: [DatePipe, DecimalPipe, UpperCasePipe, TranslatePipe, MatButton],
  templateUrl: './profile-page.html',
  styleUrl: './profile-page.css',
})
export class ProfilePage implements OnInit {
  private readonly router = inject(Router);
  private readonly http = inject(HttpClient);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly iam = inject(IamService);
  readonly userData = signal<ProfileViewData | null>(null);
  readonly loading = signal(true);
  readonly error = signal(false);
  /** Suscripción del owner (sesión); GET /subscriptions?userId=… */
  readonly ownerSubscription = signal<SubscriptionApiDto | null>(null);

  ngOnInit(): void {
    const userId = this.resolveUserId();
    forkJoin({
      user: this.loadUser$(userId),
      sub: this.loadOwnerSubscription$(),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ user, sub }) => {
          this.loading.set(false);
          this.ownerSubscription.set(sub);
          if (user) {
            this.userData.set(this.toViewData(user));
            this.error.set(false);
          } else {
            this.error.set(true);
            this.userData.set(null);
          }
        },
        error: () => {
          this.loading.set(false);
          this.error.set(true);
          this.userData.set(null);
          this.ownerSubscription.set(null);
        },
      });
  }

  protected goToPlans(): void {
    void this.router.navigate(['/subscription-plans']);
  }

  private loadUser$(userId: number): Observable<UserApiDto | null> {
    const base = INFRATRACK_API.users;
    return this.http.get<unknown>(base).pipe(
      map((listBody) => this.resolveUserFromListBody(listBody, userId)),
      catchError(() => of<UserApiDto | null>(null)),
      switchMap((fromList) => {
        if (fromList) {
          return of(fromList);
        }
        return this.http.get<unknown>(`${base}/${userId}`).pipe(
          map((body) => normalizeUserDto(body)),
          catchError(() => of(null)),
        );
      }),
    );
  }

  private loadOwnerSubscription$(): Observable<SubscriptionApiDto | null> {
    if (this.iam.role() !== 'owner' || !this.iam.sessionData()) {
      return of(null);
    }
    const oid = this.iam.sessionData()!.userId;
    const params = new HttpParams().set('userId', String(oid));
    return this.http.get<unknown>(INFRATRACK_API.subscriptions, { params }).pipe(
      catchError(() => this.http.get<unknown>(INFRATRACK_API.subscriptions)),
      map((body) => pickSubscriptionForUser(subscriptionListFromBody(body), oid)),
      catchError(() => of(null)),
    );
  }

  /** GET /users suele funcionar aunque GET /users/:id devuelva 404 en MockAPI. */
  private resolveUserFromListBody(listBody: unknown, preferredId: number): UserApiDto | null {
    const byId = pickUserFromList(listBody, preferredId);
    if (byId) {
      return byId;
    }
    if (!Array.isArray(listBody)) {
      return null;
    }
    for (const item of listBody) {
      const u = normalizeUserDto(item);
      if (u) {
        return u;
      }
    }
    return null;
  }

  private toViewData(dto: UserApiDto): ProfileViewData {
    return {
      id: dto.id,
      name: dto.username,
      email: dto.email,
      role: dto.role,
      created_at: dto.createdAt,
      photo: null,
    };
  }

  private resolveUserId(): number {
    const fromSession = this.iam.sessionData()?.userId;
    if (fromSession != null && Number.isFinite(fromSession)) {
      return fromSession;
    }
    try {
      const raw = localStorage.getItem(PREVIEW_KEY);
      const n = Number(raw);
      if (Number.isFinite(n) && n > 0) {
        return n;
      }
    } catch {
      /* ignore */
    }
    return 1;
  }

  logout(): void {
    this.iam.logout();
    void this.router.navigate(['/login'], { replaceUrl: true });
  }
}
