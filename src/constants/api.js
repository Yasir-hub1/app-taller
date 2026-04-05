import Constants from 'expo-constants';

const ENV = {
  dev: {
    /** Ajusta a la IP de tu PC en la LAN (emulador Android → suele ser http://10.0.2.2:PUERTO) */
    apiUrl: 'http://192.168.100.175:8080',
  },
  prod: {
    apiUrl: '',
  },
};

const getEnvVars = () => (__DEV__ ? ENV.dev : ENV.prod);

function trimBase(url) {
  if (typeof url !== 'string') return '';
  return url.trim().replace(/\/+$/, '');
}

/**
 * Prioridad: EXPO_PUBLIC_API_URL → app.json expo.extra.apiUrl → fallback por entorno.
 * Reinicia Metro tras cambiar .env; rebuild dev client si solo tocas extra.apiUrl.
 */
function resolveApiBaseUrl() {
  const fromEnv = trimBase(process.env.EXPO_PUBLIC_API_URL || '');
  if (fromEnv) return fromEnv;

  const fromExtra = trimBase(Constants.expoConfig?.extra?.apiUrl || '');
  if (fromExtra) return fromExtra;

  return trimBase(getEnvVars().apiUrl || '');
}

export const API_BASE_URL = resolveApiBaseUrl();
export const apiUrl = API_BASE_URL;
export const APP = '/api/app';
export const APP_PREFIX = '/api/app'; // Alias para compatibilidad

export const STRIPE_PUBLISHABLE_KEY = 'pk_test_YOUR_KEY_HERE';
