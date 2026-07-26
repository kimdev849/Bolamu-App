import { Component, signal } from '@angular/core';
import { mockDeliveryCompanies, mockAgents } from '../../../core/mock/db';
import type { DeliveryCompany } from '../../../core/models/delivery-company';

@Component({
  selector: 'psr-admin-delivery-companies',
  imports: [],
  templateUrl: './admin-delivery-companies.html',
  styleUrl: './admin-delivery-companies.scss',
})
export class AdminDeliveryCompanies {
  readonly companies = signal([...mockDeliveryCompanies]);
  readonly agents = signal(mockAgents);
  readonly searchQuery = signal('');
  readonly expandedCompany = signal<string | null>(null);
  readonly filteredCompanies = signal([...mockDeliveryCompanies]);
  readonly showAddModal = signal(false);

  // New company form fields
  readonly newName = signal('');
  readonly newEmail = signal('');
  readonly newPhone = signal('');
  readonly newAddress = signal('');
  readonly newCity = signal('');
  readonly newFleetSize = signal(5);

  onSearch(event: Event): void {
    const q = (event.target as HTMLInputElement).value.toLowerCase();
    this.searchQuery.set(q);
    this.filteredCompanies.set(
      q ? this.companies().filter(c => c.name.toLowerCase().includes(q) || c.city.toLowerCase().includes(q))
         : [...this.companies()]
    );
  }

  toggleExpand(id: string): void {
    this.expandedCompany.set(this.expandedCompany() === id ? null : id);
  }

  getCompanyAgents(companyId: string) {
    return mockAgents.filter(a => a.companyId === companyId);
  }

  toggleActive(c: DeliveryCompany): void {
    const updated = this.companies().map(x => x.id === c.id ? { ...x, isActive: !x.isActive } : x);
    this.companies.set(updated);
    const updatedC = updated.find(x => x.id === c.id);
    if (updatedC) {
      this.expandedCompany.set(null);
      setTimeout(() => this.expandedCompany.set(updatedC.id), 50);
    }
    this.onSearch({ target: { value: this.searchQuery() } } as any);
  }

  addCompany(): void {
    if (!this.newName() || !this.newCity()) return;
    const c: DeliveryCompany = {
      id: 'DC-' + String(this.companies().length + 1).padStart(3, '0'),
      name: this.newName(),
      email: this.newEmail() || 'contact@nouvelle.cg',
      phone: this.newPhone() || '+242000000000',
      address: this.newAddress() || 'Non renseignée',
      city: this.newCity(),
      region: 'Non spécifié',
      isActive: true,
      fleetSize: this.newFleetSize(),
      coverageZones: [this.newCity()],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.companies.set([c, ...this.companies()]);
    this.showAddModal.set(false);
    this.newName.set(''); this.newEmail.set(''); this.newPhone.set('');
    this.newAddress.set(''); this.newCity.set(''); this.newFleetSize.set(5);
    this.onSearch({ target: { value: '' } } as any);
  }

  get totalActive() { return this.companies().filter(c => c.isActive).length; }
  get totalFleet() { return this.companies().reduce((s, c) => s + c.fleetSize, 0); }
}
