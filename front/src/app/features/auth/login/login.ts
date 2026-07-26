import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { Auth } from '../../../core/services/auth';
import { Token } from '../../../core/services/token';
import { Toast } from '../../../core/services/toast';
import { Api } from '../../../core/services/api';

@Component({
  selector: 'psr-login',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  private readonly api = inject(Api);
  private readonly auth = inject(Auth);
  private readonly token = inject(Token);
  private readonly toast = inject(Toast);
  private readonly router = inject(Router);

  /** Map backend roles (SUPER_ADMIN) → frontend roles (admin) */
  private readonly roleMap: Record<string, string> = {
    SUPER_ADMIN: 'admin',
    PHARMACY_ADMIN: 'pharmacy',
    PHARMACY_USER: 'pharmacy',
    WHOLESALER_ADMIN: 'wholesaler',
    WHOLESALER_USER: 'wholesaler',
    DELIVERY_COMPANY_ADMIN: 'delivery_company',
    DELIVERY_COMPANY_USER: 'delivery_company',
    DRIVER: 'delivery_company',
  };

  readonly isLoading = signal(false);
  readonly showPassword = signal(false);

  readonly loginForm = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required, Validators.minLength(4)]),
    rememberMe: new FormControl(false),
  });

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    const { email, password } = this.loginForm.value;

    this.api.login(email!, password!)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (res) => {
          const { user, tokens } = res.data;

          // Stocker tokens
          this.token.setTokens(tokens.accessToken, tokens.refreshToken);

          // Mapper le rôle backend → frontend
          const frontendRole = this.roleMap[user.role] || 'admin';

          // Créer l'utilisateur frontend
          const frontendUser = {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            phone: user.phone,
            role: frontendRole as any,
            isActive: user.status === 'ACTIVE',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          this.auth.setUser(frontendUser);
          this.toast.success('Connexion réussie', `Bienvenue ${user.firstName} ${user.lastName}`);

          const routes: Record<string, string> = {
            admin: '/admin/dashboard',
            pharmacy: '/pharmacy/dashboard',
            wholesaler: '/wholesaler/dashboard',
            delivery_company: '/delivery/dashboard',
          };
          this.router.navigate([routes[frontendRole] || '/']);
        },
        error: (err) => {
          const message = err.error?.message || 'Email ou mot de passe incorrect';
          this.toast.error('Erreur de connexion', message);
        },
      });
  }

  get emailControl(): FormControl {
    return this.loginForm.get('email') as FormControl;
  }

  get passwordControl(): FormControl {
    return this.loginForm.get('password') as FormControl;
  }

  directLogin(email: string, password: string): void {
    this.isLoading.set(true);

    this.api.login(email, password)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (res) => {
          const { user, tokens } = res.data;
          this.token.setTokens(tokens.accessToken, tokens.refreshToken);
          const frontendRole = this.roleMap[user.role] || 'admin';
          const frontendUser = {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            phone: user.phone,
            role: frontendRole as any,
            isActive: user.status === 'ACTIVE',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          this.auth.setUser(frontendUser);
          this.toast.success('Connexion réussie', `Bienvenue ${user.firstName} ${user.lastName}`);
          const routes: Record<string, string> = {
            admin: '/admin/dashboard',
            pharmacy: '/pharmacy/dashboard',
            wholesaler: '/wholesaler/dashboard',
            delivery_company: '/delivery/dashboard',
          };
          this.router.navigate([routes[frontendRole] || '/']);
        },
        error: () => this.toast.error('Erreur', 'Impossible de se connecter au serveur'),
      });
  }
}
