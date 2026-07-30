import { Component, inject, signal, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { Api } from '../../../core/services/api';
import { Auth } from '../../../core/services/auth';
import { STATUS_LABELS, STATUS_COLORS } from '../../../core/config/app.constants';

@Component({
  selector: 'psr-pharmacy-dashboard',
  imports: [RouterLink, DatePipe],
  templateUrl: './pharmacy-dashboard.html',
  styleUrl: './pharmacy-dashboard.scss',
})
export class PharmacyDashboard implements OnInit {
  private readonly api = inject(Api);
  private readonly auth = inject(Auth);

  readonly user = signal<any>(null);
  readonly pharmacy: any = { name: '—', city: '—' };
  readonly subscription = signal<any>(null);
  readonly myRequests = signal<any[]>([]);
  readonly myOrders = signal<any[]>([]);

  totalRequests = 0;
  pendingRequests = 0;
  totalOrders = 0;
  activeOrders = 0;
  monthlySpent = 0;

  protected readonly STATUS_LABELS = STATUS_LABELS;
  protected readonly STATUS_COLORS = STATUS_COLORS;

  ngOnInit(): void {
    this.user.set(this.auth.user());
    this.api.getMyPharmacyProfile().subscribe({
      next: (res) => {
        const p = res.data;
        Object.assign(this.pharmacy, p);
      },
    });
    this.api.getMySubscription().subscribe({
      next: (res) => this.subscription.set(res.data),
      error: () => { /* Pas d'abonnement = silencieux */ },
    });
    this.api.getMyRequests().subscribe({
      next: (res) => {
        const data = res.data || [];
        this.myRequests.set(data);
        this.totalRequests = data.length;
        this.pendingRequests = data.filter((r: any) => r.status === 'SEARCHING' || r.status === 'searching').length;
      },
    });
    this.api.getMyOrders().subscribe({
      next: (res) => {
        const data = res.data || [];
        this.myOrders.set(data);
        this.totalOrders = data.length;
        this.activeOrders = data.filter((o: any) =>
          o.orderStatus === 'CREATED' || o.orderStatus === 'CONFIRMED' || o.orderStatus === 'IN_PROGRESS' || o.orderStatus === 'PAID'
        ).length;
        this.monthlySpent = data.reduce((s: number, o: any) => s + (o.totalAmount || 0), 0);
      },
    });
  }

  /** Retourne le statut lisible de l'abonnement (déjà capitalisé) */
  get subStatus(): string {
    const sub = this.subscription();
    if (!sub) return 'Inactif';
    if (sub.status === 'ACTIVE') return 'Actif';
    if (sub.status === 'TRIAL') return 'Essai gratuit';
    if (sub.status === 'EXPIRED') return 'Expiré';
    if (sub.status === 'CANCELLED') return 'Annulé';
    return 'Inactif';
  }

  /** Retourne la date d'expiration formatée */
  get subEndDate(): string | null {
    const sub = this.subscription();
    if (!sub?.endDate) return null;
    const d = new Date(sub.endDate);
    return isNaN(d.getTime()) ? null : sub.endDate;
  }

  /** Couleur du statut */
  get subStatusColor(): string {
    const sub = this.subscription();
    if (!sub) return 'text-slate-400';
    if (sub.status === 'ACTIVE') return 'text-emerald-600';
    if (sub.status === 'TRIAL') return 'text-blue-600';
    return 'text-amber-600';
  }
}
