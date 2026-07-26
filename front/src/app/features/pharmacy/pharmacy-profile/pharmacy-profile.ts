import { Component, inject } from '@angular/core';
import { Auth } from '../../../core/services/auth';
import { mockPharmacies } from '../../../core/mock/db';

@Component({
  selector: 'psr-pharmacy-profile',
  templateUrl: './pharmacy-profile.html',
  styleUrl: './pharmacy-profile.scss',
})
export class PharmacyProfile {
  private readonly auth = inject(Auth);
  readonly user = this.auth.currentUser;
  readonly pharmacy = mockPharmacies[0];

  saveProfile(): void {
    alert('✅ Profil mis à jour avec succès !');
  }
}
