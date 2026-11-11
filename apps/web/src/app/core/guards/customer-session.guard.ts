
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { CustomerSessionService } from '../services/customer-session.service';

export const customerSessionGuard: CanActivateFn = () => {
  const customerSession = inject(CustomerSessionService);
  const router = inject(Router);

  if (customerSession.currentCustomer) {
    return true;
  }

  return router.createUrlTree(['/customer']);
};
