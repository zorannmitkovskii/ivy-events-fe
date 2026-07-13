<template>
  <section class="cats" :class="bgClass">
    <div class="wrap">
      <div v-if="showHeader" class="s-head">
        <span class="eyebrow">{{ $t('eventCategories.section.eyebrow') }}</span>
        <h2>{{ $t('eventCategories.section.titleBefore') }} <em>{{ $t('eventCategories.section.titleAccent') }}</em></h2>
        <p class="s-desc">{{ $t('eventCategories.section.subtitle') }}</p>
      </div>

      <!-- Live categories only. Disabled ones move to the strip below to
           avoid signalling "product is unfinished" on the landing page. -->
      <div class="cats-grid">
        <div
          v-for="cat in liveCategories"
          :key="cat.id"
          class="cat"
          :class="{ active: cat.id === selectedId }"
          @click="onSelect(cat.id)"
        >
          <div class="cat-ico" :style="{ background: cat.icoBg }">{{ cat.icon }}</div>
          <div class="cat-n">{{ $t(cat.titleKey) }}</div>
          <div class="cat-d">{{ $t(cat.descriptionKey) }}</div>
        </div>
      </div>

      <p v-if="soonCategories.length" class="soon-strip">
        {{ $t('eventCategories.comingSoonPrefix') }}
        <span
          v-for="(cat, i) in soonCategories"
          :key="cat.id"
        >{{ $t(cat.titleKey) }}<span v-if="i < soonCategories.length - 1">, </span></span>.
      </p>
    </div>
  </section>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  bgClass: { type: String, default: "bg-white" },
  modelValue: { type: [String, Number, null], default: null },
  showHeader: { type: Boolean, default: true },
  disableNavigation: { type: Boolean, default: false }
});

const emit = defineEmits(["update:modelValue"]);

const selectedId = computed(() => props.modelValue);

function onSelect(id) {
  emit("update:modelValue", id);
}

const categories = [
  { id: "weddings", titleKey: "eventCategories.items.weddings.title", descriptionKey: "eventCategories.items.weddings.description", icon: "💍", icoBg: "rgba(191,210,164,.2)" },
  { id: "gallery", titleKey: "eventCategories.items.gallery.title", descriptionKey: "eventCategories.items.gallery.description", icon: "📸", icoBg: "rgba(200,162,77,.12)" },
  { id: "birthdays", titleKey: "eventCategories.items.birthdaysParties.title", descriptionKey: "eventCategories.items.birthdaysParties.description", icon: "🎂", icoBg: "rgba(237,110,105,.12)", disabled: true },
  { id: "corporate", titleKey: "eventCategories.items.corporate.title", descriptionKey: "eventCategories.items.corporate.description", icon: "🏢", icoBg: "rgba(93,106,87,.12)", disabled: true },
  { id: "graduations", titleKey: "eventCategories.items.graduations.title", descriptionKey: "eventCategories.items.graduations.description", icon: "🎓", icoBg: "rgba(191,210,164,.2)", disabled: true },
  { id: "dinners", titleKey: "eventCategories.items.privateDinners.title", descriptionKey: "eventCategories.items.privateDinners.description", icon: "🍽", icoBg: "rgba(200,162,77,.12)", disabled: true },
  { id: "baby", titleKey: "eventCategories.items.babyShowers.title", descriptionKey: "eventCategories.items.babyShowers.description", icon: "🍼", icoBg: "rgba(237,110,105,.12)", disabled: true },
  { id: "conferences", titleKey: "eventCategories.items.conferences.title", descriptionKey: "eventCategories.items.conferences.description", icon: "🎤", icoBg: "rgba(93,106,87,.12)", disabled: true },
];

const liveCategories = computed(() => categories.filter(c => !c.disabled));
const soonCategories = computed(() => categories.filter(c => c.disabled));
</script>

<style scoped>
.cats { padding: 96px 52px; }
.bg-white { background: var(--bg-white); }
.bg-main { background: var(--bg-main); }
.bg-transparent { background: transparent; padding: 2rem 0; }

.wrap { max-width: 1200px; margin: 0 auto; }

.s-head { text-align: center; margin-bottom: 56px; }

.eyebrow {
  display: inline-block;
  font-size: 13.5px;
  font-weight: 700;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--brand-main);
  margin-bottom: 12px;
}

h2 {
  font-family: var(--font-display);
  font-size: clamp(36px, 4vw, 54px);
  font-weight: 400;
  line-height: 1.15;
  margin: 0 0 14px;
  color: var(--brand-main);
}

h2 em { font-style: italic; color: var(--brand-dark); }

.s-desc {
  font-size: 17px;
  color: var(--neutral-700);
  font-weight: 300;
  line-height: 1.75;
  max-width: 520px;
  margin: 0 auto;
}

/* Grid */
.cats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

.cat {
  border-radius: 16px;
  padding: 36px 28px 30px;
  text-align: center;
  border: 1.5px solid var(--soft-light);
  background: var(--bg-white);
  transition: all 0.3s;
  cursor: pointer;
  position: relative;
}

.cat:hover:not(.disabled) {
  border-color: var(--brand-light);
  box-shadow: var(--shadow-md);
  transform: translateY(-4px);
}

.cat.active {
  border-color: var(--brand-main);
  background: var(--brand-main);
}

.cat.active .cat-n,
.cat.active .cat-d { color: #fff; }
.cat.active .cat-d { color: rgba(255, 255, 255, 0.65); }

.soon-strip {
  margin: 28px auto 0;
  max-width: 720px;
  text-align: center;
  color: var(--neutral-700);
  font-size: 14px;
  letter-spacing: 0.01em;
}

.cat-ico {
  width: 60px;
  height: 60px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 16px;
  font-size: 26px;
}

.cat-n {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 8px;
  color: var(--brand-main);
}

.cat-d {
  font-size: 15px;
  color: var(--neutral-700);
  line-height: 1.6;
}

@media (max-width: 900px) {
  .cats { padding: 64px 24px; }
  .cats-grid { grid-template-columns: repeat(2, 1fr); gap: 16px; }
}

@media (max-width: 520px) {
  .cats-grid { grid-template-columns: 1fr; }
  .cat { padding: 28px 22px 24px; }
  .cat-n { font-size: 16px; }
  .cat-d { font-size: 14px; }
}
</style>
