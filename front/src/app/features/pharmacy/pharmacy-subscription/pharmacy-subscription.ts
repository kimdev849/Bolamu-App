import { Component, inject, signal, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Api, SubscriptionPlan, MySubscription } from '../../../core/services/api';
import { Toast } from '../../../core/services/toast';
import { finalize, forkJoin } from 'rxjs';

@Component({
  selector: 'psr-pharmacy-subscription',
  imports: [DatePipe, RouterLink],
  templateUrl: './pharmacy-subscription.html',
  styleUrl: './pharmacy-subscription.scss',
})
export class PharmacySubscription implements OnInit {
  private readonly api = inject(Api);
  private readonly toast = inject(Toast);

  readonly plans = signal<SubscriptionPlan[]>([]);
  readonly mySubscription = signal<MySubscription | null>(null);
  readonly loading = signal(true);
  readonly subscribing = signal<string | null>(null); // planId being subscribed
  readonly showCancelModal = signal(false);

  ngOnInit(): void {
    this.loadData();
  }

  private loadData(): void {
    this.loading.set(true);
    forkJoin({
      plans: this.api.getSubscriptionPlans(),
      mySub: this.api.getMySubscription(),
    })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (res) => {
          this.plans.set(res.plans.data);
          this.mySubscription.set(res.mySub.data);
        },
        error: () => this.toast.error('Erreur', 'Impossible de charger les données d\'abonnement'),
      });
  }

  subscribe(planId: string): void {
    const current = this.mySubscription();
    if (current?.plan === planId && current.status === 'ACTIVE') {
      this.toast.info('Déjà actif', 'Vous êtes déjà abonné à ce plan');
      return;
    }

    this.subscribing.set(planId);
    this.api.subscribeToPlan(planId).pipe(finalize(() => this.subscribing.set(null))).subscribe({
      next: (res) => {
        this.mySubscription.set(res.data as any);
        this.toast.success('Abonnement activé', `Passage au plan ${res.data?.planName || 'choisi'} réussi`);
        // Recharger les données
        this.loadData();
      },
      error: () => this.toast.error('Erreur', 'Impossible de souscrire à ce plan'),
    });
  }

  cancelSubscription(): void {
    this.api.cancelSubscription().subscribe({
      next: () => {
        this.toast.success('Abonnement annulé', 'Vous pourrez le réactiver à tout moment');
        this.showCancelModal.set(false);
        this.loadData();
      },
      error: () => this.toast.error('Erreur', 'Impossible d\'annuler l\'abonnement'),
    });
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      TRIAL: 'Essai gratuit',
      ACTIVE: 'Actif',
      EXPIRED: 'Expiré',
      CANCELLED: 'Annulé',
      PENDING: 'En attente',
    };
    return labels[status] || status;
  }

  getStatusColor(status: string): string {
    const colors: Record<string, string> = {
      TRIAL: 'bg-blue-100 text-blue-700',
      ACTIVE: 'bg-emerald-100 text-emerald-700',
      EXPIRED: 'bg-red-100 text-red-700',
      CANCELLED: 'bg-slate-100 text-slate-500',
      PENDING: 'bg-amber-100 text-amber-700',
    };
    return colors[status] || 'bg-slate-100 text-slate-500';
  }

  isCurrentPlan(planId: string): boolean {
    const sub = this.mySubscription();
    return sub?.plan === planId && sub?.status === 'ACTIVE';
  }

  /** Vérifie si l'utilisateur a déjà un abonnement actif (quel que soit le plan) */
  get hasActiveSub(): boolean {
    const sub = this.mySubscription();
    return !!(sub && (sub.status === 'ACTIVE' || sub.status === 'TRIAL'));
  }

  /** Texte du bouton en fonction du contexte */
  getButtonLabel(planId: string): string {
    if (this.subscribing() === planId) return 'Souscription...';
    if (this.isCurrentPlan(planId)) return 'Plan actuel';
    if (this.hasActiveSub) return 'Changer pour ce plan';
    return 'Souscrire';
  }

  /** Désactiver le bouton si abonnement en cours ou plan actuel */
  isButtonDisabled(planId: string): boolean {
    return this.subscribing() !== null || this.isCurrentPlan(planId);
  }
}
