import { Component, inject, signal, OnInit } from '@angular/core';
import { Api } from '../../../core/services/api';
import { Toast } from '../../../core/services/toast';

@Component({
  selector: 'psr-admin-delivery-companies',
  imports: [],
  templateUrl: './admin-delivery-companies.html',
  styleUrl: './admin-delivery-companies.scss',
})
export class AdminDeliveryCompanies implements OnInit {
  private readonly api = inject(Api);
  private readonly toast = inject(Toast);

  readonly companies = signal<any[]>([]);
  readonly filteredCompanies = signal<any[]>([]);
  readonly expandedCompany = signal<string | null>(null);
  readonly showAddModal = signal(false);
  readonly isLoading = signal(false);

  // Formulaire création
  readonly newName = signal('');
  readonly newEmail = signal('');
  readonly newPhone = signal('');
  readonly newAddress = signal('');
  readonly newCity = signal('Brazzaville');
  readonly newContactName = signal('');
  readonly newRegistration = signal('');

  // Succès
  readonly showSuccess = signal(false);
  readonly createdEntity = signal<any>(null);

  private allCompanies: any[] = [];
  private searchQuery = '';

  readonly cities = ['Brazzaville', 'Pointe-Noire', 'Dolisie', 'Ouesso', 'Talangaï'];

  get totalActive() { return this.allCompanies.filter(c => c.isActive).length; }
  get totalFleet() { return this.allCompanies.reduce((s, c) => s + (c.fleetSize || 0), 0); }

  ngOnInit(): void {
    this.loadCompanies();
  }

  private loadCompanies(): void {
    this.isLoading.set(true);
    this.api.getAdminDeliveryCompanies(1, 100).subscribe({
      next: (res) => {
        this.allCompanies = (res.data || []).map((c: any) => ({
          ...c,
          city: c.city?.name || c.city || '—',
          coverageZones: c.coverageZones || [],
          fleetSize: c._count?.agents || c.fleetSize || 0,
        }));
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

  resetForm(): void {
    this.newName.set(''); this.newEmail.set(''); this.newPhone.set('');
    this.newAddress.set(''); this.newCity.set('Brazzaville');
    this.newContactName.set('');
    this.newRegistration.set('');
    this.showSuccess.set(false); this.createdEntity.set(null);
  }

  addCompany(): void {
    const name = this.newName();
    if (!name) return;
    this.isLoading.set(true);
    this.api.createAdminDeliveryCompany({
      name,
      email: this.newEmail(),
      phone: this.newPhone(),
      address: this.newAddress(),
      city: this.newCity(),
      contactName: this.newContactName() || name,
    }).subscribe({
      next: (res) => {
        this.createdEntity.set({ ...res.data, entityType: 'entreprise de livraison' });
        this.showSuccess.set(true);
        this.toast.success('Entreprise créée', 'Compte créé avec succès');
        this.loadCompanies();
      },
      error: (err) => this.toast.error('Erreur', err.error?.message || 'Impossible de créer l\'entreprise'),
      complete: () => this.isLoading.set(false),
    });
  }
}
