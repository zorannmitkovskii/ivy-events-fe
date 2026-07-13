<script setup>
import { toRef } from 'vue';
import { useJsonLd } from '@/composables/useJsonLd';

const props = defineProps({
  schema: { type: [Object, Array], default: null },
  id: { type: String, default: undefined },
});

useJsonLd(toRef(props, 'schema'), { id: props.id });
</script>

<template>
  <!-- No visible output — schemas are injected into <head>. -->
</template>
