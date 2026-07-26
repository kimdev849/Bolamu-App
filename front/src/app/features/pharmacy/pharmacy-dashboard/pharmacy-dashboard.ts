import { Component, signal, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Auth } from '../../../core/services/auth';
import { mockRequests, mockOrders, mockPharmacies } from '../../../core/mock/db';
import { STATUS_LABELS, STATUS_COLORS, URGENCY_LABELS, URGENCY_COLORS } from '../../../core/config/app.constants';

@Component({
  selector: 'psr-pharmacy-dashboard',
  imports: [RouterLink, DatePipe],
  templateUrl: './pharmacy-dashboard.html',
  styleUrl: './pharmacy-dashboard.scss',
})
export class PharmacyDashboard {
  private readonly auth = inject(Auth);

  readonly pharmacy = mockPharmacies[0];
  readonly myRequests = signal(mockRequests.filter(r => r.pharmacyId === 'PH-001'));
  readonly myOrders = signal(mockOrders.filter(o => o.pharmacyId === 'PH-001'));

  readonly totalRequests = this.myRequests().length;
  readonly pendingRequests = this.myRequests().filter(r => r.status === 'pending').length;
  readonly totalOrders = this.myOrders().length;
  readonly activeOrders = this.myOrders().filter(o => o.status !== 'delivered' && o.status !== 'cancelled').length;
  readonly monthlySpent = this.myOrders().reduce((s, o) => s + o.totalPrice, 0);

  readonly user = this.auth.currentUser;

  protected readonly STATUS_LABELS = STATUS_LABELS;
  protected readonly STATUS_COLORS = STATUS_COLORS;
  protected readonly URGENCY_LABELS = URGENCY_LABELS;
  protected readonly URGENCY_COLORS = URGENCY_COLORS;
}
