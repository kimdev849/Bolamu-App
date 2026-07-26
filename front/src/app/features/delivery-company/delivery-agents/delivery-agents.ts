import { Component, signal } from '@angular/core';
import { mockAgents } from '../../../core/mock/db';
import type { DeliveryAgent } from '../../../core/models/delivery-company';

@Component({
  selector: 'psr-delivery-agents',
  templateUrl: './delivery-agents.html',
  styleUrl: './delivery-agents.scss',
})
export class DeliveryAgents {
  readonly agents = signal(mockAgents.filter(a => a.companyId === 'DC-001'));
  readonly showAddForm = signal(false);
  readonly newFirstName = signal('');
  readonly newLastName = signal('');
  readonly newEmail = signal('');
  readonly newPhone = signal('');
  readonly newVehicleType = signal<string>('motorcycle');
  readonly newVehiclePlate = signal('');

  readonly vehicleLabels: Record<string, string> = {
    motorcycle: 'Moto', car: 'Voiture', van: 'Camionnette', truck: 'Camion',
  };

  toggleActive(agent: DeliveryAgent): void {
    this.agents.set(this.agents().map(a => a.id === agent.id ? { ...a, isActive: !a.isActive } : a));
  }

  addAgent(): void {
    if (!this.newFirstName() || !this.newLastName()) return;
    const agent: DeliveryAgent = {
      id: 'AG-' + Date.now().toString(36).toUpperCase(),
      firstName: this.newFirstName(),
      lastName: this.newLastName(),
      email: this.newEmail() || 'agent@bolamu.cg',
      phone: this.newPhone() || '+242000000000',
      isActive: true,
      vehicleType: this.newVehicleType() as any,
      vehiclePlate: this.newVehiclePlate() || 'XX-000-XX',
      companyId: 'DC-001',
      createdAt: new Date().toISOString(),
    };
    this.agents.set([agent, ...this.agents()]);
    this.showAddForm.set(false);
    this.newFirstName.set(''); this.newLastName.set(''); this.newEmail.set(''); this.newPhone.set(''); this.newVehiclePlate.set('');
  }
}
