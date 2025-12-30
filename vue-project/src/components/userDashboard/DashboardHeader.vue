<template>
  <header class="header d-grid align-items-center p-3 shadow-sm header-grid">
    <div></div>
    <div class="d-flex justify-content-end align-items-center gap-3">
      <img src="https://i.pravatar.cc/40" class="rounded-circle user-img" @click="toggleMenu" />
      <div v-if="menuOpen" class="dropdown-menu-custom">
        <router-link to="/profile">My Profile</router-link>
        <router-link to="/account-settings">Account Settings</router-link>
        <router-link to="/change-password">Change Password</router-link>
        <hr />
        <button class="logout-btn">Logout</button>
      </div>
    </div>
  </header>
</template>


<script setup>
import { ref } from 'vue'
const menuOpen = ref(false)
const toggleMenu = () => (menuOpen.value = !menuOpen.value)
</script>


<style scoped>
.header-grid {
  grid-template-columns: 1fr auto;
  background: var(--logo-beige);
}
.user-img {
  width: 40px;
  height: 40px;
  cursor: pointer;
}
.dropdown-menu-custom {
  position: absolute;
  right: 20px;
  top: 70px;
  background: white;
  border-radius: 8px;
  padding: 10px;
  width: 180px;
  box-shadow: 0 4px 10px rgba(0,0,0,0.1);
  display: grid;
  gap: 6px;
}
.logout-btn {
  background: transparent;
  border: none;
  color: #c00;
  text-align: left;
}
</style>
