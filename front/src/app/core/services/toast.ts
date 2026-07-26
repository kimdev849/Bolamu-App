import { Injectable, signal } from '@angular/core';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
}

@Injectable({
  providedIn: 'root',
})
export class Toast {
  readonly toasts = signal<ToastMessage[]>([]);

  success(title: string, message: string, duration = 5000): void {
    this.add({ type: 'success', title, message, duration });
  }

  error(title: string, message: string, duration = 8000): void {
    this.add({ type: 'error', title, message, duration });
  }

  warning(title: string, message: string, duration = 6000): void {
    this.add({ type: 'warning', title, message, duration });
  }

  info(title: string, message: string, duration = 5000): void {
    this.add({ type: 'info', title, message, duration });
  }

  private add(toast: Omit<ToastMessage, 'id'>): void {
    const id = crypto.randomUUID();
    this.toasts.update((t) => [...t, { ...toast, id }]);
    if (toast.duration && toast.duration > 0) {
      setTimeout(() => this.remove(id), toast.duration);
    }
  }

  remove(id: string): void {
    this.toasts.update((t) => t.filter((toast) => toast.id !== id));
  }

  clear(): void {
    this.toasts.set([]);
  }
}
