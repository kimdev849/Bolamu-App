import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Auth } from '../../../core/services/auth';
import { Token } from '../../../core/services/token';
import { Toast } from '../../../core/services/toast';
import { mockUsers } from '../../../core/mock/db';

@Component({
  selector: 'psr-login',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  private readonly auth = inject(Auth);
  private readonly token = inject(Token);
  private readonly toast = inject(Toast);
  private readonly router = inject(Router);

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

    setTimeout(() => {
      const user = mockUsers.find((u) => u.email === email);
      if (user && password) {
        this.token.setTokens('mock-token-' + user.id, 'mock-refresh-' + user.id);
        this.auth.setUser(user);
        this.toast.success('Connexion réussie', `Bienvenue ${user.firstName} ${user.lastName}`);

        const routes: Record<string, string> = {
          admin: '/admin/dashboard',
          pharmacy: '/pharmacy/dashboard',
          wholesaler: '/wholesaler/dashboard',
          delivery_company: '/delivery/dashboard',
        };
        this.router.navigate([routes[user.role] || '/']);
      } else {
        this.toast.error('Erreur de connexion', 'Email ou mot de passe incorrect');
      }
      this.isLoading.set(false);
    }, 1000);
  }

  get emailControl(): FormControl {
    return this.loginForm.get('email') as FormControl;
  }

  get passwordControl(): FormControl {
    return this.loginForm.get('password') as FormControl;
  }

  directLogin(email: string, password: string): void {
    this.isLoading.set(true);

    setTimeout(() => {
      const user = mockUsers.find((u) => u.email === email);
      if (user) {
        this.token.setTokens('mock-token-' + user.id, 'mock-refresh-' + user.id);
        this.auth.setUser(user);
        this.toast.success('Connexion réussie', `Bienvenue ${user.firstName} ${user.lastName}`);

        const routes: Record<string, string> = {
          admin: '/admin/dashboard',
          pharmacy: '/pharmacy/dashboard',
          wholesaler: '/wholesaler/dashboard',
          delivery_company: '/delivery/dashboard',
        };
        this.router.navigate([routes[user.role] || '/']);
      }
      this.isLoading.set(false);
    }, 500);
  }
}
