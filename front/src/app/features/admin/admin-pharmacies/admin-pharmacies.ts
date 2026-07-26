import { Component, inject, signal, OnInit } from '@angular/core';
import { Api } from '../../../core/services/api';

@Component({
  selector: 'psr-admin-pharmacies',
  imports: [],
  templateUrl: './admin-pharmacies.html',
  styleUrl: './admin-pharmacies.scss',
})
export class AdminPharmacies implements OnInit {
  private readonly api = inject(Api);

  readonly selectedFilter = signal<string>('all');
  readonly filteredPharmacies = signal<any[]>([]);
  readonly showAddModal = signal(false);
  readonly showDetail = signal(false);
  readonly selectedPharmacy = signal<any>(null);
  readonly newPharmacyName = signal('');
  readonly newPharmacyCity = signal('');
  readonly newPharmacyEmail = signal('');
  readonly isLoading = signal(false);

  private pharmacies: any[] = [];
  private searchQuery = '';

  readonly statusLabels: Record<string, string> = {
    active: 'Actif', expired: 'Expiré', pending: 'En attente', cancelled: 'Annulé',
  };
  readonly statusColors: Record<string, string> = {
    active: 'bg-emerald-100 text-emerald-700', expired: 'bg-red-100 text-red-700',
    pending: 'bg-amber-100 text-amber-700', cancelled: 'bg-slate-100 text-slate-500',
  };

  get totalActive() { return this.pharmacies.filter(p => p.isActive).length; }
  get totalPharmacies() { return this.pharmacies.length; }
  get totalVerified() { return this.pharmacies.filter(p => p.isVerified).length; }
  get totalPending() { return this.pharmacies.filter(p => !p.isVerified).length; }

  ngOnInit(): void {
    this.loadPharmacies();
  }

  private loadPharmacies(): void {
    this.isLoading.set(true);
    this.api.getAdminPharmacies(1, 100).subscribe({
      next: (res) => {
        this.pharmacies = res.data || [];
        this.applyFilters();
      },
      complete: () => this.isLoading.set(false),
    });
  }

  updateFilter(filter: string): void {
    this.selectedFilter.set(filter);
    this.applyFilters();
  }

  onSearch(event: Event): void {
    this.searchQuery = (event.target as HTMLInputElement).value;
    this.applyFilters();
  }

  private applyFilters(): void {
    let result = [...this.pharmacies];
    const filter = this.selectedFilter();
    const query = this.searchQuery.toLowerCase();

    if (filter === 'active') result = result.filter(p => p.isActive);
    if (filter === 'inactive') result = result.filter(p => !p.isActive);
    if (filter === 'verified') result = result.filter(p => p.isVerified);
    if (filter === 'unverified') result = result.filter(p => !p.isVerified);
    if (query) result = result.filter(p =>
      (p.name || '').toLowerCase().includes(query) || (p.city || '').toLowerCase().includes(query)
    );
    this.filteredPharmacies.set(result);
  }

  openDetail(pharmacy: any): void {
    this.selectedPharmacy.set(pharmacy);
    this.showDetail.set(true);
  }
  closeDetail(): void {
    this.showDetail.set(false);
    this.selectedPharmacy.set(null);
  }

  addPharmacy(): void {
    const name = this.newPharmacyName();
    if (!name) return;
    const newPharm = {
      id: `PH-${Date.now()}`,
      name,
      city: this.newPharmacyCity() || 'Brazzaville',
      email: this.newPharmacyEmail(),
      isActive: true,
      isVerified: false,
      subscriptionStatus: 'pending',
      pharmacistInCharge: '',
      licenseNumber: '',
      phone: '',
      address: '',
      region: '',
    };
    this.pharmacies = [newPharm, ...this.pharmacies];
    this.applyFilters();
    this.showAddModal.set(false);
    this.newPharmacyName.set('');
    this.newPharmacyCity.set('');
    this.newPharmacyEmail.set('');
  }

  toggleActive(ph: any): void {
    this.pharmacies = this.pharmacies.map(p =>
      p.id === ph.id ? { ...p, isActive: !p.isActive } : p
    );
    this.applyFilters();
  }
}
