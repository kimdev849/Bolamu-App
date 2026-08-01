import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'psr-onboarding-landing',
  imports: [RouterLink],
  templateUrl: './onboarding-landing.html',
  styleUrl: './onboarding-landing.scss',
})
export class OnboardingLanding {
  /** Diagnostic temporaire : tracer le clic sur le bouton Espace professionnel */
  onLoginClick($event: Event): void {
    const href = ($event.currentTarget as HTMLAnchorElement)?.getAttribute('href');
    console.log('[BOLAMU-DEBUG] Clic sur Espace professionnel — href:', href);
    // Ne pas empêcher la navigation par défaut du routerLink — on observe seulement.
  }
}
