import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function phoneValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (!value) return null;
    const valid = /^(\+242|242)?[6-9]\d{8}$/.test(value.replace(/\s/g, ''));
    return valid ? null : { phone: 'Numéro de téléphone invalide' };
  };
}

export function emailValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (!value) return null;
    const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    return valid ? null : { email: 'Email invalide' };
  };
}

export function passwordStrengthValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (!value) return null;
    const errors: string[] = [];
    if (value.length < 8) errors.push('8 caractères minimum');
    if (!/[A-Z]/.test(value)) errors.push('une majuscule');
    if (!/[a-z]/.test(value)) errors.push('une minuscule');
    if (!/[0-9]/.test(value)) errors.push('un chiffre');
    return errors.length > 0 ? { weakPassword: errors.join(', ') } : null;
  };
}

export function matchFieldsValidator(field1: string, field2: string): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const v1 = control.get(field1)?.value;
    const v2 = control.get(field2)?.value;
    if (v1 && v2 && v1 !== v2) {
      control.get(field2)?.setErrors({ mismatch: 'Les champs ne correspondent pas' });
      return { mismatch: true };
    }
    return null;
  };
}

export function positiveNumberValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (value === null || value === undefined || value === '') return null;
    const num = Number(value);
    return isNaN(num) || num <= 0 ? { positiveNumber: 'La valeur doit être positive' } : null;
  };
}
