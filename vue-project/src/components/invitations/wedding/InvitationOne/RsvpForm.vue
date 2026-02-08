<template>
  <div class="rsvp-card">
    <h2 class="card-heading">RSVP</h2>

    <form class="rsvp-form-wrapper" @submit.prevent="handleSubmit">
      <div class="field-group">
        <label for="guestName" class="field-label">Your Name(s)</label>
        <input
          id="guestName"
          v-model="formData.guestName"
          type="text"
          class="field-input"
          placeholder="Enter your full name"
          required
        />
      </div>

      <div class="field-group">
        <label for="attendance" class="field-label">Will you attend?</label>
        <select
          id="attendance"
          v-model="formData.attendance"
          class="field-select"
          required
        >
          <option value="">Please select...</option>
          <option value="Yes, I'll be there!">Yes, I'll be there! 🎉</option>
          <option value="Sadly, I cannot attend">Sadly, I cannot attend 😢</option>
        </select>
      </div>

      <div class="field-group">
        <label for="message" class="field-label">Message for the couple</label>
        <textarea
          id="message"
          v-model="formData.message"
          class="field-textarea"
          placeholder="Share your wishes or any special requests..."
        ></textarea>
      </div>

      <button
        type="submit"
        class="submit-btn"
        :disabled="isSubmitting"
      >
        {{ isSubmitting ? 'Sending...' : 'Send RSVP' }}
      </button>

      <!-- Success/Error Messages -->
      <div v-if="submitMessage" class="message-box" :class="messageClass">
        {{ submitMessage }}
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue';

const props = defineProps({
  maxResponses: {
    type: Number,
    default: 999
  }
});

const emit = defineEmits(['submit']);

const formData = reactive({
  guestName: '',
  attendance: '',
  message: ''
});

const isSubmitting = ref(false);
const submitMessage = ref('');
const isSuccess = ref(false);

const messageClass = computed(() => ({
  'success-box': isSuccess.value,
  'error-box': !isSuccess.value
}));

async function handleSubmit() {
  isSubmitting.value = true;
  submitMessage.value = '';

  try {
    const rsvpData = {
      guest_name: formData.guestName,
      attendance: formData.attendance,
      message: formData.message || '',
      submitted_at: new Date().toISOString()
    };

    // Emit to parent component
    const result = await emit('submit', rsvpData);

    // Show success message
    isSuccess.value = true;
    submitMessage.value = 'Thank you! Your RSVP has been received. We look forward to celebrating with you! 💕';

    // Reset form
    formData.guestName = '';
    formData.attendance = '';
    formData.message = '';

  } catch (error) {
    isSuccess.value = false;
    submitMessage.value = 'Sorry, there was an error submitting your RSVP. Please try again.';
    console.error('RSVP submission error:', error);
  } finally {
    isSubmitting.value = false;
  }
}
</script>

<style scoped>
.rsvp-card {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 252, 254, 0.95) 100%);
  padding: 60px 40px;
  border-radius: 20px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
  text-align: center;
  margin: 40px 0;
}

.card-heading {
  font-family: 'Playfair Display', serif;
  font-size: 42px;
  font-weight: 700;
  color: #2d4a5a;
  margin-bottom: 40px;
  position: relative;
  display: inline-block;
}

.card-heading::after {
  content: '';
  position: absolute;
  bottom: -12px;
  left: 50%;
  transform: translateX(-50%);
  width: 70px;
  height: 2px;
  background: linear-gradient(90deg, transparent, #6ba5c8, transparent);
}

.rsvp-form-wrapper {
  max-width: 550px;
  margin: 40px auto 0;
}

.field-group {
  margin-bottom: 25px;
  text-align: left;
}

.field-label {
  display: block;
  font-size: 13px;
  color: #4a7a95;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  margin-bottom: 10px;
}

.field-input,
.field-textarea,
.field-select {
  width: 100%;
  padding: 15px 20px;
  border: 2px solid #d4e8f0;
  border-radius: 10px;
  font-family: 'Crimson Text', serif;
  font-size: 18px;
  color: #2d4a5a;
  background: white;
  transition: border-color 0.3s ease;
}

.field-input:focus,
.field-textarea:focus,
.field-select:focus {
  outline: none;
  border-color: #6ba5c8;
}

.field-textarea {
  resize: vertical;
  min-height: 110px;
}

.submit-btn {
  background: linear-gradient(135deg, #6ba5c8 0%, #4a8ab0 100%);
  color: white;
  padding: 16px 50px;
  border: none;
  border-radius: 50px;
  font-family: 'Lato', sans-serif;
  font-size: 15px;
  text-transform: uppercase;
  letter-spacing: 2px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 10px 30px rgba(107, 165, 200, 0.35);
  margin-top: 10px;
}

.submit-btn:hover:not(:disabled) {
  transform: translateY(-3px);
  box-shadow: 0 15px 40px rgba(107, 165, 200, 0.45);
}

.submit-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.message-box {
  padding: 20px;
  border-radius: 10px;
  margin-top: 25px;
  font-family: 'Crimson Text', serif;
  font-size: 20px;
}

.success-box {
  background: linear-gradient(135deg, #d4f4dd 0%, #c3e8cc 100%);
  color: #2d5a3d;
}

.error-box {
  background: linear-gradient(135deg, #ffd4d4 0%, #ffc3c3 100%);
  color: #8b3a3a;
}

@media (max-width: 768px) {
  .card-heading {
    font-size: 34px;
  }
}
</style>
