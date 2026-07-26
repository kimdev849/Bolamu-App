import { Injectable, signal } from '@angular/core';
import { User } from '../models/user';

@Injectable({
  providedIn: 'root',
})
export class Auth {
  private readonly currentUserSignal = signal<User | null>(this.getStoredUser());
  readonly currentUser = this.currentUserSignal.asReadonly();
  readonly isLoggedIn = signal(this.getStoredUser() !== null);

  /** Convenience getter for components using the template `user()` syntax */
  get user() { return this.currentUser; }

  private getStoredUser(): User | null {
    try {
      const stored = localStorage.getItem('psr_current_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }

  setUser(user: User): void {
    localStorage.setItem('psr_current_user', JSON.stringify(user));
    this.currentUserSignal.set(user);
    this.isLoggedIn.set(true);
  }

  clearUser(): void {
    localStorage.removeItem('psr_current_user');
    localStorage.removeItem('psr_access_token');
    localStorage.removeItem('psr_refresh_token');
    this.currentUserSignal.set(null);
    this.isLoggedIn.set(false);
  }

  getUserRole(): string | null {
    return this.currentUser()?.role ?? null;
  }
}
