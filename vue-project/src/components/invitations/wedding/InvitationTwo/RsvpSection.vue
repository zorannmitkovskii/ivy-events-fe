<template>
  <div id="rsvp-section" class="rsvp-card">
    <h2 class="card-heading">RSVP</h2>

    <form class="rsvp-form-wrapper" @submit.prevent="handleSubmit">
      <div class="field-group">
        <label class="field-label">Guest Name(s)</label>
        <div
          v-for="(guest, index) in formData.guestNames"
          :key="index"
          class="guest-name-row"
        >
          <input
            :id="'guestName-' + index"
            v-model="formData.guestNames[index]"
            type="text"
            class="field-input"
            :placeholder="index === 0 ? 'Enter your full name' : 'Enter guest full name'"
            required
          />
          <button
            v-if="index > 0"
            type="button"
            class="remove-guest-btn"
            @click="removeGuest(index)"
            aria-label="Remove guest"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <line x1="4" y1="4" x2="14" y2="14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              <line x1="14" y1="4" x2="4" y2="14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </button>
        </div>
        <button type="button" class="add-guest-btn" @click="addGuest">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <line x1="8" y1="2" x2="8" y2="14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            <line x1="2" y1="8" x2="14" y2="8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
          Add another guest
        </button>
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
  guestNames: [''],
  attendance: '',
  message: ''
});

function addGuest() {
  formData.guestNames.push('');
}

function removeGuest(index) {
  formData.guestNames.splice(index, 1);
}

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
      guest_names: formData.guestNames.filter(n => n.trim()),
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
    formData.guestNames = [''];
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
  position: relative;
  background: #FAF8F5;
  padding: 60px 40px;
  border-radius: 20px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.08);
  text-align: center;
  margin: 40px 0;
  overflow: hidden;
}

/* Paper texture overlay */
.rsvp-card::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image: url("data:image/svg+xml,%3Csvg width='6' height='6' viewBox='0 0 6 6' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23C8A870' fill-opacity='0.04'%3E%3Cpath d='M5 0h1L0 5V4zM6 5v1H5z'/%3E%3C/g%3E%3C/svg%3E");
  pointer-events: none;
}

/* Leaf corner decorations */
.rsvp-card::after {
  content: '';
  position: absolute;
  top: 12px;
  left: 12px;
  width: 40px;
  height: 40px;
  background-image: url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M4 36C4 36 8 20 20 10C32 0 36 4 36 4C36 4 32 12 22 22C12 32 4 36 4 36Z' fill='%23A8B89C' opacity='0.25'/%3E%3C/svg%3E");
  background-size: contain;
  background-repeat: no-repeat;
  pointer-events: none;
}

.card-heading {
  font-family: 'Playfair Display', serif;
  font-size: 42px;
  font-weight: 700;
  color: #3D4A3A;
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
  background: linear-gradient(90deg, transparent, #C8A870, transparent);
}

.rsvp-form-wrapper {
  max-width: 550px;
  margin: 40px auto 0;
  position: relative;
  z-index: 1;
}

.field-group {
  margin-bottom: 25px;
  text-align: left;
}

.field-label {
  display: block;
  font-family: 'Lato', sans-serif;
  font-size: 13px;
  color: #7A6B5A;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  margin-bottom: 10px;
}

.guest-name-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.guest-name-row .field-input {
  flex: 1;
  margin-bottom: 0;
}

.remove-guest-btn {
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1.5px solid #D4A69E;
  border-radius: 50%;
  background: transparent;
  color: #D4A69E;
  cursor: pointer;
  transition: all 0.2s ease;
}

.remove-guest-btn:hover {
  background: #D4A69E;
  color: #FAF8F5;
}

.add-guest-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 18px;
  border: 1.5px dashed #8B9E7E;
  border-radius: 50px;
  background: transparent;
  color: #6B7D60;
  font-family: 'Lato', sans-serif;
  font-size: 13px;
  letter-spacing: 1px;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-top: 2px;
}

.add-guest-btn:hover {
  background: rgba(139, 158, 126, 0.1);
  border-color: #6B7D60;
}

.field-input,
.field-textarea,
.field-select {
  width: 100%;
  padding: 15px 20px;
  border: 2px solid #D4CFC4;
  border-radius: 10px;
  font-family: 'Crimson Text', serif;
  font-size: 18px;
  color: #3D4A3A;
  background: white;
  transition: border-color 0.3s ease;
  box-sizing: border-box;
}

.field-input:focus,
.field-textarea:focus,
.field-select:focus {
  outline: none;
  border-color: #8B9E7E;
}

.field-textarea {
  resize: vertical;
  min-height: 110px;
}

.submit-btn {
  background: linear-gradient(135deg, #8B9E7E 0%, #6B7D60 100%);
  color: #FAF8F5;
  padding: 16px 50px;
  border: none;
  border-radius: 50px;
  font-family: 'Lato', sans-serif;
  font-size: 15px;
  text-transform: uppercase;
  letter-spacing: 2px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 10px 30px rgba(139, 158, 126, 0.35);
  margin-top: 10px;
}

.submit-btn:hover:not(:disabled) {
  transform: translateY(-3px);
  box-shadow: 0 15px 40px rgba(139, 158, 126, 0.45);
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
  position: relative;
  z-index: 1;
}

.success-box {
  background: linear-gradient(135deg, #dce8d6 0%, #cddec5 100%);
  color: #3D4A3A;
}

.error-box {
  background: linear-gradient(135deg, #F2D7D5 0%, #E8C4C0 100%);
  color: #7A6B5A;
}

@media (max-width: 768px) {
  .card-heading {
    font-size: 34px;
  }

  .rsvp-card {
    padding: 40px 20px;
  }
}
</style>
