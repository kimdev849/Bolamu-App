import { Component, inject, signal, OnInit } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { finalize } from 'rxjs';
import { Api } from '../../../core/services/api';
import { Toast } from '../../../core/services/toast';
import { STATUS_LABELS, STATUS_COLORS } from '../../../core/config/app.constants';

@Component({
  selector: 'psr-pharmacy-orders',
  imports: [DatePipe, DecimalPipe],
  templateUrl: './pharmacy-orders.html',
  styleUrl: './pharmacy-orders.scss',
})
export class PharmacyOrders implements OnInit {
  private readonly api = inject(Api);
  private readonly toast = inject(Toast);

  readonly orders = signal<any[]>([]);
  readonly selectedFilter = signal('all');
  readonly filteredOrders = signal<any[]>([]);
  readonly otpLoading = signal<string | null>(null);

  totalSpent = 0;

  protected readonly STATUS_LABELS = STATUS_LABELS;
  protected readonly STATUS_COLORS = STATUS_COLORS;

  ngOnInit(): void {
    this.loadOrders();
  }

  loadOrders(): void {
    this.api.getMyOrders().subscribe({
      next: (res) => {
        const data = res.data || [];
        this.orders.set(data);
        this.filteredOrders.set(data);
        this.totalSpent = data.reduce((s: number, o: any) => s + (o.totalAmount || 0), 0);
      },
    });
  }

  filterBy(f: string): void {
    this.selectedFilter.set(f);
    const all = this.orders();
    if (f === 'all') {
      this.filteredOrders.set(all);
    } else {
      const statusMap: Record<string, string> = {
        pending: 'CREATED',
        processing: 'IN_PROGRESS',
        delivered: 'DELIVERED',
        cancelled: 'CANCELLED',
      };
      this.filteredOrders.set(all.filter((o: any) =>
        (o.orderStatus || o.status || '').toLowerCase() === f ||
        (o.orderStatus || o.status || '') === (statusMap[f] || f.toUpperCase())
      ));
    }
  }

  /** Le code OTP peut être généré tant que la livraison n'est pas terminée */
  canGenerateOtp(o: any): boolean {
    const s = String(o.deliveryStatus || '').toUpperCase();
    const terminal = ['DELIVERED', 'COMPLETED', 'CANCELLED', 'FAILED', 'RETURNED', 'REFUNDED', 'DISPUTED'];
    return !terminal.includes(s);
  }

  isOtpExpired(o: any): boolean {
    return !!o.otpExpiresAt && new Date(o.otpExpiresAt) < new Date();
  }

  generateOtp(o: any): void {
    if (!o?.id) return;
    this.otpLoading.set(o.id);
    this.api.generateOrderOtp(o.id)
      .pipe(finalize(() => this.otpLoading.set(null)))
      .subscribe({
        next: (res) => {
          const expiry = res.data.otpExpiresAt ? new Date(res.data.otpExpiresAt) : null;
          const minutes = expiry ? Math.max(1, Math.round((expiry.getTime() - Date.now()) / 60000)) : 10;
          this.toast.success('Code OTP généré', `Code : ${res.data.otpCode} — valable ${minutes} min`);
          this.orders.update(all => all.map(x => x.id === o.id ? { ...x, otpCode: res.data.otpCode, otpExpiresAt: res.data.otpExpiresAt, otpVerifiedAt: null, otpAttempts: 0 } : x));
          this.filteredOrders.update(all => all.map(x => x.id === o.id ? { ...x, otpCode: res.data.otpCode, otpExpiresAt: res.data.otpExpiresAt, otpVerifiedAt: null, otpAttempts: 0 } : x));
        },
        error: (err) => {
          this.toast.error('Erreur', err.error?.message || 'Impossible de générer le code OTP');
        },
      });
  }
}
