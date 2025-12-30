<template>
  <section id="faq" class="py-5 bg-brand-light">
    <div class="container">

      <div class="text-center mb-5">
        <h2 class="display-5 fw-bold mb-3" style="color: var(--neutral-900);">
          Frequently Asked Questions
        </h2>
        <p class="fs-5" style="color: var(--neutral-500);">
          Everything you need to know about EventPro
        </p>
      </div>

      <div class="row justify-content-center">
        <div class="col-lg-8">

          <div
            v-for="(item, index) in faqs"
            :key="index"
            class="accordion-item border-0 mb-3 shadow-sm"
            style="border-radius: var(--radius-card); overflow:hidden;"
          >

            <!-- QUESTION -->
            <div
              class="accordion-button fw-semibold d-flex align-items-center px-3"
              @click="toggle(index)"
              :class="{collapsed: active !== index}"
              style="
                background:white;
                color:var(--neutral-900);
                border-radius:var(--radius-card);
                cursor:pointer;
                border:1px solid;
                min-height:50px;
              "
            >
              <i class="fas fa-question-circle me-3" style="color: var(--primary-main);"></i>
              {{ item.q }}
            </div>

            <!-- ANSWER -->
            <div
              v-show="active === index"
              class="accordion-collapse"
              style="background:white; border:none;"
            >
              <div
                class="accordion-body"
                style="
                  color:var(--neutral-500);
                  padding:1rem 1.2rem;
                "
              >
                {{ item.a }}
              </div>
            </div>

          </div><!-- item -->

        </div>
      </div>

    </div>
  </section>
</template>

<script setup>
import { ref } from "vue";

const active = ref(null);

const toggle = (index) => {
  active.value = active.value === index ? null : index;
};

const faqs = [
  {
    q: "How do I create an event?",
    a: "Simply click 'Get Started' or 'Plan Your Event', choose your event category, fill in the details..."
  },
  {
    q: "Can multiple people manage an event?",
    a: "Yes! You can add co-hosts and assign different permission levels..."
  },
  {
    q: "How do guests upload photos?",
    a: "Guests receive a unique event link where they can drag and drop photos and videos..."
  },
  {
    q: "Is it free to use?",
    a: "EventPro offers a free plan for individual users with basic features..."
  },
  {
    q: "What's the difference between Organizer and User accounts?",
    a: "User accounts are for individuals planning their own events..."
  }
];
</script>

<style scoped>
.accordion-button {
  min-height: 50px;
}

@media(max-width: 768px) {
  .accordion-button {
    min-height: 38px !important;
  }
}
</style>
