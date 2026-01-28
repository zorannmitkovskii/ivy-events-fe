<template>
  <section class="templates-section" :id="id">
    <div class="container">
      <SectionHeader
        title="Stunning Templates for Every Occasion"
        subtitle="Professionally designed, fully customizable invitations"
      />

      <TemplatesGrid :items="templates" />

      <div class="templates-cta">
        <ButtonMain variant="outline" label="View All Templates" :to="ctaTo" />
      </div>
    </div>
  </section>
</template>

<script setup>
import SectionHeader from "@/components/ui/SectionHeader.vue";
import TemplatesGrid from "@/components/grids/TemplatesGrid.vue";
import ButtonMain from "@/components/generic/ButtonMain.vue";

defineProps({
  id: { type: String, default: "templates" },
  ctaTo: { type: [String, Object], default: "/templates" }
});

const templates = [
  {
    featured: true,
    image: "https://images.unsplash.com/photo-1519741497674-611481863552?w=800&h=900&fit=crop",
    title: "Elegant Wedding",
    subtitle: "Classic & Timeless",
    useTo: "/templates"
  },
  {
    image: "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=800&h=900&fit=crop",
    title: "Birthday Celebration",
    subtitle: "Fun & Festive",
    useTo: "/templates"
  },
  {
    image: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=900&fit=crop",
    title: "Corporate Event",
    subtitle: "Professional & Modern",
    useTo: "/templates"
  },
  {
    image: "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800&h=900&fit=crop",
    title: "Baby Shower",
    subtitle: "Sweet & Charming",
    useTo: "/templates"
  }
];
</script>

<style scoped>
.templates-section {
  padding: 6rem 0;
  background: var(--bg-white);
}

/* If you already have global container, remove this */
.container {
  max-width: 1180px;
  margin: 0 auto;
  padding: 0 24px;
}

.templates-cta {
  display: flex;
  justify-content: center;
  margin-top: 34px;
}
</style>
