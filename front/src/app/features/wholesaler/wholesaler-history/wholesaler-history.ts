import { Component, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { mockOrders } from '../../../core/mock/db';
import { STATUS_LABELS, STATUS_COLORS } from '../../../core/config/app.constants';

@Component({
  selector: 'psr-wholesaler-history',
  imports: [DatePipe, DecimalPipe],
  templateUrl: './wholesaler-history.html',
  styleUrl: './wholesaler-history.scss',
})
export class WholesalerHistory {
  readonly history = signal(mockOrders.filter(o => o.wholesalerId === 'WH-001' && (o.status === 'delivered' || o.status === 'cancelled')));
  readonly STATUS_LABELS = STATUS_LABELS;
  readonly STATUS_COLORS = STATUS_COLORS;

  get totalDelivered() { return this.history().filter(o => o.status === 'delivered').length; }
  get totalRevenue() { return this.history().filter(o => o.status === 'delivered').reduce((s, o) => s + o.totalPrice, 0); }
}
