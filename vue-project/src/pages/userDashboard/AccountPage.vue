<template>
  <DashboardLayout>
    <div class="container py-4">

      <h1 class="text-brand-dark mb-4">Account Settings</h1>

      <!-- Account Info -->
      <div class="card shadow-sm mb-4">
        <div class="card-header bg-brand-light">
          <h5 class="m-0 text-brand-dark">Account Information</h5>
        </div>

        <div class="card-body">
          <div class="row g-3">

            <div class="col-md-6">
              <label class="form-label">Username</label>
              <input
                type="text"
                class="form-control"
                v-model="form.username"
              />
            </div>

            <div class="col-md-6">
              <label class="form-label">Email Address</label>
              <input
                type="email"
                class="form-control"
                v-model="form.email"
              />
            </div>

            <div class="col-md-6">
              <label class="form-label">Phone Number</label>
              <input
                type="text"
                class="form-control"
                v-model="form.phone"
              />
            </div>

          </div>
        </div>
      </div>

      <!-- Preferences Section -->
      <div class="card shadow-sm mb-4">
        <div class="card-header bg-brand-light">
          <h5 class="m-0 text-brand-dark">Preferences</h5>
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
                <option value="CET">CET (Central European)</option>
                <option value="EET">EET (Eastern European)</option>
                <option value="UTC">UTC</option>
              </select>
            </div>

            <div class="col-md-12">
              <label class="form-label">Notifications</label>
              <div class="form-check">
                <input
                  class="form-check-input"
                  type="checkbox"
                  v-model="form.notifyEmail"
                />
                <label class="form-check-label">Email Notifications</label>
              </div>
              <div class="form-check mt-1">
                <input
                  class="form-check-input"
                  type="checkbox"
                  v-model="form.notifySms"
                />
                <label class="form-check-label">SMS Notifications</label>
              </div>
            </div>

          </div>
        </div>
      </div>

      <!-- Security Section -->
      <div class="card shadow-sm mb-4">
        <div class="card-header bg-brand-light">
          <h5 class="m-0 text-brand-dark">Security</h5>
        </div>

        <div class="card-body">
          <div class="row g-3">

            <div class="col-md-6">
              <label class="form-label">New Password</label>
              <input
                type="password"
                class="form-control"
                v-model="form.newPassword"
              />
            </div>

            <div class="col-md-6">
              <label class="form-label">Confirm Password</label>
              <input
                type="password"
                class="form-control"
                v-model="form.confirmPassword"
              />
            </div>

          </div>
        </div>
      </div>

      <!-- Save Button -->
      <div class="text-end">
        <button class="btn btn-brand-dark px-4" @click="save">
          Save Changes
        </button>
      </div>

    </div>
  </DashboardLayout>
</template>

<script setup>
import { reactive } from "vue";
import DashboardLayout from "@/components/userDashboard/dashboard/DashboardLayout.vue";

const form = reactive({
  username: "zoran123",
  email: "zoran@example.com",
  phone: "+389 70 123 456",
  language: "en",
  timezone: "CET",
  notifyEmail: true,
  notifySms: false,
  newPassword: "",
  confirmPassword: "",
});

function save() {
  console.log("Saving account settings:", form);
  // TODO: call backend
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
