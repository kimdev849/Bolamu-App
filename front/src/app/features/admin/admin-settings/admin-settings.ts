import { Component } from '@angular/core';
import { APP_NAME } from '../../../core/config/app.constants';

@Component({
  selector: 'psr-admin-settings',
  templateUrl: './admin-settings.html',
  styleUrl: './admin-settings.scss',
})
export class AdminSettings {
  readonly platformName = APP_NAME;
  readonly supportEmail = 'contact@bolamu.cg';
  readonly supportPhone = '+242 05 555 55 55';
  readonly currency = 'FCFA (Franc CFA)';
  readonly commissionRate = 10;

  readonly subscriptionPlans = [
    { name: 'Basique', description: 'Fonctionnalités essentielles pour petites pharmacies', price: 25000 },
    { name: 'Premium', description: 'Accès complet aux fonctionnalités avancées', price: 50000 },
    { name: 'Enterprise', description: 'Solution sur mesure pour chaînes de pharmacies', price: 100000 },
  ];

  saveSettings(): void {
    alert('✅ Paramètres enregistrés avec succès !\n\nCes modifications sont simulées dans la version de démonstration.');
  }
}
