import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FcfaPipe } from '../../../shared/pipes/fcfa-pipe';
import { mockRequests, mockOrders, mockPharmacies, mockWholesalers, mockDeliveryCompanies, mockCommissions } from '../../../core/mock/db';
import { STATUS_LABELS, STATUS_COLORS, URGENCY_LABELS, URGENCY_COLORS } from '../../../core/config/app.constants';

@Component({
  selector: 'psr-admin-dashboard',
  imports: [RouterLink, FcfaPipe],
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.scss',
})
export class AdminDashboard {
  readonly today = new Date();

  readonly stats = signal([
    {
      title: 'Pharmacies',
      value: mockPharmacies.length,
      active: mockPharmacies.filter(p => p.isActive).length,
      change: '+12%',
      trend: 'up',
      icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
      color: 'blue',
    },
    {
      title: 'Grossistes',
      value: mockWholesalers.length,
      active: mockWholesalers.filter(w => w.isActive).length,
      change: '+8%',
      trend: 'up',
      icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10',
      color: 'violet',
    },
    {
      title: 'Demandes',
      value: mockRequests.length,
      active: mockRequests.filter(r => r.status === 'pending').length,
      change: '+23%',
      trend: 'up',
      icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
      color: 'amber',
    },
    {
      title: 'Chiffre d\'affaires',
      value: '2.5M',
      active: 'FCFA',
      change: '+15%',
      trend: 'up',
      icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
      color: 'emerald',
    },
  ]);

  readonly recentRequests = signal(
    [...mockRequests]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5)
  );

  readonly recentOrders = signal(
    [...mockOrders]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  );

  readonly pendingCommissions = signal(mockCommissions.filter(c => c.status === 'pending'));

  readonly totalCommissionsAmount = signal(
    mockCommissions.reduce((sum, c) => sum + c.amount, 0)
  );

  readonly pendingCommissionsAmount = signal(
    mockCommissions.filter(c => c.status === 'pending').reduce((sum, c) => sum + c.amount, 0)
  );

  readonly monthlyRevenue = signal(2500000);
  readonly monthlyOrders = signal(mockOrders.length);
  readonly monthlyRequests = signal(mockRequests.length);

  protected readonly STATUS_LABELS = STATUS_LABELS;
  protected readonly STATUS_COLORS = STATUS_COLORS;
  protected readonly URGENCY_LABELS = URGENCY_LABELS;
  protected readonly URGENCY_COLORS = URGENCY_COLORS;
}
