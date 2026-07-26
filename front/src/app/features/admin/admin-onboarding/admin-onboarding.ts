import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { DateAgoPipe } from '../../../shared/pipes/date-ago-pipe';
import { Api } from '../../../core/services/api';
import { Toast } from '../../../core/services/toast';

@Component({
  selector: 'psr-admin-onboarding',
  imports: [DateAgoPipe],
  templateUrl: './admin-onboarding.html',
  styleUrl: './admin-onboarding.scss',
})
export class AdminOnboarding implements OnInit {
  private readonly api = inject(Api);
  private readonly toast = inject(Toast);

  readonly requests = signal<any[]>([]);
  readonly selectedTab = signal<string>('pending');
  readonly isLoading = signal(false);

  readonly ENTITY_LABELS: Record<string, string> = {
    pharmacy: 'Pharmacie', wholesaler: 'Grossiste', delivery_company: 'Transport & Livraison',
  };
  readonly STATUS_LABELS: Record<string, string> = {
    PENDING: 'En attente', CONTACTED: 'Contacté', APPROVED: 'Approuvé', REJECTED: 'Rejeté',
    pending: 'En attente', approved: 'Approuvé', rejected: 'Rejeté',
  };
  readonly STATUS_COLORS: Record<string, string> = {
    PENDING: 'bg-amber-100 text-amber-700', CONTACTED: 'bg-blue-100 text-blue-700',
    APPROVED: 'bg-emerald-100 text-emerald-700', REJECTED: 'bg-red-100 text-red-700',
    pending: 'bg-amber-100 text-amber-700', approved: 'bg-emerald-100 text-emerald-700', rejected: 'bg-red-100 text-red-700',
  };
  readonly tabs = [
    { key: 'PENDING', label: 'En attente' }, { key: 'APPROVED', label: 'Approuvées' },
    { key: 'REJECTED', label: 'Rejetées' }, { key: 'all', label: 'Toutes' },
  ];

  ngOnInit(): void {
    this.loadRequests();
  }

  private loadRequests(): void {
    this.isLoading.set(true);
    this.api.getOnboardingRequests(this.selectedTab()).subscribe({
      next: (res) => this.requests.set(res.data || []),
      complete: () => this.isLoading.set(false),
    });
  }

  selectTab(key: string): void {
    this.selectedTab.set(key);
    this.loadRequests();
  }

  get filteredRequests(): any[] {
    const all = this.requests();
    const tab = this.selectedTab();
    if (tab === 'all') return all;
    return all.filter((r: any) => r.status === tab);
  }

  readonly pendingRequests = computed(() => this.requests().filter((r: any) => r.status === 'PENDING' || r.status === 'pending'));
  readonly approvedRequests = computed(() => this.requests().filter((r: any) => r.status === 'APPROVED' || r.status === 'approved'));
  readonly rejectedRequests = computed(() => this.requests().filter((r: any) => r.status === 'REJECTED' || r.status === 'rejected'));

  approve(requestId: string): void {
    this.api.approveOnboardingRequest(requestId).subscribe({
      next: (res) => {
        this.toast.success('Demande approuvée',
          `Compte créé — Identifiants envoyés à l'email de la demande (mot de passe temporaire: ${res.data.tempPassword})`);
        this.loadRequests();
      },
      error: (err) => this.toast.error('Erreur', err.error?.message || "Impossible d'approuver la demande"),
    });
  }

  reject(requestId: string): void {
    this.api.rejectOnboardingRequest(requestId, 'Demande rejetée').subscribe({
      next: () => {
        this.toast.success('Demande rejetée', 'La demande a été marquée comme rejetée');
        this.loadRequests();
      },
      error: (err) => this.toast.error('Erreur', err.error?.message || 'Impossible de rejeter la demande'),
    });
  }
}
