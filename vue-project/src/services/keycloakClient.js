import { getRuntimeEnv, detectDefaultEnvFromLocation, computeKeycloakBaseUrl } from '@/services/env'

/**
 * The Keycloak realm and public client the app talks to. Fixed outside local
 * development, so a misconfigured container cannot point a deployed app at
 * the wrong realm.
 */
export function keycloakClientConfig() {
  const env = getRuntimeEnv()
  const appEnv = (env.APP_ENV || detectDefaultEnvFromLocation()).toString().toLowerCase()
  const isLocal = appEnv === 'local'
  return {
    keycloakUrl: isLocal ? env.VITE_KEYCLOAK_URL || computeKeycloakBaseUrl(appEnv) : computeKeycloakBaseUrl(appEnv),
    realm: isLocal ? env.VITE_KEYCLOAK_REALM || 'event-app' : 'event-app',
    clientId: isLocal ? env.VITE_KEYCLOAK_CLIENT_ID || 'eventFE' : 'eventFE',
  }
}

export function tokenEndpoint() {
  const { keycloakUrl, realm } = keycloakClientConfig()
  return `${keycloakUrl}/realms/${realm}/protocol/openid-connect/token`
}
