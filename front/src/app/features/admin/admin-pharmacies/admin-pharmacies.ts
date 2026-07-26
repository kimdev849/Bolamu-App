import { Component, inject, signal, OnInit } from '@angular/core';
import { TitleCasePipe } from '@angular/common';
import { Api } from '../../../core/services/api';
import { Toast } from '../../../core/services/toast';

@Component({
  selector: 'psr-admin-pharmacies',
  imports: [TitleCasePipe],
  templateUrl: './admin-pharmacies.html',
  styleUrl: './admin-pharmacies.scss',
})
export class AdminPharmacies implements OnInit {
  private readonly api = inject(Api);
  private readonly toast = inject(Toast);

  readonly selectedFilter = signal<string>('all');
  readonly filteredPharmacies = signal<any[]>([]);
  readonly showAddModal = signal(false);
  readonly showDetail = signal(false);
  readonly selectedPharmacy = signal<any>(null);
  readonly isLoading = signal(false);

  // Formulaire création
  readonly newName = signal('');
  readonly newEmail = signal('');
  readonly newPhone = signal('');
  readonly newAddress = signal('');
  readonly newCity = signal('Brazzaville');
  readonly newLicenseNumber = signal('');
  readonly newContactName = signal('');

  // Succès création
  readonly showSuccess = signal(false);
  readonly createdEntity = signal<any>(null);

  private pharmacies: any[] = [];
  private searchQuery = '';

  readonly statusLabels: Record<string, string> = {
    active: 'Actif', expired: 'Expiré', pending: 'En attente', cancelled: 'Annulé',
  };
  readonly statusColors: Record<string, string> = {
    active: 'bg-emerald-100 text-emerald-700', expired: 'bg-red-100 text-red-700',
    pending: 'bg-amber-100 text-amber-700', cancelled: 'bg-slate-100 text-slate-500',
  };

  readonly cities = ['Brazzaville', 'Pointe-Noire', 'Dolisie', 'Ouesso', 'Talangaï', 'Mfilou', 'Ouenzé'];

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
        this.pharmacies = (res.data || []).map((p: any) => ({
          ...p,
          city: p.city?.name || p.city || '—',
        }));
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

  resetForm(): void {
    this.newName.set('');
    this.newEmail.set('');
    this.newPhone.set('');
    this.newAddress.set('');
    this.newCity.set('Brazzaville');
    this.newLicenseNumber.set('');
    this.newContactName.set('');
    this.showSuccess.set(false);
    this.createdEntity.set(null);
  }

  addPharmacy(): void {
    const name = this.newName();
    if (!name) return;

    this.isLoading.set(true);
    this.api.createAdminPharmacy({
      name,
      email: this.newEmail(),
      phone: this.newPhone(),
      address: this.newAddress(),
      city: this.newCity(),
      licenseNumber: this.newLicenseNumber() || undefined,
      contactName: this.newContactName() || name,
    }).subscribe({
      next: (res) => {
        this.createdEntity.set({ ...res.data, entityType: 'pharmacie' });
        this.showSuccess.set(true);
        this.toast.success('Pharmacie créée', `Compte créé avec succès`);
        this.loadPharmacies();
      },
      error: (err) => {
        this.toast.error('Erreur', err.error?.message || 'Impossible de créer la pharmacie');
      },
      complete: () => this.isLoading.set(false),
    });
  }

  toggleActive(ph: any): void {
    this.pharmacies = this.pharmacies.map(p =>
      p.id === ph.id ? { ...p, isActive: !p.isActive } : p
    );
    this.applyFilters();
  }
}
