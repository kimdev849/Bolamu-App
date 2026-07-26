import { Component, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { mockCommissions } from '../../../core/mock/db';
import type { Commission } from '../../../core/models/misc';

@Component({
  selector: 'psr-admin-commissions',
  imports: [DatePipe, DecimalPipe],
  templateUrl: './admin-commissions.html',
  styleUrl: './admin-commissions.scss',
})
export class AdminCommissions {
  readonly commissions = signal<Commission[]>([...mockCommissions]);
  readonly selectedFilter = signal<string>('all');

  readonly filteredCommissions = signal<Commission[]>([...mockCommissions]);

  get totalAmount() { return this.commissions().reduce((s, c) => s + c.amount, 0); }
  get pendingAmount() { return this.commissions().filter(c => c.status === 'pending').reduce((s, c) => s + c.amount, 0); }
  get paidAmount() { return this.commissions().filter(c => c.status === 'paid').reduce((s, c) => s + c.amount, 0); }
  get pendingCount() { return this.commissions().filter(c => c.status === 'pending').length; }
  get paidCount() { return this.commissions().filter(c => c.status === 'paid').length; }

  filterBy(f: string): void {
    this.selectedFilter.set(f);
    this.filteredCommissions.set(
      f === 'all' ? this.commissions() : this.commissions().filter(c => c.status === f)
    );
  }

  markAsPaid(id: string): void {
    this.commissions.set(this.commissions().map(c =>
      c.id === id ? { ...c, status: 'paid' as const, paidAt: new Date().toISOString() } : c
    ));
    this.filterBy(this.selectedFilter());
  }
}
