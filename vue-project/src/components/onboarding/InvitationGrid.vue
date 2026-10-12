<template>
  <div v-if="invitations.length">
    <ul class="invitation-grid" role="list">
      <li v-for="(inv, idx) in invitations" :key="inv.id" class="invitation-grid__item">
        <InvitationCard
          :id="String(inv.id)"
          :name="inv.name"
          :subtitle="inv.subtitle"
          :thumbnail-url="inv.thumbnailUrl"
          :traits="inv.traits || []"
          :selected="inv.id === selectedId"
          :color-index="idx"
          :personalization="personalization"
          @select="$emit('select', inv.id)"
          @preview="$emit('preview', inv.id)"
        />
      </li>
    </ul>
    <!-- INV-201: the choice is said to a screen reader as well as shown. -->
    <p class="invitation-grid__status" role="status" aria-live="polite" data-testid="invitation-selected-status">{{ selectedAnnouncement }}</p>
  </div>

  <div v-else class="empty-state">
    <div class="empty-icon" aria-hidden="true">📭</div>
    <p class="empty-message">{{ emptyMessage }}</p>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import InvitationCard from './InvitationCard.vue';

const props = defineProps({
  // [{ id, name, subtitle, thumbnailUrl, traits }]
  invitations: { type: Array, required: true },
  selectedId: { type: String, default: '' },
  emptyMessage: { type: String, default: 'No invitations available for this category yet.' },
  // The user's names, date and place, drawn on every design (INV-104).
  personalization: { type: Object, default: null }
});

defineEmits(['select', 'preview']);

const { t } = useI18n();

// Said when the choice changes on this page — not on arrival.
const selectedAnnouncement = ref('');
watch(() => props.selectedId, (id, old) => {
  if (!id || id === old) return;
  const inv = props.invitations.find(i => i.id === id);
  selectedAnnouncement.value = inv ? t('onboarding.invitations.card.selectedStatus', { name: inv.name }) : '';
});
</script>

<style scoped>
.invitation-grid {
  list-style: none;
  margin: 0;
  padding: 0;
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

.invitation-grid__item {
  min-width: 0;
}

.invitation-grid__status {
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  padding: 0;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
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
  color: var(--neutral-500, var(--ink-3));
}
</style>
