<template>
  <section class="owner-form" aria-labelledby="vendor-owner-title">
    <h2 id="vendor-owner-title">{{ t('vendorOwner.title') }}</h2>
    <p class="hint">{{ t('vendorOwner.hint') }}</p>

    <form @submit.prevent="submit">
      <label class="field">
        <span>{{ t('vendorOwner.vendor') }}</span>
        <select v-model="vendorId" required data-testid="owner-vendor">
          <option value="" disabled>{{ t('vendorOwner.pickVendor') }}</option>
          <option v-for="vendor in sortedVendors" :key="vendor.id" :value="vendor.id">{{ vendor.name }}</option>
        </select>
      </label>

      <label class="field">
        <span>{{ t('vendorOwner.email') }}</span>
        <input v-model.trim="email" type="email" required autocomplete="off" data-testid="owner-email" />
      </label>

      <div class="names">
        <label class="field">
          <span>{{ t('vendorOwner.firstName') }}</span>
          <input v-model.trim="firstName" type="text" autocomplete="off" />
        </label>
        <label class="field">
          <span>{{ t('vendorOwner.lastName') }}</span>
          <input v-model.trim="lastName" type="text" autocomplete="off" />
        </label>
      </div>

      <button class="btn" type="submit" :disabled="saving || !vendorId || !email">
        {{ saving ? t('vendorOwner.saving') : t('vendorOwner.submit') }}
      </button>
    </form>

    <p v-if="done" class="done" role="status" data-testid="owner-done">{{ done }}</p>
    <p v-if="error" class="error" role="alert" data-testid="owner-error">{{ error }}</p>
  </section>
</template>

<script setup>
/**
 * Giving a vendor the account that runs it.
 *
 * <p>The server could always do this (POST /admin/vendors/{id}/owner, ADMIN
 * only) but no screen called it, so a vendor could not get an account at all:
 * the vendor portal requires the VENDOR role and nothing else hands it out.
 * One vendor, one owner — a vendor that already has an account is refused, and
 * from then on its owner adds the staff.
 */
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { vendorApplicationService } from '@/services/vendorDirectory.service'

const props = defineProps({
  /** Preselects a vendor, e.g. from its row in the approval queue. */
  preselect: { type: String, default: '' },
})

const { t } = useI18n()

const vendors = ref([])
const vendorId = ref(props.preselect)
const email = ref('')
const firstName = ref('')
const lastName = ref('')
const saving = ref(false)
const done = ref('')
const error = ref('')

watch(() => props.preselect, (id) => { if (id) vendorId.value = id })

const sortedVendors = computed(() =>
  [...vendors.value].sort((a, b) => String(a.name || '').localeCompare(String(b.name || ''), 'mk')))

onMounted(async () => {
  try {
    const response = await vendorApplicationService.allVendors()
    vendors.value = response?.data ?? response ?? []
  } catch (e) {
    error.value = e?.detail || e?.message || t('vendorOwner.loadFailed')
  }
})

async function submit() {
  error.value = ''
  done.value = ''
  saving.value = true
  try {
    await vendorApplicationService.createOwner(vendorId.value, {
      email: email.value,
      firstName: firstName.value || null,
      lastName: lastName.value || null,
    })
    const vendor = vendors.value.find((v) => v.id === vendorId.value)
    done.value = t('vendorOwner.created', { email: email.value, vendor: vendor?.name || '' })
    email.value = ''
    firstName.value = ''
    lastName.value = ''
  } catch (e) {
    // 409 carries the server's own sentence ("already has an account…"),
    // which says more than anything this form could.
    error.value = e?.detail || e?.message || t('vendorOwner.failed')
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.owner-form {
  padding: 16px; border-radius: 10px; background: #fff; border: 1px solid #ece8e0;
  display: flex; flex-direction: column; gap: 10px;
}
.owner-form h2 { margin: 0; font-size: 17px; }
.hint { margin: 0; font-size: 13px; color: #6b6b6b; }
form { display: flex; flex-direction: column; gap: 10px; max-width: 520px; }
.names { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 10px; }
.field { display: flex; flex-direction: column; gap: 4px; font-size: 12.5px; }
.field input, .field select { padding: 8px 10px; border: 1px solid #ddd8cf; border-radius: 8px; font-size: 13.5px; background: #fff; }
.btn { align-self: flex-start; padding: 9px 16px; border: 0; border-radius: 8px; background: var(--brand); color: #fff; font-size: 14px; cursor: pointer; }
.btn:disabled { opacity: .55; cursor: not-allowed; }
.done { margin: 0; font-size: 13px; color: #1f6b3a; }
.error { margin: 0; font-size: 13px; color: #a3271f; }
</style>
