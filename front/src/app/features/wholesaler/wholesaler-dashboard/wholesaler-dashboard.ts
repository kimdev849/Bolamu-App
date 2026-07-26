import { Component, inject, signal, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Auth } from '../../../core/services/auth';
import { Api } from '../../../core/services/api';
import { STATUS_LABELS, STATUS_COLORS } from '../../../core/config/app.constants';

@Component({
  selector: 'psr-wholesaler-dashboard',
  imports: [RouterLink],
  templateUrl: './wholesaler-dashboard.html',
  styleUrl: './wholesaler-dashboard.scss',
})
export class WholesalerDashboard implements OnInit {
  private readonly api = inject(Api);
  private readonly auth = inject(Auth);

  readonly user = signal<any>(null);
  readonly pendingRequests = signal<any[]>([]);
  readonly matchedRequests = signal<any[]>([]);
  readonly myOrders = signal<any[]>([]);

  totalRequests = 0;
  totalOrders = 0;
  totalRevenue = 0;

  protected readonly STATUS_LABELS = STATUS_LABELS;
  protected readonly STATUS_COLORS = STATUS_COLORS;

  ngOnInit(): void {
    this.user.set(this.auth.user());
    this.api.getMyWholesalerRequests().subscribe({
      next: (res) => {
        const data = res.data || [];
        this.matchedRequests.set(data);
        this.totalRequests = data.length;
        this.pendingRequests.set(data.filter((r: any) => r.status === 'SEARCHING' || r.status === 'searching'));
      },
    });
    this.api.getMyOrders().subscribe({
      next: (res) => {
        const data = res.data || [];
        this.myOrders.set(data);
        this.totalOrders = data.length;
        this.totalRevenue = data.reduce((s: number, o: any) => s + (o.totalAmount || 0), 0);
      },
    });
  }
}
