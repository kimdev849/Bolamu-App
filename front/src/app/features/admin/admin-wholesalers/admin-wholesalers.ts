import { Component, signal } from '@angular/core';
import { mockWholesalers } from '../../../core/mock/db';
import type { Wholesaler } from '../../../core/models/wholesaler';

@Component({
  selector: 'psr-admin-wholesalers',
  imports: [],
  templateUrl: './admin-wholesalers.html',
  styleUrl: './admin-wholesalers.scss',
})
export class AdminWholesalers {
  readonly wholesalers = signal([...mockWholesalers]);
  readonly searchQuery = signal('');
  readonly selectedFilter = signal<string>('all');
  readonly selectedWholesaler = signal<Wholesaler | null>(null);
  readonly showDetail = signal(false);
  readonly showAddModal = signal(false);
  readonly newName = signal('');
  readonly newCity = signal('');

  readonly filteredWholesalers = signal([...mockWholesalers]);

  updateFilter(filter: string): void {
    this.selectedFilter.set(filter);
    this.applyFilters();
  }

  onSearch(event: Event): void {
    this.searchQuery.set((event.target as HTMLInputElement).value);
    this.applyFilters();
  }

  private applyFilters(): void {
    let result = [...this.wholesalers()];
    const filter = this.selectedFilter();
    const query = this.searchQuery().toLowerCase();
    if (filter === 'active') result = result.filter(w => w.isActive);
    if (filter === 'inactive') result = result.filter(w => !w.isActive);
    if (filter === 'verified') result = result.filter(w => w.isVerified);
    if (filter === 'unverified') result = result.filter(w => !w.isVerified);
    if (query) result = result.filter(w => w.name.toLowerCase().includes(query) || w.city.toLowerCase().includes(query));
    this.filteredWholesalers.set(result);
  }

  openDetail(w: Wholesaler): void { this.selectedWholesaler.set(w); this.showDetail.set(true); }
  closeDetail(): void { this.showDetail.set(false); this.selectedWholesaler.set(null); }

  toggleActive(w: Wholesaler): void {
    const updated = this.wholesalers().map(x => x.id === w.id ? { ...x, isActive: !x.isActive } : x);
    this.wholesalers.set(updated);
    const updatedW = updated.find(x => x.id === w.id);
    if (updatedW) this.selectedWholesaler.set(updatedW);
    this.applyFilters();
  }

  addWholesaler(): void {
    if (!this.newName() || !this.newCity()) return;
    const w: Wholesaler = {
      id: 'WH-' + String(this.wholesalers().length + 1).padStart(3, '0'),
      name: this.newName(), email: 'contact@nouveau.cg', phone: '+242000000000',
      address: 'Non renseignée', city: this.newCity(), region: 'Non spécifié',
      licenseNumber: 'LIC-WH-' + Date.now().toString(36).toUpperCase(),
      isVerified: false, isActive: true,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    };
    this.wholesalers.set([w, ...this.wholesalers()]);
    this.showAddModal.set(false);
    this.newName.set(''); this.newCity.set('');
    this.applyFilters();
  }

  get totalActive() { return this.wholesalers().filter(w => w.isActive).length; }
  get totalVerified() { return this.wholesalers().filter(w => w.isVerified).length; }
  get total() { return this.wholesalers().length; }
}
