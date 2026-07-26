import { Component, signal, computed } from '@angular/core';
import { DateAgoPipe } from '../../../shared/pipes/date-ago-pipe';
import type { OnboardingRequest, OnboardingStatus } from '../../../core/models/onboarding';

@Component({
  selector: 'psr-admin-onboarding',
  imports: [DateAgoPipe],
  templateUrl: './admin-onboarding.html',
  styleUrl: './admin-onboarding.scss',
})
export class AdminOnboarding {
  readonly requests = signal<OnboardingRequest[]>([]);
  readonly selectedTab = signal<string>('pending');

  readonly ENTITY_LABELS: Record<string, string> = {
    pharmacy: 'Pharmacie', wholesaler: 'Grossiste', delivery_company: 'Transport & Livraison',
  };
  readonly STATUS_LABELS: Record<string, string> = {
    pending: 'En attente', approved: 'Approuvé', rejected: 'Rejeté',
  };
  readonly STATUS_COLORS: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-700', approved: 'bg-emerald-100 text-emerald-700', rejected: 'bg-red-100 text-red-700',
  };
  readonly tabs = [
    { key: 'pending', label: 'En attente' }, { key: 'approved', label: 'Approuvées' },
    { key: 'rejected', label: 'Rejetées' }, { key: 'all', label: 'Toutes' },
  ];

  selectTab(key: string): void { this.selectedTab.set(key); }

  get filteredRequests(): OnboardingRequest[] {
    const all = this.requests();
    const tab = this.selectedTab();
    if (tab === 'all') return all;
    return all.filter((r: any) => r.status === tab);
  }

  readonly pendingRequests = computed(() => this.requests().filter((r: any) => r.status === 'pending'));
  readonly approvedRequests = computed(() => this.requests().filter((r: any) => r.status === 'approved'));
  readonly rejectedRequests = computed(() => this.requests().filter((r: any) => r.status === 'rejected'));

  approve(requestId: string): void {
    this.requests.update(requests =>
      requests.map(r => r.id === requestId ? { ...r, status: 'approved' as OnboardingStatus, processedAt: new Date().toISOString() } : r)
    );
  }

  reject(requestId: string): void {
    this.requests.update(requests =>
      requests.map(r => r.id === requestId ? { ...r, status: 'rejected' as OnboardingStatus, processedAt: new Date().toISOString() } : r)
    );
  }
}
