import { Component, signal, computed, effect } from '@angular/core';
import { mockRequests, mockOrders, mockPharmacies } from '../../../core/mock/db';
import { STATUS_LABELS, STATUS_COLORS, URGENCY_LABELS, URGENCY_COLORS, getDeliveryFee, getCommission } from '../../../core/config/app.constants';
import type { ProductRequest, RequestResponse } from '../../../core/models/request';
import type { Order } from '../../../core/models/misc';

@Component({
  selector: 'psr-wholesaler-requests',
  imports: [],
  templateUrl: './wholesaler-requests.html',
  styleUrl: './wholesaler-requests.scss',
})
export class WholesalerRequests {
  readonly wholesalerId = 'WH-001';
  readonly wholesalerName = 'DistriPharm Cameroun';

  // Données
  readonly requests = signal(
    mockRequests.filter(r =>
      r.status === 'searching' ||
      r.status === 'found' ||
      r.status === 'confirmed' ||
      r.responses?.some(rs => rs.wholesalerId === this.wholesalerId)
    )
  );

  readonly orders = signal(mockOrders.filter(o => o.wholesalerId === this.wholesalerId));
  readonly selectedFilter = signal<string>('all');

  readonly filteredRequests = computed(() => {
    const f = this.selectedFilter();
    return f === 'all' ? this.requests() : this.requests().filter(r => r.status === f);
  });

  // Gestion de l'expansion inline par ID de demande
  readonly expandedId = signal<string | null>(null);
  readonly inlinePrice = signal(0);

  // Timers FCFS
  readonly timers = signal<Record<string, string>>({});

  constructor() {
    effect((onCleanup) => {
      const searching = this.requests().filter(r => r.status === 'searching');
      if (searching.length === 0) { this.timers.set({}); return; }

      const updateTimers = () => {
        const newTimers: Record<string, string> = {};
        for (const r of searching) {
          const remaining = Math.max(0, 30 * 60 * 1000 - (Date.now() - new Date(r.createdAt).getTime()));
          if (remaining <= 0) {
            newTimers[r.id] = 'Expiré';
            this.requests.set(this.requests().map(req =>
              req.id === r.id ? { ...req, status: 'expired' as const } : req
            ));
            continue;
          }
          const mins = Math.floor(remaining / 60000);
          const secs = Math.floor((remaining % 60000) / 1000);
          newTimers[r.id] = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
        }
        this.timers.set(newTimers);
      };

      updateTimers();
      const interval = setInterval(updateTimers, 1000);
      onCleanup(() => clearInterval(interval));
    });
  }

  readonly STATUS_LABELS = STATUS_LABELS;
  readonly STATUS_COLORS = STATUS_COLORS;
  readonly URGENCY_LABELS = URGENCY_LABELS;
  readonly URGENCY_COLORS = URGENCY_COLORS;

  filterBy(f: string): void {
    this.selectedFilter.set(f);
  }

  /** Récupère la ville de la pharmacie pour calculer les frais de livraison */
  getPharmacyCity(pharmacyId: string): string {
    return mockPharmacies.find(p => p.id === pharmacyId)?.city || 'Douala';
  }

  /** Calcule le delivery fee selon la ville de la pharmacie */
  calcDeliveryFee(pharmacyId: string): number {
    return getDeliveryFee(this.getPharmacyCity(pharmacyId));
  }

  /** Ouvre le panneau inline pour fixer le prix du médicament uniquement */
  expandCard(request: ProductRequest): void {
    if (this.expandedId() === request.id) {
      this.expandedId.set(null);
      return;
    }
    this.expandedId.set(request.id);
    this.inlinePrice.set(Math.floor(Math.random() * 100) + 200);
  }

  /** Confirme l'acceptation (FCFS) — le delivery fee est auto-calculé par PSR */
  confirmAccept(request: ProductRequest): void {
    if (request.status !== 'searching') {
      this.expandedId.set(null);
      return; // FCFS lock
    }

    const foundPrice = this.inlinePrice();
    const deliveryPrice = this.calcDeliveryFee(request.pharmacyId);
    const commissionAmount = getCommission(foundPrice * request.quantity);

    const response: RequestResponse = {
      id: 'RS-' + Date.now().toString(36).toUpperCase(),
      wholesalerId: this.wholesalerId,
      wholesalerName: this.wholesalerName,
      type: 'accepted',
      price: foundPrice,
      availableQuantity: request.quantity,
      estimatedDeliveryDays: Math.floor(Math.random() * 3) + 1,
      createdAt: new Date().toISOString(),
    };

    // Verrouillage FCFS
    this.requests.set(this.requests().map(r =>
      r.id === request.id
        ? { ...r, status: 'found' as const, foundById: this.wholesalerId, foundAt: new Date().toISOString(), foundPrice, deliveryPrice, responses: [...(r.responses || []), response] }
        : r
    ));

    // Création commande
    const total = foundPrice * request.quantity + deliveryPrice + commissionAmount;
    this.orders.set([{
      id: 'ORD-' + Date.now().toString(36).toUpperCase(),
      requestId: request.id,
      pharmacyId: request.pharmacyId,
      pharmacyName: request.pharmacyName,
      wholesalerId: this.wholesalerId,
      wholesalerName: this.wholesalerName,
      productName: request.productName,
      productCode: request.productCode,
      dosage: request.dosage,
      quantity: request.quantity,
      unit: request.unit,
      unitPrice: foundPrice,
      deliveryPrice,
      totalPrice: total,
      status: 'created',
      paymentStatus: 'unpaid',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as Order, ...this.orders()]);

    this.expandedId.set(null);
  }

  /** Décliner la demande */
  declineRequest(request: ProductRequest): void {
    this.requests.set(this.requests().map(r =>
      r.id === request.id
        ? { ...r, responses: [...(r.responses || []), { id: 'RS-' + Date.now().toString(36).toUpperCase(), wholesalerId: this.wholesalerId, wholesalerName: this.wholesalerName, type: 'declined' as const, createdAt: new Date().toISOString() }] }
        : r
    ));
  }

  hasResponded(requestId: string): boolean {
    return this.requests().find(r => r.id === requestId)?.responses?.some(rs => rs.wholesalerId === this.wholesalerId) ?? false;
  }

  getMyResponse(requestId: string): RequestResponse | undefined {
    return this.requests().find(r => r.id === requestId)?.responses?.find(rs => rs.wholesalerId === this.wholesalerId);
  }

  getOrderForRequest(requestId: string): Order | undefined {
    return this.orders().find(o => o.requestId === requestId);
  }
}
