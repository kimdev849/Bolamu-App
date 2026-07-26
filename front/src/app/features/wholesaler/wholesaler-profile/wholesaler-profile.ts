import { Component, inject, signal, OnInit } from '@angular/core';
import { Api } from '../../../core/services/api';
import { Auth } from '../../../core/services/auth';

@Component({
  selector: 'psr-wholesaler-profile',
  imports: [],
  templateUrl: './wholesaler-profile.html',
  styleUrl: './wholesaler-profile.scss',
})
export class WholesalerProfile implements OnInit {
  private readonly api = inject(Api);
  private readonly auth = inject(Auth);

  readonly user = signal<any>(null);
  readonly wholesaler: any = { name: '—', city: '—', licenseNumber: '—' };

  ngOnInit(): void {
    this.user.set(this.auth.user());
    this.api.getMyWholesalerProfile().subscribe({
      next: (res) => {
        if (res.data) Object.assign(this.wholesaler, res.data);
      },
    });
  }

  saveProfile(): void {
    alert('Profil mis à jour (simulation).');
  }
}
