import { Component, inject, signal, OnInit, OnDestroy, computed } from '@angular/core';
import { finalize } from 'rxjs';
import { STATUS_LABELS, STATUS_COLORS, URGENCY_LABELS, URGENCY_COLORS } from '../../../core/config/app.constants';
import { Api } from '../../../core/services/api';
import { Toast } from '../../../core/services/toast';
import { Auth } from '../../../core/services/auth';

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
  private readonly toast = inject(Toast);
  private readonly auth = inject(Auth);

  /** Current wholesaler ID from the user profile (set after profile load) */
  readonly currentWholesalerId = signal<string | null>(null);

  readonly requests = signal<any[]>([]);
  readonly selectedFilter = signal('all');
  readonly filteredRequests = signal<any[]>([]);
  readonly expandedId = signal<string | null>(null);
  readonly timers = signal<Record<string, string>>({});
  readonly inlinePrice = signal(0);
  readonly isProcessing = signal<string | null>(null);

  private allRequests: any[] = [];
  private orders: any[] = [];
  private intervalId: ReturnType<typeof setInterval> | null = null;

  protected readonly STATUS_LABELS = STATUS_LABELS;
  protected readonly STATUS_COLORS = STATUS_COLORS;
  protected readonly URGENCY_LABELS = URGENCY_LABELS;
  protected readonly URGENCY_COLORS = URGENCY_COLORS;

  ngOnInit(): void {
    this.loadWholesalerProfile();
    this.loadRequests();
    this.loadOrders();
  }

  private loadWholesalerProfile(): void {
    if (this.auth.currentUser()) {
      this.api.getMyWholesalerProfile().subscribe({
        next: (res) => {
          if (res.data?.id) this.currentWholesalerId.set(res.data.id);
        },
      });
    }
  }

  ngOnDestroy(): void {
    if (this.intervalId) clearInterval(this.intervalId);
  }

  private loadRequests(): void {
    this.api.getMyWholesalerRequests().subscribe({
      next: (res) => {
        this.allRequests = (res.data || []).map((r: any) => ({
          ...r,
          status: r.status || 'SEARCHING',
          responses: r.responses || [],
          createdAt: r.createdAt || new Date().toISOString(),
        }));
        this.applyFilter();
        this.startTimers();
      },
    });
  }

  private loadOrders(): void {
    this.api.getOrders({ limit: 100 }).subscribe({
      next: (res) => { this.orders = res.data || []; },
    });
  }

  private startTimers(): void {
    const update = () => {
      const now = Date.now();
      const newTimers: Record<string, string> = {};
      for (const r of this.allRequests) {
        if (r.status !== 'SEARCHING') continue;
        const elapsed = now - new Date(r.createdAt).getTime();
        const remaining = Math.max(0, 30 * 60 * 1000 - elapsed);
        if (remaining <= 0) {
          newTimers[r.id] = 'Expiré';
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
    if (f === 'all') {
      this.filteredRequests.set([...this.allRequests]);
    } else {
      this.filteredRequests.set(this.allRequests.filter((r: any) => r.status === f.toUpperCase()));
    }
  }

  expandCard(r: any): void {
    this.expandedId.set(r.id === this.expandedId() ? null : r.id);
    this.inlinePrice.set(0);
  }

  confirmAccept(r: any): void {
    const price = this.inlinePrice();
    if (price <= 0) {
      this.toast.warning('Prix requis', 'Veuillez saisir un prix valide');
      return;
    }

    this.isProcessing.set(r.id);
    this.api.acceptRequest(r.id, price)
      .pipe(finalize(() => this.isProcessing.set(null)))
      .subscribe({
        next: () => {
          this.toast.success('Demande acceptée', 'La commande a été créée avec succès');
          this.expandedId.set(null);
          this.inlinePrice.set(0);
          this.loadRequests();
          this.loadOrders();
        },
        error: (err) => {
          this.toast.error('Erreur', err.error?.message || 'Impossible d\'accepter la demande');
        },
      });
  }

  declineRequest(r: any): void {
    this.isProcessing.set(r.id);
    this.api.declineRequest(r.id)
      .pipe(finalize(() => this.isProcessing.set(null)))
      .subscribe({
        next: () => {
          this.toast.info('Demande déclinée', 'La demande reste ouverte pour les autres grossistes');
          this.loadRequests();
        },
        error: (err) => {
          this.toast.error('Erreur', err.error?.message || 'Impossible de décliner la demande');
        },
      });
  }

  hasResponded(requestId: string): boolean {
    const r = this.allRequests.find((req: any) => req.id === requestId);
    const myId = this.currentWholesalerId();
    if (!myId) return false;
    return r?.responses?.some((rs: any) => rs.wholesalerId === myId) || false;
  }

  getMyResponse(requestId: string): any {
    const r = this.allRequests.find((req: any) => req.id === requestId);
    const myId = this.currentWholesalerId();
    if (!myId) return null;
    return r?.responses?.find((rs: any) => rs.wholesalerId === myId) || null;
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
