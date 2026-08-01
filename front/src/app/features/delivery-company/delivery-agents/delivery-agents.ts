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
  readonly newPassword = signal('');
  // Identifiants retournés par le backend après création (à transmettre à l'agent)
  readonly createdCredentials = signal<{ email: string; password: string } | null>(null);

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
    this.api.createDeliveryAgent({
      firstName, lastName,
      email: this.newEmail(),
      phone: this.newPhone(),
      password: this.newPassword() || undefined,
    })
      .pipe(finalize(() => this.isSubmitting.set(false)))
      .subscribe({
        next: (res) => {
          // Afficher les identifiants à transmettre à l'agent
          if (res?.credentials) {
            this.createdCredentials.set(res.credentials);
          } else {
            this.toast.success('Livreur ajouté', 'Le livreur a été créé avec succès');
          }
          this.showAddForm.set(false);
          this.newFirstName.set('');
          this.newLastName.set('');
          this.newEmail.set('');
          this.newPhone.set('');
          this.newPassword.set('');
          this.loadAgents();
        },
        error: (err) => {
          this.toast.error('Erreur', err.error?.message || 'Impossible de créer le livreur');
        },
      });
  }

  copyCredentials(): void {
    const creds = this.createdCredentials();
    if (!creds) return;
    const text = `Email : ${creds.email}\nMot de passe : ${creds.password}`;
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text).then(() => this.toast.success('Copié', 'Identifiants copiés dans le presse-papier'));
    } else {
      this.toast.info('Identifiants', text);
    }
  }

  closeCredentials(): void {
    this.createdCredentials.set(null);
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
