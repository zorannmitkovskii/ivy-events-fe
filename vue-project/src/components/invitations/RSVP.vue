<template>
  <section class="rsvp-section py-5 text-white position-relative overflow-hidden">
    <!-- Background Pattern -->
<!--    <img-->
<!--      src="/img/pattern.png"-->
<!--      alt="pattern"-->
<!--      class="position-absolute top-0 start-0 opacity-25 pattern-img"-->
<!--    />-->

    <div class="container position-relative" style="z-index: 2; max-width: 750px;">
      <h2 class="fw-bold text-center mb-3">Confirm attendance</h2>

      <p class="text-center mb-4 fs-5">
        We are delighted to invite you to join us on one of the happiest days of our lives.
        Nothing would make us happier than to celebrate this special day surrounded by those we love.
      </p>

      <!-- Invitation Radio Buttons -->
      <div class="text-center mb-4">
        <h5 class="fw-bold mb-3">Invitation:</h5>
        <div class="d-flex justify-content-center gap-4">
          <div class="form-check">
            <input class="form-check-input" type="radio" value="yes" v-model="form.invitation" />
            <label class="form-check-label">Yes, I confirm!</label>
          </div>
          <div class="form-check">
            <input class="form-check-input" type="radio" value="no" v-model="form.invitation" />
            <label class="form-check-label">No sorry... :(</label>
          </div>
        </div>
      </div>

      <!-- Form Fields -->
      <form @submit.prevent="submitRsvp" class="text-white">
        <div class="mb-3">
          <label class="form-label">Name</label>
          <input v-model="form.name" type="text" class="form-control" placeholder="Write here..." />
        </div>

        <div class="mb-3">
          <label class="form-label">Email</label>
          <input v-model="form.email" type="email" class="form-control" placeholder="Write here..." />
        </div>

        <div class="mb-3">
          <label class="form-label">Companions</label>
          <input v-model="form.companions" type="text" class="form-control" placeholder="Write here..." />
        </div>

        <div class="mb-3">
          <label class="form-label">Other comments...</label>
          <textarea v-model="form.comments" rows="3" class="form-control" placeholder="Personal specifications such as allergies and intolerances, or others..."></textarea>
        </div>

        <div class="mb-3">
          <label class="form-label">Are you going to need transport?</label>
          <select v-model="form.transport" class="form-select">
            <option value="">Select option...</option>
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>
        </div>

        <div class="mb-3">
          <label class="form-label">Where will you stay?</label>
          <select v-model="form.stay" class="form-select">
            <option value="">Select option...</option>
            <option value="hotel">Hotel</option>
            <option value="family">With family</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div class="text-center mt-4">
          <button type="submit" class="btn btn-brand px-4 py-2 fw-bold">SUBMIT MY RSVP</button>
        </div>
      </form>
    </div>
  </section>
</template>

<script setup>
import { reactive } from 'vue'

const form = reactive({
  invitation: '',
  name: '',
  email: '',
  companions: '',
  comments: '',
  transport: '',
  stay: ''
})

function submitRsvp() {
  console.log('RSVP Submitted:', { ...form })
  alert('Thank you! Your RSVP has been submitted.')
}
</script>

<style scoped>
.rsvp-section {
  background-color: #3f6043;
  padding-top: 80px;
  padding-bottom: 80px;
  min-height: 100vh;
}

.pattern-img {
  width: 45%;
  max-width: 500px;
}

.btn-brand {
  background-color: #2d4a32;
  color: #fff;
  border-radius: 6px;
}
.btn-brand:hover {
  background-color: #243c29;
}

.form-control, .form-select {
  border-radius: 6px;
}
</style>
