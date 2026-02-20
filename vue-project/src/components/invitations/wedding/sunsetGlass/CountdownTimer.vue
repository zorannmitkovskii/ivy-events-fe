<template>
  <div class="flex justify-center gap-6 flex-wrap">
    <div class="text-center">
      <div class="font-heading text-4xl lg:text-5xl text-pink-400 mb-2">{{ countdown.days }}</div>
      <div class="font-body text-sm text-gray-600">{{ t('invitation.days') }}</div>
    </div>
    <div class="text-center">
      <div class="font-heading text-4xl lg:text-5xl text-purple-300 mb-2">{{ countdown.hours }}</div>
      <div class="font-body text-sm text-gray-600">{{ t('invitation.hours') }}</div>
    </div>
    <div class="text-center">
      <div class="font-heading text-4xl lg:text-5xl text-teal-300 mb-2">{{ countdown.minutes }}</div>
      <div class="font-body text-sm text-gray-600">{{ t('invitation.minutes') }}</div>
    </div>
    <div class="text-center">
      <div class="font-heading text-4xl lg:text-5xl text-pink-300 mb-2">{{ countdown.seconds }}</div>
      <div class="font-body text-sm text-gray-600">{{ t('invitation.seconds') }}</div>
    </div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const props = defineProps({
  targetIso: { type: String, required: true }, // e.g. "2026-06-15T16:00:00"
});

const now = ref(Date.now());
let timer;

onMounted(() => {
  timer = setInterval(() => (now.value = Date.now()), 1000);
});
onBeforeUnmount(() => clearInterval(timer));

const countdown = computed(() => {
  const target = new Date(props.targetIso).getTime();
  const diff = Math.max(0, target - now.value);

  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / (3600 * 24));
  const hours = Math.floor((totalSeconds % (3600 * 24)) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return { days, hours, minutes, seconds };
});
</script>
