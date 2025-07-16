import { Routes } from '@angular/router';

export const routes: Routes = [
  { 
    path: 'login', 
    loadComponent: () => import('./components/login/login.component').then(m => m.LoginComponent) 
  },
  { 
    path: 'register', 
    loadComponent: () => import('./components/register/register.component').then(m => m.RegisterComponent) 
  },
  { 
    path: 'dashboard', 
    loadComponent: () => import('./components/dashboard/dashboard.component').then(m => m.DashboardComponent) 
  },
  { 
    path: 'new-proposal', 
    loadComponent: () => import('./components/proposal-form/proposal-form.component').then(m => m.ProposalFormComponent) 
  },
  { 
    path: 'claims', 
    loadComponent: () => import('./components/claims/claims.component').then(m => m.ClaimsComponent) 
  },
  { 
    path: 'health-check', 
    loadComponent: () => import('./components/health-check/health-check.component').then(m => m.HealthCheckComponent) 
  },
  { 
    path: 'profile', 
    loadComponent: () => import('./components/profile/profile.component').then(m => m.ProfileComponent) 
  },
  { 
    path: '', 
    redirectTo: '/login', 
    pathMatch: 'full' 
  },
  { 
    path: '**', 
    redirectTo: '/login' 
  }
];
