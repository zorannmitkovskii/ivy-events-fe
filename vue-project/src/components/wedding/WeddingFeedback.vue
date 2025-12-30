<template>
  <section class="py-5 bg-brand-light">
    <div class="container">
      <h2 class="text-center text-dark mb-4">Feedback</h2>

      <div class="position-relative px-5">
        <!-- Left Arrow -->
        <button
          class="btn arrow-btn position-absolute top-50 start-0 translate-middle-y"
          @click="scrollLeft"
        >
          ‹
        </button>

        <!-- Scrollable Row -->
        <div
          ref="scrollContainer"
          class="d-flex overflow-hidden gap-3"
          style="scroll-behavior: smooth;"
        >
          <div
            v-for="(item, index) in feedbacks"
            :key="index"
            class="flex-shrink-0 col-12 col-md-4 bg-dark text-light p-3 rounded shadow"
          >
            <p class="fw-bold mb-2">"{{ item.comment }}"</p>
            <p class="mb-0">- {{ item.name }}</p>
          </div>
        </div>

        <!-- Right Arrow -->
        <button
          class="btn arrow-btn position-absolute top-50 end-0 translate-middle-y"
          @click="scrollRight"
        >
          ›
        </button>
      </div>
    </div>
  </section>
</template>

<script>
export default {
  data() {
    return {
      feedbacks: [
        { name: "Alice", comment: "Amazing service! Highly recommend." },
        { name: "Bob", comment: "Very user-friendly and intuitive." },
        { name: "Charlie", comment: "Helped me a lot, excellent support!" },
        { name: "Diana", comment: "Great experience overall." },
        { name: "Ethan", comment: "Professional and fast service." },
        { name: "Fiona", comment: "Love the design and simplicity." },
        { name: "George", comment: "Perfect solution for my needs." }
      ]
    };
  },
  methods: {
    scrollRight() {
      const container = this.$refs.scrollContainer;
      const itemWidth = container.children[0].offsetWidth + 16; // Bootstrap gap ~1rem
      container.scrollBy({ left: itemWidth * 3, behavior: "smooth" });
    },
    scrollLeft() {
      const container = this.$refs.scrollContainer;
      const itemWidth = container.children[0].offsetWidth + 16;
      container.scrollBy({ left: -itemWidth * 3, behavior: "smooth" });
    }
  }
};
</script>

<style scoped>
.bg-brand-light {
  background-color: var(--logo-beige) !important;
}
.bg-dark {
  background-color: var(--logo-brown) !important;
}
.text-light {
  color: var(--logo-beige) !important;
}

/* Arrow buttons with brand colors */
.arrow-btn {
  background-color: var(--logo-brown);
  color: var(--logo-beige);
  border: none;
  width: 2.5rem;            /* circle width */
  height: 2.5rem;           /* circle height */
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  font-size: 1.25rem;       /* adjust if needed */
  line-height: 1;
}

.arrow-btn i {               /* if using font-awesome or icon inside <i> */
  display: block;            /* ensures proper centering */
}


</style>
