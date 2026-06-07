import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { IamService } from '../../iam/application/iam.service';

/** Solo usuarios con rol `owner` (sesión demo). */
export const ownerGuard: CanActivateFn = () => {
  const iam = inject(IamService);
  const router = inject(Router);
  if (iam.role() === 'owner') {
    return true;
  }
  return router.parseUrl('/profile');
};
