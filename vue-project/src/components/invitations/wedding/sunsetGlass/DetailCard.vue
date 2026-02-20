<template>
  <div class="rounded-large shadow-custom p-6 text-center" :class="bgClass">
    <div class="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" :class="iconBgClass">
      <slot name="icon" />
    </div>
    <h3 class="font-heading text-2xl text-gray-800 mb-2">{{ title }}</h3>
    <p class="font-body text-gray-600 mb-4" v-html="bodyHtml"></p>
    <a
      v-if="mapUrl"
      :href="mapUrl"
      target="_blank"
      class="inline-block text-white font-body text-sm px-6 py-2 rounded-small transition-all duration-300"
      :class="buttonClass"
    >
      {{ t('invitation.viewMap') }}
    </a>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

defineProps({
  title: { type: String, required: true },
  bodyHtml: { type: String, default: "" },
  mapUrl: { type: String, default: "" },
  bgClass: { type: String, default: "bg-pink-50" },
  iconBgClass: { type: String, default: "bg-pink-200" },
  buttonClass: { type: String, default: "bg-pink-300 hover:bg-pink-400" },
});
</script>
