import { Component, inject, signal, OnInit } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { Api } from '../../../core/services/api';
import { STATUS_LABELS, STATUS_COLORS } from '../../../core/config/app.constants';

@Component({
  selector: 'psr-admin-orders',
  imports: [DatePipe, DecimalPipe],
  templateUrl: './admin-orders.html',
  styleUrl: './admin-orders.scss',
})
export class AdminOrders implements OnInit {
  private readonly api = inject(Api);

  readonly orders = signal<any[]>([]);
  readonly filteredOrders = signal<any[]>([]);
  readonly selectedStatus = signal<string>('all');
  readonly isLoading = signal(false);

  orderStats: any[] = [];

  private searchQuery = '';

  readonly statusLabels = STATUS_LABELS;
  readonly statusColors = STATUS_COLORS;

  readonly statusFilters = [
    { value: 'all', label: 'Toutes' },
    { value: 'CREATED', label: 'Créées' },
    { value: 'CONFIRMED', label: 'Confirmées' },
    { value: 'PAID', label: 'Payées' },
    { value: 'IN_PROGRESS', label: 'En cours' },
    { value: 'DELIVERED', label: 'Livrées' },
    { value: 'CANCELLED', label: 'Annulées' },
  ];

  ngOnInit(): void {
    this.loadOrders();
  }

  private loadOrders(): void {
    this.isLoading.set(true);
    this.api.getOrders({ limit: 100 }).subscribe({
      next: (res) => {
        const data = res.data || [];
        this.orders.set(data);
        this.filteredOrders.set(data);
        this.orderStats = [
          { label: 'Total', value: data.length, color: 'text-slate-900' },
          { label: 'En attente', value: data.filter((o: any) => o.orderStatus === 'CREATED' || o.orderStatus === 'CONFIRMED').length, color: 'text-amber-600' },
          { label: 'En cours', value: data.filter((o: any) => o.orderStatus === 'IN_PROGRESS' || o.orderStatus === 'PAID').length, color: 'text-indigo-600' },
          { label: 'Livrées', value: data.filter((o: any) => o.orderStatus === 'DELIVERED').length, color: 'text-emerald-600' },
          { label: 'Revenu total', value: data.reduce((s: number, o: any) => s + (o.totalAmount || 0), 0).toLocaleString() + ' FCFA', color: 'text-slate-900' },
        ];
      },
      complete: () => this.isLoading.set(false),
    });
  }

  updateStatusFilter(value: string): void {
    this.selectedStatus.set(value);
    this.applyFilters();
  }

  onSearch(event: Event): void {
    this.searchQuery = (event.target as HTMLInputElement).value.toLowerCase();
    this.applyFilters();
  }

  exportCSV(): void {
    const rows = this.filteredOrders();
    const csv = [
      ['ID', 'Pharmacie', 'Grossiste', 'Produit', 'Montant', 'Statut', 'Date'].join(','),
      ...rows.map((o: any) => [o.id, o.pharmacyName, o.wholesalerName, o.productName, o.totalAmount || 0, o.orderStatus || o.status, o.createdAt].join(',')),
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'commandes.csv'; a.click();
    URL.revokeObjectURL(url);
  }

  private applyFilters(): void {
    let result = [...this.orders()];
    const status = this.selectedStatus();
    const query = this.searchQuery;

    if (status !== 'all') result = result.filter(o => o.orderStatus === status);
    if (query) result = result.filter(o =>
      (o.reference || o.id || '').toLowerCase().includes(query) ||
      (o.productName || '').toLowerCase().includes(query)
    );
    this.filteredOrders.set(result);
  }
}
