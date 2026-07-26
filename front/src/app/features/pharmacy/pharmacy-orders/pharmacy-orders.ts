import { Component, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { mockOrders } from '../../../core/mock/db';
import { STATUS_LABELS, STATUS_COLORS } from '../../../core/config/app.constants';

@Component({
  selector: 'psr-pharmacy-orders',
  imports: [DatePipe, DecimalPipe],
  templateUrl: './pharmacy-orders.html',
  styleUrl: './pharmacy-orders.scss',
})
export class PharmacyOrders {
  readonly orders = signal(mockOrders.filter(o => o.pharmacyId === 'PH-001'));
  readonly selectedFilter = signal<string>('all');

  readonly filteredOrders = signal(this.orders());

  readonly STATUS_LABELS = STATUS_LABELS;
  readonly STATUS_COLORS = STATUS_COLORS;

  filterBy(f: string): void {
    this.selectedFilter.set(f);
    this.filteredOrders.set(f === 'all' ? this.orders() : this.orders().filter(o => o.status === f));
  }

  get totalSpent() { return this.orders().reduce((s, o) => s + o.totalPrice, 0); }
}
