import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Guards routes that require any authenticated user.
 * Redirects to home if not signed in.
 */
export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isSignedIn()) {
    return true;
  }

  return router.createUrlTree(['/']);
};
