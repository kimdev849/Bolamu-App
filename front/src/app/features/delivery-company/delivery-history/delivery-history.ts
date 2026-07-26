import { Component, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { mockOrders } from '../../../core/mock/db';
import { STATUS_LABELS, STATUS_COLORS } from '../../../core/config/app.constants';

@Component({
  selector: 'psr-delivery-history',
  imports: [DatePipe, DecimalPipe],
  templateUrl: './delivery-history.html',
  styleUrl: './delivery-history.scss',
})
export class DeliveryHistory {
  readonly history = signal(mockOrders.filter(o => o.deliveryStatus === 'delivered'));
  readonly STATUS_LABELS = STATUS_LABELS;
  readonly STATUS_COLORS = STATUS_COLORS;

  get totalRevenue() { return this.history().reduce((s, o) => s + o.totalPrice, 0); }
}
