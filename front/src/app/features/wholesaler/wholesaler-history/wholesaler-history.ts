import { Component, inject, signal, OnInit } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { Api } from '../../../core/services/api';
import { STATUS_LABELS, STATUS_COLORS } from '../../../core/config/app.constants';

@Component({
  selector: 'psr-wholesaler-history',
  imports: [DatePipe, DecimalPipe],
  templateUrl: './wholesaler-history.html',
  styleUrl: './wholesaler-history.scss',
})
export class WholesalerHistory implements OnInit {
  private readonly api = inject(Api);

  readonly history = signal<any[]>([]);

  totalDelivered = 0;
  totalRevenue = 0;

  protected readonly STATUS_LABELS = STATUS_LABELS;
  protected readonly STATUS_COLORS = STATUS_COLORS;

  ngOnInit(): void {
    this.api.getOrders({ limit: 100 }).subscribe({
      next: (res) => {
        const delivered = (res.data || []).filter((o: any) =>
          o.orderStatus === 'DELIVERED' || o.deliveryStatus === 'delivered'
        );
        this.history.set(delivered);
        this.totalDelivered = delivered.length;
        this.totalRevenue = delivered.reduce((s: number, o: any) => s + (o.totalAmount || 0), 0);
      },
    });
  }
}
