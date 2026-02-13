<template>
  <form class="space-y-6" @submit.prevent="submit">
    <BaseField label="Guests (Full name)" required hint="Use + to add more names.">
      <GuestFullNameList v-model="local.fullNames" />
    </BaseField>

    <BaseField label="How should we contact you?">
      <BaseRadioGroup
        v-model="local.notificationType"
        name="notificationType"
        :options="[
          { value: 'email', label: 'Email' },
          { value: 'sms', label: 'SMS' }
        ]"
      />
    </BaseField>

    <BaseField v-if="local.notificationType === 'email'" label="Email Address">
      <BaseInput v-model="local.email" type="email" placeholder="you@example.com" autocomplete="email" />
    </BaseField>

    <BaseField v-if="local.notificationType === 'sms'" label="Phone Number">
      <BaseInput v-model="local.phone" type="tel" placeholder="+1 (555) 123-4567" autocomplete="tel" />
    </BaseField>

    <BaseField label="Will you be attending?" required>
      <BaseRadioGroup
        v-model="local.attendance"
        name="attendance"
        :options="[
          { value: 'yes', label: 'Joyfully Accept' },
          { value: 'no', label: 'Regretfully Decline' }
        ]"
      />
    </BaseField>

    <BaseField label="Dietary Preference">
      <select
        v-model="local.dietary"
        class="w-full px-4 py-3 border border-gray-300 rounded-small focus:outline-none focus:ring-2 focus:ring-pink-300 font-body appearance-none bg-white"
      >
        <option value="" disabled>Select dietary preference</option>
        <option value="no_restrictions">No Restrictions</option>
        <option value="vegetarian">Vegetarian</option>
        <option value="vegan">Vegan</option>
        <option value="chicken">Chicken</option>
        <option value="fish">Fish</option>
        <option value="gluten_free">Gluten-Free</option>
        <option value="other">Other</option>
      </select>
    </BaseField>

    <BaseField label="Special Message (Optional)">
      <BaseTextarea v-model="local.message" rows="4" placeholder="Share your well wishes..." />
    </BaseField>

    <PrimaryButton type="submit" className="w-full">
      Submit RSVP
    </PrimaryButton>
  </form>
</template>

<script setup>
import { computed } from "vue";
import PrimaryButton from "@/components/invitations/wedding/sunsetGlass/PrimaryButton.vue";
import BaseTextarea from "@/components/invitations/wedding/forms/BaseTextarea.vue";
import BaseField from "@/components/invitations/wedding/forms/BaseField.vue";
import BaseRadioGroup from "@/components/invitations/wedding/forms/BaseRadioGroup.vue";
import BaseInput from "@/components/invitations/wedding/forms/BaseInput.vue";
import GuestFullNameList from "@/components/invitations/wedding/sunsetGlass/GuestFullNameList.vue";

const props = defineProps({
  modelValue: {
    type: Object,
    default: () => ({
      fullNames: [""],
      notificationType: "",
      email: "",
      phone: "",
      attendance: "",
      dietary: "",
      message: "",
    }),
  },
});

const emit = defineEmits(["update:modelValue", "submit"]);

const local = computed({
  get: () => props.modelValue,
  set: (v) => emit("update:modelValue", v),
});

function submit() {
  const cleaned = {
    ...local.value,
    fullNames: (local.value.fullNames || []).map(s => (s ?? "").trim()).filter(Boolean),
    email: local.value.notificationType === 'email' ? (local.value.email || '').trim() : '',
    phone: local.value.notificationType === 'sms' ? (local.value.phone || '').trim() : '',
  };

  // Keep at least one row visible after cleaning
  if (!cleaned.fullNames.length) cleaned.fullNames = [""];

  emit("update:modelValue", cleaned);
  emit("submit", cleaned);
}
</script>
