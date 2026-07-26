import { Component, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { mockPharmacies } from '../../../core/mock/db';

@Component({
  selector: 'psr-admin-subscriptions',
  imports: [DatePipe],
  templateUrl: './admin-subscriptions.html',
  styleUrl: './admin-subscriptions.scss',
})
export class AdminSubscriptions {
  readonly pharmacies = signal(mockPharmacies);

  readonly activeCount = mockPharmacies.filter(p => p.subscriptionStatus === 'active').length;
  readonly expiredCount = mockPharmacies.filter(p => p.subscriptionStatus === 'expired').length;
  readonly pendingCount = mockPharmacies.filter(p => p.subscriptionStatus === 'pending' || p.subscriptionStatus === 'cancelled').length;

  readonly statusLabels: Record<string, string> = {
    active: 'Actif',
    expired: 'Expiré',
    pending: 'En attente',
    cancelled: 'Annulé',
  };

  readonly statusColors: Record<string, string> = {
    active: 'bg-emerald-100 text-emerald-700',
    expired: 'bg-red-100 text-red-700',
    pending: 'bg-amber-100 text-amber-700',
    cancelled: 'bg-slate-100 text-slate-500',
  };
}
