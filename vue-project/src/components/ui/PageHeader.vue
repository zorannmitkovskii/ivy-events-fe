<template>
  <header class="page-header">
    <div class="page-header__text">
      <nav v-if="crumbs.length" class="page-header__crumbs" aria-label="breadcrumb">
        <template v-for="(crumb, i) in crumbs" :key="crumb.label">
          <RouterLink v-if="crumb.to" :to="crumb.to">{{ crumb.label }}</RouterLink>
          <span v-else>{{ crumb.label }}</span>
          <span v-if="i < crumbs.length - 1" class="sep" aria-hidden="true">›</span>
        </template>
      </nav>

      <h1>{{ title }}</h1>
      <p v-if="subtitle" class="page-header__sub">{{ subtitle }}</p>
    </div>

    <div v-if="stamp || $slots.actions" class="page-header__actions">
      <span v-if="stamp" class="page-header__stamp">{{ stamp }}</span>
      <slot name="actions" />
    </div>
  </header>
</template>

<script setup>
/**
 * PageHeader — title, subtitle, breadcrumbs and actions.
 *
 * Every screen was rebuilding this, so no two agreed on where the primary
 * action sat or how large the title was. One component, one answer.
 */
defineProps({
  title: { type: String, required: true },
  subtitle: { type: String, default: '' },
  /** Right-aligned, quiet: "освежено 14:32", "12 од 240". */
  stamp: { type: String, default: '' },
  /** [{ label, to? }] — the last entry is the current page and needs no `to`. */
  crumbs: { type: Array, default: () => [] },
})
</script>

<style scoped>
.page-header {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  flex-wrap: wrap;
  margin: 0 0 18px;
}

.page-header__crumbs {
  font-size: 12px;
  color: var(--ink-3);
  margin: 0 0 6px;
  display: flex;
  gap: 6px;
  align-items: center;
}
.page-header__crumbs a { color: var(--ink-3); text-decoration: none; }
.page-header__crumbs a:hover { color: var(--ink); }
.page-header__crumbs .sep { opacity: 0.6; }

.page-header h1 {
  font-family: var(--font-family);
  font-weight: 600;
  font-size: 27px;
  letter-spacing: -0.01em;
  margin: 0;
  text-wrap: balance;
  color: var(--ink);
}

.page-header__sub {
  font-family: var(--font-ui);
  color: var(--ink-2);
  font-size: 13.5px;
  margin: 3px 0 0;
  max-width: 70ch;
}

.page-header__actions {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 9px;
  flex-wrap: wrap;
}

.page-header__stamp {
  font-family: var(--font-ui);
  font-size: 12px;
  color: var(--ink-3);
}

@media (max-width: 720px) {
  .page-header__actions { margin-left: 0; width: 100%; }
}
</style>
