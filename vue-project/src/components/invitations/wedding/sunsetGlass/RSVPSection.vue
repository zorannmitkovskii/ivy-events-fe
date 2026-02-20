<template>
  <section id="rsvp" class="py-16 lg:py-20 px-6 gradient-bg max-h-[900px] overflow-auto">
    <div class="max-w-2xl mx-auto">
      <h2 class="font-heading text-4xl lg:text-5xl text-center text-gray-800 mb-4">{{ t('invitation.rsvp') }}</h2>
      <p class="font-body text-center text-gray-600 mb-12">
        {{ t('invitation.rsvpSubtitle', { date: respondByLabel }) }}
      </p>

      <div class="bg-white rounded-large shadow-custom p-8 lg:p-12">
        <RSVPForm v-model="form" @submit="$emit('submit', $event)" />
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, watchEffect } from "vue";
import { useI18n } from 'vue-i18n';
import RSVPForm from "@/components/invitations/wedding/sunsetGlass/RSVPForm.vue";

const { t } = useI18n();

const props = defineProps({
  respondByLabel: { type: String, default: "May 1, 2024" },
  modelValue: { type: Object, default: () => ({}) },
});

const emit = defineEmits(["submit", "update:modelValue"]);

const form = ref({
  fullNames: [""],
  notificationType: "",
  email: "",
  phone: "",
  attendance: "",
  dietary: "",
  message: "",
  ...props.modelValue,
});

watchEffect(() => emit("update:modelValue", form.value));
</script>
