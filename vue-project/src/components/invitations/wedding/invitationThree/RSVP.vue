<template>
  <section id="rsvp">
    <h2 class="section-title">RSVP</h2>
    <p class="section-subtitle">We hope you can join us</p>

    <div class="rsvp-container">
      <form @submit.prevent="handleSubmit">
        <div class="form-group">
          <label>Guest Names</label>
          <div class="guest-list">
            <div
              v-for="(guest, index) in guests"
              :key="index"
              class="guest-row"
            >
              <input
                v-model="guests[index]"
                type="text"
                placeholder="Full name"
                required
              />
              <button
                v-if="guests.length > 1"
                type="button"
                class="remove-guest"
                @click="removeGuest(index)"
              >
                ×
              </button>
            </div>
          </div>
          <button type="button" class="add-guest-btn" @click="addGuest">
            <span>+</span>
            <span>Add guest</span>
          </button>
        </div>

        <div class="form-group">
          <label>Will you be attending?</label>
          <div class="radio-group">
            <div class="radio-option">
              <input
                type="radio"
                id="coming"
                name="attendance"
                value="coming"
                v-model="attendance"
                required
              />
              <label for="coming" class="radio-label">Joyfully Accept</label>
            </div>
            <div class="radio-option">
              <input
                type="radio"
                id="not-coming"
                name="attendance"
                value="not-coming"
                v-model="attendance"
              />
              <label for="not-coming" class="radio-label">Regretfully Decline</label>
            </div>
          </div>
        </div>

        <div class="form-group">
          <label for="message">Message for the couple</label>
          <textarea
            id="message"
            v-model="message"
            placeholder="Share your thoughts, dietary requirements, or song requests..."
          ></textarea>
        </div>

        <button type="submit" class="submit-btn">Submit RSVP</button>
      </form>
    </div>
  </section>
</template>

<script>
export default {
  name: 'RsvpSection',
  data() {
    return {
      guests: [''],
      attendance: '',
      message: ''
    }
  },
  methods: {
    addGuest() {
      this.guests.push('')
    },
    removeGuest(index) {
      if (this.guests.length > 1) {
        this.guests.splice(index, 1)
      }
    },
    handleSubmit() {
      const guestNames = this.guests.filter(guest => guest.trim() !== '')

      alert(`Thank you for your RSVP!\n\nGuests: ${guestNames.join(', ')}\nAttendance: ${this.attendance}\nMessage: ${this.message}`)

      // Reset form
      this.guests = ['']
      this.attendance = ''
      this.message = ''
    }
  }
}
</script>

<style scoped>
.rsvp-container {
  max-width: 700px;
  margin: 0 auto;
  background: var(--warm-ivory);
  padding: 4rem 3rem;
  border-radius: 2px;
  box-shadow: 0 8px 40px rgba(155, 145, 134, 0.12);
  border-top: 2px solid var(--dusty-rose);
}

.guest-list {
  margin-bottom: 2.5rem;
}

.guest-row {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.guest-row input[type="text"] {
  flex: 1;
  padding: 1rem 1.5rem;
  border: 1px solid var(--divider);
  background: white;
  font-family: 'Lora', serif;
  font-size: 1rem;
  color: var(--charcoal);
  border-radius: 2px;
  transition: all 0.3s ease;
}

.guest-row input[type="text"]:focus {
  outline: none;
  border-color: var(--rose-accent);
  box-shadow: 0 0 0 3px rgba(212, 165, 165, 0.1);
}

.remove-guest {
  padding: 0.8rem 1rem;
  background: transparent;
  border: 1px solid var(--divider);
  color: var(--warm-gray);
  cursor: pointer;
  border-radius: 2px;
  transition: all 0.3s ease;
  font-size: 1.2rem;
  line-height: 1;
}

.remove-guest:hover {
  background: #fef1f0;
  border-color: var(--rose-accent);
  color: var(--rose-accent);
}

.add-guest-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem 2rem;
  background: transparent;
  border: 1px dashed var(--sage-dark);
  color: var(--sage-dark);
  font-family: 'Lora', serif;
  font-size: 0.95rem;
  cursor: pointer;
  border-radius: 2px;
  transition: all 0.3s ease;
  letter-spacing: 0.05em;
}

.add-guest-btn:hover {
  background: rgba(200, 213, 199, 0.1);
  border-color: var(--muted-sage);
  color: var(--muted-sage);
}

.form-group {
  margin-bottom: 2.5rem;
}

.form-group label {
  display: block;
  font-family: 'Cormorant Garamond', serif;
  font-size: 1.3rem;
  font-weight: 500;
  color: var(--charcoal);
  margin-bottom: 1rem;
  letter-spacing: 0.02em;
}

.radio-group {
  display: flex;
  gap: 2rem;
}

.radio-option {
  flex: 1;
}

.radio-option input[type="radio"] {
  display: none;
}

.radio-label {
  display: block;
  padding: 1.2rem;
  border: 1.5px solid var(--divider);
  background: white;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  font-family: 'Lora', serif;
  font-size: 1rem;
  color: var(--charcoal);
  border-radius: 2px;
}

.radio-option input[type="radio"]:checked + .radio-label {
  background: var(--blush);
  border-color: var(--rose-accent);
  color: var(--charcoal);
}

.radio-label:hover {
  border-color: var(--dusty-rose);
}

textarea {
  width: 100%;
  padding: 1.2rem 1.5rem;
  border: 1px solid var(--divider);
  background: white;
  font-family: 'Lora', serif;
  font-size: 1rem;
  color: var(--charcoal);
  border-radius: 2px;
  resize: vertical;
  min-height: 120px;
  transition: all 0.3s ease;
}

textarea:focus {
  outline: none;
  border-color: var(--rose-accent);
  box-shadow: 0 0 0 3px rgba(212, 165, 165, 0.1);
}

.submit-btn {
  width: 100%;
  padding: 1.4rem 3rem;
  background: var(--rose-accent);
  border: none;
  color: white;
  font-family: 'Lora', serif;
  font-size: 1.05rem;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  cursor: pointer;
  border-radius: 2px;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 20px rgba(212, 165, 165, 0.25);
}

.submit-btn:hover {
  background: var(--dusty-rose);
  box-shadow: 0 6px 30px rgba(212, 165, 165, 0.35);
  transform: translateY(-2px);
}

.submit-btn:active {
  transform: translateY(0);
}

@media (max-width: 768px) {
  .rsvp-container {
    padding: 2.5rem 1.5rem;
  }

  .radio-group {
    flex-direction: column;
    gap: 1rem;
  }

  .guest-row {
    flex-direction: column;
    align-items: stretch;
  }

  .remove-guest {
    width: 100%;
  }
}
</style>
