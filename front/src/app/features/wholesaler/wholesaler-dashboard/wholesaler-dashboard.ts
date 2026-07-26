import { Component, signal, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Auth } from '../../../core/services/auth';
import { mockRequests, mockOrders } from '../../../core/mock/db';
import { STATUS_LABELS, STATUS_COLORS } from '../../../core/config/app.constants';

@Component({
  selector: 'psr-wholesaler-dashboard',
  imports: [RouterLink],
  templateUrl: './wholesaler-dashboard.html',
  styleUrl: './wholesaler-dashboard.scss',
})
export class WholesalerDashboard {
  private readonly auth = inject(Auth);
  readonly user = this.auth.currentUser;

  readonly matchedRequests = signal(mockRequests.filter(r => r.responses?.some(rs => rs.wholesalerId === 'WH-001')));
  readonly myOrders = signal(mockOrders.filter(o => o.wholesalerId === 'WH-001'));
  readonly pendingRequests = signal(mockRequests.filter(r => r.status === 'pending'));
  readonly totalRequests = mockRequests.filter(r => r.responses?.some(rs => rs.wholesalerId === 'WH-001')).length;
  readonly totalOrders = mockOrders.filter(o => o.wholesalerId === 'WH-001').length;
  readonly totalRevenue = mockOrders.filter(o => o.wholesalerId === 'WH-001').reduce((s, o) => s + o.totalPrice, 0);

  readonly STATUS_LABELS = STATUS_LABELS;
  readonly STATUS_COLORS = STATUS_COLORS;
}
