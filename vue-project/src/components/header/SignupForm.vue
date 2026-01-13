<template>
  <div class="d-flex justify-content-center align-items-center vh-100 bg-light">
    <div class="card p-4 shadow-lg register-card">
      <h3 class="text-center mb-4 text-logo-brown fw-bold">Create Your IvyEvents Account</h3>

      <!-- Standard Registration Form -->
      <form @submit.prevent="register">
        <div class="mb-3">
          <input v-model="username" type="text" class="form-control" placeholder="Username" required />
        </div>
        <div class="mb-3">
          <input v-model="email" type="email" class="form-control" placeholder="Email" required />
        </div>
        <div class="mb-3">
          <input v-model="firstName" type="text" class="form-control" placeholder="First Name" required />
        </div>
        <div class="mb-3">
          <input v-model="lastName" type="text" class="form-control" placeholder="Last Name" required />
        </div>
        <div class="mb-3">
          <input v-model="password" type="password" class="form-control" placeholder="Password" required />
        </div>

        <button type="submit" class="btn w-100 text-white mb-3" style="background-color: var(--logo-brown);">
          Create Account
        </button>
      </form>

      <div v-if="errorMessage" class="alert alert-danger py-2 text-center">{{ errorMessage }}</div>
      <div v-if="successMessage" class="alert alert-success py-2 text-center">{{ successMessage }}</div>

      <div class="text-center text-muted mb-2">or register with</div>

      <!-- Social Registration -->
      <div class="d-flex flex-column gap-2">
        <!-- Google -->
        <button class="btn btn-light border d-flex align-items-center justify-content-center gap-2"
                @click="registerWithGoogle">
          <i class="bi bi-google fs-5"></i>
          <span>Sign Up with Google</span>
        </button>

        <!-- Facebook -->
        <button class="btn btn-light border d-flex align-items-center justify-content-center gap-2"
                @click="registerWithFacebook">
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
import { ref } from 'vue';
import { RouterLink } from 'vue-router';
import keycloak from "@/keycloak/keycloak.js";
import { baseUrl } from "@/services/baseUrl";

const username = ref('');
const email = ref('');
const firstName = ref('');
const lastName = ref('');
const password = ref('');

const errorMessage = ref('');
const successMessage = ref('');

const register = async () => {
  errorMessage.value = '';
  successMessage.value = '';

  try {
    const body = {
      username: username.value,
      email: email.value,
      firstName: firstName.value,
      lastName: lastName.value,
      password: password.value,
      enabled: true,
      roles: ["USER"]
    };

    const response = await fetch(`${baseUrl}/public/users/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    if (response.ok) {
      successMessage.value = "Registration successful! You can now log in.";
      // Optionally clear the form
      username.value = '';
      email.value = '';
      firstName.value = '';
      lastName.value = '';
      password.value = '';
    } else if (response.status === 409) {
      errorMessage.value = "User already exists.";
    } else {
      const errorData = await response.json();
      errorMessage.value = errorData.error || "Registration failed.";
    }
  } catch (err) {
    errorMessage.value = "An error occurred. Please try again.";
    console.error(err);
  }
};

// Social login redirects to Keycloak
const registerWithGoogle = () => {
  keycloak.login({ idpHint: 'google' });
};

const registerWithFacebook = () => {
  keycloak.register({ idpHint: 'facebook' });
};
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
