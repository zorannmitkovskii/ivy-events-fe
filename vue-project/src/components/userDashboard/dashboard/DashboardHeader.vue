<template>
  <header class="dashboard-header">
    <div>
      <h5 class="mb-0 text-brand-dark">Dashboard Overview</h5>
    </div>

    <div class="d-flex align-items-center gap-3 position-relative">
      <i class="bi bi-bell" style="font-size:1.15rem;color:var(--logo-brown)"></i>

      <div class="d-flex align-items-center gap-2" @click="toggle">
        <img :src="userImage" class="user-avatar" alt="avatar" />
        <span class="text-brand-dark fw-semibold d-none d-md-inline">{{ userName }}</span>
        <i class="bi bi-caret-down-fill text-brand-dark"></i>
      </div>

      <div
        v-if="menuOpen"
        class="position-absolute"
        style="right:12px; top:58px; z-index:50;"
      >
        <div class="bg-white p-2 rounded shadow" style="min-width:180px;">

          <router-link
            to="/profilepage"
            class="btn btn-sm w-100 text-start"
            @click="closeMenu"
          >
            My Profile
          </router-link>

          <router-link
            to="/account"
            class="btn btn-sm w-100 text-start"
            @click="closeMenu"
          >
            Account Settings
          </router-link>

          <router-link
            to="/change-password"
            class="btn btn-sm w-100 text-start"
            @click="closeMenu"
          >
            Change Password
          </router-link>

          <hr />

          <router-link
            to="/logout"
            class="btn btn-sm w-100 text-start text-danger"
            @click="closeMenu"
          >
            Logout
          </router-link>

        </div>
      </div>

    </div>
  </header>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
const router = useRouter()
const menuOpen = ref(false)
const userName = 'Zoran Mitkovski'
const userImage = 'https://i.pravatar.cc/40'
function toggle(){ menuOpen.value = !menuOpen.value }
function go(page){
  menuOpen.value = false
  if(page === 'profile') router.push('/profile')
  if(page === 'account') router.push('/account-settings')
  if(page === 'password') router.push('/change-password')
}
function logout(){
  // implement logout (Keycloak or API)
  console.log('logout')
  menuOpen.value = false
}
</script>

<style scoped>
/* small local styles */
</style>
