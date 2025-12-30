<template>
  <header class="admin-header container-fluid px-4 py-3 d-flex justify-content-between align-items-center">

    <!-- Page title -->
    <div>
      <h5 class="mb-0 text-brand-dark">{{ pageTitle }}</h5>
    </div>

    <!-- right -->
    <div class="d-flex align-items-center gap-3 position-relative">

      <i class="bi bi-bell" style="font-size:1.15rem;color:var(--primary-color)"></i>

      <!-- user dropdown -->
      <div class="d-flex align-items-center gap-2" @click="toggle">
        <img :src="userImage" class="user-avatar" alt="avatar" />
        <span class="text-brand-dark fw-semibold d-none d-md-inline">{{ userName }}</span>
        <i class="bi bi-caret-down-fill text-brand-dark"></i>
      </div>

      <!-- dropdown -->
      <div
        v-if="menuOpen"
        class="position-absolute"
        style="right:12px; top:58px; z-index:50;"
      >
        <div class="bg-white p-2 rounded shadow" style="min-width:180px;">

          <router-link
            to="/admin/profile"
            class="btn btn-sm w-100 text-start"
            @click="closeMenu"
          >
            My Profile
          </router-link>

          <router-link
            to="/admin/account"
            class="btn btn-sm w-100 text-start"
            @click="closeMenu"
          >
            Account Settings
          </router-link>

          <router-link
            to="/admin/change-password"
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

const props = defineProps({
  pageTitle: { type: String, default: "Admin Dashboard" }
})

const menuOpen = ref(false)

const userName = "Admin User"
const userImage = "https://i.pravatar.cc/40"

// toggle dropdown
function toggle(){ menuOpen.value = !menuOpen.value }
function closeMenu(){ menuOpen.value = false }
</script>

<style scoped>
.admin-header{
  background-color: var(--cards-color);
  border-bottom: 1px solid rgba(0,0,0,0.05);
  min-height: 70px;
}

.user-avatar{
  width:38px;
  height:38px;
  border-radius:50%;
  border:2px solid var(--primary-color);
}
</style>
