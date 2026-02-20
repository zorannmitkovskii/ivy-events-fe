<template>
  <form class="space-y-6" @submit.prevent="submit">
    <BaseField :label="t('invitation.fullName')" required>
      <GuestFullNameList v-model="local.fullNames" />
    </BaseField>

    <BaseField :label="t('invitation.howToContact')">
      <BaseRadioGroup
        v-model="local.notificationType"
        name="notificationType"
        :options="[
          { value: 'email', label: t('invitation.email') },
          { value: 'sms', label: t('invitation.sms') }
        ]"
      />
    </BaseField>

    <BaseField v-if="local.notificationType === 'email'" :label="t('invitation.emailAddress')">
      <BaseInput v-model="local.email" type="email" placeholder="you@example.com" autocomplete="email" />
    </BaseField>

    <BaseField v-if="local.notificationType === 'sms'" :label="t('invitation.phoneNumber')">
      <BaseInput v-model="local.phone" type="tel" placeholder="+1 (555) 123-4567" autocomplete="tel" />
    </BaseField>

    <BaseField :label="t('invitation.willYouAttend')" required>
      <BaseRadioGroup
        v-model="local.attendance"
        name="attendance"
        :options="[
          { value: 'yes', label: t('invitation.joyfullyAccept') },
          { value: 'no', label: t('invitation.regretfullyDecline') }
        ]"
      />
    </BaseField>

    <BaseField :label="t('invitation.dietaryPreference')">
      <select
        v-model="local.dietary"
        class="w-full px-4 py-3 border border-gray-300 rounded-small focus:outline-none focus:ring-2 focus:ring-pink-300 font-body appearance-none bg-white"
      >
        <option value="" disabled>{{ t('invitation.selectDietary') }}</option>
        <option value="no_restrictions">{{ t('invitation.noRestrictions') }}</option>
        <option value="vegetarian">{{ t('invitation.vegetarian') }}</option>
        <option value="vegan">{{ t('invitation.vegan') }}</option>
        <option value="chicken">{{ t('invitation.chicken') }}</option>
        <option value="fish">{{ t('invitation.fish') }}</option>
        <option value="gluten_free">{{ t('invitation.glutenFree') }}</option>
        <option value="other">{{ t('invitation.otherDietary') }}</option>
      </select>
    </BaseField>

    <BaseField :label="t('invitation.specialMessage')">
      <BaseTextarea v-model="local.message" rows="4" placeholder="Share your well wishes..." />
    </BaseField>

    <PrimaryButton type="submit" className="w-full">
      {{ t('invitation.submitRsvp') }}
    </PrimaryButton>
  </form>
</template>

<script setup>
import { computed } from "vue";
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
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
