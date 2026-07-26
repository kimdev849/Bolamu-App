import { Component, inject, signal, OnInit } from '@angular/core';
import { Api } from '../../../core/services/api';
import { Auth } from '../../../core/services/auth';

@Component({
  selector: 'psr-pharmacy-profile',
  imports: [],
  templateUrl: './pharmacy-profile.html',
  styleUrl: './pharmacy-profile.scss',
})
export class PharmacyProfile implements OnInit {
  private readonly api = inject(Api);
  private readonly auth = inject(Auth);

  readonly user = signal<any>(null);
  readonly pharmacy: any = { name: '—', city: '—', region: '—', licenseNumber: '—', pharmacistInCharge: '—' };

  ngOnInit(): void {
    this.user.set(this.auth.user());
    this.api.getMyPharmacyProfile().subscribe({
      next: (res) => {
        if (res.data) Object.assign(this.pharmacy, res.data);
      },
    });
  }

  saveProfile(): void {
    alert('Profil mis à jour (simulation).');
  }
}
