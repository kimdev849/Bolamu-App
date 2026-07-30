import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Auth } from '../../../../core/services/auth';
import { Api } from '../../../../core/services/api';
import { Toast } from '../../../../core/services/toast';
import { Notification } from '../../../../core/models/misc';
import { DateAgoPipe } from '../../../../shared/pipes/date-ago-pipe';
import { ClickOutside } from '../../../../shared/directives/click-outside';
import { interval, Subscription, switchMap, of, catchError } from 'rxjs';

@Component({
  selector: 'psr-navbar',
  imports: [RouterLink, DateAgoPipe, ClickOutside],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss',
})
export class Navbar implements OnInit, OnDestroy {
  private readonly auth = inject(Auth);
  private readonly api = inject(Api);
  private readonly toast = inject(Toast);
  private readonly router = inject(Router);
  private refreshSub?: Subscription;

  readonly currentUser = this.auth.currentUser;
  readonly showUserMenu = signal(false);
  readonly showNotifications = signal(false);
  readonly showMobileSearch = signal(false);
  readonly searchQuery = signal('');

  readonly notifications = signal<Notification[]>([]);
  readonly unreadCount = signal(0);
  readonly isLoadingNotifications = signal(false);

  ngOnInit(): void {
    this.loadNotifications();
    // Rafraîchir les notifications toutes les 30 secondes (échec silencieux)
    this.refreshSub = interval(30_000)
      .pipe(
        switchMap(() =>
          this.api.getNotifications().pipe(
            catchError(() => of(null))
          )
        )
      )
      .subscribe({
        next: (res) => {
          if (res) {
            this.notifications.set(res.data.notifications);
            this.unreadCount.set(res.data.unreadCount);
          }
        },
      });
  }

  ngOnDestroy(): void {
    this.refreshSub?.unsubscribe();
  }

  loadNotifications(): void {
    this.isLoadingNotifications.set(true);
    this.api.getNotifications().subscribe({
      next: (res) => {
        this.notifications.set(res.data.notifications);
        this.unreadCount.set(res.data.unreadCount);
        this.isLoadingNotifications.set(false);
      },
      error: () => {
        this.isLoadingNotifications.set(false);
        this.toast.error('Erreur', 'Impossible de charger les notifications');
      },
    });
  }

  logout(): void {
    this.auth.clearUser();
    this.router.navigate(['/auth/login']);
  }

  markAllRead(): void {
    // Sauvegarder l'état avant modification optimiste
    const previousNotifications = this.notifications().map((n) => ({ ...n }));
    const previousUnreadCount = this.unreadCount();

    // Optimistic update
    this.notifications.update((list) =>
      list.map((n) => ({ ...n, isRead: true, readAt: new Date().toISOString() }))
    );
    this.unreadCount.set(0);

    this.api.markAllNotificationsAsRead().subscribe({
      error: () => {
        // Rollback en cas d'échec
        this.notifications.set(previousNotifications);
        this.unreadCount.set(previousUnreadCount);
        this.toast.error('Erreur', 'Impossible de marquer les notifications comme lues');
      },
    });
  }

  markAsRead(id: string): void {
    // Sauvegarder l'état avant modification optimiste
    const previous = this.notifications().find((n) => n.id === id);
    const previousUnreadCount = this.unreadCount();

    // Optimistic update
    this.notifications.update((list) =>
      list.map((n) => (n.id === id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n))
    );
    this.unreadCount.update((c) => Math.max(0, c - 1));

    this.api.markNotificationAsRead(id).subscribe({
      error: () => {
        // Rollback en cas d'échec
        if (previous) {
          this.notifications.update((list) =>
            list.map((n) => (n.id === id ? previous : n))
          );
        }
        this.unreadCount.set(previousUnreadCount);
        this.toast.error('Erreur', 'Impossible de marquer la notification comme lue');
      },
    });
  }

  goToProfile(): void {
    const role = this.auth.getUserRole();
    if (role === 'admin') {
      this.router.navigate(['/admin/settings']);
    } else {
      this.router.navigate([`/${role}/profile`]);
    }
    this.showUserMenu.set(false);
  }

  getRoleLabel(): string {
    const role = this.auth.getUserRole();
    const labels: Record<string, string> = {
      admin: 'Administrateur',
      pharmacy: 'Pharmacie',
      wholesaler: 'Grossiste',
      delivery_company: 'Transport & Livraison',
    };
    return labels[role ?? ''] ?? role ?? '';
  }

  /** Convertit le type backend en libellé lisible */
  getTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      NEW_REQUEST: 'Nouvelle demande',
      REQUEST_FOUND: 'Demande trouvée',
      REQUEST_EXPIRED: 'Demande expirée',
      NEW_ORDER: 'Nouvelle commande',
      ORDER_CONFIRMED: 'Commande confirmée',
      PAYMENT_RECEIVED: 'Paiement reçu',
      DELIVERY_ASSIGNED: 'Livraison assignée',
      DELIVERY_STATUS_UPDATE: 'Mise à jour livraison',
      NEW_MISSION: 'Nouvelle mission',
      MISSION_CANCELLED: 'Mission annulée',
    };
    return labels[type] || type;
  }
}
