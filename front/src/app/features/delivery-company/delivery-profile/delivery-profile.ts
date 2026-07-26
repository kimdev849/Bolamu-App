import { Component, inject } from '@angular/core';
import { Auth } from '../../../core/services/auth';
import { mockDeliveryCompanies } from '../../../core/mock/db';

@Component({
  selector: 'psr-delivery-profile',
  templateUrl: './delivery-profile.html',
  styleUrl: './delivery-profile.scss',
})
export class DeliveryProfile {
  private readonly auth = inject(Auth);
  readonly user = this.auth.currentUser;
  readonly company = mockDeliveryCompanies[0];

  saveProfile(): void {
    alert('✅ Profil mis à jour avec succès !');
  }
}
