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
  // Identifiants retournés par le backend (création ou reset) — à transmettre à l'agent
  readonly createdCredentials = signal<{ email: string; password: string } | null>(null);
  readonly credentialsTitle = signal('Livreur créé !');
  readonly credentialsSubtitle = signal('Transmettez ces identifiants à l\'agent');

  // ── Édition d'un agent existant ──
  readonly editingAgent = signal<any | null>(null);
  readonly editFirstName = signal('');
  readonly editLastName = signal('');
  readonly editEmail = signal('');
  readonly editPhone = signal('');

  // ── Réinitialisation du mot de passe ──
  readonly resettingAgent = signal<any | null>(null);
  readonly resetPassword = signal('');

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
            this.credentialsTitle.set('Livreur créé !');
            this.credentialsSubtitle.set('Transmettez ces identifiants à l\'agent');
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

  // ── Modification d'un agent ──

  openEdit(a: any): void {
    this.editingAgent.set(a);
    this.editFirstName.set(a.firstName || '');
    this.editLastName.set(a.lastName || '');
    this.editEmail.set(a.email || '');
    this.editPhone.set(a.phone || '');
  }

  closeEdit(): void {
    this.editingAgent.set(null);
  }

  saveEdit(): void {
    const agent = this.editingAgent();
    if (!agent) return;

    const firstName = this.editFirstName();
    const lastName = this.editLastName();
    if (!firstName || !lastName) {
      this.toast.warning('Champs requis', 'Prénom et nom sont requis');
      return;
    }

    this.isSubmitting.set(true);
    this.api.updateDeliveryAgent(agent.id, {
      firstName,
      lastName,
      email: this.editEmail(),
      phone: this.editPhone(),
    })
      .pipe(finalize(() => this.isSubmitting.set(false)))
      .subscribe({
        next: () => {
          this.toast.success('Livreur modifié', 'Les informations ont été enregistrées');
          this.closeEdit();
          this.loadAgents();
        },
        error: (err) => {
          this.toast.error('Erreur', err.error?.message || 'Impossible de modifier le livreur');
        },
      });
  }

  // ── Réinitialisation du mot de passe ──

  openReset(a: any): void {
    this.resettingAgent.set(a);
    this.resetPassword.set('');
  }

  closeReset(): void {
    this.resettingAgent.set(null);
    this.resetPassword.set('');
  }

  resetAgentPassword(): void {
    const agent = this.resettingAgent();
    if (!agent) return;

    this.isSubmitting.set(true);
    this.api.resetDeliveryAgentPassword(agent.id, this.resetPassword() || undefined)
      .pipe(finalize(() => this.isSubmitting.set(false)))
      .subscribe({
        next: (res) => {
          if (res?.credentials) {
            this.credentialsTitle.set('Mot de passe réinitialisé');
            this.credentialsSubtitle.set('Nouveaux identifiants à transmettre à l\'agent');
            this.createdCredentials.set(res.credentials);
            this.toast.success('Mot de passe réinitialisé', 'Transmettez les nouveaux identifiants à l\'agent');
          } else {
            this.toast.success('Mot de passe réinitialisé', 'Le mot de passe a été mis à jour');
          }
          this.closeReset();
        },
        error: (err) => {
          this.toast.error('Erreur', err.error?.message || 'Impossible de réinitialiser le mot de passe');
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
