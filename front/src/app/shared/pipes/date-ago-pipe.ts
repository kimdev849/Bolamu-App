import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'dateAgo',
})
export class DateAgoPipe implements PipeTransform {
  transform(value: string | Date | null | undefined): string {
    if (!value) return '';

    const date = typeof value === 'string' ? new Date(value) : value;
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 0) {
      const absSec = Math.abs(seconds);
      if (absSec < 60) return 'dans quelques secondes';
      if (absSec < 3600) return `dans ${Math.floor(absSec / 60)}min`;
      if (absSec < 86400) return `dans ${Math.floor(absSec / 3600)}h`;
      return `dans ${Math.floor(absSec / 86400)}j`;
    }
    if (seconds < 60) return `il y a ${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `il y a ${minutes}min`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `il y a ${hours}h`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `il y a ${days}j`;
    const weeks = Math.floor(days / 7);
    if (weeks < 4) return `il y a ${weeks}sem`;
    const months = Math.floor(days / 30);
    if (months < 12) return `il y a ${months}mois`;
    const years = Math.floor(days / 365);
    return `il y a ${years}an`;
  }
}
