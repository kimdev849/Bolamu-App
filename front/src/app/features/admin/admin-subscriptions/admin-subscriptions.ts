import { Component, inject, signal, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Api } from '../../../core/services/api';

@Component({
  selector: 'psr-admin-subscriptions',
  imports: [DatePipe],
  templateUrl: './admin-subscriptions.html',
  styleUrl: './admin-subscriptions.scss',
})
export class AdminSubscriptions implements OnInit {
  private readonly api = inject(Api);
  readonly pharmacies = signal<any[]>([]);

  readonly statusLabels: Record<string, string> = {
    active: 'Actif', expired: 'Expiré', pending: 'En attente', cancelled: 'Annulé',
  };
  readonly statusColors: Record<string, string> = {
    active: 'bg-emerald-100 text-emerald-700', expired: 'bg-red-100 text-red-700',
    pending: 'bg-amber-100 text-amber-700', cancelled: 'bg-slate-100 text-slate-500',
  };

  get activeCount() { return this.pharmacies().filter(p => p.isActive).length; }
  get expiredCount() { return this.pharmacies().filter(p => p.subscriptionStatus === 'expired').length; }
  get pendingCount() { return this.pharmacies().filter(p => p.subscriptionStatus === 'pending').length; }

  ngOnInit(): void {
    this.api.getAdminPharmacies(1, 100).subscribe({
      next: (res) => this.pharmacies.set(res.data || []),
    });
  }
}
