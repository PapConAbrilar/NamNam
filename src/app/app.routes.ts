import { Routes } from '@angular/router';
import { authGuard, onboardingGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.page').then((m) => m.LoginPage),
  },
  {
    path: 'onboarding',
    canActivate: [onboardingGuard],
    loadComponent: () => import('./pages/onboarding/onboarding.page').then((m) => m.OnboardingPage),
  },
  {
    path: 'gacha',
    canActivate: [authGuard],
    loadComponent: () => import('./gacha/pages/gacha-page/gacha.page').then((m) => m.GachaPage),
  },
  {
    path: '',
    canActivate: [authGuard],
    loadChildren: () => import('./tabs/tabs.routes').then((m) => m.routes),
  },
];