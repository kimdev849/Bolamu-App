import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Api } from '../../../core/services/api';
import { STATUS_LABELS, STATUS_COLORS, URGENCY_LABELS, URGENCY_COLORS } from '../../../core/config/app.constants';

const PRODUCT_SUGGESTIONS = [
  'Amoxicilline', 'Paracétamol', 'Doliprane', 'Efferalgan', 'Dafalgan',
  'Ibuprofène', 'Advil', 'Aspirine', 'Vitamine C', 'Dexaméthasone',
  'Diazépam', 'Oméprazole', 'Métronidazole', 'Albendazole', 'Artéméther',
  'Quinine', 'Ceftriaxone', 'Pénicilline', 'Insuline', 'Salbutamol',
];

@Component({
  selector: 'psr-pharmacy-requests',
  imports: [DatePipe],
  templateUrl: './pharmacy-requests.html',
  styleUrl: './pharmacy-requests.scss',
})
export class PharmacyRequests implements OnInit {
  private readonly api = inject(Api);

  readonly requests = signal<any[]>([]);
  readonly orders = signal<any[]>([]);
  readonly selectedFilter = signal('all');
  readonly showNewForm = signal(false);
  readonly foundRequest = signal<any>(null);
  readonly timeRemaining = signal<string | null>(null);

  readonly newProductName = signal('');
  readonly newDosage = signal('');
  readonly newQuantity = signal(1);
  readonly newUrgency = signal('normal');
  readonly newNotes = signal('');
  readonly showSuggestions = signal(false);

  readonly filteredSuggestions = computed(() => {
    const q = this.newProductName().toLowerCase();
    if (!q) return PRODUCT_SUGGESTIONS;
    return PRODUCT_SUGGESTIONS.filter(s => s.toLowerCase().includes(q));
  });

  protected readonly STATUS_LABELS = STATUS_LABELS;
  protected readonly STATUS_COLORS = STATUS_COLORS;
  protected readonly URGENCY_LABELS = URGENCY_LABELS;
  protected readonly URGENCY_COLORS = URGENCY_COLORS;

  readonly pendingOrders = computed(() => {
    return this.orders().filter(o => o.paymentStatus === 'PENDING' || o.paymentStatus === 'pending' || o.paymentStatus === 'unpaid');
  });

  ngOnInit(): void {
    this.api.getMyRequests().subscribe({
      next: (res) => {
        const data = res.data || [];
        this.requests.set(data);
        const found = data.find((r: any) => r.status === 'FOUND' || r.status === 'found');
        if (found) this.foundRequest.set(found);
      },
    });
    this.api.getMyOrders().subscribe({
      next: (res) => this.orders.set(res.data || []),
    });
  }

  selectProduct(name: string): void {
    this.newProductName.set(name);
    this.showSuggestions.set(false);
  }

  onBlurProductName(): void {
    setTimeout(() => this.showSuggestions.set(false), 200);
  }

  submitRequest(): void {
    const name = this.newProductName();
    if (!name) return;
    const newReq = {
      id: `REQ-${Date.now()}`,
      productName: name,
      dosage: this.newDosage() || undefined,
      quantity: this.newQuantity(),
      unit: 'boîte',
      urgency: this.newUrgency(),
      notes: this.newNotes() || undefined,
      status: 'SEARCHING',
      createdAt: new Date().toISOString(),
    };
    this.requests.update(reqs => [newReq, ...reqs]);
    this.showNewForm.set(false);
    this.newProductName.set('');
    this.newDosage.set('');
    this.newQuantity.set(1);
    this.newUrgency.set('normal');
    this.newNotes.set('');
  }

  getWholesalerName(wholesalerId: string): string {
    return `Fournisseur #${wholesalerId?.slice(-4) || '?'}`;
  }

  confirmOrder(found: any): void {
    this.foundRequest.set(null);
  }

  cancelFoundRequest(found: any): void {
    this.requests.update(reqs => reqs.map(r => r.id === found.id ? { ...r, status: 'CANCELLED' } : r));
    this.foundRequest.set(null);
  }

  markPaid(requestId: string): void {
    this.orders.update(ords => ords.map(o => o.requestId === requestId ? { ...o, paymentStatus: 'paid' } : o));
  }
}
