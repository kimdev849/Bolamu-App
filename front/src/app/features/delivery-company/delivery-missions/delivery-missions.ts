import { Component, signal } from '@angular/core';
import { mockOrders } from '../../../core/mock/db';
import { STATUS_LABELS, STATUS_COLORS } from '../../../core/config/app.constants';

@Component({
  selector: 'psr-delivery-missions',
  imports: [],
  templateUrl: './delivery-missions.html',
  styleUrl: './delivery-missions.scss',
})
export class DeliveryMissions {
  readonly deliveries = signal(mockOrders.filter(o => o.deliveryStatus));

  readonly STATUS_LABELS = STATUS_LABELS;
  readonly STATUS_COLORS = STATUS_COLORS;

  updateStatus(id: string, newStatus: string): void {
    this.deliveries.set(this.deliveries().map(d =>
      d.id === id ? { ...d, deliveryStatus: newStatus as any } : d
    ));
  }
}
