<template>
  <!-- The same block closes all four models; only the model's colours differ. -->
  <section :id="id" class="contact">
    <div class="section-inner contact-grid">
      <div>
        <span class="eyebrow">{{ eyebrow }}</span>
        <h2 :class="{ 'contact-title': large }">{{ title }}</h2>
        <p v-if="text">{{ text }}</p>
        <p v-if="place || email" class="contact-lines">
          <template v-if="place"><strong>{{ t('vendorMicrosite.common.workingIn') }}:</strong> {{ place }}<br></template>
          <template v-if="email"><strong>{{ t('vendorMicrosite.common.email') }}:</strong>
            <a :href="`mailto:${email}`">{{ email }}</a></template>
        </p>
      </div>
      <div class="ms-form">
        <PublicInquiryForm v-if="slug" :slug="slug" :disabled="formDisabled" />
      </div>
    </div>
  </section>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
import PublicInquiryForm from '@/components/vendor/PublicInquiryForm.vue'

defineProps({
  id: { type: String, required: true },
  eyebrow: { type: String, default: '' },
  title: { type: String, default: '' },
  text: { type: String, default: '' },
  place: { type: String, default: '' },
  email: { type: String, default: '' },
  /** Without a slug there is nowhere to send to, so no form is drawn. */
  slug: { type: String, default: '' },
  formDisabled: { type: Boolean, default: false },
  /** The classic model sets its contact heading larger than its other headings. */
  large: { type: Boolean, default: false },
})

const { t } = useI18n()
</script>
