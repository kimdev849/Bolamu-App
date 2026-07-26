import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Auth } from '../../../../core/services/auth';

@Component({
  selector: 'psr-navbar',
  imports: [RouterLink],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss',
})
export class Navbar {
  private readonly auth = inject(Auth);
  private readonly router = inject(Router);
  readonly currentUser = this.auth.currentUser;
  readonly showUserMenu = signal(false);
  readonly showNotifications = signal(false);
  readonly showMobileSearch = signal(false);
  readonly searchQuery = signal('');

  readonly notifications = [
    { id: 1, title: 'Nouvelle commande', message: 'Pharmacie Centrale a passé une commande', time: '5 min', read: false, type: 'order' },
    { id: 2, title: 'Demande en attente', message: '3 demandes de produits nécessitent votre attention', time: '1 h', read: false, type: 'request' },
    { id: 3, title: 'Livraison effectuée', message: 'La commande ORD-001 a été livrée avec succès', time: '2 h', read: true, type: 'delivery' },
    { id: 4, title: 'Abonnement expire', message: 'Votre abonnement expire dans 7 jours', time: '1 j', read: true, type: 'subscription' },
  ];

  readonly unreadCount = signal(this.notifications.filter(n => !n.read).length);

  logout(): void {
    this.auth.clearUser();
    this.router.navigate(['/auth/login']);
  }

  markAllRead(): void {
    this.notifications.forEach(n => n.read = true);
    this.unreadCount.set(0);
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
}
