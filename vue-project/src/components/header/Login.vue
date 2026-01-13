<template>
  <div class="d-flex justify-content-center align-items-center vh-100 bg-light">
    <div class="card p-4 shadow-lg login-card">
      <h3 class="text-center mb-4 text-logo-brown fw-bold">Login to IvyEvents</h3>

      <!-- Username / Password Login -->
      <form @submit.prevent="loginWithCredentials">
        <div class="mb-3">
          <input
            v-model="username"
            type="text"
            class="form-control"
            placeholder="Username"
            required
          />
        </div>
        <div class="mb-3">
          <input
            v-model="password"
            type="password"
            class="form-control"
            placeholder="Password"
            required
          />
        </div>
        <button
          type="submit"
          class="btn w-100 text-white mb-3"
          style="background-color: var(--logo-brown);"
        >
          Login
        </button>
      </form>

      <div class="text-center text-muted mb-2">or continue with</div>

      <!-- Social Login Buttons -->
      <div class="d-flex flex-column gap-2">
        <button
          class="btn btn-light border d-flex align-items-center justify-content-center gap-2"
          @click="loginWithGoogle"
        >
          <i class="bi bi-google fs-5"></i>
          <span>Login with Google</span>
        </button>

        <button
          class="btn btn-light border d-flex align-items-center justify-content-center gap-2"
          @click="loginWithFacebook"
        >
          <i class="bi bi-facebook fs-4 text-primary"></i>
          <span>Login with Facebook</span>
        </button>
      </div>

      <!-- Register Link -->
      <div class="text-center mt-3">
        <span class="text-muted">Don’t have an account?</span>
        <a @click="register" class="ms-1 text-logo-brown fw-bold" style="cursor:pointer;">
          Sign Up
        </a>
      </div>
    </div>
  </div>
</template>

<script setup>
import {ref} from "vue";
import keycloak from "@/keycloak/keycloak.js";
import {useRouter} from "vue-router";
import axios from "axios";
import { baseUrl } from "@/services/baseUrl";

const username = ref("");
const password = ref("");
const router = useRouter();

// Login with Keycloak using username/password
async function loginWithCredentials() {
  try {
    const res = await axios.post(
      `${baseUrl}/public/users/login`,
      {
        username: username.value,
        password: password.value
      }
    );

    localStorage.setItem('access_token', res.data.access_token);

    const roles = res.data.realm_access?.roles || [];

    if (roles.includes('ADMIN')) {
      router.push('/admin');
    } else if (roles.includes('VENDOR')) {
      router.push('/vendor');
    } else if (roles.includes('ORGANIZER')) {
      router.push('/organizer');
    } else {
      router.push('/user');
    }
  } catch (e) {
    console.error(e);
  }
}


// Social logins
function loginWithGoogle() {
  keycloak.login({idpHint: "google", prompt: "select_account"});
}

function loginWithFacebook() {
  keycloak.login({idpHint: "facebook"});
}

// Redirect to Keycloak registration page
function register() {
  router.push('/signup');
}
</script>

<style scoped>
.login-card {
  max-width: 420px;
  width: 100%;
  border-radius: 16px;
}

.text-logo-brown {
  color: var(--logo-brown);
}
</style>
