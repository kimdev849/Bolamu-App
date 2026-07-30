import { Component, inject, signal, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Api, AdminSubscription, SubscriptionPlan } from '../../../core/services/api';
import { Toast } from '../../../core/services/toast';
import { finalize, forkJoin } from 'rxjs';

@Component({
  selector: 'psr-admin-subscriptions',
  imports: [DatePipe],
  templateUrl: './admin-subscriptions.html',
  styleUrl: './admin-subscriptions.scss',
})
export class AdminSubscriptions implements OnInit {
  private readonly api = inject(Api);
  private readonly toast = inject(Toast);

  readonly subscriptions = signal<AdminSubscription[]>([]);
  readonly allPharmacies = signal<any[]>([]);
  readonly plans = signal<SubscriptionPlan[]>([]);
  readonly loading = signal(true);

  // Gérer modal
  readonly showManageModal = signal(false);
  readonly selectedSub = signal<AdminSubscription | null>(null);
  readonly selectedPlanId = signal('');
  readonly updating = signal(false);

  // Nouvel abonnement modal
  readonly showCreateModal = signal(false);
  readonly newPharmacyId = signal('');
  readonly newPlanId = signal('');
  readonly creating = signal(false);
  readonly searchQuery = signal('');

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

  get filteredPharmacies() {
    const q = this.searchQuery().toLowerCase();
    return this.allPharmacies().filter(
      (p) => p.name?.toLowerCase().includes(q) || p.email?.toLowerCase().includes(q)
    );
  }

  ngOnInit(): void {
    this.loadAll();
  }

  private loadAll(): void {
    this.loading.set(true);
    forkJoin({
      subscriptions: this.api.getAdminSubscriptions(),
      plans: this.api.getSubscriptionPlans(),
      pharmacies: this.api.getAdminPharmacies(1, 200),
    })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (res) => {
          this.subscriptions.set(res.subscriptions.data);
          this.plans.set(res.plans.data);
          this.allPharmacies.set((res.pharmacies.data || []).map((p: any) => ({
            ...p,
            city: p.city?.name || p.city || '—',
          })));
        },
        error: () => this.toast.error('Erreur', 'Impossible de charger les données'),
      });
  }

  // ───── Gérer ─────

  openManage(sub: AdminSubscription): void {
    this.selectedSub.set(sub);
    this.selectedPlanId.set(sub.plan);
    this.showManageModal.set(true);
  }

  changePlan(): void {
    const sub = this.selectedSub();
    if (!sub || !this.selectedPlanId()) return;
    this.updating.set(true);
    this.api.updateAdminSubscription(sub.id, { planId: this.selectedPlanId() })
      .pipe(finalize(() => this.updating.set(false)))
      .subscribe({
        next: () => {
          this.toast.success('Plan changé', 'L\'abonnement a été mis à jour');
          this.showManageModal.set(false);
          this.loadAll();
        },
        error: () => this.toast.error('Erreur', 'Impossible de changer le plan'),
      });
  }

  cancelManagedSubscription(): void {
    const sub = this.selectedSub();
    if (!sub) return;
    this.updating.set(true);
    this.api.updateAdminSubscription(sub.id, { status: 'CANCELLED' })
      .pipe(finalize(() => this.updating.set(false)))
      .subscribe({
        next: () => {
          this.toast.success('Abonnement annulé', 'L\'abonnement a été annulé');
          this.showManageModal.set(false);
          this.loadAll();
        },
        error: () => this.toast.error('Erreur', 'Impossible d\'annuler l\'abonnement'),
      });
  }

  // ───── Nouvel abonnement ─────

  openCreate(): void {
    this.newPharmacyId.set('');
    this.newPlanId.set('');
    this.searchQuery.set('');
    this.showCreateModal.set(true);
  }

  createSubscription(): void {
    if (!this.newPharmacyId() || !this.newPlanId()) {
      this.toast.warning('Champs requis', 'Sélectionnez une pharmacie et un plan');
      return;
    }
    this.creating.set(true);
    this.api.createAdminSubscription(this.newPharmacyId(), this.newPlanId())
      .pipe(finalize(() => this.creating.set(false)))
      .subscribe({
        next: () => {
          this.toast.success('Abonnement créé', 'Le nouvel abonnement est actif');
          this.showCreateModal.set(false);
          this.loadAll();
        },
        error: (err) => {
          const msg = err.error?.message || 'Erreur lors de la création';
          this.toast.error('Erreur', msg);
        },
      });
  }

  // ───── Helpers ─────

  safeDate(date: string | undefined | null): string | null {
    if (!date) return null;
    // Si c'est déjà un objet ou autre chose qu'une string, return null
    if (typeof date !== 'string') return null;
    // Vérifier que c'est une date valide
    const d = new Date(date);
    if (isNaN(d.getTime())) return null;
    return date;
  }
}
