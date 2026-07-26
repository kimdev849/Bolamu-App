import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'fcfa',
})
export class FcfaPipe implements PipeTransform {
  transform(value: number | string | null | undefined): string {
    if (value === null || value === undefined) return '0 FCFA';

    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) return '0 FCFA';

    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  }
}
