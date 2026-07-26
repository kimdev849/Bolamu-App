import { Component, inject } from '@angular/core';
import { Auth } from '../../../core/services/auth';
import { mockWholesalers } from '../../../core/mock/db';

@Component({
  selector: 'psr-wholesaler-profile',
  templateUrl: './wholesaler-profile.html',
  styleUrl: './wholesaler-profile.scss',
})
export class WholesalerProfile {
  private readonly auth = inject(Auth);
  readonly user = this.auth.currentUser;
  readonly wholesaler = mockWholesalers[0];

  saveProfile(): void {
    alert('✅ Profil mis à jour avec succès !');
  }
}
