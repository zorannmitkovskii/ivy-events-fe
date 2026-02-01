<template>
  <section class="templates-section" :id="id">
    <div class="container">
      <SectionHeader
        :title="$t('home.templates.title')"
        :subtitle="$t('home.templates.subtitle')"
      />

      <TemplatesGrid :items="templates"/>

      <div class="templates-cta">
        <ButtonMain
          :label="$t('home.templates.cta')"
          :to="ctaTo"
          variant="outline"
        />
      </div>

    </div>
  </section>
</template>

<script setup>
import SectionHeader from "@/components/ui/SectionHeader.vue";
import TemplatesGrid from "@/components/grids/TemplatesGrid.vue";
import ButtonMain from "@/components/generic/ButtonMain.vue";
import { t } from '@/i18n'

defineProps({
  id: {type: String, default: "templates"},
  ctaTo: {type: [String, Object], default: "/templates"}
});

const templates = [
  {
    image: "https://images.unsplash.com/photo-1519741497674-611481863552?w=800&h=900&fit=crop",
    title: t('home.templates.items.elegantWedding.title'),
    subtitle: t('home.templates.items.elegantWedding.subtitle'),
    useTo: "/login"
  },
  {
    image: "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=800&h=900&fit=crop",
    title: t('home.templates.items.birthday.title'),
    subtitle: t('home.templates.items.birthday.subtitle'),
    useTo: "/login"
  },
  {
    image: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=900&fit=crop",
    title: t('home.templates.items.corporate.title'),
    subtitle: t('home.templates.items.corporate.subtitle'),
    useTo: "/login"
  },
  {
    image: "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800&h=900&fit=crop",
    title: t('home.templates.items.babyShower.title'),
    subtitle: t('home.templates.items.babyShower.subtitle'),
    useTo: "/login"
  }
];
</script>

<style scoped>
.templates-cta {
  display: flex;
  justify-content: center;
  margin-top: 34px;
}

.cta-outline {
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;

  padding: 12px 22px;
  border-radius: 10px;

  border: 1.5px solid var(--brand-dark);
  color: var(--brand-dark);
  background: transparent;

  font-weight: 700;
  transition: transform 0.2s ease, background 0.2s ease;
}

.cta-outline:hover {
  transform: translateY(-1px);
  background: rgba(21, 41, 30, 0.04);
}

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
