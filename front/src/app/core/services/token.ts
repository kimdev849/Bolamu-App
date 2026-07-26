import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class Token {
  getAccessToken(): string | null {
    return localStorage.getItem('psr_access_token');
  }

  getRefreshToken(): string | null {
    return localStorage.getItem('psr_refresh_token');
  }

  setTokens(accessToken: string, refreshToken: string): void {
    localStorage.setItem('psr_access_token', accessToken);
    localStorage.setItem('psr_refresh_token', refreshToken);
  }

  clearTokens(): void {
    localStorage.removeItem('psr_access_token');
    localStorage.removeItem('psr_refresh_token');
  }

  hasValidToken(): boolean {
    const token = this.getAccessToken();
    return token !== null && token.length > 0;
  }
}
