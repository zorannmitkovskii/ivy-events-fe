<template>
  <div class="flex justify-center gap-6 flex-wrap">
    <div class="text-center">
      <div class="font-heading text-4xl lg:text-5xl text-pink-400 mb-2">{{ t.days }}</div>
      <div class="font-body text-sm text-gray-600">Days</div>
    </div>
    <div class="text-center">
      <div class="font-heading text-4xl lg:text-5xl text-purple-300 mb-2">{{ t.hours }}</div>
      <div class="font-body text-sm text-gray-600">Hours</div>
    </div>
    <div class="text-center">
      <div class="font-heading text-4xl lg:text-5xl text-teal-300 mb-2">{{ t.minutes }}</div>
      <div class="font-body text-sm text-gray-600">Minutes</div>
    </div>
    <div class="text-center">
      <div class="font-heading text-4xl lg:text-5xl text-pink-300 mb-2">{{ t.seconds }}</div>
      <div class="font-body text-sm text-gray-600">Seconds</div>
    </div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from "vue";

const props = defineProps({
  targetIso: { type: String, required: true }, // e.g. "2026-06-15T16:00:00"
});

const now = ref(Date.now());
let timer;

onMounted(() => {
  timer = setInterval(() => (now.value = Date.now()), 1000);
});
onBeforeUnmount(() => clearInterval(timer));

const t = computed(() => {
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
