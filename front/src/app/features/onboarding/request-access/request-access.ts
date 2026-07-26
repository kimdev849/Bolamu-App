import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Toast } from '../../../core/services/toast';
import { phoneValidator } from '../../../shared/utils/validators';

@Component({
  selector: 'psr-request-access',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './request-access.html',
  styleUrl: './request-access.scss',
})
export class RequestAccess {
  private readonly toast = inject(Toast);
  readonly isLoading = signal(false);
  readonly isSubmitted = signal(false);
  readonly selectedFile = signal<File | null>(null);
  readonly selectedFileLabel = signal('Aucun fichier choisi');
  readonly requestReference = signal('');

  readonly requestForm = new FormGroup({
    entityType: new FormControl<'pharmacy' | 'wholesaler' | 'delivery_company'>('pharmacy', [Validators.required]),
    entityName: new FormControl('', [Validators.required, Validators.minLength(3)]),
    email: new FormControl('', [Validators.required, Validators.email]),
    phone: new FormControl('', [Validators.required, phoneValidator()]),
    city: new FormControl('', [Validators.required]),
    licenseNumber: new FormControl('', [Validators.required]),
    notes: new FormControl(''),
  });

  readonly entityTypes = [
    { value: 'pharmacy', label: 'Pharmacie', desc: 'Établissement pharmaceutique' },
    { value: 'wholesaler', label: 'Grossiste', desc: 'Distributeur de produits de santé' },
    { value: 'delivery_company', label: 'Transport & Livraison', desc: 'Société de transport médical' },
  ] as const;

  readonly cities = [
    'Brazzaville', 'Pointe-Noire', 'Dolisie', 'Nkayi', 'Ouesso',
    'Owando', 'Sibiti', 'Impfondo', 'Gamboma', 'Madingou',
  ];

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile.set(input.files[0]);
      this.selectedFileLabel.set(input.files[0].name);
    }
  }

  onSubmit(): void {
    if (this.requestForm.invalid) {
      this.requestForm.markAllAsTouched();
      this.toast.error('Erreur', 'Veuillez corriger les erreurs dans le formulaire');
      return;
    }

    this.requestReference.set('ONB-' + Date.now().toString(36).toUpperCase());
    this.isLoading.set(true);
    setTimeout(() => {
      this.isSubmitted.set(true);
      this.isLoading.set(false);
      this.toast.success('Demande envoyée', 'L\'équipe de Bolamu va étudier votre dossier et vous contactera sous 48h.');
    }, 1500);
  }

  getControl(name: string): FormControl {
    return this.requestForm.get(name) as FormControl;
  }
}
