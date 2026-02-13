<template>
  <section class="strip">
    <div class="inner">
      <div class="badge-item">
        <span class="stars" aria-label="5 stars">
          <svg v-for="n in 5" :key="n" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
        </span>
        <span class="badge-label">{{ $t('home.socialProof.rating') }}</span>
      </div>

      <div class="badge-item">
        <svg class="badge-icon badge-icon--sage" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
        <span class="badge-label">{{ $t('home.socialProof.eventsCreated') }}</span>
      </div>

      <div class="badge-item">
        <svg class="badge-icon badge-icon--main" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
        <span class="badge-label">{{ $t('home.socialProof.trustedBy') }}</span>
      </div>

      <div class="badge-item">
        <svg class="badge-icon badge-icon--salmon" width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
        <span class="badge-label">{{ $t('home.socialProof.satisfaction') }}</span>
      </div>
    </div>
  </section>
</template>

<script setup>
</script>

<style scoped>
.strip {
  background: var(--bg-white);
  padding: 24px 20px;
  border-top: 1px solid var(--neutral-300);
  border-bottom: 1px solid var(--neutral-300);
}
.inner {
  max-width: var(--container-max);
  margin: 0 auto;
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 40px;
}
.badge-item {
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--neutral-700);
}
.badge-label {
  font-weight: 600;
  font-size: 14px;
}
.stars {
  display: flex;
  gap: 2px;
  color: var(--brand-gold);
}
.badge-icon { flex-shrink: 0; }
.badge-icon--sage { color: var(--secondary-sage); }
.badge-icon--main { color: var(--brand-main); }
.badge-icon--salmon { color: var(--secondary-salmon); }

@media (max-width: 768px) {
  .inner { gap: 20px; }
  .badge-label { font-size: 13px; }
}
</style>
