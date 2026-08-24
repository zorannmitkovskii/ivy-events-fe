<template>
  <section class="page-hero">
    <div class="page-hero__inner">
      <span v-if="eyebrow" class="page-hero__eyebrow">{{ eyebrow }}</span>
      <h1 class="page-hero__title">{{ title }}</h1>
      <p v-if="subtitle" class="page-hero__subtitle">{{ subtitle }}</p>
      <div v-if="$slots.default" class="page-hero__extra"><slot /></div>
    </div>
  </section>
</template>

<script setup>
/**
 * The banner on a public page: About, Packages, Contact.
 *
 * <p>Contact had it, the other two each had their own — one a plain centred
 * heading, one a bare `h2` with no banner at all — so three marketing pages
 * opened three different ways. This is Contact's, extracted rather than copied
 * twice more.
 *
 * <p>The eyebrow names the page and the title says the thing worth saying;
 * that ordering is why Contact reads as a destination and Packages read as a
 * list that started mid-sentence.
 */
defineProps({
  /** Small, uppercase, gold: the page's name. */
  eyebrow: { type: String, default: '' },
  /** The sentence. Large, serif. */
  title: { type: String, required: true },
  subtitle: { type: String, default: '' },
})
</script>

<style scoped>
/*
  The redesign's page banner is light — paper fading into the page's cream —
  not the dark green block this was. The dark treatment is reserved now for
  the two bands that are meant to invert the palette: the planner section on
  the home page and the gallery packages band.
*/
.page-hero {
  padding: 100px 24px 70px;
  background: linear-gradient(180deg, var(--paper), var(--cream));
  text-align: center;
}

.page-hero__inner {
  max-width: var(--text-container);
  margin: 0 auto;
}

.page-hero__eyebrow {
  display: inline-block;
  margin-bottom: 16px;
  font-family: var(--font-ui);
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.23em;
  text-transform: uppercase;
  color: var(--ink);
}

.page-hero__title {
  margin: 0;
  font-family: var(--font-display);
  font-size: clamp(48px, 6vw, 78px);
  font-weight: 400;
  line-height: 0.98;
  letter-spacing: -0.03em;
  color: var(--ink);
  text-wrap: balance;
}

.page-hero__subtitle {
  max-width: 56ch;
  margin: 25px auto 0;
  font: 15px/1.8 var(--font-display);
  color: var(--ink-3);
}

.page-hero__extra {
  margin-top: 24px;
}

@media (max-width: 580px) {
  .page-hero {
    padding: 75px 20px 50px;
  }
}
</style>
