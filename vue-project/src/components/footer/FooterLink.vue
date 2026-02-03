<template>
  <li class="footer-link">
    <component
      :is="isExternal ? 'a' : RouterLink"
      :href="isExternal ? href : undefined"
      :to="!isExternal ? to : undefined"
      :target="isExternal ? '_blank' : undefined"
      :rel="isExternal ? 'noopener noreferrer' : undefined"
      class="footer-link__a"
    >
      <slot>{{ labelKey ? $t(labelKey) : label }}</slot>
    </component>
  </li>
</template>

<script setup>
import { computed } from "vue";
import { RouterLink } from "vue-router";

const props = defineProps({
  label: { type: String, default: "" },
  labelKey: { type: String, default: "" },
  to: { type: [String, Object], default: null },   // internal
  href: { type: String, default: "" }              // external
});

const isExternal = computed(() => !!props.href);
</script>

<style scoped>
.footer-link__a {
  color: rgba(255, 255, 255, 0.78);
  text-decoration: none;
  font-size: 14px;
  line-height: 1.9;
  transition: color 0.18s ease, transform 0.18s ease;
}

.footer-link__a:hover {
  color: var(--bg-white);
}
</style>
