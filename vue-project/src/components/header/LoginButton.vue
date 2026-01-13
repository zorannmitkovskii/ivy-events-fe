<template>
  <li class="nav-item ms-lg-3">
    <button class="login-btn" @click="goToLogin">
      Login
    </button>
  </li>
</template>

<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

function goToLogin() {
  router.push('/login')
}
</script>


