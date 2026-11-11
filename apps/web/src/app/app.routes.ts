
import { Routes } from '@angular/router';
import { customerSessionGuard } from './core/guards/customer-session.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/landing/landing.component')
        .then(m => m.LandingComponent)
  },
  {
    path: 'customer',
    loadComponent: () =>
      import('./features/customer-portal/customer-portal.component')
        .then(m => m.CustomerPortalComponent)
  },
  {
    path: 'dashboard',
    canActivate: [customerSessionGuard],
    loadComponent: () =>
      import('./features/dashboard/dashboard.component')
        .then(m => m.DashboardComponent)
  },
  {
    path: 'admin',
    loadComponent: () =>
      import('./features/admin/admin.component')
        .then(m => m.AdminComponent)
  },
  {
    path: 'investigation',
    canActivate: [customerSessionGuard],
    loadComponent: () =>
      import('./features/investigation/investigation.component')
        .then(m => m.InvestigationComponent)
  },
  {
    path: 'transactions',
    canActivate: [customerSessionGuard],
    loadComponent: () =>
      import('./features/transactions/transactions.component')
        .then(m => m.TransactionsComponent)
  },
  {
    path: 'disputes',
    canActivate: [customerSessionGuard],
    loadComponent: () =>
      import('./features/disputes/disputes.component')
        .then(m => m.DisputesComponent)
  },
  {
    path: 'support',
    loadComponent: () =>
      import('./features/support/support-dashboard/support-dashboard.component')
        .then(m => m.SupportDashboardComponent)
  },
  {
    path: 'support/disputes/:disputeId',
    loadComponent: () =>
      import('./features/support/dispute-details/dispute-details.component')
        .then(m => m.DisputeDetailsComponent)
  },
  {
    path: '**',
    redirectTo: ''
  }
];
