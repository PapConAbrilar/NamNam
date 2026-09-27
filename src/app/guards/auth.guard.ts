import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Guard para proteger el acceso a las rutas principales (/tabs).
 * - Si no hay sesión activa: redirige a /login.
 * - Si hay sesión pero no completó el onboarding: redirige a /onboarding.
 */
export const authGuard: CanActivateFn = async () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Asegura que la sesión se haya restaurado (útil si usa Supabase)
  if (authService.isLoadingSession) {
    await authService.waitForSession();
  }

  const user = authService.currentUser;

  if (!user) {
    return router.createUrlTree(['/login']);
  }

  if (!user.hasCompletedOnboarding) {
    return router.createUrlTree(['/onboarding']);
  }

  return true;
};

/**
 * Guard para el onboarding:
 * - Requiere que haya usuario logueado.
 * - Si ya completó onboarding, redirige a /tabs/tab1.
 */
export const onboardingGuard: CanActivateFn = async () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isLoadingSession) {
    await authService.waitForSession();
  }

  const user = authService.currentUser;

  if (!user) {
    return router.createUrlTree(['/login']);
  }

  if (user.hasCompletedOnboarding) {
    return router.createUrlTree(['/tabs/tab1']);
  }

  return true;
};
