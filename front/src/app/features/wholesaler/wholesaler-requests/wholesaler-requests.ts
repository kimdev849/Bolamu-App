import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { STATUS_LABELS, STATUS_COLORS, URGENCY_LABELS, URGENCY_COLORS } from '../../../core/config/app.constants';
import { Api } from '../../../core/services/api';

const DELIVERY_FEES: Record<string, number> = {
  'Brazzaville': 1000, 'Pointe-Noire': 1500, 'Talangaï': 1500,
  'Ouenzé': 1500, 'Mfilou': 2000, 'Madingou': 2500,
};

@Component({
  selector: 'psr-wholesaler-requests',
  imports: [],
  templateUrl: './wholesaler-requests.html',
  styleUrl: './wholesaler-requests.scss',
})
export class WholesalerRequests implements OnInit, OnDestroy {
  private readonly api = inject(Api);

  readonly requests = signal<any[]>([]);
  readonly selectedFilter = signal('all');
  readonly filteredRequests = signal<any[]>([]);
  readonly expandedId = signal<string | null>(null);
  readonly timers = signal<Record<string, string>>({});
  readonly inlinePrice = signal(0);

  readonly wholesalerId = `WS-${Date.now()}`;

  private allRequests: any[] = [];
  private orders: any[] = [];
  private intervalId: ReturnType<typeof setInterval> | null = null;

  protected readonly STATUS_LABELS = STATUS_LABELS;
  protected readonly STATUS_COLORS = STATUS_COLORS;
  protected readonly URGENCY_LABELS = URGENCY_LABELS;
  protected readonly URGENCY_COLORS = URGENCY_COLORS;

  ngOnInit(): void {
    this.api.getMyWholesalerRequests().subscribe({
      next: (res) => {
        this.allRequests = (res.data || []).map((r: any) => ({
          ...r,
          status: (r.status || 'searching').toLowerCase(),
          urgent: r.urgency === 'emergency' || r.urgency === 'high',
          responses: r.responses || [],
          createdAt: r.createdAt || new Date().toISOString(),
          pharmacyCity: this.getPharmacyCity(r.pharmacyId),
        }));
        this.applyFilter();
        this.startTimers();
      },
    });
    this.api.getOrders({ limit: 100 }).subscribe({
      next: (res) => { this.orders = res.data || []; },
    });
  }

  ngOnDestroy(): void {
    if (this.intervalId) clearInterval(this.intervalId);
  }

  private startTimers(): void {
    const update = () => {
      const now = Date.now();
      const newTimers: Record<string, string> = {};
      for (const r of this.allRequests) {
        if (r.status !== 'searching') continue;
        const elapsed = now - new Date(r.createdAt).getTime();
        const remaining = Math.max(0, 30 * 60 * 1000 - elapsed);
        if (remaining <= 0) {
          newTimers[r.id] = 'Expiré';
          this.allRequests = this.allRequests.map(req =>
            req.id === r.id ? { ...req, status: 'expired' } : req
          );
        } else {
          const m = Math.floor(remaining / 60000);
          const s = Math.floor((remaining % 60000) / 1000);
          newTimers[r.id] = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
        }
      }
      this.timers.set(newTimers);
    };
    update();
    this.intervalId = setInterval(update, 1000);
  }

  filterBy(f: string): void {
    this.selectedFilter.set(f);
    this.applyFilter();
  }

  private applyFilter(): void {
    const f = this.selectedFilter();
    this.filteredRequests.set(
      f === 'all' ? [...this.allRequests] : this.allRequests.filter((r: any) => r.status === f)
    );
  }

  expandCard(r: any): void {
    this.expandedId.set(r.id === this.expandedId() ? null : r.id);
    this.inlinePrice.set(0);
  }

  confirmAccept(r: any): void {
    const price = this.inlinePrice();
    if (price <= 0) return;
    const response = {
      id: `RESP-${Date.now()}`,
      requestId: r.id,
      wholesalerId: this.wholesalerId,
      type: 'accepted',
      unitPrice: price,
      createdAt: new Date().toISOString(),
    };
    this.allRequests = this.allRequests.map(req =>
      req.id === r.id ? { ...req, status: 'found', foundById: this.wholesalerId, responses: [...(req.responses || []), response] } : req
    );
    const order = {
      id: `ORD-${Date.now()}`,
      requestId: r.id,
      productName: r.productName,
      quantity: r.quantity,
      unit: r.unit,
      unitPrice: price,
      deliveryPrice: this.calcDeliveryFee(r.pharmacyId),
      totalPrice: price * r.quantity + this.calcDeliveryFee(r.pharmacyId),
      status: 'CREATED',
      pharmacyName: r.pharmacyName,
      createdAt: new Date().toISOString(),
    };
    this.orders = [order, ...this.orders];
    this.expandedId.set(null);
    this.applyFilter();
  }

  declineRequest(r: any): void {
    this.allRequests = this.allRequests.map(req =>
      req.id === r.id ? { ...req, responses: [...(req.responses || []), { id: `RESP-${Date.now()}`, requestId: r.id, wholesalerId: this.wholesalerId, type: 'declined', createdAt: new Date().toISOString() }] } : req
    );
    this.applyFilter();
  }

  hasResponded(requestId: string): boolean {
    const r = this.allRequests.find((req: any) => req.id === requestId);
    return r?.responses?.some((rs: any) => rs.wholesalerId === this.wholesalerId) || false;
  }

  getMyResponse(requestId: string): any {
    const r = this.allRequests.find((req: any) => req.id === requestId);
    return r?.responses?.find((rs: any) => rs.wholesalerId === this.wholesalerId);
  }

  getOrderForRequest(requestId: string): any {
    return this.orders.find((o: any) => o.requestId === requestId);
  }

  calcDeliveryFee(pharmacyId: string): number {
    const city = this.getPharmacyCity(pharmacyId);
    return DELIVERY_FEES[city] || 1500;
  }

  getPharmacyCity(pharmacyId: string): string {
    return 'Brazzaville';
  }
}
