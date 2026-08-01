import { Platform } from 'react-native';
import Constants from 'expo-constants';

/**
 * URL de base de l'API.
 * - Production : backend déployé sur Render.
 * - Développement : l'adresse du PC qui sert Metro est déduite automatiquement
 *   (hostUri), ce qui fonctionne sur téléphone physique via Expo Go sans IP en dur.
 */
function resolveApiBaseUrl(): string {
  if (!__DEV__) {
    return 'https://bolamu-app.onrender.com/api';
  }

  const hostUri = Constants.expoConfig?.hostUri;
  const host = hostUri?.split(':')[0];
  if (host) {
    return `http://${host}:3000/api`;
  }

  // Fallback : émulateur Android (10.0.2.2 = loopback du host) ou simulateur iOS
  return Platform.OS === 'android'
    ? 'http://10.0.2.2:3000/api'
    : 'http://localhost:3000/api';
}

export const API_BASE_URL = resolveApiBaseUrl();
export const CURRENCY = 'FCFA';

export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'bolamu_access_token',
  REFRESH_TOKEN: 'bolamu_refresh_token',
  CURRENT_USER: 'bolamu_current_user',
} as const;
