import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Toast } from '../../../core/services/toast';

@Component({
  selector: 'psr-forgot-password',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './forgot-password.html',
  styleUrl: './forgot-password.scss',
})
export class ForgotPassword {
  private readonly toast = inject(Toast);
  readonly isLoading = signal(false);
  readonly isSent = signal(false);

  readonly forgotForm = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
  });

  onSubmit(): void {
    if (this.forgotForm.invalid) {
      this.forgotForm.markAllAsTouched();
      return;
    }
    this.isLoading.set(true);
    setTimeout(() => {
      this.isSent.set(true);
      this.isLoading.set(false);
      this.toast.success('Email envoyé', 'Vérifiez votre boîte de réception pour réinitialiser votre mot de passe');
    }, 1500);
  }
}
