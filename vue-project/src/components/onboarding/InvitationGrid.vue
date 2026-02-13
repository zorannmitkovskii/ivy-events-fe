<template>
  <div v-if="invitations.length" class="invitation-grid">
    <InvitationCard
      v-for="(inv, idx) in invitations"
      :key="inv.id"
      :name="inv.name"
      :subtitle="inv.subtitle"
      :thumbnail-url="inv.thumbnailUrl"
      :selected="inv.id === selectedId"
      :color-index="idx"
      @select="$emit('select', inv.id)"
      @preview="$emit('preview', inv.id)"
    />
  </div>

  <div v-else class="empty-state">
    <div class="empty-icon" aria-hidden="true">📭</div>
    <p class="empty-message">{{ emptyMessage }}</p>
  </div>
</template>

<script setup>
import InvitationCard from './InvitationCard.vue';

defineProps({
  invitations: { type: Array, required: true },
  selectedId: { type: String, default: '' },
  emptyMessage: { type: String, default: 'No invitations available for this category yet.' }
});

defineEmits(['select', 'preview']);
</script>

<style scoped>
.invitation-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
}

@media (min-width: 480px) {
  .invitation-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 900px) {
  .invitation-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (min-width: 1200px) {
  .invitation-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

.empty-state {
  text-align: center;
  padding: 48px 16px;
}

.empty-icon {
  font-size: 40px;
  margin-bottom: 12px;
}

.empty-message {
  margin: 0;
  font-size: 15px;
  color: var(--neutral-500, #6b7280);
}
</style>
