import { Component, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Api } from '../../../core/services/api';
import { Toast } from '../../../core/services/toast';
import { finalize } from 'rxjs';

@Component({
  selector: 'psr-admin-settings',
  imports: [FormsModule],
  templateUrl: './admin-settings.html',
  styleUrl: './admin-settings.scss',
})
export class AdminSettings implements OnInit {
  private readonly api = inject(Api);
  private readonly toast = inject(Toast);

  readonly loading = signal(true);
  readonly saving = signal(false);

  readonly settings = signal<Record<string, string>>({});

  ngOnInit(): void {
    this.loadSettings();
  }

  loadSettings(): void {
    this.loading.set(true);
    this.api.getAdminSettings().pipe(finalize(() => this.loading.set(false))).subscribe({
      next: (res) => this.settings.set(res.data),
      error: () => this.toast.error('Erreur', 'Impossible de charger les paramètres'),
    });
  }

  get commissionRate(): number {
    return parseInt(this.settings()['commission_percent'] || '10');
  }
  set commissionRate(v: number) {
    this.settings.update((s) => ({ ...s, commission_percent: String(v) }));
  }

  get basicPrice(): number {
    return parseInt(this.settings()['subscription_basic_price'] || '25000');
  }
  set basicPrice(v: number) {
    this.settings.update((s) => ({ ...s, subscription_basic_price: String(v) }));
  }

  get premiumPrice(): number {
    return parseInt(this.settings()['subscription_premium_price'] || '50000');
  }
  set premiumPrice(v: number) {
    this.settings.update((s) => ({ ...s, subscription_premium_price: String(v) }));
  }

  get enterprisePrice(): number {
    return parseInt(this.settings()['subscription_enterprise_price'] || '100000');
  }
  set enterprisePrice(v: number) {
    this.settings.update((s) => ({ ...s, subscription_enterprise_price: String(v) }));
  }

  saveSettings(): void {
    this.saving.set(true);
    this.api.saveAdminSettings({
      commission_percent: String(this.commissionRate),
      subscription_basic_price: String(this.basicPrice),
      subscription_premium_price: String(this.premiumPrice),
      subscription_enterprise_price: String(this.enterprisePrice),
    }).pipe(finalize(() => this.saving.set(false))).subscribe({
      next: () => {
        this.toast.success('Paramètres enregistrés', 'Les modifications ont été appliquées à toute la plateforme');
        this.loadSettings();
      },
      error: () => this.toast.error('Erreur', 'Impossible d\'enregistrer les paramètres'),
    });
  }

  resetForm(): void {
    this.loadSettings();
    this.toast.info('Réinitialisé', 'Les valeurs par défaut ont été restaurées');
  }
}
