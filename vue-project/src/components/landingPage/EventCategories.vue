<template>
  <section class="categories-section">
    <div class="container">
      <SectionHeader
        :title="$t('eventCategories.section.title')"
        :subtitle="$t('eventCategories.section.subtitle')"
      />

      <CategoryGrid :items="categories" />
    </div>
  </section>
</template>

<script setup>
import SectionHeader from "@/components/ui/SectionHeader.vue";
import CategoryGrid from "@/components/grids/CategoryGrid.vue";

const categories = [
  { titleKey: "eventCategories.items.weddings.title",           descriptionKey: "eventCategories.items.weddings.description",           icon: "💍", chipClass: "chip-pink" },
  { titleKey: "eventCategories.items.birthdaysParties.title",   descriptionKey: "eventCategories.items.birthdaysParties.description", icon: "🎂", chipClass: "chip-peach" },
  { titleKey: "eventCategories.items.corporate.title",          descriptionKey: "eventCategories.items.corporate.description",        icon: "💼", chipClass: "chip-gold" },
  { titleKey: "eventCategories.items.conferences.title",        descriptionKey: "eventCategories.items.conferences.description",      icon: "👥", chipClass: "chip-green" },
  { titleKey: "eventCategories.items.privateDinners.title",     descriptionKey: "eventCategories.items.privateDinners.description",   icon: "🍽️", chipClass: "chip-blue" },
  { titleKey: "eventCategories.items.babyShowers.title",        descriptionKey: "eventCategories.items.babyShowers.description",      icon: "👶", chipClass: "chip-purple" },
  { titleKey: "eventCategories.items.graduations.title",        descriptionKey: "eventCategories.items.graduations.description",      icon: "🎓", chipClass: "chip-yellow" },
  { titleKey: "eventCategories.items.anniversaries.title",      descriptionKey: "eventCategories.items.anniversaries.description",    icon: "❤️", chipClass: "chip-pink" }
];
</script>

<style scoped>
.categories-section {
  padding: 6rem 0;
  background: var(--bg-white);
}

/* Uses your global container if you have it; otherwise keep this */
.container {
  max-width: 1180px;
  margin: 0 auto;
  padding: 0 24px;
}
</style>
