<template>
  <EventCategories bgClass="bg-main" v-model="selectedId" />

  <div class="mt-5 d-flex flex-column button-lg mx-auto">
    <button-main
      :to="selectedTo"
      :label="$t('eventCategories.section.continue')"
      variant="main"
      class="w-100"
      :class="{ disabled: !selectedId }"
      :aria-disabled="!selectedId"
      @click.prevent="!selectedId && null"
    />

    <p class="mt-3 text-center">
      {{ $t('eventCategories.section.description') }}
    </p>
  </div>
</template>

<script>
import EventCategories from "@/components/landingPage/EventCategories.vue";
import ButtonMain from "@/components/generic/ButtonMain.vue";

export default {
  name: "EventCategoryPage",
  components: { ButtonMain, EventCategories },
  data() {
    return {
      selectedId: null
    };
  },
  computed: {
    selectedTo() {
      // fallback if nothing selected
      if (!this.selectedId) return "/invitations";

      // IMPORTANT: to get category->to, best is to move categories array outside into a shared config file.
      // For now simplest: map ids here:
      const map = {
        weddings: "/invitations/weddings",
        birthdays: "/invitations/birthdays",
        corporate: "/invitations/corporate",
        conferences: "/invitations/conferences",
        dinners: "/invitations/dinners",
        baby: "/invitations/baby",
        graduations: "/invitations/graduations",
        anniversaries: "/invitations/anniversaries"
      };

      return map[this.selectedId] || "/invitations";
    }
  }
};
</script>

<style scoped>
.button-lg { max-width: 24rem; }

.disabled {
  pointer-events: none;
  opacity: 0.6;
}
</style>
