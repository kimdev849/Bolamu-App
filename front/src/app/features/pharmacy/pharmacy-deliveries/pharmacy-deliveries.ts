import { Component, signal } from '@angular/core';
import { mockOrders } from '../../../core/mock/db';
import { STATUS_LABELS, STATUS_COLORS } from '../../../core/config/app.constants';

@Component({
  selector: 'psr-pharmacy-deliveries',
  imports: [],
  templateUrl: './pharmacy-deliveries.html',
  styleUrl: './pharmacy-deliveries.scss',
})
export class PharmacyDeliveries {
  readonly deliveries = signal(mockOrders.filter(o => (o.pharmacyId === 'PH-001' || o.pharmacyId === 'PH-002') && o.deliveryStatus));
  readonly STATUS_LABELS = STATUS_LABELS;
  readonly STATUS_COLORS = STATUS_COLORS;
  readonly Math = Math;

  readonly stepLabels: Record<string, string> = {
    pending: 'En attente', assigned: 'Assigné', picked_up: 'Récupéré', in_transit: 'En transit', delivered: 'Livré',
  };

  getStepIndex(status: string): number {
    const steps = ['pending', 'assigned', 'picked_up', 'in_transit', 'delivered'];
    return steps.indexOf(status);
  }
}
