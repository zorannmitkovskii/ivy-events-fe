// Compatibility re-export to avoid breaking existing imports
// Use the singleton from src/auth/keycloak
export { keycloak as default, keycloak, initKeycloak } from '@/auth/keycloak'
