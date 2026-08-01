/**
 * Design tokens Bolamu Livreur — identité verte/blanche professionnelle.
 * Centralise la palette pour les styles dynamiques (Reanimated, Skia…).
 */
export const BRAND = {
  // Vert principal
  green: '#16A34A',
  greenDark: '#15803D',
  greenDeep: '#14532D',
  greenSoft: '#DCFCE7',
  greenMist: '#F0FDF4',

  // Accents
  teal: '#0D9488',
  amber: '#B45309',
  red: '#DC2626',

  // Texte
  text: '#0F172A',
  soft: '#334155',
  muted: '#64748B',
  faint: '#94A3B8',

  // Surfaces
  surface: '#FFFFFF',
  bg: '#F6F8F7',
  line: '#E8EDEA',
} as const;

/** Dégradé signature des en-têtes (vert profond → vert principal → émeraude) */
export const HEADER_GRADIENT: [string, string, string] = ['#14532D', '#15803D', '#16A34A'];

/** Rayons de carte */
export const RADIUS = { sm: 12, md: 16, lg: 20, xl: 28 } as const;

/** Ombres */
export const SHADOW = {
  card: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 3,
  },
} as const;
