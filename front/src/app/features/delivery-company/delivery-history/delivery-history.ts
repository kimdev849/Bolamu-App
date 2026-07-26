import { Component, inject, signal, OnInit } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { Api } from '../../../core/services/api';
import { STATUS_LABELS, STATUS_COLORS } from '../../../core/config/app.constants';

@Component({
  selector: 'psr-delivery-history',
  imports: [DatePipe, DecimalPipe],
  templateUrl: './delivery-history.html',
  styleUrl: './delivery-history.scss',
})
export class DeliveryHistory implements OnInit {
  private readonly api = inject(Api);

  readonly history = signal<any[]>([]);
  totalRevenue = 0;

  protected readonly STATUS_LABELS = STATUS_LABELS;
  protected readonly STATUS_COLORS = STATUS_COLORS;
  protected readonly Math = Math;

  ngOnInit(): void {
    this.api.getOrders({ limit: 100 }).subscribe({
      next: (res) => {
        const delivered = (res.data || []).filter((o: any) =>
          o.deliveryStatus === 'delivered' || o.orderStatus === 'DELIVERED'
        );
        this.history.set(delivered);
        this.totalRevenue = delivered.reduce((s: number, o: any) => s + (o.totalAmount || 0), 0);
      },
    });
  }
}
