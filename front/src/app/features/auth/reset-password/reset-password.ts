import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { finalize } from 'rxjs';
import { Api } from '../../../core/services/api';
import { Toast } from '../../../core/services/toast';

@Component({
  selector: 'psr-reset-password',
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <div class="w-full">
      <div class="text-center mb-8">
        <h2 class="text-2xl font-bold text-slate-900">Nouveau mot de passe</h2>
        <p class="text-slate-500 mt-1.5">Choisissez un nouveau mot de passe pour votre compte</p>
      </div>

      @if (isSuccess()) {
        <div class="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center space-y-4">
          <div class="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
            <svg class="w-7 h-7 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 class="text-lg font-bold text-emerald-900">Mot de passe réinitialisé !</h3>
          <p class="text-sm text-emerald-700">Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.</p>
          <a routerLink="/auth/login" class="inline-block mt-2 text-sm font-semibold text-indigo-600 hover:text-indigo-700">
            Aller à la connexion →
          </a>
        </div>
      } @else {
        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-5">
          <div>
            <label class="block text-sm font-semibold text-slate-700 mb-1.5">Nouveau mot de passe</label>
            <input type="password" formControlName="newPassword" placeholder="Minimum 6 caractères"
              class="w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-all"
              [class.border-slate-200]="!passwordControl.invalid"
              [class.border-red-300]="passwordControl.invalid && passwordControl.touched"
              [class.focus:border-indigo-400]="!passwordControl.invalid"
              [class.focus:ring-2]="!passwordControl.invalid"
              [class.focus:ring-indigo-500/30]="!passwordControl.invalid" />
            @if (passwordControl.invalid && passwordControl.touched) {
              <p class="mt-1.5 text-xs text-red-500 font-medium">Minimum 6 caractères</p>
            }
          </div>

          <div>
            <label class="block text-sm font-semibold text-slate-700 mb-1.5">Confirmer le mot de passe</label>
            <input type="password" formControlName="confirmPassword" placeholder="Confirmer le mot de passe"
              class="w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-all"
              [class.border-slate-200]="!form.errors?.['mismatch'] || !confirmControl.touched"
              [class.border-red-300]="form.errors?.['mismatch'] && confirmControl.touched"
              [class.focus:border-indigo-400]="!form.errors?.['mismatch']"
              [class.focus:ring-2]="!form.errors?.['mismatch']"
              [class.focus:ring-indigo-500/30]="!form.errors?.['mismatch']" />
            @if (form.errors?.['mismatch'] && confirmControl.touched) {
              <p class="mt-1.5 text-xs text-red-500 font-medium">Les mots de passe ne correspondent pas</p>
            }
          </div>

          <button type="submit" [disabled]="isLoading()" class="btn-primary w-full justify-center">
            @if (isLoading()) {
              <svg class="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
              <span>Réinitialisation...</span>
            } @else {
              <span>Réinitialiser le mot de passe</span>
            }
          </button>

          <p class="text-center text-sm text-slate-500">
            <a routerLink="/auth/login" class="font-semibold text-indigo-600 hover:text-indigo-700">← Retour à la connexion</a>
          </p>
        </form>
      }
    </div>
  `,
})
export class ResetPassword {
  private readonly api = inject(Api);
  private readonly toast = inject(Toast);
  private readonly route = inject(ActivatedRoute);

  readonly isLoading = signal(false);
  readonly isSuccess = signal(false);

  readonly form = new FormGroup({
    newPassword: new FormControl('', [Validators.required, Validators.minLength(6)]),
    confirmPassword: new FormControl('', [Validators.required]),
  }, (group) => {
    const pwd = group.get('newPassword')?.value;
    const confirm = group.get('confirmPassword')?.value;
    return pwd === confirm ? null : { mismatch: true };
  });

  get passwordControl() { return this.form.get('newPassword') as FormControl; }
  get confirmControl() { return this.form.get('confirmPassword') as FormControl; }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }

    const token = this.route.snapshot.queryParams['token'];
    const email = this.route.snapshot.queryParams['email'];

    if (!token || !email) {
      this.toast.error('Lien invalide', 'Le lien de réinitialisation est invalide ou expiré');
      return;
    }

    this.isLoading.set(true);
    this.api.resetPassword(email, token, this.form.value.newPassword!)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: () => {
          this.isSuccess.set(true);
          this.toast.success('Mot de passe réinitialisé', 'Vous pouvez maintenant vous connecter');
        },
        error: (err) => this.toast.error('Erreur', err.error?.message || 'Lien invalide ou expiré'),
      });
  }
}
