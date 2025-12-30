<template>
  <section id="packages" class="py-5 bg-white">
    <div class="container">

      <!-- HEADER -->
      <div class="text-center mb-5">
        <h2 class="display-5 fw-bold mb-3" style="color: var(--neutral-900);">
          Choose Your Package
        </h2>
        <p class="fs-5" style="color: var(--neutral-500);">
          Flexible pricing for individuals and professional organizers
        </p>
      </div>

      <!-- TOGGLE -->
      <div class="text-center mb-4">
        <div class="toggle-wrapper">
          <button
            class="toggle-btn"
            :class="{ active: selected === 'individual' }"
            @click="selected = 'individual'"
          >
            Individuals
          </button>

          <button
            class="toggle-btn"
            :class="{ active: selected === 'organizer' }"
            @click="selected = 'organizer'"
          >
            Organizers
          </button>
        </div>
      </div>

      <!-- INDIVIDUALS -->
      <div v-if="selected === 'individual'">
        <h3 class="fw-bold mb-4 text-center" style="color: var(--primary-main);">
          For Individuals
        </h3>

        <div class="row g-4">
          <div class="col-md-4" v-for="(pkg, i) in individuals" :key="i">
            <div class="card pricing-card h-100" :class="{ featured: pkg.featured }">

              <div v-if="pkg.featured" class="pricing-badge">Most Popular</div>

              <div class="card-body p-4">
                <h4 class="fw-bold mb-3" style="color: var(--neutral-900);">
                  {{ pkg.title }}
                </h4>

                <div class="mb-4">
                <span class="display-4 fw-bold" :style="{ color: 'var(--primary-main)' }">
                  {{ pkg.price }}
                </span>
                  <span v-if="pkg.per" style="color: var(--neutral-500);">/{{ pkg.per }}</span>
                </div>

                <ul class="list-unstyled mb-4">
                  <li
                    v-for="(item, idx) in pkg.features"
                    :key="idx"
                    class="mb-3"
                    :style="{ color: item.enabled ? 'var(--neutral-900)' : 'var(--neutral-300)' }"
                  >
                    <i
                      :class="item.enabled ? 'fas fa-check-circle me-2' : 'fas fa-times-circle me-2'"
                      :style="{ color: item.enabled ? 'var(--success)' : '' }"
                    ></i>
                    {{ item.label }}
                  </li>
                </ul>

                <button :class="pkg.featured ? 'btn w-100 btn-main' : 'btn btn-outline-success w-100'">
                  Get Started
                </button>
              </div>

            </div>
          </div>
        </div>
      </div>

      <!-- ORGANIZERS -->
      <div v-if="selected === 'organizer'" class="mt-5">
        <h3 class="fw-bold mb-4 text-center text-primary-main">
          For Organizers
        </h3>

        <div class="row g-4">
          <div class="col-md-4" v-for="(pkg, i) in organizers" :key="i">
            <div class="card pricing-card h-100" :class="{ featured: pkg.featured }">

              <div v-if="pkg.featured" class="pricing-badge">Most Popular</div>

              <div class="card-body p-4">
                <h4 class="fw-bold mb-3 text-primary-main">
                  {{ pkg.title }}
                </h4>

                <div class="mb-4">
                <span class="display-4 fw-bold text-primary-main">
                  {{ pkg.price }}
                </span>
                  <span v-if="pkg.per" style="color: var(--neutral-500);">/{{ pkg.per }}</span>
                </div>

                <ul class="list-unstyled mb-4">
                  <li
                    v-for="(item, idx) in pkg.features"
                    :key="idx"
                    class="mb-3"
                    :style="{ color: item.enabled ? 'var(--neutral-900)' : 'var(--neutral-300)' }"
                  >
                    <i
                      :class="item.enabled ? 'fas fa-check-circle me-2' : 'fas fa-times-circle me-2'"
                      :style="{ color: item.enabled ? 'var(--success)' : '' }"
                    ></i>
                    {{ item.label }}
                  </li>
                </ul>

                <button :class="pkg.featured ? 'btn w-100 btn-main' : 'btn btn-outline-success w-100'">
                  Get Started
                </button>
              </div>

            </div>
          </div>

        </div>
      </div>

    </div>
  </section>
