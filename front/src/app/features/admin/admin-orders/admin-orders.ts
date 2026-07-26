import { Component, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { mockOrders } from '../../../core/mock/db';
import { STATUS_LABELS, STATUS_COLORS } from '../../../core/config/app.constants';

@Component({
  selector: 'psr-admin-orders',
  imports: [DatePipe, DecimalPipe],
  templateUrl: './admin-orders.html',
  styleUrl: './admin-orders.scss',
})
export class AdminOrders {
  readonly orders = signal(mockOrders);
  readonly filteredOrders = signal(mockOrders);
  readonly selectedStatus = signal<string>('all');
  readonly searchQuery = signal('');

  readonly statusLabels = STATUS_LABELS;
  readonly statusColors = STATUS_COLORS;

  readonly statusFilters = [
    { value: 'all', label: 'Toutes' },
    { value: 'pending', label: 'En attente' },
    { value: 'processing', label: 'En cours' },
    { value: 'delivered', label: 'Livrées' },
    { value: 'cancelled', label: 'Annulées' },
  ];

  readonly orderStats = [
    { label: 'Total', value: mockOrders.length, color: 'text-slate-900' },
    { label: 'En attente', value: mockOrders.filter(o => o.status === 'pending').length, color: 'text-amber-600' },
    { label: 'En cours', value: mockOrders.filter(o => o.status === 'processing' || o.status === 'confirmed' || o.status === 'shipped').length, color: 'text-indigo-600' },
    { label: 'Livrées', value: mockOrders.filter(o => o.status === 'delivered').length, color: 'text-emerald-600' },
    { label: 'Revenu total', value: mockOrders.reduce((s, o) => s + o.totalPrice, 0).toLocaleString() + ' FCFA', color: 'text-slate-900' },
  ];

  updateStatusFilter(value: string): void {
    this.selectedStatus.set(value);
    this.applyFilters();
  }

  onSearch(event: Event): void {
    this.searchQuery.set((event.target as HTMLInputElement).value.toLowerCase());
    this.applyFilters();
  }

  private applyFilters(): void {
    let result = [...mockOrders];
    const status = this.selectedStatus();
    const query = this.searchQuery();

    if (status !== 'all') result = result.filter(o => o.status === status);
    if (query) result = result.filter(o =>
      o.id.toLowerCase().includes(query) ||
      o.pharmacyName.toLowerCase().includes(query) ||
      o.wholesalerName.toLowerCase().includes(query) ||
      o.productName.toLowerCase().includes(query)
    );
    this.filteredOrders.set(result);
  }

  exportCSV(): void {
    const headers = 'ID,Pharmacie,Grossiste,Produit,Quantité,Montant,Statut,Paiement,Date\n';
    const rows = mockOrders.map(o =>
      `${o.id},${o.pharmacyName},${o.wholesalerName},${o.productName},${o.quantity},${o.totalPrice},${o.status},${o.paymentStatus},${o.createdAt}`
    ).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'commandes.csv'; a.click();
    URL.revokeObjectURL(url);
  }
}
