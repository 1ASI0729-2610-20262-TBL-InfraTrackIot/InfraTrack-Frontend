import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';

import {
  OnboardingDraftStore,
  SubscriptionPlanId,
} from '../../../application/onboarding-draft.store';
import { SubscriptionPaymentService } from '../../../application/subscription-payment.service';
import { LanguageSwitcher } from '../../../../shared/presentation/components/language-switcher/language-switcher';

const PLAN_NAME_KEYS: Record<SubscriptionPlanId, string> = {
  basic: 'signup.planBasicName',
  premium: 'signup.planPremiumName',
  enterprise: 'signup.planEnterpriseName',
};

const PLAN_PRICE_KEYS: Record<SubscriptionPlanId, string> = {
  basic: 'signup.planBasicPrice',
  premium: 'signup.planPremiumPrice',
  enterprise: 'signup.planEnterprisePrice',
};

@Component({
  selector: 'app-owner-payment-page',
  imports: [FormsModule, LanguageSwitcher, TranslatePipe],
  templateUrl: './owner-payment-page.html',
  styleUrl: './owner-payment-page.css',
})
export class OwnerPaymentPage {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly drafts = inject(OnboardingDraftStore);
  private readonly payment = inject(SubscriptionPaymentService);

  protected readonly fromProfile = computed(
    () => this.route.snapshot.queryParamMap.get('from') === 'profile',
  );

  protected readonly selectedPlan = computed(() => this.drafts.selectedPlan());

  protected readonly planNameKey = computed(() => {
    const plan = this.selectedPlan();
    return plan ? PLAN_NAME_KEYS[plan] : 'signup.planPremiumName';
  });

  protected readonly planPriceKey = computed(() => {
    const plan = this.selectedPlan();
    return plan ? PLAN_PRICE_KEYS[plan] : 'signup.planPremiumPrice';
  });

  protected readonly cardNumber = signal('');
  protected readonly expiration = signal('');
  protected readonly securityCode = signal('');
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly processing = signal(false);

  back(): void {
    if (this.fromProfile()) {
      void this.router.navigate(['/subscription-plans']);
      return;
    }
    void this.router.navigate(['/iam/owner/plans']);
  }

  onCardNumberInput(value: string): void {
    const digits = value.replace(/\D/g, '').slice(0, 16);
    const grouped = digits.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
    this.cardNumber.set(grouped);
  }

  onExpirationInput(value: string): void {
    const digits = value.replace(/\D/g, '').slice(0, 4);
    const formatted =
      digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
    this.expiration.set(formatted);
  }

  onSecurityCodeInput(value: string): void {
    this.securityCode.set(value.replace(/\D/g, '').slice(0, 4));
  }

  submit(): void {
    const cardDigits = this.cardNumber().replace(/\s/g, '');
    const expiration = this.expiration().trim();
    const cvv = this.securityCode().trim();

    if (!cardDigits || !expiration || !cvv) {
      this.errorMessage.set('payment.errorRequired');
      return;
    }

    if (cardDigits.length < 16) {
      this.errorMessage.set('payment.errorCardNumber');
      return;
    }

    if (!/^\d{2}\/\d{2}$/.test(expiration)) {
      this.errorMessage.set('payment.errorExpiration');
      return;
    }

    if (cvv.length < 3) {
      this.errorMessage.set('payment.errorSecurityCode');
      return;
    }

    this.errorMessage.set(null);
    this.processing.set(true);

    this.payment
      .processPayment({
        cardNumber: cardDigits,
        expiration,
        securityCode: cvv,
      })
      .subscribe({
        next: () => {
          this.payment.markPaymentCompleted();
          this.processing.set(false);
          const successRoute = this.fromProfile()
            ? ['/subscription-plans']
            : ['/iam/owner/plans'];
          void this.router.navigate(successRoute, { queryParams: { step: 'success' } });
        },
        error: () => {
          this.processing.set(false);
          this.errorMessage.set('payment.errorProcessing');
        },
      });
  }
}