</template>



<script setup>
import { ref } from "vue";

const selected = ref("individual");

/* -----------------------
   INDIVIDUAL PACKAGES
------------------------*/
const individuals = [
  {
    title: "Basic",
    price: "Free",
    per: null,
    featured: false,
    features: [
      { label: "Up to 50 guests", enabled: true },
      { label: "1 event at a time", enabled: true },
      { label: "Basic RSVP tracking", enabled: true },
      { label: "Email invitations", enabled: true },
      { label: "Photo sharing (100MB)", enabled: true },
      { label: "Custom branding", enabled: false },
      { label: "Priority support", enabled: false },
    ],
  },
  {
    title: "Standard",
    price: "$19",
    per: "month",
    featured: true,
    features: [
      { label: "Up to 200 guests", enabled: true },
      { label: "3 events at a time", enabled: true },
      { label: "Advanced RSVP tracking", enabled: true },
      { label: "Email & SMS invitations", enabled: true },
      { label: "Photo sharing (1GB)", enabled: true },
      { label: "Custom branding", enabled: true },
      { label: "Priority support", enabled: false },
    ],
  },
  {
    title: "Premium",
    price: "$49",
    per: "month",
    featured: false,
    features: [
      { label: "Unlimited guests", enabled: true },
      { label: "Unlimited events", enabled: true },
      { label: "Advanced RSVP tracking", enabled: true },
      { label: "All invitation methods", enabled: true },
      { label: "Photo sharing (10GB)", enabled: true },
      { label: "Custom branding", enabled: true },
      { label: "Priority support", enabled: true },
    ],
  },
];

/* -----------------------
   ORGANIZER PACKAGES
------------------------*/
const organizers = [
  {
    title: "Basic",
    price: "$49",
    per: "month",
    featured: false,
    features: [
      { label: "Up to 5 clients", enabled: true },
      { label: "10 events/month", enabled: true },
      { label: "Client management", enabled: true },
      { label: "Basic analytics", enabled: true },
      { label: "Email support", enabled: true },
      { label: "Earnings tracking", enabled: false },
      { label: "White label", enabled: false },
    ],
  },
  {
    title: "Standard",
    price: "$99",
    per: "month",
    featured: true,
    features: [
      { label: "Up to 20 clients", enabled: true },
      { label: "50 events/month", enabled: true },
      { label: "Client management", enabled: true },
      { label: "Advanced analytics", enabled: true },
      { label: "Priority support", enabled: true },
      { label: "Earnings tracking", enabled: true },
      { label: "White label", enabled: false },
    ],
  },
  {
    title: "Premium",
    price: "$199",
    per: "month",
    featured: false,
    features: [
      { label: "Unlimited clients", enabled: true },
      { label: "Unlimited events", enabled: true },
      { label: "Client management", enabled: true },
      { label: "Advanced analytics", enabled: true },
      { label: "Dedicated support", enabled: true },
      { label: "Earnings tracking", enabled: true },
      { label: "White label", enabled: true },
    ],
  },
];
</script>



<style scoped>
.pricing-card {
  border-radius: 16px;
  border: 1px solid #eee;
  box-shadow: 0 3px 20px rgba(0,0,0,0.05);
  position: relative;
}

.pricing-card.featured {
  border: 2px solid var(--primary-main);
}

.pricing-badge {
  position: absolute;
  top: -12px;
  right: 16px;
  background: var(--primary-main);
  color: white;
  padding: 4px 12px;
  font-size: 0.85rem;
  border-radius: 20px;
  font-weight: bold;
}

.toggle-wrapper {
  display: inline-flex;
  background: #eee;
  padding: 5px;
  border-radius: 50px;
}

.toggle-btn {
  padding: 8px 20px;
  border-radius: 40px;
  background: transparent;
  border: none;
  font-weight: 600;
  color: #777;
  cursor: pointer;
}

.toggle-btn.active {
  background: var(--primary-main);
  color: white !important;
}
</style>
