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


