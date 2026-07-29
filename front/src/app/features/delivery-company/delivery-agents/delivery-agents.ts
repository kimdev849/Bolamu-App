import { Component, inject, signal, OnInit } from '@angular/core';
import { finalize } from 'rxjs';
import { Api } from '../../../core/services/api';
import { Toast } from '../../../core/services/toast';

@Component({
  selector: 'psr-delivery-agents',
  imports: [],
  templateUrl: './delivery-agents.html',
  styleUrl: './delivery-agents.scss',
})
export class DeliveryAgents implements OnInit {
  private readonly api = inject(Api);
  private readonly toast = inject(Toast);

  readonly agents = signal<any[]>([]);
  readonly showAddForm = signal(false);
  readonly isSubmitting = signal(false);
  readonly newFirstName = signal('');
  readonly newLastName = signal('');
  readonly newEmail = signal('');
  readonly newPhone = signal('');

  readonly vehicleLabels: Record<string, string> = {
    motorcycle: 'Moto', car: 'Voiture', van: 'Camionnette', truck: 'Camion',
  };

  ngOnInit(): void {
    this.loadAgents();
  }

  private loadAgents(): void {
    this.api.getDeliveryAgents().subscribe({
      next: (res) => { this.agents.set(res.data || []); },
    });
  }

  addAgent(): void {
    const firstName = this.newFirstName();
    const lastName = this.newLastName();
    if (!firstName || !lastName) {
      this.toast.warning('Champs requis', 'Prénom et nom sont requis');
      return;
    }

    this.isSubmitting.set(true);
    this.api.createDeliveryAgent({ firstName, lastName, email: this.newEmail(), phone: this.newPhone() })
      .pipe(finalize(() => this.isSubmitting.set(false)))
      .subscribe({
        next: () => {
          this.toast.success('Livreur ajouté', 'Le livreur a été créé avec succès');
          this.showAddForm.set(false);
          this.newFirstName.set('');
          this.newLastName.set('');
          this.newEmail.set('');
          this.newPhone.set('');
          this.loadAgents();
        },
        error: (err) => {
          this.toast.error('Erreur', err.error?.message || 'Impossible de créer le livreur');
        },
      });
  }

  toggleActive(a: any): void {
    this.api.toggleDeliveryAgent(a.id).subscribe({
      next: () => {
        this.toast.success('Statut mis à jour', `Le livreur est maintenant ${a.isActive ? 'désactivé' : 'activé'}`);
        this.loadAgents();
      },
      error: (err) => {
        this.toast.error('Erreur', err.error?.message || 'Impossible de modifier le statut');
      },
    });
  }
}
