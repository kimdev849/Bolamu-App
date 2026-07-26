import { Component, signal, computed, effect } from '@angular/core';
import { DatePipe } from '@angular/common';
import { mockRequests, mockOrders, mockWholesalers } from '../../../core/mock/db';
import { STATUS_LABELS, STATUS_COLORS, URGENCY_LABELS, URGENCY_COLORS, getDeliveryFee, getCommission } from '../../../core/config/app.constants';
import type { ProductRequest } from '../../../core/models/request';
import type { Order } from '../../../core/models/misc';

const SUGGESTED_PRODUCTS = [
  'Amoxicilline', 'Paracétamol', 'Doliprane', 'Ibuprofène',
  'Vitamine C', 'Médicament Antipaludique', 'Artéméther',
  'Ceftriaxone', 'Métronidazole', 'Dexaméthasone', 'Diazépam',
  'Oméprazole', 'Salbutamol', 'Prednisolone', 'Aspirine',
];

@Component({
  selector: 'psr-pharmacy-requests',
  imports: [DatePipe],
  templateUrl: './pharmacy-requests.html',
  styleUrl: './pharmacy-requests.scss',
})
export class PharmacyRequests {
  // Données
  readonly requests = signal(mockRequests.filter(r => r.pharmacyId === 'PH-001'));
  readonly orders = signal(mockOrders.filter(o => o.pharmacyId === 'PH-001'));

  // Formulaire nouvelle demande
  readonly showNewForm = signal(false);
  readonly newProductName = signal('');
  readonly newDosage = signal('');
  readonly newQuantity = signal(1);
  readonly newUrgency = signal<'low' | 'normal' | 'high' | 'emergency'>('normal');
  readonly newNotes = signal('');
  readonly showSuggestions = signal(false);

  // Suggestions autocomplete filtrées
  readonly filteredSuggestions = computed(() => {
    const q = this.newProductName().toLowerCase();
    if (!q || q.length < 2) return [];
    return SUGGESTED_PRODUCTS.filter(p => p.toLowerCase().includes(q));
  });

  // Demande trouvée (FCFS) — notification de commande à confirmer
  readonly foundRequest = computed(() =>
    this.requests().find(r => r.status === 'found' && r.foundById)
  );

  readonly pendingOrders = computed(() =>
    this.orders().filter(o => o.paymentStatus === 'unpaid')
  );

  // Décompte du timer pour la commande trouvée
  readonly timeRemaining = signal<string>('');
  constructor() {
    // Met à jour le timer chaque seconde, nettoyé proprement par onCleanup
    effect((onCleanup) => {
      const found = this.foundRequest();

      if (!found?.foundAt) {
        this.timeRemaining.set('');
        onCleanup(() => {});
        return;
      }

      const updateTimer = () => {
        const elapsed = Date.now() - new Date(found.foundAt!).getTime();
        const remaining = Math.max(0, 30 * 60 * 1000 - elapsed);
        if (remaining <= 0) {
          this.timeRemaining.set('Expiré');
          return;
        }
        const mins = Math.floor(remaining / 60000);
        const secs = Math.floor((remaining % 60000) / 1000);
        this.timeRemaining.set(`${mins} min ${secs} s`);
      };

      updateTimer();
      const interval = setInterval(updateTimer, 1000);
      onCleanup(() => clearInterval(interval));
    });
  }

  readonly STATUS_LABELS = STATUS_LABELS;
  readonly STATUS_COLORS = STATUS_COLORS;
  readonly URGENCY_LABELS = URGENCY_LABELS;
  readonly URGENCY_COLORS = URGENCY_COLORS;

  /** Cache les suggestions après un délai (pour gérer le blur avant le click) */
  onBlurProductName(): void {
    setTimeout(() => this.showSuggestions.set(false), 200);
  }

  /** Sélectionne un produit dans l'autocomplete */
  selectProduct(name: string): void {
    this.newProductName.set(name);
    this.showSuggestions.set(false);
  }

  /** Soumet une nouvelle demande */
  submitRequest(): void {
    if (!this.newProductName()) return;
    const req: ProductRequest = {
      id: 'RQ-' + Date.now().toString(36).toUpperCase(),
      pharmacyId: 'PH-001',
      pharmacyName: 'Pharmacie Centrale',
      productName: this.newProductName(),
      productCode: this.newProductName().substring(0, 3).toUpperCase(),
      dosage: this.newDosage() || undefined,
      quantity: this.newQuantity(),
      unit: 'boîte',
      status: 'searching',
      urgency: this.newUrgency(),
      notes: this.newNotes() || undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.requests.set([req, ...this.requests()]);
    this.resetForm();
  }

  /** Confirmer la commande (pharmacie accepte le prix) */
  confirmOrder(request: ProductRequest): void {
    const foundPrice = request.foundPrice || 0;
    const deliveryPrice = request.deliveryPrice || 0;
    const commissionAmount = getCommission(foundPrice * request.quantity);
    const totalPrice = foundPrice * request.quantity + deliveryPrice + commissionAmount;

    // Créer la commande
    const order: Order = {
      id: 'ORD-' + Date.now().toString(36).toUpperCase(),
      requestId: request.id,
      pharmacyId: request.pharmacyId,
      pharmacyName: request.pharmacyName,
      wholesalerId: request.foundById || '',
      wholesalerName: '',
      productName: request.productName,
      productCode: request.productCode,
      dosage: request.dosage,
      quantity: request.quantity,
      unit: request.unit,
      unitPrice: foundPrice,
      deliveryPrice: deliveryPrice,
      totalPrice: totalPrice,
      status: 'confirmed',
      paymentStatus: 'unpaid',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Trouver le nom du grossiste
    const wholesaler = mockWholesalers.find(w => w.id === request.foundById);
    if (wholesaler) order.wholesalerName = wholesaler.name;

    // Mettre à jour les listes
    this.requests.set(this.requests().map(r =>
      r.id === request.id ? { ...r, status: 'confirmed' as const } : r
    ));
    this.orders.set([order, ...this.orders()]);
  }

  /** Annuler la demande trouvée */
  cancelFoundRequest(request: ProductRequest): void {
    this.requests.set(this.requests().map(r =>
      r.id === request.id ? { ...r, status: 'cancelled' as const } : r
    ));
  }

  /** Obtenir le nom du grossiste */
  getWholesalerName(wholesalerId: string | undefined): string {
    if (!wholesalerId) return '—';
    const w = mockWholesalers.find(w => w.id === wholesalerId);
    return w?.name || '—';
  }

  /** Paiement manuel confirmé */
  markPaid(requestId: string): void {
    const request = this.requests().find(r => r.id === requestId);
    if (!request) return;
    const order = this.orders().find(o => o.requestId === requestId);
    if (!order) return;

    this.orders.set(this.orders().map(o =>
      o.id === order.id ? { ...o, paymentStatus: 'paid' as const, status: 'processing' as const } : o
    ));
    this.requests.set(this.requests().map(r =>
      r.id === request.id ? { ...r, status: 'in_progress' as const } : r
    ));
  }

  private resetForm(): void {
    this.showNewForm.set(false);
    this.newProductName.set('');
    this.newDosage.set('');
    this.newQuantity.set(1);
    this.newUrgency.set('normal');
    this.newNotes.set('');
  }
}
