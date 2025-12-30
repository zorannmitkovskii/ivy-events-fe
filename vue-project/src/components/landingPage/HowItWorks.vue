<template>
  <section id="how-it-works" class="py-5 bg-white">
    <div class="container">

      <!-- Title -->
      <div class="text-center mb-5">
        <h2 class="display-5 fw-bold mb-3" style="color: var(--neutral-900);">
          How It Works
        </h2>
        <p class="fs-5" style="color: var(--neutral-500);">
          Three simple steps to your perfect event
        </p>
      </div>

      <!-- Steps -->
      <div class="row g-4">

        <div
          v-for="(step, index) in steps"
          :key="index"
          class="col-md-4"
        >
          <div class="text-center">

            <!-- gradient icon block -->
            <div
              class="mx-auto mb-4 icon-box"
            >
              <i :class="step.icon" class="text-white step-icon"></i>
            </div>

            <!-- circle number -->
            <div class="mx-auto mb-3 number-circle">
              {{ index + 1 }}
            </div>

            <h4 class="fw-bold mb-3" style="color: var(--neutral-900);">
              {{ step.title }}
            </h4>

            <p style="color: var(--neutral-500);">
              {{ step.text }}
            </p>

          </div>
        </div>

      </div>
    </div>
  </section>
</template>

<script setup>
const steps = [
  {
    icon: 'fas fa-calendar-plus',
    title: 'Create an Event',
    text: 'Pick your category, add event details, and invite guests with a personalized link or QR code.'
  },
  {
    icon: 'fas fa-tasks',
    title: 'Manage Everything',
    text: 'Track RSVPs, manage schedules, coordinate vendors, monitor budget, and organize media all in one place.'
  },
  {
    icon: 'fas fa-images',
    title: 'Share Memories',
    text: 'Guests upload photos and videos directly to your event space. Create albums and relive the moments.'
  }
]
</script>

<style scoped>
.icon-box{
  width:100px;
  height:100px;
  border-radius:20px;
  display:flex;
  justify-content:center;
  align-items:center;
  background: linear-gradient(135deg, var(--primary-main), var(--primary-light));
}
.step-icon{
  font-size:3rem;
}
.number-circle{
  width:50px;
  height:50px;
  border-radius:50%;
  font-weight:bold;
  font-size:1.5rem;
  color:white;
  display:flex;
  justify-content:center;
  align-items:center;
  background:var(--primary-main);
}
</style>
