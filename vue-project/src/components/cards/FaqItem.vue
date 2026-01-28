<template>
  <article class="faq-item" :class="{ open: isOpen }">
    <button
      class="faq-question"
      type="button"
      :aria-expanded="isOpen ? 'true' : 'false'"
      @click="$emit('toggle')"
    >
      <span class="faq-q-text">{{ question }}</span>

      <!-- Chevron -->
      <span class="faq-chevron" aria-hidden="true">
        <svg viewBox="0 0 24 24" class="chev">
          <path
            d="M6 9l6 6 6-6"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </span>
    </button>

    <div class="faq-answer " :style="answerStyle">
      <div class="faq-answer-inner">
        {{ answer }}
      </div>
    </div>
  </article>
</template>

<script setup>

const props = defineProps({
  question: { type: String, required: true },
  answer: { type: String, required: true },
  isOpen: { type: Boolean, default: false }
});

defineEmits(["toggle"]);

</script>

<style scoped>
.faq-item {
  border-radius: var(--radius-lg);
  background: var(--bg-white);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
  border: 1px solid rgba(0,0,0,0.03);
}

/* QUESTION ROW */
.faq-question {
  width: 100%;
  border: 0;
  background: transparent;
  cursor: pointer;

  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;

  padding: 18px 22px;

  font-family: var(--font-family), serif;
  font-size: 16px;
  color: var(--brand-main);
}

/* Remove that “black outline/border” */
.faq-question:focus,
.faq-question:focus-visible {
  outline: none;
  box-shadow: none;
}

/* ACTIVE HEADER BACKGROUND */
.faq-item.open .faq-question {
  background: var(--bg-main);
}

/* CHEVRON */
.faq-chevron {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  display: grid;
  place-items: center;
  color: var(--brand-main);
}

.chev {
  width: 18px;
  height: 18px;
  transition: transform 0.2s ease;
}

.faq-item.open .chev {
  transform: rotate(180deg);
}

/* ANSWER COLLAPSE (grid trick) */
.faq-answer {
  display: grid;
  transition: grid-template-rows 0.25s ease;
}

/* IMPORTANT: hide content when collapsed */
.faq-answer-inner {
  overflow: hidden;
  padding: 18px 22px;
  border-top: 1px solid rgba(0,0,0,0.06);
  font-size: 14px;
  color: var(--brand-dark);
  line-height: 1.6;
}

/* When CLOSED, remove border-top and bottom padding */
.faq-item:not(.open) .faq-answer-inner {
  display: none;
  border-top-color: transparent;
  padding-bottom: 0;
}

</style>
