import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { IamService } from '../iam/application/iam.service';

/**
 * Para rutas protegidas.
 */
export const authGuard: CanActivateFn = () => {
  const auth = inject(IamService);
  const router = inject(Router);
  if (auth.isAuthenticated()) {
    return true;
  }
  return router.createUrlTree(['/login']);
};
