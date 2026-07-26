import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Api } from '../../../core/services/api';
import { Toast } from '../../../core/services/toast';

@Component({
  selector: 'psr-forgot-password',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './forgot-password.html',
  styleUrl: './forgot-password.scss',
})
export class ForgotPassword {
  private readonly api = inject(Api);
  private readonly toast = inject(Toast);

  readonly isLoading = signal(false);
  readonly emailSent = signal(false);

  readonly form = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
  });

  get emailControl() { return this.form.get('email') as FormControl; }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.isLoading.set(true);

    this.api.forgotPassword(this.form.value.email!).subscribe({
      next: () => {
        this.emailSent.set(true);
        this.toast.success('Email envoyé', 'Vérifiez votre boîte de réception');
      },
      error: () => {
        this.toast.success('Email envoyé', 'Si un compte existe, vous recevrez un lien');
        this.emailSent.set(true);
      },
      complete: () => this.isLoading.set(false),
    });
  }
}
