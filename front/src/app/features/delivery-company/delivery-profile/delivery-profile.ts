import { Component, inject, signal, OnInit } from '@angular/core';
import { Api } from '../../../core/services/api';
import { Auth } from '../../../core/services/auth';

@Component({
  selector: 'psr-delivery-profile',
  imports: [],
  templateUrl: './delivery-profile.html',
  styleUrl: './delivery-profile.scss',
})
export class DeliveryProfile implements OnInit {
  private readonly api = inject(Api);
  private readonly auth = inject(Auth);

  readonly user = signal<any>(null);
  readonly company: any = { name: '—', city: '—', fleetSize: 0 };

  ngOnInit(): void {
    this.user.set(this.auth.user());
    this.api.getMyDeliveryCompany().subscribe({
      next: (res) => {
        if (res.data) Object.assign(this.company, res.data);
      },
    });
  }

  saveProfile(): void {
    alert('Profil mis à jour (simulation).');
  }
}
