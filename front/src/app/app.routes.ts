import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth-guard';
import { noAuthGuard } from './core/guards/no-auth';
import { roleGuard } from './core/guards/role';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/onboarding/onboarding-landing/onboarding-landing').then((c) => c.OnboardingLanding),
  },
  {
    path: 'request-access',
    loadComponent: () => import('./features/onboarding/request-access/request-access').then((c) => c.RequestAccess),
  },
  {
    path: 'auth',
    canActivate: [noAuthGuard],
    loadComponent: () => import('./features/auth/auth-layout/auth-layout').then((c) => c.AuthLayout),
    children: [
      {
        path: 'login',
        loadComponent: () => import('./features/auth/login/login').then((c) => c.Login),
      },
      {
        path: 'forgot-password',
        loadComponent: () => import('./features/auth/forgot-password/forgot-password').then((c) => c.ForgotPassword),
      },
      {
        path: 'reset-password',
        loadComponent: () => import('./features/auth/reset-password/reset-password').then((c) => c.ResetPassword),
      },
      {
        path: '',
        redirectTo: 'login',
        pathMatch: 'full',
      },
    ],
  },
  {
    path: 'admin',
    canActivate: [authGuard, roleGuard(['admin'])],
    loadComponent: () => import('./features/admin/admin-layout/admin-layout').then((c) => c.AdminLayout),
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./features/admin/admin-dashboard/admin-dashboard').then((c) => c.AdminDashboard),
      },
      {
        path: 'onboarding',
        loadComponent: () => import('./features/admin/admin-onboarding/admin-onboarding').then((c) => c.AdminOnboarding),
      },
      {
        path: 'pharmacies',
        loadComponent: () => import('./features/admin/admin-pharmacies/admin-pharmacies').then((c) => c.AdminPharmacies),
      },
      {
        path: 'wholesalers',
        loadComponent: () => import('./features/admin/admin-wholesalers/admin-wholesalers').then((c) => c.AdminWholesalers),
      },
      {
        path: 'delivery-companies',
        loadComponent: () => import('./features/admin/admin-delivery-companies/admin-delivery-companies').then((c) => c.AdminDeliveryCompanies),
      },
      {
        path: 'orders',
        loadComponent: () => import('./features/admin/admin-orders/admin-orders').then((c) => c.AdminOrders),
      },
      {
        path: 'commissions',
        loadComponent: () => import('./features/admin/admin-commissions/admin-commissions').then((c) => c.AdminCommissions),
      },
      {
        path: 'subscriptions',
        loadComponent: () => import('./features/admin/admin-subscriptions/admin-subscriptions').then((c) => c.AdminSubscriptions),
      },
      {
        path: 'reports',
        loadComponent: () => import('./features/admin/admin-reports/admin-reports').then((c) => c.AdminReports),
      },
      {
        path: 'settings',
        loadComponent: () => import('./features/admin/admin-settings/admin-settings').then((c) => c.AdminSettings),
      },
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
    ],
  },
  {
    path: 'pharmacy',
    canActivate: [authGuard, roleGuard(['pharmacy'])],
    loadComponent: () => import('./features/pharmacy/pharmacy-layout/pharmacy-layout').then((c) => c.PharmacyLayout),
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./features/pharmacy/pharmacy-dashboard/pharmacy-dashboard').then((c) => c.PharmacyDashboard),
      },
      {
        path: 'requests',
        loadComponent: () => import('./features/pharmacy/pharmacy-requests/pharmacy-requests').then((c) => c.PharmacyRequests),
      },
      {
        path: 'orders',
        loadComponent: () => import('./features/pharmacy/pharmacy-orders/pharmacy-orders').then((c) => c.PharmacyOrders),
      },
      {
        path: 'deliveries',
        loadComponent: () => import('./features/pharmacy/pharmacy-deliveries/pharmacy-deliveries').then((c) => c.PharmacyDeliveries),
      },
      {
        path: 'subscription',
        loadComponent: () => import('./features/pharmacy/pharmacy-subscription/pharmacy-subscription').then((c) => c.PharmacySubscription),
      },
      {
        path: 'profile',
        loadComponent: () => import('./features/pharmacy/pharmacy-profile/pharmacy-profile').then((c) => c.PharmacyProfile),
      },
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
    ],
  },
  {
    path: 'wholesaler',
    canActivate: [authGuard, roleGuard(['wholesaler'])],
    loadComponent: () => import('./features/wholesaler/wholesaler-layout/wholesaler-layout').then((c) => c.WholesalerLayout),
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./features/wholesaler/wholesaler-dashboard/wholesaler-dashboard').then((c) => c.WholesalerDashboard),
      },
      {
        path: 'requests',
        loadComponent: () => import('./features/wholesaler/wholesaler-requests/wholesaler-requests').then((c) => c.WholesalerRequests),
      },
      {
        path: 'orders',
        loadComponent: () => import('./features/wholesaler/wholesaler-orders/wholesaler-orders').then((c) => c.WholesalerOrders),
      },
      {
        path: 'history',
        loadComponent: () => import('./features/wholesaler/wholesaler-history/wholesaler-history').then((c) => c.WholesalerHistory),
      },
      {
        path: 'profile',
        loadComponent: () => import('./features/wholesaler/wholesaler-profile/wholesaler-profile').then((c) => c.WholesalerProfile),
      },
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
    ],
  },
  {
    path: 'delivery',
    canActivate: [authGuard, roleGuard(['delivery_company'])],
    loadComponent: () => import('./features/delivery-company/delivery-layout/delivery-layout').then((c) => c.DeliveryLayout),
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./features/delivery-company/delivery-dashboard/delivery-dashboard').then((c) => c.DeliveryDashboard),
      },
      {
        path: 'missions',
        loadComponent: () => import('./features/delivery-company/delivery-missions/delivery-missions').then((c) => c.DeliveryMissions),
      },
      {
        path: 'agents',
        loadComponent: () => import('./features/delivery-company/delivery-agents/delivery-agents').then((c) => c.DeliveryAgents),
      },
      {
        path: 'history',
        loadComponent: () => import('./features/delivery-company/delivery-history/delivery-history').then((c) => c.DeliveryHistory),
      },
      {
        path: 'profile',
        loadComponent: () => import('./features/delivery-company/delivery-profile/delivery-profile').then((c) => c.DeliveryProfile),
      },
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
    ],
  },
  {
    path: '**',
    redirectTo: '/',
  },
];
