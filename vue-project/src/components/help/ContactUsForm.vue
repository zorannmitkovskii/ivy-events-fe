<template>
  <section class="py-5" style="background-color: var(--logo-beige); color: var(--logo-brown);">
    <div class="container">

      <h2 class="fw-bold mb-4">Contact Us</h2>

      <p class="mb-4">
        Have questions? Fill out the form below and we will get back to you shortly.
      </p>

      <form @submit.prevent="submitForm" class="p-4 rounded shadow-sm" style="background: white;">

        <div class="row mb-3">
          <div class="col-md-6 mb-3 mb-md-0">
            <label class="form-label fw-bold">First Name</label>
            <input
              type="text"
              v-model="form.firstName"
              class="form-control"
              placeholder="Enter your first name"
              required
            >
          </div>

          <div class="col-md-6">
            <label class="form-label fw-bold">Last Name</label>
            <input
              type="text"
              v-model="form.lastName"
              class="form-control"
              placeholder="Enter your last name"
              required
            >
          </div>
        </div>

        <div class="mb-3">
          <label class="form-label fw-bold">Email</label>
          <input
            type="email"
            v-model="form.email"
            class="form-control"
            placeholder="Enter your email"
            required
          >
        </div>

        <div class="mb-3">
          <label class="form-label fw-bold">Subject</label>
          <input
            type="text"
            v-model="form.subject"
            class="form-control"
            placeholder="Enter subject"
            required
          >
        </div>

        <div class="mb-3">
          <label class="form-label fw-bold">Message</label>
          <textarea
            v-model="form.message"
            class="form-control"
            rows="5"
            placeholder="Write your message..."
            required
          ></textarea>
        </div>

        <button class="btn px-4 py-2"
                style="background-color: var(--logo-brown); color: white;">
          Send Message
        </button>
      </form>

    </div>
  </section>
</template>

<script setup>
import { reactive } from "vue";

const form = reactive({
  firstName: "",
  lastName: "",
  email: "",
  subject: "",
  message: ""
});

function submitForm() {
  console.log("Form submitted:", form);

  // You can replace this with API call
  alert("Your message has been sent!");
}
</script>

<style scoped>
</style>
