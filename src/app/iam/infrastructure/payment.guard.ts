import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { IamStore } from '../application/iam.store';
import { OnboardingDraftStore } from '../application/onboarding-draft.store';

/**
 * Allows payment when a plan is selected (onboarding guest or signed-in owner).
 */
export const paymentGuard: CanActivateFn = () => {
  const store = inject(IamStore);
  const drafts = inject(OnboardingDraftStore);
  const router = inject(Router);

  if (!drafts.selectedPlan()) {
    return router.createUrlTree(['/iam/owner/plans']);
  }

  if (!store.isSignedIn() || store.role() === 'owner') {
    return true;
  }

  return router.createUrlTree(['/operacion']);
};
