import { Component, inject, signal, OnInit } from '@angular/core';
import { Api } from '../../../core/services/api';
import { Auth } from '../../../core/services/auth';

@Component({
  selector: 'psr-delivery-agents',
  imports: [],
  templateUrl: './delivery-agents.html',
  styleUrl: './delivery-agents.scss',
})
export class DeliveryAgents implements OnInit {
  private readonly api = inject(Api);

  readonly agents = signal<any[]>([]);
  readonly showAddForm = signal(false);
  readonly newFirstName = signal('');
  readonly newLastName = signal('');
  readonly newEmail = signal('');
  readonly newPhone = signal('');
  readonly newVehicleType = signal('motorcycle');
  readonly newVehiclePlate = signal('');

  readonly vehicleLabels: Record<string, string> = {
    motorcycle: 'Moto', car: 'Voiture', van: 'Camionnette', truck: 'Camion',
  };

  ngOnInit(): void {
    this.api.getDeliveryAgents().subscribe({
      next: (res) => { this.agents.set(res.data || []); },
    });
  }

  addAgent(): void {
    const firstName = this.newFirstName();
    const lastName = this.newLastName();
    if (!firstName || !lastName) return;
    const newAgent = {
      id: `AGT-${Date.now()}`,
      firstName, lastName,
      email: this.newEmail(),
      phone: this.newPhone(),
      vehicleType: this.newVehicleType(),
      vehiclePlate: this.newVehiclePlate(),
      isActive: true,
    };
    this.agents.update(a => [newAgent, ...a]);
    this.showAddForm.set(false);
    this.newFirstName.set('');
    this.newLastName.set('');
    this.newEmail.set('');
    this.newPhone.set('');
    this.newVehicleType.set('motorcycle');
    this.newVehiclePlate.set('');
  }

  toggleActive(a: any): void {
    this.agents.update(all =>
      all.map(ag => ag.id === a.id ? { ...ag, isActive: !ag.isActive } : ag)
    );
  }
}
