import { Component, inject, signal, OnInit } from '@angular/core';
import { Api } from '../../../core/services/api';

@Component({
  selector: 'psr-admin-delivery-companies',
  imports: [],
  templateUrl: './admin-delivery-companies.html',
  styleUrl: './admin-delivery-companies.scss',
})
export class AdminDeliveryCompanies implements OnInit {
  private readonly api = inject(Api);

  readonly companies = signal<any[]>([]);
  readonly filteredCompanies = signal<any[]>([]);
  readonly expandedCompany = signal<string | null>(null);
  readonly showAddModal = signal(false);
  readonly isLoading = signal(false);

  readonly newName = signal('');
  readonly newEmail = signal('');
  readonly newPhone = signal('');
  readonly newAddress = signal('');
  readonly newCity = signal('');
  readonly newFleetSize = signal(0);

  private allCompanies: any[] = [];
  private searchQuery = '';

  get totalActive() { return this.allCompanies.filter(c => c.isActive).length; }
  get totalFleet() { return this.allCompanies.reduce((s, c) => s + (c.fleetSize || 0), 0); }

  ngOnInit(): void {
    this.loadCompanies();
  }

  private loadCompanies(): void {
    this.isLoading.set(true);
    this.api.getAdminDeliveryCompanies(1, 100).subscribe({
      next: (res) => {
        this.allCompanies = res.data || [];
        this.companies.set(this.allCompanies);
        this.applyFilter();
      },
      complete: () => this.isLoading.set(false),
    });
  }

  onSearch(event: Event): void {
    this.searchQuery = (event.target as HTMLInputElement).value;
    this.applyFilter();
  }

  private applyFilter(): void {
    const q = this.searchQuery.toLowerCase();
    const result = q
      ? this.allCompanies.filter(c => (c.name || '').toLowerCase().includes(q) || (c.city || '').toLowerCase().includes(q))
      : [...this.allCompanies];
    this.filteredCompanies.set(result);
  }

  toggleExpand(id: string): void {
    this.expandedCompany.set(this.expandedCompany() === id ? null : id);
  }

  getCompanyAgents(companyId: string): any[] {
    return [];
  }

  toggleActive(c: any): void {
    this.allCompanies = this.allCompanies.map(co => co.id === c.id ? { ...co, isActive: !co.isActive } : co);
    this.companies.set(this.allCompanies);
    this.applyFilter();
  }

  addCompany(): void {
    const name = this.newName();
    if (!name) return;
    const newCo = {
      id: `DC-${Date.now()}`,
      name,
      email: this.newEmail(),
      phone: this.newPhone(),
      address: this.newAddress(),
      city: this.newCity() || 'Brazzaville',
      fleetSize: this.newFleetSize() || 0,
      isActive: true,
      coverageZones: [this.newCity() || 'Brazzaville'],
    };
    this.allCompanies = [newCo, ...this.allCompanies];
    this.companies.set(this.allCompanies);
    this.applyFilter();
    this.showAddModal.set(false);
    this.newName.set('');
    this.newEmail.set('');
    this.newPhone.set('');
    this.newAddress.set('');
    this.newCity.set('');
    this.newFleetSize.set(0);
  }
}
