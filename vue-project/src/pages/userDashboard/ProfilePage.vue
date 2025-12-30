<template>
  <DashboardLayout>
    <div class="container py-4">
      <h1 class="text-brand-dark mb-4">My Profile</h1>

      <!-- Profile Overview Card -->
      <div class="card shadow-sm mb-4">
        <div class="card-header bg-brand-light">
          <h5 class="m-0 text-brand-dark">Profile Information</h5>
        </div>
        <div class="card-body">
          <div class="row g-3">
            <div class="col-md-6">
              <label class="form-label">First Name</label>
              <input type="text" class="form-control" v-model="form.firstName" />
            </div>
            <div class="col-md-6">
              <label class="form-label">Last Name</label>
              <input type="text" class="form-control" v-model="form.lastName" />
            </div>
            <div class="col-md-6">
              <label class="form-label">Email</label>
              <input type="email" class="form-control" v-model="form.email" />
            </div>
            <div class="col-md-6">
              <label class="form-label">Phone</label>
              <input type="text" class="form-control" v-model="form.phone" />
            </div>
          </div>
        </div>
      </div>

      <!-- Preferences -->
      <div class="card shadow-sm mb-4">
        <div class="card-header bg-brand-light">
          <h5 class="m-0 text-brand-dark">Account Preferences</h5>
        </div>
        <div class="card-body">
          <div class="row g-3">
            <div class="col-md-6">
              <label class="form-label">Language</label>
              <select class="form-select" v-model="form.language">
                <option value="en">English</option>
                <option value="mk">Macedonian</option>
                <option value="de">German</option>
              </select>
            </div>
            <div class="col-md-6">
              <label class="form-label">Timezone</label>
              <select class="form-select" v-model="form.timezone">
                <option value="CET">CET (Central European Time)</option>
                <option value="EET">EET (Eastern European Time)</option>
                <option value="UTC">UTC</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <!-- Security Settings -->
      <div class="card shadow-sm mb-4">
        <div class="card-header bg-brand-light">
          <h5 class="m-0 text-brand-dark">Security</h5>
        </div>
        <div class="card-body">
          <div class="row g-3">
            <div class="col-md-6">
              <label class="form-label">New Password</label>
              <input type="password" class="form-control" v-model="form.newPassword" />
            </div>
            <div class="col-md-6">
              <label class="form-label">Confirm Password</label>
              <input type="password" class="form-control" v-model="form.confirmPassword" />
            </div>
          </div>
        </div>
      </div>

      <!-- Save Button -->
      <div class="text-end">
        <button class="btn btn-brand-dark px-4" @click="save">Save Changes</button>
      </div>
    </div>
  </DashboardLayout>
</template>

<script setup>
import { reactive } from "vue";
import DashboardLayout from "@/components/userDashboard/dashboard/DashboardLayout.vue";

const form = reactive({
  firstName: "Zoran",
  lastName: "Mitkovski",
  email: "zoran@example.com",
  phone: "",
  language: "en",
  timezone: "CET",
  newPassword: "",
  confirmPassword: "",
});

function save() {
  console.log("Saving profile info:", form);
  // TODO: connect to backend API
}
</script>

<style scoped>
.btn-brand-dark {
  background-color: var(--logo-brown);
  color: white;
}
.btn-brand-dark:hover {
  background-color: #704e2f;
}
</style>
