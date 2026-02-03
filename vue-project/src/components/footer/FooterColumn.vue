<template>
  <div class="footer-col">
    <h4 class="footer-col__title">{{ titleKey ? $t(titleKey) : title }}</h4>
    <ul class="footer-col__list">
      <FooterLink
        v-for="(l, i) in links"
        :key="i"
        :label="l.label"
        :labelKey="l.labelKey"
        :to="l.to"
        :href="l.href"
      />
    </ul>
  </div>
</template>

<script setup>
import FooterLink from "./FooterLink.vue";

defineProps({
  title: { type: String, default: "" },
  titleKey: { type: String, default: "" },
  links: { type: Array, required: true } // [{label|labelKey,to} or {label|labelKey,href}]
});
</script>

<style scoped>
.footer-col__title {
  color: var(--bg-white);
  font-weight: 700;
  font-size: 14px;
  margin: 0 0 12px;
}

.footer-col__list {
  list-style: none;
  padding: 0;
  margin: 0;
}
</style>
