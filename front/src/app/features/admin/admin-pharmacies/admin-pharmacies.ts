import { Component, signal } from '@angular/core';
import { mockPharmacies } from '../../../core/mock/db';
import type { Pharmacy } from '../../../core/models/pharmacy';

@Component({
  selector: 'psr-admin-pharmacies',
  imports: [],
  templateUrl: './admin-pharmacies.html',
  styleUrl: './admin-pharmacies.scss',
})
export class AdminPharmacies {
  readonly pharmacies = signal([...mockPharmacies]);
  readonly searchQuery = signal('');
  readonly selectedFilter = signal<string>('all');
  readonly selectedPharmacy = signal<Pharmacy | null>(null);
  readonly showDetail = signal(false);
  readonly showAddModal = signal(false);
  readonly newPharmacyName = signal('');
  readonly newPharmacyCity = signal('');
  readonly newPharmacyEmail = signal('');

  readonly filteredPharmacies = signal([...mockPharmacies]);

  updateFilter(filter: string): void {
    this.selectedFilter.set(filter);
    this.applyFilters();
  }

  onSearch(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchQuery.set(value);
    this.applyFilters();
  }

  private applyFilters(): void {
    let result = [...this.pharmacies()];
    const filter = this.selectedFilter();
    const query = this.searchQuery().toLowerCase();

    if (filter === 'active') result = result.filter(p => p.isActive);
    if (filter === 'inactive') result = result.filter(p => !p.isActive);
    if (filter === 'verified') result = result.filter(p => p.isVerified);
    if (filter === 'unverified') result = result.filter(p => !p.isVerified);
    if (query) result = result.filter(p =>
      p.name.toLowerCase().includes(query) || p.city.toLowerCase().includes(query)
    );
    this.filteredPharmacies.set(result);
  }

  openDetail(pharmacy: Pharmacy): void { this.selectedPharmacy.set(pharmacy); this.showDetail.set(true); }
  closeDetail(): void { this.showDetail.set(false); this.selectedPharmacy.set(null); }

  toggleActive(pharmacy: Pharmacy): void {
    const updated = this.pharmacies().map(p =>
      p.id === pharmacy.id ? { ...p, isActive: !p.isActive } : p
    );
    this.pharmacies.set(updated);
    const updatedPh = updated.find(p => p.id === pharmacy.id);
    if (updatedPh) this.selectedPharmacy.set(updatedPh);
    this.applyFilters();
  }

  addPharmacy(): void {
    if (!this.newPharmacyName() || !this.newPharmacyCity()) return;
    const newPharm: Pharmacy = {
      id: 'PH-' + String(this.pharmacies().length + 1).padStart(3, '0'),
      name: this.newPharmacyName(),
      email: this.newPharmacyEmail() || 'contact@nouvelle.cg',
      phone: '+242000000000',
      address: 'Adresse non renseignée',
      city: this.newPharmacyCity(),
      region: 'Non spécifié',
      licenseNumber: 'LIC-' + Date.now().toString(36).toUpperCase(),
      pharmacistInCharge: 'Non assigné',
      isVerified: false,
      isActive: true,
      subscriptionStatus: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.pharmacies.set([newPharm, ...this.pharmacies()]);
    this.showAddModal.set(false);
    this.newPharmacyName.set('');
    this.newPharmacyCity.set('');
    this.newPharmacyEmail.set('');
    this.applyFilters();
  }

  readonly statusLabels: Record<string, string> = {
    active: 'Actif', expired: 'Expiré', pending: 'En attente', cancelled: 'Annulé',
  };
  readonly statusColors: Record<string, string> = {
    active: 'bg-emerald-100 text-emerald-700', expired: 'bg-red-100 text-red-700',
    pending: 'bg-amber-100 text-amber-700', cancelled: 'bg-slate-100 text-slate-500',
  };

  get totalActive() { return this.pharmacies().filter(p => p.isActive).length; }
  get totalVerified() { return this.pharmacies().filter(p => p.isVerified).length; }
  get totalPending() { return this.pharmacies().filter(p => p.subscriptionStatus === 'pending').length; }
  get totalPharmacies() { return this.pharmacies().length; }
}
