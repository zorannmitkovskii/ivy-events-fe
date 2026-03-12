<template>
  <section class="cats" :class="bgClass">
    <div class="wrap">
      <div v-if="showHeader" class="s-head">
        <span class="eyebrow">{{ $t('eventCategories.section.eyebrow') }}</span>
        <h2>{{ $t('eventCategories.section.titleBefore') }} <em>{{ $t('eventCategories.section.titleAccent') }}</em></h2>
        <p class="s-desc">{{ $t('eventCategories.section.subtitle') }}</p>
      </div>

      <div class="cats-grid">
        <div
          v-for="cat in categories"
          :key="cat.id"
          class="cat"
          :class="{ active: cat.id === selectedId, disabled: cat.disabled }"
          @click="!cat.disabled && onSelect(cat.id)"
        >
          <span v-if="cat.disabled" class="soon">{{ $t('eventCategories.comingSoon') }}</span>
          <div class="cat-ico" :style="{ background: cat.icoBg }">{{ cat.icon }}</div>
          <div class="cat-n">{{ $t(cat.titleKey) }}</div>
          <div class="cat-d">{{ $t(cat.descriptionKey) }}</div>
        </div>
      </div>
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
  font-family: 'Cormorant Garamond', serif;
  font-size: clamp(36px, 4vw, 54px);
  font-weight: 400;
  line-height: 1.15;
  margin: 0 0 14px;
  color: var(--brand-main);
}

h2 em { font-style: italic; color: var(--brand-gold); }

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
  grid-template-columns: repeat(4, 1fr);
  gap: 13px;
}

.cat {
  border-radius: 14px;
  padding: 26px 20px 22px;
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

.cat.disabled {
  opacity: 0.6;
  cursor: default;
}

.soon {
  position: absolute;
  top: 10px;
  right: 10px;
  background: var(--secondary-gold);
  color: var(--brand-main);
  font-size: 9px;
  font-weight: 600;
  letter-spacing: 0.09em;
  text-transform: uppercase;
  padding: 3px 8px;
  border-radius: 100px;
}

.cat-ico {
  width: 50px;
  height: 50px;
  border-radius: 11px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 13px;
  font-size: 19px;
}

.cat-n {
  font-size: 15px;
  font-weight: 500;
  margin-bottom: 6px;
  color: var(--brand-main);
}

.cat-d {
  font-size: 14px;
  color: var(--neutral-700);
  line-height: 1.55;
}

@media (max-width: 900px) {
  .cats { padding: 64px 24px; }
  .cats-grid { grid-template-columns: repeat(2, 1fr); }
}

@media (max-width: 520px) {
  .cats-grid { grid-template-columns: 1fr; }
}
</style>
