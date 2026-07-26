import { Component, inject, signal, OnInit } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { Api } from '../../../core/services/api';

@Component({
  selector: 'psr-admin-commissions',
  imports: [DatePipe, DecimalPipe],
  templateUrl: './admin-commissions.html',
  styleUrl: './admin-commissions.scss',
})
export class AdminCommissions implements OnInit {
  private readonly api = inject(Api);

  readonly commissions = signal<any[]>([]);
  readonly selectedFilter = signal<string>('all');
  readonly filteredCommissions = signal<any[]>([]);

  get totalAmount() { return this.commissions().reduce((s, c) => s + (c.amount || 0), 0); }
  get pendingAmount() { return this.commissions().filter(c => c.status === 'PENDING' || c.status === 'pending').reduce((s, c) => s + (c.amount || 0), 0); }
  get paidAmount() { return this.commissions().filter(c => c.status === 'PAID' || c.status === 'paid').reduce((s, c) => s + (c.amount || 0), 0); }
  get pendingCount() { return this.commissions().filter(c => c.status === 'PENDING' || c.status === 'pending').length; }
  get paidCount() { return this.commissions().filter(c => c.status === 'PAID' || c.status === 'paid').length; }

  ngOnInit(): void {
    this.api.getOrders({ limit: 100 }).subscribe({
      next: (res) => {
        const all = res.data || [];
        const cs = all
          .filter((o: any) => o.totalAmount)
          .map((o: any) => ({
            id: `COMM-${o.id}`,
            orderId: o.id,
            percentage: 0,
            amount: o.totalAmount || 0,
            status: o.paymentStatus === 'CONFIRMED' ? 'paid' : 'pending',
            createdAt: o.createdAt || new Date().toISOString(),
          }));
        this.commissions.set(cs);
        this.applyFilter(this.selectedFilter());
      },
    });
  }

  filterBy(f: string): void {
    this.selectedFilter.set(f);
    this.applyFilter(f);
  }

  private applyFilter(f: string): void {
    const all = this.commissions();
    if (f === 'all') {
      this.filteredCommissions.set(all);
    } else if (f === 'paid') {
      this.filteredCommissions.set(all.filter(c => c.status === 'paid'));
    } else {
      this.filteredCommissions.set(all.filter(c => c.status === 'pending'));
    }
  }

  markAsPaid(id: string): void {
    const updated = this.commissions().map(c =>
      c.id === id ? { ...c, status: 'paid' as const, paidAt: new Date().toISOString() } : c
    );
    this.commissions.set(updated);
    this.applyFilter(this.selectedFilter());
  }
}
