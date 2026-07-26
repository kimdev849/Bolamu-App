import { Component, inject, signal, OnInit } from '@angular/core';
import { Api } from '../../../core/services/api';
import { Auth } from '../../../core/services/auth';

@Component({
  selector: 'psr-delivery-dashboard',
  imports: [],
  templateUrl: './delivery-dashboard.html',
  styleUrl: './delivery-dashboard.scss',
})
export class DeliveryDashboard implements OnInit {
  private readonly api = inject(Api);
  private readonly auth = inject(Auth);

  readonly company: any = { name: '—', city: '—', fleetSize: 0, coverageZones: [] };

  missions: any[] = [];
  agents: any[] = [];

  get activeMissions() { return this.missions.filter((m: any) => m.deliveryStatus !== 'delivered').length; }
  get completedMissions() { return this.missions.filter((m: any) => m.deliveryStatus === 'delivered').length; }
  get activeAgents() { return this.agents.filter((a: any) => a.isActive).length; }

  ngOnInit(): void {
    this.api.getMyDeliveryCompany().subscribe({
      next: (res) => {
        if (res.data) Object.assign(this.company, res.data);
      },
    });
    this.api.getOrders({ limit: 50 }).subscribe({
      next: (res) => { this.missions = res.data || []; },
    });
    this.api.getDeliveryAgents().subscribe({
      next: (res) => { this.agents = res.data || []; },
    });
  }
}
