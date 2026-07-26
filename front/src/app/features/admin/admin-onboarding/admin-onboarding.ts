import { Component, signal } from '@angular/core';
import { DateAgoPipe } from '../../../shared/pipes/date-ago-pipe';
import { mockOnboardingRequests } from '../../../core/mock/db';
import type { OnboardingRequest, OnboardingStatus } from '../../../core/models/onboarding';

@Component({
  selector: 'psr-admin-onboarding',
  imports: [DateAgoPipe],
  templateUrl: './admin-onboarding.html',
  styleUrl: './admin-onboarding.scss',
})
export class AdminOnboarding {
  readonly requests = signal<OnboardingRequest[]>(mockOnboardingRequests);

  readonly pendingRequests = signal<OnboardingRequest[]>(mockOnboardingRequests.filter(r => r.status === 'pending'));
  readonly approvedRequests = signal<OnboardingRequest[]>(mockOnboardingRequests.filter(r => r.status === 'approved'));
  readonly rejectedRequests = signal<OnboardingRequest[]>(mockOnboardingRequests.filter(r => r.status === 'rejected'));

  readonly selectedTab = signal<string>('pending');

  readonly ENTITY_LABELS: Record<string, string> = {
    pharmacy: 'Pharmacie',
    wholesaler: 'Grossiste',
    delivery_company: 'Transport & Livraison',
  };

  readonly STATUS_LABELS: Record<string, string> = {
    pending: 'En attente',
    approved: 'Approuvé',
    rejected: 'Rejeté',
  };

  readonly STATUS_COLORS: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-700',
    approved: 'bg-emerald-100 text-emerald-700',
    rejected: 'bg-red-100 text-red-700',
  };

  readonly tabs = [
    { key: 'pending', label: 'En attente' },
    { key: 'approved', label: 'Approuvées' },
    { key: 'rejected', label: 'Rejetées' },
    { key: 'all', label: 'Toutes' },
  ];

  selectTab(key: string): void {
    this.selectedTab.set(key);
  }

  get filteredRequests(): OnboardingRequest[] {
    const all = this.requests();
    const tab = this.selectedTab();
    if (tab === 'all') return all;
    return all.filter(r => r.status === tab);
  }

  approve(requestId: string): void {
    this.requests.update(requests =>
      requests.map(r =>
        r.id === requestId
          ? { ...r, status: 'approved' as OnboardingStatus, processedAt: new Date().toISOString() }
          : r
      )
    );
    this.recalculateCounts();
  }

  reject(requestId: string): void {
    this.requests.update(requests =>
      requests.map(r =>
        r.id === requestId
          ? { ...r, status: 'rejected' as OnboardingStatus, processedAt: new Date().toISOString() }
          : r
      )
    );
    this.recalculateCounts();
  }

  private recalculateCounts(): void {
    const all = this.requests();
    this.pendingRequests.set(all.filter(r => r.status === 'pending'));
    this.approvedRequests.set(all.filter(r => r.status === 'approved'));
    this.rejectedRequests.set(all.filter(r => r.status === 'rejected'));
  }
}
