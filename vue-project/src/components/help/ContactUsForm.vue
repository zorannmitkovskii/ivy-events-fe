<template>
  <section class="py-5" style="background-color: var(--logo-beige); color: var(--logo-brown);">
    <div class="container">

      <h2 class="fw-bold mb-4">Contact Us</h2>

      <p class="mb-4">
        Have questions? Fill out the form below and we will get back to you shortly.
      </p>

      <div v-if="success" class="p-4 rounded shadow-sm text-center" style="background: #ecfdf5; border: 1px solid #a7f3d0;">
        <h3 class="fw-bold mb-2">Message Sent!</h3>
        <p class="mb-0">Thank you for reaching out. We will get back to you shortly.</p>
      </div>

      <form v-else @submit.prevent="submitForm" class="p-4 rounded shadow-sm" style="background: white;">

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

        <p v-if="error" class="text-danger small mb-3">{{ error }}</p>

        <button class="btn px-4 py-2"
                style="background-color: var(--logo-brown); color: white;"
                :disabled="submitting">
          {{ submitting ? 'Sending...' : 'Send Message' }}
        </button>
      </form>

    </div>
  </section>
</template>

<script setup>
import { reactive, ref } from "vue";
import { contactService } from "@/services/contact.service";

const form = reactive({
  firstName: "",
  lastName: "",
  email: "",
  subject: "",
  message: ""
});

const submitting = ref(false);
const success = ref(false);
const error = ref("");

async function submitForm() {
  error.value = "";
  submitting.value = true;
  try {
    await contactService.submitPublic({
      name: `${form.firstName.trim()} ${form.lastName.trim()}`.trim(),
      email: form.email.trim(),
      subject: form.subject.trim(),
      message: form.message.trim(),
    });
    success.value = true;
  } catch (e) {
    error.value = e.response?.data?.message || e.message || "Something went wrong. Please try again.";
  } finally {
    submitting.value = false;
  }
}
</script>

<style scoped>
</style>
