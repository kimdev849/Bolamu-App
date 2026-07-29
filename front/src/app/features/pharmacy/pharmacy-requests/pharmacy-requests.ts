import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { finalize } from 'rxjs';
import { Api } from '../../../core/services/api';
import { Toast } from '../../../core/services/toast';
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
  private readonly toast = inject(Toast);

  readonly requests = signal<any[]>([]);
  readonly orders = signal<any[]>([]);
  readonly selectedFilter = signal('all');
  readonly showNewForm = signal(false);
  readonly foundRequest = signal<any>(null);
  readonly isSubmitting = signal(false);
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
    return this.orders().filter(o => o.paymentStatus === 'PENDING' || o.paymentStatus === 'pending');
  });

  ngOnInit(): void {
    this.loadRequests();
    this.loadOrders();
  }

  private loadRequests(): void {
    this.api.getMyRequests().subscribe({
      next: (res) => {
        const data = res.data || [];
        this.requests.set(data);
        const found = data.find((r: any) => r.status === 'FOUND');
        if (found) {
          // Fetch full detail to get order pricing info
          this.api.getRequestDetail(found.id).subscribe({
            next: (detailRes) => this.foundRequest.set(detailRes.data),
          });
        }
      },
    });
  }

  private loadOrders(): void {
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
    const productName = this.newProductName();
    if (!productName) return;

    this.isSubmitting.set(true);
    this.api.createRequest({
      productName,
      dosage: this.newDosage() || undefined,
      quantity: this.newQuantity(),
      isUrgent: this.newUrgency() === 'urgent' || this.newUrgency() === 'emergency',
      notes: this.newNotes() || undefined,
    }).pipe(finalize(() => this.isSubmitting.set(false)))
    .subscribe({
      next: () => {
        this.toast.success('Demande créée', 'Votre demande a été soumise avec succès');
        this.showNewForm.set(false);
        this.newProductName.set('');
        this.newDosage.set('');
        this.newQuantity.set(1);
        this.newUrgency.set('normal');
        this.newNotes.set('');
        this.loadRequests();
      },
      error: (err) => {
        this.toast.error('Erreur', err.error?.message || 'Impossible de créer la demande');
      },
    });
  }

  getWholesalerName(wholesalerId: string): string {
    return `Fournisseur #${wholesalerId?.slice(-4) || '?'}`;
  }

  confirmOrder(found: any): void {
    this.api.confirmRequest(found.id).subscribe({
      next: () => {
        this.toast.success('Commande confirmée', 'La commande a été confirmée avec succès');
        this.foundRequest.set(null);
        this.loadRequests();
        this.loadOrders();
      },
      error: (err) => this.toast.error('Erreur', err.error?.message || 'Impossible de confirmer'),
    });
  }

  cancelFoundRequest(found: any): void {
    this.api.cancelRequest(found.id).subscribe({
      next: () => {
        this.toast.success('Demande annulée', 'La demande a été annulée');
        this.foundRequest.set(null);
        this.loadRequests();
      },
      error: (err) => this.toast.error('Erreur', err.error?.message || 'Impossible d\'annuler'),
    });
  }

  markPaid(requestId: string): void {
    this.api.markRequestPaid(requestId).subscribe({
      next: () => {
        this.toast.success('Paiement confirmé', 'Le paiement a été enregistré');
        this.loadOrders();
        this.loadRequests();
      },
      error: (err) => this.toast.error('Erreur', err.error?.message || 'Impossible de marquer comme payé'),
    });
  }
}
