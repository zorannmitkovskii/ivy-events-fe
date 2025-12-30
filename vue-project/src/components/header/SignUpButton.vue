<template>
  <li class="nav-item ms-lg-3">
    <button class="login-btn" @click="goToLogin">
      Get Started
    </button>
  </li>
</template>

<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

function goToLogin() {
  router.push('/signup')
}
</script>


<style scoped>
.login-btn {
  background-color: var(--logo-brown);
  color: var(--logo-beige);      /* brand beige text */
  padding: 0.5rem 1.5rem;
  border: none;
  border-radius: 0.35rem;
  font-weight: 600;
  cursor: pointer;
  display: inline-block;

  transition: opacity 0.25s ease, transform 0.15s ease;
}

.login-btn:hover {
  opacity: 0.85;
}

.login-btn:active {
  transform: scale(0.96);
}
</style>
