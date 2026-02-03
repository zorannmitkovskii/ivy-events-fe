<template>
  <section class="categories-section" :class="bgClass">
    <div class="container">
      <SectionHeader
        :title="$t('eventCategories.section.title')"
        :subtitle="$t('eventCategories.section.subtitle')"
      />

      <CategoryGrid
        :items="categories"
        v-model="selectedId"
      />
    </div>
  </section>
</template>

<script setup>
import SectionHeader from "@/components/ui/SectionHeader.vue";
import CategoryGrid from "@/components/grids/CategoryGrid.vue";
import {computed} from "vue";

const props = defineProps({
  bgClass: { type: String, default: "bg-white" },
  modelValue: { type: [String, Number, null], default: null }
});

const emit = defineEmits(["update:modelValue"]);

const selectedId = computed({
  get: () => props.modelValue,
  set: (v) => emit("update:modelValue", v)
});

const categories = [
  { id: "weddings", titleKey: "eventCategories.items.weddings.title", descriptionKey: "eventCategories.items.weddings.description", icon: "💍", chipClass: "chip-pink", to: "/invitations/weddings" },
  { id: "birthdays", titleKey: "eventCategories.items.birthdaysParties.title", descriptionKey: "eventCategories.items.birthdaysParties.description", icon: "🎂", chipClass: "chip-peach", to: "/invitations/birthdays" },
  { id: "corporate", titleKey: "eventCategories.items.corporate.title", descriptionKey: "eventCategories.items.corporate.description", icon: "💼", chipClass: "chip-gold", to: "/invitations/corporate" },
  { id: "conferences", titleKey: "eventCategories.items.conferences.title", descriptionKey: "eventCategories.items.conferences.description", icon: "👥", chipClass: "chip-green", to: "/invitations/conferences" },
  { id: "dinners", titleKey: "eventCategories.items.privateDinners.title", descriptionKey: "eventCategories.items.privateDinners.description", icon: "🍽️", chipClass: "chip-blue", to: "/invitations/dinners" },
  { id: "baby", titleKey: "eventCategories.items.babyShowers.title", descriptionKey: "eventCategories.items.babyShowers.description", icon: "👶", chipClass: "chip-purple", to: "/invitations/baby" },
  { id: "graduations", titleKey: "eventCategories.items.graduations.title", descriptionKey: "eventCategories.items.graduations.description", icon: "🎓", chipClass: "chip-yellow", to: "/invitations/graduations" },
  { id: "anniversaries", titleKey: "eventCategories.items.anniversaries.title", descriptionKey: "eventCategories.items.anniversaries.description", icon: "❤️", chipClass: "chip-pink", to: "/invitations/anniversaries" }
];
</script>

<style scoped>
.categories-section { padding: 6rem 0; }
.bg-white { background: var(--bg-white); }
.bg-main { background: var(--bg-main); }

.container {
  max-width: 1180px;
  margin: 0 auto;
  padding: 0 24px;
}
</style>
