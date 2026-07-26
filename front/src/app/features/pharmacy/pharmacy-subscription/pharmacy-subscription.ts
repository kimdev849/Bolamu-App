import { Component } from '@angular/core';
import { DatePipe } from '@angular/common';
import { mockPharmacies } from '../../../core/mock/db';

@Component({
  selector: 'psr-pharmacy-subscription',
  imports: [DatePipe],
  templateUrl: './pharmacy-subscription.html',
  styleUrl: './pharmacy-subscription.scss',
})
export class PharmacySubscription {
  readonly pharmacy = mockPharmacies[0];

  readonly plans = [
    { name: 'Basique', price: 25000, desc: 'Fonctionnalités essentielles', popular: false, features: ['Gestion des demandes', 'Catalogue produits', 'Support email'] },
    { name: 'Premium', price: 50000, desc: 'Accès complet', popular: true, features: ['Tout du Basique', 'Commandes illimitées', 'Statistiques avancées', 'Support prioritaire', 'API intégration'] },
    { name: 'Enterprise', price: 100000, desc: 'Solution sur mesure', popular: false, features: ['Tout du Premium', 'Multi-sites', 'Comptes utilisateurs', 'SLA garanti', 'Account manager dédié'] },
  ];

  getDaysLeft(endDate?: string): number {
    if (!endDate) return 0;
    const diff = new Date(endDate).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }
}
