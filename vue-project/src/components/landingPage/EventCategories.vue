<template>
  <section class="cats" :class="bgClass">
    <div v-if="showHeader" class="cats-head">
      <p class="tag">{{ $t('eventCategories.section.eyebrow') }}</p>
      <h2>
        {{ $t('eventCategories.section.titleBefore') }}
        <em>{{ $t('eventCategories.section.titleAccent') }}</em>
      </h2>
      <p class="cats-sub">{{ $t('eventCategories.section.subtitle') }}</p>
    </div>

    <div class="cats-grid">
      <!--
        A card that can be chosen is a button: it was a div with a click
        handler, which no keyboard can reach. One that cannot be chosen is not
        a control at all, so it stays a div and says so to a screen reader.
      -->
      <component
        :is="cat.disabled ? 'div' : 'button'"
        v-for="cat in categories"
        :key="cat.id"
        :type="cat.disabled ? null : 'button'"
        class="cat"
        :class="{ active: cat.id === selectedId, disabled: cat.disabled }"
        :aria-disabled="cat.disabled ? 'true' : null"
        @click="!cat.disabled && onSelect(cat.id)"
      >
        <span v-if="cat.disabled" class="soon">{{ $t('eventCategories.comingSoon') }}</span>
        <b class="cat-ico" aria-hidden="true">{{ cat.glyph }}</b>
        <span class="cat-n">{{ $t(cat.titleKey) }}</span>
        <span class="cat-d">{{ $t(cat.descriptionKey) }}</span>
      </component>
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

/*
  Glyphs, not emoji. Eight full-colour pictograms were the brightest thing on
  a page whose whole palette is ink, cream and one gold; the redesign draws its
  icons in the page's own serif so they carry the text colour and the card's
  disabled state applies to them without a grayscale filter.
*/
const categories = [
  { id: "weddings", titleKey: "eventCategories.items.weddings.title", descriptionKey: "eventCategories.items.weddings.description", glyph: "◇" },
  { id: "gallery", titleKey: "eventCategories.items.gallery.title", descriptionKey: "eventCategories.items.gallery.description", glyph: "❋" },
  { id: "birthdays", titleKey: "eventCategories.items.birthdaysParties.title", descriptionKey: "eventCategories.items.birthdaysParties.description", glyph: "✦", disabled: true },
  { id: "corporate", titleKey: "eventCategories.items.corporate.title", descriptionKey: "eventCategories.items.corporate.description", glyph: "▦", disabled: true },
  { id: "graduations", titleKey: "eventCategories.items.graduations.title", descriptionKey: "eventCategories.items.graduations.description", glyph: "◈", disabled: true },
  { id: "dinners", titleKey: "eventCategories.items.privateDinners.title", descriptionKey: "eventCategories.items.privateDinners.description", glyph: "❖", disabled: true },
  { id: "baby", titleKey: "eventCategories.items.babyShowers.title", descriptionKey: "eventCategories.items.babyShowers.description", glyph: "☼", disabled: true },
  { id: "conferences", titleKey: "eventCategories.items.conferences.title", descriptionKey: "eventCategories.items.conferences.description", glyph: "◎", disabled: true },
];
</script>

<style scoped>
.cats {
  padding: var(--section-space) max(24px, calc((100vw - var(--container)) / 2));
}

.bg-white { background: var(--paper); }
.bg-main { background: var(--cream); }
.bg-transparent { background: transparent; padding: 2rem 0; }

.cats-head {
  max-width: var(--text-container);
  margin: 0 auto 56px;
  text-align: center;
}

.cats-head h2 {
  font-size: clamp(36px, 4vw, 58px);
  line-height: 1.1;
  letter-spacing: -0.03em;
  margin: 0 0 18px;
}

.cats-sub {
  max-width: 560px;
  margin: 0 auto;
  font: 15px/1.8 var(--font-display);
  color: var(--ink-3);
}

.cats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  max-width: var(--container);
  margin: 0 auto;
}

/* Same card as `.values article` — bordered, on paper, lifting on hover —
   with the type stack a category needs. */
.cat {
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
  min-height: 210px;
  padding: 30px 26px;
  border: 1px solid var(--line);
  border-radius: var(--radius-card);
  background: #fffdf8;
  font: inherit;
  text-align: left;
  cursor: pointer;
  transition: background 0.3s, transform 0.3s, box-shadow 0.3s, border-color 0.3s;
}

.cat:hover:not(.disabled) {
  background: #f3f6ef;
  transform: translateY(-4px);
  box-shadow: 0 18px 42px rgba(23, 55, 43, 0.08);
}

.cat:focus-visible {
  outline: 2px solid var(--brand-mid);
  outline-offset: 3px;
}

.cat.active {
  border-color: var(--ink);
  background: var(--ink);
}

.cat.active .cat-ico { color: var(--gold); }
.cat.active .cat-n { color: #fff; }
.cat.active .cat-d { color: #b7c5be; }

/*
  Unavailable has to look unavailable (IVY-1205). At 0.6 with a white face and
  a full border, a card with a NASKORO badge was still the loudest thing in the
  grid and read as something you could pick. It now sinks into the section: no
  card surface, a dashed edge, and no hover.
*/
.cat.disabled {
  background: transparent;
  border-style: dashed;
  border-color: var(--line-2);
  box-shadow: none;
  opacity: 0.72;
  cursor: default;
}

.soon {
  position: absolute;
  top: 12px;
  right: 12px;
  padding: 4px 9px;
  border-radius: 999px;
  background: var(--secondary-gold);
  color: var(--ink);
  font-family: var(--font-ui);
  font-size: 8px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.cat-ico {
  font-family: var(--font-display);
  font-size: 26px;
  font-weight: 400;
  color: var(--gold);
  margin-bottom: 28px;
}

.cat-n {
  font-family: var(--font-display);
  font-size: 21px;
  margin-bottom: 8px;
}

.cat-d {
  font: 13px/1.7 var(--font-display);
  color: var(--ink-3);
}

@media (max-width: 1100px) {
  .cats-grid { grid-template-columns: repeat(2, 1fr); }
}

@media (max-width: 580px) {
  .cats { padding-left: 20px; padding-right: 20px; }
  .cats-grid { grid-template-columns: 1fr; gap: 12px; }
  .cat { min-height: auto; padding: 26px 22px; }
  .cat-ico { margin-bottom: 18px; }
}
</style>
