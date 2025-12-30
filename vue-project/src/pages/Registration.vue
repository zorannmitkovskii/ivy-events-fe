<template>
  <div class="d-flex justify-content-center align-items-center vh-100 bg-light">
    <div class="card p-4 shadow-lg register-card">
      <h3 class="text-center mb-4 text-logo-brown fw-bold">Create Your IvyEvents Account</h3>

      <!-- Register button (Keycloak) -->
      <button
        class="btn w-100 text-white mb-3"
        style="background-color: var(--logo-brown);"
        @click="register"
      >
        Create Account
      </button>

      <div class="text-center text-muted mb-2">or register with</div>

      <!-- Social Registration -->
      <div class="d-flex flex-column gap-2">

        <!-- Google -->
        <button
          class="btn btn-light border d-flex align-items-center justify-content-center gap-2"
          @click="registerWithGoogle"
        >
          <i class="bi bi-google fs-5"></i>
          <span>Sign Up with Google</span>
        </button>

        <!-- Facebook -->
        <button
          class="btn btn-light border d-flex align-items-center justify-content-center gap-2"
          @click="registerWithFacebook"
        >
          <i class="bi bi-facebook fs-4 text-primary"></i>
          <span>Sign Up with Facebook</span>
        </button>

      </div>

      <!-- Back to Login -->
      <div class="text-center mt-3">
        <span class="text-muted">Already have an account?</span>
        <RouterLink to="/login" class="ms-1 text-logo-brown fw-bold">
          Login
        </RouterLink>
      </div>
    </div>
  </div>
</template>

<script setup>
import { RouterLink } from 'vue-router'
import keycloak from '@/keycloak.js'

// Standard registration
function register() {
  keycloak.register()
}

// Social registration using Keycloak Identity Providers
function registerWithGoogle() {
  keycloak.register({ idpHint: 'google' })
}

function registerWithFacebook() {
  keycloak.register({ idpHint: 'facebook' })
}
</script>

<style scoped>
.register-card {
  max-width: 420px;
  width: 100%;
  border-radius: 16px;
}

.text-logo-brown {
  color: var(--logo-brown);
}
</style>
