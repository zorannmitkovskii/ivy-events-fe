<template>
  <section class="testimonials-section" :id="id">
    <div class="container">
      <SectionHeader
        :title="$t('home.testimonials.title')"
        :subtitle="$t('home.testimonials.subtitle')"
      />

      <div class="grid">
        <div v-for="(t, i) in testimonials" :key="i" class="card">
          <svg class="quote-icon" width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
            <path d="M6 17h3l2-4V7H5v6h3zm8 0h3l2-4V7h-6v6h3z"/>
          </svg>

          <p class="quote">{{ t.text }}</p>

          <div class="author">
            <img :src="t.avatar" :alt="t.name" class="avatar" loading="lazy" />
            <div>
              <div class="name">{{ t.name }}</div>
              <div class="role">{{ t.role }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import SectionHeader from "@/components/ui/SectionHeader.vue";

defineProps({
  id: { type: String, default: "testimonials" }
});

const testimonials = [
  {
    text: "IvyEvents made planning our wedding so much easier! The invitation designs are stunning, and tracking RSVPs was effortless. Our guests loved how easy it was to respond.",
    name: "Sarah & Michael",
    role: "Wedding, June 2024",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop"
  },
  {
    text: "As an event planner, IvyEvents has become my go-to tool. The professional templates and seamless guest management save me hours of work. My clients are always impressed!",
    name: "Emily Rodriguez",
    role: "Event Planner",
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&h=100&fit=crop"
  },
  {
    text: "We used IvyEvents for our daughter's birthday party and it was perfect! The mobile-friendly invitations made it easy for all parents to RSVP quickly. Highly recommend!",
    name: "David Thompson",
    role: "Birthday Party Host",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop"
  }
];
</script>

<style scoped>
.testimonials-section {
  padding: 6rem 0;
  background: var(--bg-main);
}
.container {
  max-width: 1180px;
  margin: 0 auto;
  padding: 0 24px;
}
.grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
  margin-top: 12px;
}
.card {
  background: var(--bg-white);
  border-radius: 20px;
  padding: 36px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.06);
}
.quote-icon {
  color: var(--secondary-sage);
  opacity: 0.5;
  margin-bottom: 16px;
}
.quote {
  color: var(--neutral-700);
  font-size: 15px;
  line-height: 1.7;
  font-style: italic;
  margin: 0 0 24px;
}
.author {
  display: flex;
  align-items: center;
  gap: 14px;
}
.avatar {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid var(--secondary-sage);
}
.name {
  font-weight: 700;
  font-size: 15px;
  color: var(--neutral-900);
}
.role {
  font-size: 13px;
  color: var(--neutral-500);
}

@media (max-width: 980px) {
  .grid { grid-template-columns: 1fr; max-width: 560px; margin: 12px auto 0; }
}
</style>
