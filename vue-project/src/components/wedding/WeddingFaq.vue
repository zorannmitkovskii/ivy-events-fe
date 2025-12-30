<template>
  <section class="px-5 py-5 bg-brand-light ">
    <h2 class="text-center text-3xl font-bold text-brand-dark mb-10">FAQ</h2>

    <div class="max-w-2xl mx-auto">
      <div
        v-for="(item, index) in faqs"
        :key="index"
        class="mb-4 rounded overflow-hidden shadow"
      >
        <!-- Question -->
        <div
          class="faq-question px-4 py-3 cursor-pointer text-brand-light font-bold bg-brand-dark"
          @click="toggle(index)"
        >
          {{ item.question }}
        </div>

        <!-- Answer -->
        <div
          v-show="activeIndex === index"
          class="faq-answer px-4 py-3 bg-brand-light text-brand-dark font-normal transition-all duration-300"
        >
          {{ item.answer }}
        </div>
      </div>
    </div>
  </section>
</template>

<script>
export default {
  data() {
    return {
      activeIndex: null,
      faqs: [
        {
          question: "What is a web invitation?",
          answer: "Web invitations are the new generation: welcome to the future. They go beyond traditional digital invitations..."
        },
        {
          question: "How do I start mine?",
          answer: "Creating your web invitation is easy and intuitive. Start by registering and following a few simple steps..."
        },
        {
          question: "Can I customize everything?",
          answer: "Yes, you can customize everything almost entirely to your liking, as many times as you want..."
        },
        {
          question: "About sharing the invitation",
          answer: "Share it easily and without limits via WhatsApp, email, SMS, or any digital channel."
        },
        {
          question: "Where are designs & data saved?",
          answer: "FreshEvent is 100% cloud-secure. All your information and guest records are safely stored in your private account."
        }
      ]
    };
  },
  methods: {
    toggle(index) {
      this.activeIndex = this.activeIndex === index ? null : index;
    }
  }
};
</script>

<style scoped>
.faq-answer {
  overflow: hidden;
}
</style>
