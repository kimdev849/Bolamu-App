import { Component, inject, signal, OnInit } from '@angular/core';
import { Api } from '../../../core/services/api';

@Component({
  selector: 'psr-admin-wholesalers',
  imports: [],
  templateUrl: './admin-wholesalers.html',
  styleUrl: './admin-wholesalers.scss',
})
export class AdminWholesalers implements OnInit {
  private readonly api = inject(Api);

  readonly selectedFilter = signal<string>('all');
  readonly filteredWholesalers = signal<any[]>([]);
  readonly selectedWholesaler = signal<any>(null);
  readonly showDetail = signal(false);
  readonly showAddModal = signal(false);
  readonly isLoading = signal(false);

  private wholesalers: any[] = [];
  private searchQuery = '';

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
        this.wholesalers = res.data || [];
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

  toggleActive(w: any): void {
    this.wholesalers = this.wholesalers.map(ws => ws.id === w.id ? { ...ws, isActive: !ws.isActive } : ws);
    this.applyFilters();
  }
}
