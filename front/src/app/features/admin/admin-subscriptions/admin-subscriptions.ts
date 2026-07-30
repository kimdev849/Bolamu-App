import { Component, inject, signal, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Api, AdminSubscription } from '../../../core/services/api';
import { Toast } from '../../../core/services/toast';
import { finalize } from 'rxjs';

@Component({
  selector: 'psr-admin-subscriptions',
  imports: [DatePipe],
  templateUrl: './admin-subscriptions.html',
  styleUrl: './admin-subscriptions.scss',
})
export class AdminSubscriptions implements OnInit {
  private readonly api = inject(Api);
  readonly subscriptions = signal<AdminSubscription[]>([]);
  readonly loading = signal(true);

  readonly statusLabels: Record<string, string> = {
    TRIAL: 'Essai gratuit',
    ACTIVE: 'Actif',
    EXPIRED: 'Expiré',
    CANCELLED: 'Annulé',
    PENDING: 'En attente',
  };

  readonly statusColors: Record<string, string> = {
    TRIAL: 'bg-blue-100 text-blue-700',
    ACTIVE: 'bg-emerald-100 text-emerald-700',
    EXPIRED: 'bg-red-100 text-red-700',
    CANCELLED: 'bg-slate-100 text-slate-500',
    PENDING: 'bg-amber-100 text-amber-700',
  };

  get plansCount() {
    const subs = this.subscriptions();
    return {
      total: subs.length,
      active: subs.filter(s => s.status === 'ACTIVE').length,
      trial: subs.filter(s => s.status === 'TRIAL').length,
      expired: subs.filter(s => s.status === 'EXPIRED' || s.status === 'CANCELLED').length,
      revenue: subs.filter(s => s.status === 'ACTIVE').reduce((sum, s) => sum + s.price, 0),
    };
  }

  ngOnInit(): void {
    this.loading.set(true);
    this.api.getAdminSubscriptions()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (res) => this.subscriptions.set(res.data),
        error: () => this.toast.error('Erreur', 'Impossible de charger les abonnements'),
      });
  }
}
