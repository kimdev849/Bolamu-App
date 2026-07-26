import { Component, inject, signal, OnInit } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { Api } from '../../../core/services/api';
import { STATUS_LABELS, STATUS_COLORS } from '../../../core/config/app.constants';

@Component({
  selector: 'psr-pharmacy-orders',
  imports: [DatePipe, DecimalPipe],
  templateUrl: './pharmacy-orders.html',
  styleUrl: './pharmacy-orders.scss',
})
export class PharmacyOrders implements OnInit {
  private readonly api = inject(Api);

  readonly orders = signal<any[]>([]);
  readonly selectedFilter = signal('all');
  readonly filteredOrders = signal<any[]>([]);

  totalSpent = 0;

  protected readonly STATUS_LABELS = STATUS_LABELS;
  protected readonly STATUS_COLORS = STATUS_COLORS;

  ngOnInit(): void {
    this.api.getMyOrders().subscribe({
      next: (res) => {
        const data = res.data || [];
        this.orders.set(data);
        this.filteredOrders.set(data);
        this.totalSpent = data.reduce((s: number, o: any) => s + (o.totalAmount || 0), 0);
      },
    });
  }

  filterBy(f: string): void {
    this.selectedFilter.set(f);
    const all = this.orders();
    if (f === 'all') {
      this.filteredOrders.set(all);
    } else {
      const statusMap: Record<string, string> = {
        pending: 'CREATED',
        processing: 'IN_PROGRESS',
        delivered: 'DELIVERED',
        cancelled: 'CANCELLED',
      };
      this.filteredOrders.set(all.filter((o: any) =>
        (o.orderStatus || o.status || '').toLowerCase() === f ||
        (o.orderStatus || o.status || '') === (statusMap[f] || f.toUpperCase())
      ));
    }
  }
}
