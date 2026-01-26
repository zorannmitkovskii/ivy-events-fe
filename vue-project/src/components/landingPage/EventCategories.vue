<template>
  <section class="categories-section">
    <div class="container">
      <SectionHeader
        title="Perfect for Every Celebration"
        subtitle="Beautiful invitations for all your special moments"
      />

      <CategoryGrid :items="categories" />
    </div>
  </section>
</template>

<script setup>
import SectionHeader from "@/components/ui/SectionHeader.vue";
import CategoryGrid from "@/components/cards/CategoryGrid.vue";

const categories = [
  { title: "Weddings",           description: "Elegant invitations for your special day", icon: "💍", chipClass: "chip-pink" },
  { title: "Birthdays & Parties",description: "Celebrate milestones in style",            icon: "🎂", chipClass: "chip-peach" },
  { title: "Corporate Events",   description: "Professional invitations for business",    icon: "💼", chipClass: "chip-gold" },
  { title: "Conferences",        description: "Streamline event registration",            icon: "👥", chipClass: "chip-green" },
  { title: "Private Dinners",    description: "Intimate gatherings made easy",            icon: "🍽️", chipClass: "chip-blue" },
  { title: "Baby Showers",       description: "Welcome the new arrival",                  icon: "👶", chipClass: "chip-purple" },
  { title: "Graduations",        description: "Celebrate achievements",                   icon: "🎓", chipClass: "chip-yellow" },
  { title: "Anniversaries",      description: "Honor years of love",                      icon: "❤️", chipClass: "chip-pink" }
];
</script>

<style scoped>
.categories-section {
  padding: 6rem 0;
  background: var(--white);
}

/* Uses your global container if you have it; otherwise keep this */
.container {
  max-width: 1180px;
  margin: 0 auto;
  padding: 0 24px;
}
</style>
