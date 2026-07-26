import { Component, inject } from '@angular/core';

import { Auth } from '../../../core/services/auth';
import { mockOrders, mockDeliveryCompanies, mockAgents } from '../../../core/mock/db';
import { STATUS_LABELS, STATUS_COLORS } from '../../../core/config/app.constants';

@Component({
  selector: 'psr-delivery-dashboard',
  imports: [],
  templateUrl: './delivery-dashboard.html',
  styleUrl: './delivery-dashboard.scss',
})
export class DeliveryDashboard {
  private readonly auth = inject(Auth);
  readonly user = this.auth.currentUser;
  readonly company = mockDeliveryCompanies[0];
  readonly agents = mockAgents.filter(a => a.companyId === 'DC-001');
  readonly missions = mockOrders.filter(o => o.deliveryStatus);

  readonly STATUS_LABELS = STATUS_LABELS;
  readonly STATUS_COLORS = STATUS_COLORS;

  get activeMissions() { return this.missions.filter(m => m.deliveryStatus !== 'delivered').length; }
  get completedMissions() { return this.missions.filter(m => m.deliveryStatus === 'delivered').length; }
  get activeAgents() { return this.agents.filter(a => a.isActive).length; }
}
