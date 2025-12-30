<template>
  <section id="categories" class="py-5 bg-bg-main">
    <div class="container">

      <!-- Heading -->
      <div class="text-center mb-5 px-2">
        <h2 class="display-6 fw-bold mb-3" style="color: var(--neutral-900);">
          Effortless Online Invitations and RSVP Tracking
        </h2>
        <p class="fs-6 fs-md-5" style="color: var(--neutral-500);">
          Deliver elegant online invitations directly to all of your friends and family with EventPro.
          Whether you want to upload your own custom design or tailor one of our exclusive designer suites,
          every invitation is delivered complete with personalized digital envelope, liner, stamp and RSVP tracking.
        </p>
      </div>

      <!-- GRID -->
      <div class="row g-4 text-center">
        <div
          v-for="(c, index) in categories"
          :key="index"
          class="col-6 col-md-4 col-lg-3"
        >
          <div class="category-card h-100">
            <div class="category-icon mb-3">
              <i :class="c.icon"></i>
            </div>

            <h5 class="fw-bold mb-2" style="color: var(--neutral-900);">
              {{ c.title }}
            </h5>

            <a href="#" class="text-decoration-none fw-semibold" style="color: var(--primary-main)">
              View Designs <i class="fas fa-arrow-right ms-1"></i>
            </a>
          </div>
        </div>
      </div>

    </div>
  </section>
</template>

<script>
export default {
  name: "CategoryGrid",

  data() {
    return {
      categories: [
        { title: "Wedding Invitations", icon: "fas fa-ring" },
        { title: "Wedding Save The Dates", icon: "fas fa-envelope-open-text" },
        { title: "Business Invitations", icon: "fas fa-briefcase" },
        { title: "Baby", icon: "fas fa-baby-carriage" },
        { title: "Birthday Party Invitations", icon: "fas fa-cake-candles" },
        { title: "Holiday Cards", icon: "fas fa-snowflake" },
        { title: "Holiday Party Invitations", icon: "fas fa-gifts" },
        { title: "Christmas Cards", icon: "fas fa-gift" },
        { title: "Christmas Invitations", icon: "fas fa-tree" },
        { title: "Other", icon: "fas fa-ellipsis-h" }
      ]
    };
  }
};
</script>

<style scoped>
.category-card {
  background: white;
  border-radius: 12px;
  padding: 28px 22px;
  border: 2px solid transparent;
  transition: 0.25s;
  cursor: pointer;
}

.category-card:hover {
  border-color: var(--primary-main);
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.08);
}

.category-icon {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: var(--primary-lightest, rgba(16, 185, 129, .1));
  color: var(--primary-main);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
}
</style>
