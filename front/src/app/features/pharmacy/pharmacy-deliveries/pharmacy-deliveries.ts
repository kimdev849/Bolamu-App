import { Component, inject, signal, OnInit } from '@angular/core';
import { Api } from '../../../core/services/api';
import { STATUS_LABELS, STATUS_COLORS } from '../../../core/config/app.constants';

@Component({
  selector: 'psr-pharmacy-deliveries',
  imports: [],
  templateUrl: './pharmacy-deliveries.html',
  styleUrl: './pharmacy-deliveries.scss',
})
export class PharmacyDeliveries implements OnInit {
  private readonly api = inject(Api);

  readonly deliveries = signal<any[]>([]);

  readonly stepLabels: Record<string, string> = {
    pending: 'En attente', assigned: 'Assigné', picked_up: 'Ramassé',
    in_transit: 'En transit', delivered: 'Livré',
  };

  protected readonly STATUS_LABELS = STATUS_LABELS;
  protected readonly STATUS_COLORS = STATUS_COLORS;
  protected readonly Math = Math;

  ngOnInit(): void {
    this.api.getMyOrders().subscribe({
      next: (res) => {
        const data = res.data || [];
        const deliveries = data
          .filter((o: any) => o.deliveryStatus)
          .map((o: any) => ({
            id: o.id,
            productName: o.productName || '—',
            wholesalerName: o.wholesalerName || '—',
            deliveryStatus: o.deliveryStatus || 'pending',
          }));
        this.deliveries.set(deliveries.length > 0 ? deliveries : [{
          id: '—',
          productName: 'Aucune livraison',
          wholesalerName: '—',
          deliveryStatus: 'pending',
        }]);
      },
    });
  }

  getStepIndex(status: string): number {
    const steps = ['pending', 'assigned', 'picked_up', 'in_transit', 'delivered'];
    return steps.indexOf(status);
  }
}
