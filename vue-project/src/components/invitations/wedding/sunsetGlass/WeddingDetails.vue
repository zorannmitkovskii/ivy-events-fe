<template>
  <section class="py-16 lg:py-20 px-6 bg-white">
    <div class="max-w-6xl mx-auto">
      <h2 class="font-heading text-4xl lg:text-5xl text-center text-gray-800 mb-12">{{ t('invitation.weddingDetails') }}</h2>

      <div class="rounded-large shadow-custom p-8 mb-12 text-center gradient-bg glass-panel">
        <p class="font-body text-lg text-gray-700 mb-4">{{ t('invitation.countdownToSpecialDay') }}</p>
        <CountdownTimer :target-iso="countdownTargetIso" />
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <DetailCard
          :title="t('invitation.ceremony')"
          :body-html="ceremonyHtml"
          :map-url="ceremonyMapUrl"
          bg-class="bg-pink-50"
          icon-bg-class="bg-pink-200"
          button-class="bg-pink-300 hover:bg-pink-400"
        >
          <template #icon>
            <svg class="w-8 h-8 text-pink-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </template>
        </DetailCard>

        <DetailCard
          :title="t('invitation.reception')"
          :body-html="receptionHtml"
          :map-url="receptionMapUrl"
          bg-class="bg-purple-50"
          icon-bg-class="bg-purple-200"
          button-class="bg-purple-300 hover:bg-purple-400"
        >
          <template #icon>
            <svg class="w-8 h-8 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </template>
        </DetailCard>

        <DetailCard
          :title="t('invitation.venue')"
          :body-html="venueHtml"
          :map-url="venueMapUrl"
          bg-class="bg-teal-50"
          icon-bg-class="bg-teal-200"
          button-class="bg-teal-300 hover:bg-teal-400"
        >
          <template #icon>
            <svg class="w-8 h-8 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </template>
        </DetailCard>
      </div>
    </div>
  </section>
</template>

<script setup>
import { useI18n } from 'vue-i18n';
import DetailCard from "@/components/invitations/wedding/sunsetGlass/DetailCard.vue";
import CountdownTimer from "@/components/invitations/wedding/sunsetGlass/CountdownTimer.vue";

const { t } = useI18n();

defineProps({
  countdownTargetIso: { type: String, required: true },

  ceremonyHtml: { type: String, default: "" },
  ceremonyMapUrl: { type: String, default: "" },

  receptionHtml: { type: String, default: "" },
  receptionMapUrl: { type: String, default: "" },

  venueHtml: { type: String, default: "" },
  venueMapUrl: { type: String, default: "" },
});
</script>
