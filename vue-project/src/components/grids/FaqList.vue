<template>
  <div class="faq-list">
    <FaqItem
      v-for="(item, idx) in faqItems"
      :key="idx"
      :question="item.question"
      :answer="item.answer"
      :isOpen="openIndex === idx"
      @toggle="toggle(idx)"
    />
  </div>
</template>

<script setup>
import { ref } from "vue";
import FaqItem from "@/components/cards/FaqItem.vue";

const props = defineProps({
  defaultOpenIndex: { type: Number, default: 0 } // first open like screenshot
});

const openIndex = ref(props.defaultOpenIndex);
const faqItems = [
  {
    question: "How do I create an invitation?",
    answer:
      "Creating an invitation is simple! Just sign up for free, choose a template from our gallery, customize it with your event details and photos, then share it via email, text, or social media. The entire process takes less than 10 minutes."
  },
  {
    question: "Can I customize the invitation templates?",
    answer:
      "Absolutely! All templates are fully customizable. You can change colors, fonts, images, text, and layout."
  },
  {
    question: "How does RSVP tracking work?",
    answer:
      "Guests RSVP with one click. You'll see responses in real-time and can send reminders to guests who haven't replied."
  },
  {
    question: "Is EventPro free to use?",
    answer:
      "Yes! We offer a free plan for small events. Pro and Premium plans unlock advanced features for larger events."
  },
  {
    question: "Can I use EventPro for professional event planning?",
    answer:
      "Definitely. You can manage multiple events, use premium templates, and keep everything organized for clients."
  },
  {
    question: "Are the invitations mobile-friendly?",
    answer:
      "Yes! All invitations are responsive and work beautifully on desktop, tablet, and mobile."
  },
  {
    question: "What if I need help or have questions?",
    answer:
      "We offer a help center and email support. Pro and Premium users get priority support with faster response times."
  }
];
function toggle(idx) {
  openIndex.value = openIndex.value === idx ? -1 : idx;
}
</script>

<style scoped>
.faq-list {
  display: grid;
  gap: 18px;
}
</style>
