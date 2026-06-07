import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { IamService } from '../iam/application/iam.service';

/**
 * Para rutas “solo invitado” (p. ej. login). Úsalo cuando registres `path: 'login'` en `app.routes.ts`.
 */
export const guestGuard: CanActivateFn = () => {
  const auth = inject(IamService);
  const router = inject(Router);
  if (!auth.isAuthenticated()) {
    return true;
  }
  return router.createUrlTree(['/control-panel']);
};
