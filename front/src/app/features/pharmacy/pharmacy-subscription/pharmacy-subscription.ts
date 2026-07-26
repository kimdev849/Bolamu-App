import { Component, inject, signal, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Api } from '../../../core/services/api';

@Component({
  selector: 'psr-pharmacy-subscription',
  imports: [DatePipe],
  templateUrl: './pharmacy-subscription.html',
  styleUrl: './pharmacy-subscription.scss',
})
export class PharmacySubscription implements OnInit {
  private readonly api = inject(Api);

  readonly pharmacy: any = { name: '—', subscriptionStatus: 'pending', subscriptionEndDate: new Date() };

  readonly plans = [
    { name: 'Essentiel', desc: 'Pour petites pharmacies', price: 50_000, popular: false, features: ['10 demandes/mois', 'Support email', 'Dashboard de base'] },
    { name: 'Professionnel', desc: 'Pour pharmacies actives', price: 100_000, popular: true, features: ['Demandes illimitées', 'Support prioritaire', 'Statistiques avancées', 'API accessible'] },
    { name: 'Enterprise', desc: 'Pour chaînes de pharmacies', price: 200_000, popular: false, features: ['Tout illimité', 'Support dédié 24/7', 'Rapports personnalisés', 'SLA garanti'] },
  ];

  ngOnInit(): void {
    this.api.getMyPharmacyProfile().subscribe({
      next: (res) => {
        if (res.data) Object.assign(this.pharmacy, res.data);
      },
    });
  }

  getDaysLeft(endDate: string): number {
    if (!endDate) return 0;
    const diff = new Date(endDate).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }
}
