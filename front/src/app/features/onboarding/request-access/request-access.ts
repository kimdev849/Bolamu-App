import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Api } from '../../../core/services/api';
import { Toast } from '../../../core/services/toast';

@Component({
  selector: 'psr-request-access',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './request-access.html',
  styleUrl: './request-access.scss',
})
export class RequestAccess {
  private readonly api = inject(Api);
  private readonly toast = inject(Toast);

  readonly isLoading = signal(false);
  readonly isSubmitted = signal(false);

  readonly form = new FormGroup({
    entityType: new FormControl('pharmacy', Validators.required),
    entityName: new FormControl('', Validators.required),
    email: new FormControl('', [Validators.required, Validators.email]),
    phone: new FormControl('+242', Validators.required),
    city: new FormControl('Brazzaville', Validators.required),
    licenseNumber: new FormControl(''),
    notes: new FormControl(''),
  });

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.isLoading.set(true);

    this.api.submitOnboardingRequest({
      entityType: this.form.value.entityType || 'pharmacy',
      entityName: this.form.value.entityName || '',
      email: this.form.value.email || '',
      phone: this.form.value.phone || '',
      city: this.form.value.city || 'Brazzaville',
      licenseNumber: this.form.value.licenseNumber || undefined,
      notes: this.form.value.notes || undefined,
    }).subscribe({
      next: (res) => {
        this.isSubmitted.set(true);
        this.toast.success('Demande envoyée', res.message);
      },
      error: (err) => {
        this.toast.error('Erreur', err.error?.message || 'Impossible de soumettre la demande');
      },
      complete: () => this.isLoading.set(false),
    });
  }

  readonly entityTypes = [
    { value: 'pharmacy', label: 'Pharmacie' },
    { value: 'wholesaler', label: 'Grossiste' },
    { value: 'delivery_company', label: 'Entreprise de livraison' },
  ];

  readonly cities = ['Brazzaville', 'Pointe-Noire', 'Dolisie', 'Ouesso', 'Talangaï'];
}
