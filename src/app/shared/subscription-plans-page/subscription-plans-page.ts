import { DatePipe, DecimalPipe, UpperCasePipe } from '@angular/common';
import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { MatButton } from '@angular/material/button';
import {
  MatCard,
  MatCardContent,
  MatCardHeader,
  MatCardSubtitle,
  MatCardTitle,
} from '@angular/material/card';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { MatSlideToggle } from '@angular/material/slide-toggle';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { catchError, finalize, map, of, switchMap, take } from 'rxjs';

import { IamService } from '../../iam/application/iam.service';
import { INFRATRACK_API } from '../infratrack-api.urls';
import { SubscriptionApiDto } from '../infratrack-api.dto';
import { infratrackPutDeleteAllowed } from '../infratrack-http-policy';
import { coercePlanTier, PLAN_CATALOG, type SubscriptionPlanTier } from '../subscription/plan-catalog';
import {
  pickSubscriptionForUser,
  subscriptionListFromBody,
} from '../subscription/subscription-api.normalize';

@Component({
  selector: 'app-subscription-plans-page',
  standalone: true,
  imports: [
    RouterLink,
    MatButton,
    MatCard,
    MatCardHeader,
    MatCardTitle,
    MatCardSubtitle,
    MatCardContent,
    MatSlideToggle,
    MatProgressSpinner,
    TranslatePipe,
    DatePipe,
    DecimalPipe,
    UpperCasePipe,
  ],
  templateUrl: './subscription-plans-page.html',
  styleUrl: './subscription-plans-page.css',
})
export class SubscriptionPlansPage implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly iam = inject(IamService);
  private readonly router = inject(Router);
  private readonly snack = inject(MatSnackBar);
  private readonly translate = inject(TranslateService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly loading = signal(true);
  protected readonly saving = signal(false);
  protected readonly subscription = signal<SubscriptionApiDto | null>(null);
  protected readonly tiers: SubscriptionPlanTier[] = ['basic', 'premium', 'enterprise'];

  protected readonly httpPutEnabled = signal(infratrackPutDeleteAllowed());

  ngOnInit(): void {
    this.reload();
  }

  protected reload(): void {
    const session = this.iam.sessionData();
    if (!session || session.role !== 'owner') {
      void this.router.navigate(['/profile']);
      return;
    }
    this.loading.set(true);
    const params = new HttpParams().set('userId', String(session.userId));
    this.http
      .get<unknown>(INFRATRACK_API.subscriptions, { params })
      .pipe(
        catchError(() => this.http.get<unknown>(INFRATRACK_API.subscriptions)),
        map((body) => pickSubscriptionForUser(subscriptionListFromBody(body), session.userId)),
        catchError(() => of<SubscriptionApiDto | null>(null)),
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((sub) => this.subscription.set(sub));
  }

  protected currentTier(): SubscriptionPlanTier {
    const s = this.subscription();
    return coercePlanTier(s?.plan ?? s?.planName);
  }

  protected isCurrentTier(tier: SubscriptionPlanTier): boolean {
    return this.currentTier() === tier;
  }

  protected catalogFor(tier: SubscriptionPlanTier) {
    return PLAN_CATALOG[tier];
  }

  protected selectPlan(tier: SubscriptionPlanTier): void {
    if (!this.httpPutEnabled() || this.saving() || this.isCurrentTier(tier)) {
      return;
    }
    const current = this.subscription();
    if (!current) {
      this.snack.open(this.translate.instant('subscriptionPlans.noRecord'), undefined, { duration: 4000 });
      return;
    }
    const next = this.mergeTier(current, tier);
    this.saving.set(true);
    this.http
      .put<unknown>(`${INFRATRACK_API.subscriptions}/${current.id}`, next)
      .pipe(
        take(1),
        switchMap(() => {
          const session = this.iam.sessionData()!;
          const params = new HttpParams().set('userId', String(session.userId));
          return this.http.get<unknown>(INFRATRACK_API.subscriptions, { params }).pipe(
            catchError(() => this.http.get<unknown>(INFRATRACK_API.subscriptions)),
            map((body) => pickSubscriptionForUser(subscriptionListFromBody(body), session.userId)),
            catchError(() => of<SubscriptionApiDto | null>(null)),
          );
        }),
        finalize(() => this.saving.set(false)),
      )
      .subscribe({
        next: (sub) => {
          this.subscription.set(sub);
          this.snack.open(this.translate.instant('subscriptionPlans.planSaved'), undefined, { duration: 2800 });
        },
        error: () => {
          this.snack.open(this.translate.instant('subscriptionPlans.planError'), undefined, { duration: 4500 });
        },
      });
  }

  protected onAutoRenew(checked: boolean): void {
    if (!this.httpPutEnabled() || this.saving()) {
      this.reload();
      return;
    }
    const current = this.subscription();
    if (!current) {
      return;
    }
    const next: SubscriptionApiDto = { ...current, autoRenew: checked };
    this.saving.set(true);
    this.http
      .put<unknown>(`${INFRATRACK_API.subscriptions}/${current.id}`, next)
      .pipe(
        take(1),
        finalize(() => this.saving.set(false)),
      )
      .subscribe({
        next: () => {
          this.subscription.update((s) => (s ? { ...s, autoRenew: checked } : s));
          this.snack.open(this.translate.instant('subscriptionPlans.autoRenewSaved'), undefined, { duration: 2200 });
        },
        error: () => {
          this.snack.open(this.translate.instant('subscriptionPlans.planError'), undefined, { duration: 4500 });
          this.reload();
        },
      });
  }

  private mergeTier(current: SubscriptionApiDto, tier: SubscriptionPlanTier): SubscriptionApiDto {
    const cat = PLAN_CATALOG[tier];
    const label = tier.toUpperCase();
    return {
      ...current,
      plan: label,
      planName: label,
      maxMachinery: cat.maxMachinery,
      pricePen: cat.pricePen,
      userId: current.userId ?? this.iam.sessionData()?.userId,
      status: current.status ?? 'active',
    };
  }
}
