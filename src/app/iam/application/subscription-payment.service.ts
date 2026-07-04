import { Injectable } from '@angular/core';
import { delay, Observable, of } from 'rxjs';

export interface PaymentCardDetails {
  cardNumber: string;
  expiration: string;
  securityCode: string;
}

const PAYMENT_COMPLETED_KEY = 'infratrack_payment_completed';

/**
 * Simulates subscription checkout for onboarding and plan changes.
 */
@Injectable({ providedIn: 'root' })
export class SubscriptionPaymentService {
  isPaymentCompleted(): boolean {
    return sessionStorage.getItem(PAYMENT_COMPLETED_KEY) === 'true';
  }

  markPaymentCompleted(): void {
    sessionStorage.setItem(PAYMENT_COMPLETED_KEY, 'true');
  }

  clearPaymentCompleted(): void {
    sessionStorage.removeItem(PAYMENT_COMPLETED_KEY);
  }

  /**
   * Simulates a successful card charge after client-side validation.
   */
  processPayment(_details: PaymentCardDetails): Observable<void> {
    return of(undefined).pipe(delay(1400));
  }
}
