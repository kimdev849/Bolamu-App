import { Component, inject, signal, OnInit } from '@angular/core';
import { Api } from '../../../core/services/api';
import { STATUS_LABELS, STATUS_COLORS } from '../../../core/config/app.constants';

@Component({
  selector: 'psr-delivery-missions',
  imports: [],
  templateUrl: './delivery-missions.html',
  styleUrl: './delivery-missions.scss',
})
export class DeliveryMissions implements OnInit {
  private readonly api = inject(Api);

  readonly deliveries = signal<any[]>([]);

  protected readonly STATUS_LABELS = STATUS_LABELS;
  protected readonly STATUS_COLORS = STATUS_COLORS;

  ngOnInit(): void {
    this.api.getDeliveryMissions().subscribe({
      next: (res) => { this.deliveries.set(res.data || []); },
    });
  }

  updateStatus(id: string, newStatus: string): void {
    this.deliveries.update(all =>
      all.map(d => d.id === id ? { ...d, deliveryStatus: newStatus } : d)
    );
  }
}
