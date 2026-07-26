import { Component, inject, signal, OnInit } from '@angular/core';
import { TitleCasePipe } from '@angular/common';
import { Api } from '../../../core/services/api';
import { Toast } from '../../../core/services/toast';

@Component({
  selector: 'psr-admin-wholesalers',
  imports: [TitleCasePipe],
  templateUrl: './admin-wholesalers.html',
  styleUrl: './admin-wholesalers.scss',
})
export class AdminWholesalers implements OnInit {
  private readonly api = inject(Api);
  private readonly toast = inject(Toast);

  readonly selectedFilter = signal<string>('all');
  readonly filteredWholesalers = signal<any[]>([]);
  readonly selectedWholesaler = signal<any>(null);
  readonly showDetail = signal(false);
  readonly showAddModal = signal(false);
  readonly isLoading = signal(false);

  // Formulaire création
  readonly newName = signal('');
  readonly newEmail = signal('');
  readonly newPhone = signal('');
  readonly newAddress = signal('');
  readonly newCity = signal('Brazzaville');
  readonly newLicenseNumber = signal('');
  readonly newContactName = signal('');

  // Succès
  readonly showSuccess = signal(false);
  readonly createdEntity = signal<any>(null);

  private wholesalers: any[] = [];
  private searchQuery = '';

  readonly cities = ['Brazzaville', 'Pointe-Noire', 'Dolisie', 'Ouesso', 'Talangaï'];

  get totalActive() { return this.wholesalers.filter(w => w.isActive).length; }
  get total() { return this.wholesalers.length; }
  get totalVerified() { return this.wholesalers.filter(w => w.isVerified).length; }

  ngOnInit(): void {
    this.loadWholesalers();
  }

  private loadWholesalers(): void {
    this.isLoading.set(true);
    this.api.getAdminWholesalers(1, 100).subscribe({
      next: (res) => {
        this.wholesalers = (res.data || []).map((w: any) => ({
          ...w,
          city: w.city?.name || w.city || '—',
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
    let result = [...this.wholesalers];
    const filter = this.selectedFilter();
    const query = this.searchQuery.toLowerCase();
    if (filter === 'active') result = result.filter(w => w.isActive);
    if (filter === 'inactive') result = result.filter(w => !w.isActive);
    if (filter === 'verified') result = result.filter(w => w.isVerified);
    if (filter === 'unverified') result = result.filter(w => !w.isVerified);
    if (query) result = result.filter(w => (w.name || '').toLowerCase().includes(query) || (w.city || '').toLowerCase().includes(query));
    this.filteredWholesalers.set(result);
  }

  openDetail(w: any): void { this.selectedWholesaler.set(w); this.showDetail.set(true); }
  closeDetail(): void { this.showDetail.set(false); this.selectedWholesaler.set(null); }

  resetForm(): void {
    this.newName.set(''); this.newEmail.set(''); this.newPhone.set('');
    this.newAddress.set(''); this.newCity.set('Brazzaville');
    this.newLicenseNumber.set(''); this.newContactName.set('');
    this.showSuccess.set(false); this.createdEntity.set(null);
  }

  addWholesaler(): void {
    const name = this.newName();
    if (!name) return;
    this.isLoading.set(true);
    this.api.createAdminWholesaler({
      name,
      email: this.newEmail(),
      phone: this.newPhone(),
      address: this.newAddress(),
      city: this.newCity(),
      licenseNumber: this.newLicenseNumber() || undefined,
      contactName: this.newContactName() || name,
    }).subscribe({
      next: (res) => {
        this.createdEntity.set({ ...res.data, entityType: 'grossiste' });
        this.showSuccess.set(true);
        this.toast.success('Grossiste créé', 'Compte créé avec succès');
        this.loadWholesalers();
      },
      error: (err) => this.toast.error('Erreur', err.error?.message || 'Impossible de créer le grossiste'),
      complete: () => this.isLoading.set(false),
    });
  }

  toggleActive(w: any): void {
    this.wholesalers = this.wholesalers.map(ws => ws.id === w.id ? { ...ws, isActive: !ws.isActive } : ws);
    this.applyFilters();
  }
}
