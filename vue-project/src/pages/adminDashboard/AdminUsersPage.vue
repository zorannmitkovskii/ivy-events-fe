<template>
  <div>
    <UserDirectory
      :title="t('adminUsers.title')"
      :subtitle="t('adminUsers.subtitle')"
      :role-options="ROLE_OPTIONS"
      :protected-roles="PROTECTED_ROLES"
      :default-roles="DEFAULT_ROLES"
      show-packages
    >
      <template #header-actions>
        <button class="btn-create btn-create--outline" @click="openDiscount">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
          {{ t('adminUsers.discountSubscribe') }}
        </button>
      </template>
    </UserDirectory>

    <!-- Discount Subscribe Dialog -->
    <div v-if="discountDialogOpen" class="dialog-overlay" @click.self="closeDiscountDialog">
      <div class="dialog">
        <div class="dialog-header">
          <h3>{{ t('adminUsers.discountSubscribe') }}</h3>
          <button class="dialog-close" @click="closeDiscountDialog">&times;</button>
        </div>

        <div class="dialog-body">
          <div class="form-grid">
            <div class="form-group form-group--full">
              <label>{{ t('adminUsers.name') }} <span class="req">*</span></label>
              <input v-model="discountForm.name" type="text" :placeholder="t('adminUsers.fullName')" class="form-input" />
            </div>
            <div class="form-group form-group--full">
              <label>{{ t('userDirectory.email') }} <span class="req">*</span></label>
              <input v-model="discountForm.email" type="email" placeholder="user@example.com" class="form-input" />
            </div>
            <div class="form-group form-group--full">
              <label>{{ t('adminUsers.phone') }}</label>
              <input v-model="discountForm.phone" type="tel" placeholder="+389 70 000 000" class="form-input" />
            </div>
          </div>

          <p v-if="discountError" class="form-error">{{ discountError }}</p>
          <p v-if="discountSuccess" class="form-success">{{ t('adminUsers.subscribed') }}</p>
        </div>

        <div class="dialog-footer">
          <button class="btn-cancel" @click="closeDiscountDialog">{{ t('userDirectory.cancel') }}</button>
          <button class="btn-save" :disabled="discountSaving" @click="saveDiscount">
            {{ discountSaving ? t('adminUsers.subscribing') : t('adminUsers.subscribe') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
/**
 * The platform administrator's user table.
 *
 * <p>The table itself moved into {@code UserDirectory} in IVY-1203, when the
 * agency console needed the same screen against the same endpoints. What stays
 * here is what only the platform has: every role, commercial packages, and the
 * discount subscription that belongs to marketing rather than to user
 * administration.
 */
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import UserDirectory from '@/components/users/UserDirectory.vue'
import { subscribeToDiscounts } from '@/services/backendApi'

const ROLE_OPTIONS = ['ADMIN', 'ORGANIZER', 'USER']
const PROTECTED_ROLES = ['ADMIN']
const DEFAULT_ROLES = ['USER']

const { t } = useI18n()

const discountDialogOpen = ref(false)
const discountSaving = ref(false)
const discountError = ref('')
const discountSuccess = ref(false)

const defaultDiscountForm = () => ({ name: '', email: '', phone: '' })
const discountForm = ref(defaultDiscountForm())

function openDiscount() {
  discountForm.value = defaultDiscountForm()
  discountError.value = ''
  discountSuccess.value = false
  discountDialogOpen.value = true
}

function closeDiscountDialog() {
  discountDialogOpen.value = false
  discountError.value = ''
  discountSuccess.value = false
}

async function saveDiscount() {
  discountError.value = ''
  discountSuccess.value = false

  if (!discountForm.value.name.trim()) { discountError.value = t('adminUsers.nameRequired'); return }
  if (!discountForm.value.email.trim()) { discountError.value = t('userDirectory.emailRequired'); return }

  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRe.test(discountForm.value.email.trim())) { discountError.value = t('adminUsers.emailInvalid'); return }

  const payload = {
    name: discountForm.value.name.trim(),
    email: discountForm.value.email.trim(),
    phone: discountForm.value.phone.trim() || undefined
  }

  discountSaving.value = true
  try {
    await subscribeToDiscounts(payload)
    discountSuccess.value = true
    discountForm.value = defaultDiscountForm()
  } catch (e) {
    discountError.value = e?.response?.data?.message || e.message || t('adminUsers.subscribeFailed')
  } finally {
    discountSaving.value = false
  }
}
</script>

<style scoped>
.btn-create {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 10px 20px; border: none; border-radius: 10px;
  background: var(--brand-main); color: #fff;
  font-size: 14px; font-weight: 600; cursor: pointer;
  transition: background 0.2s;
}
.btn-create--outline {
  background: #fff; color: var(--brand-main);
  border: 1px solid var(--brand-main);
}
.btn-create--outline:hover { background: #f5f3ff; }

/* ---- Dialog ---- */
.dialog-overlay {
  position: fixed; inset: 0; z-index: 1000;
  background: rgba(0,0,0,0.4);
  display: flex; align-items: center; justify-content: center;
  padding: 24px;
}

.dialog {
  background: #fff; border-radius: 16px;
  width: 100%; max-width: 580px; max-height: 90vh;
  display: flex; flex-direction: column;
  box-shadow: 0 20px 60px rgba(0,0,0,0.15);
}

.dialog-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 20px 24px; border-bottom: 1px solid var(--line);
}
.dialog-header h3 { margin: 0; font-size: 18px; font-weight: 700; color: var(--ink); }
.dialog-close {
  background: none; border: none; font-size: 24px; color: var(--ink-4);
  cursor: pointer; line-height: 1; padding: 0;
}
.dialog-close:hover { color: var(--ink-2); }

.dialog-body { padding: 24px; overflow-y: auto; flex: 1; }

.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.form-group { display: flex; flex-direction: column; gap: 4px; }
.form-group--full { grid-column: 1 / -1; }
.form-group label { font-size: 13px; font-weight: 600; color: var(--ink-2); }
.req { color: #dc2626; }

.form-input {
  padding: 9px 12px; border: 1px solid var(--line); border-radius: 8px;
  font-size: 14px; background: #fff; outline: none;
  transition: border-color 0.2s;
}
.form-input:focus { border-color: var(--brand-main); }

.form-error {
  margin-top: 12px; padding: 8px 12px; background: #fef2f2;
  border: 1px solid #fecaca; border-radius: 8px;
  color: #dc2626; font-size: 13px; font-weight: 500;
}

.form-success {
  margin-top: 12px; padding: 8px 12px; background: #ecfdf5;
  border: 1px solid #a7f3d0; border-radius: 8px;
  color: #059669; font-size: 13px; font-weight: 500;
}

.dialog-footer {
  display: flex; justify-content: flex-end; gap: 10px;
  padding: 16px 24px; border-top: 1px solid var(--line);
}

.btn-cancel {
  padding: 9px 20px; border: 1px solid var(--line); border-radius: 8px;
  background: #fff; color: var(--ink-2); font-size: 14px; font-weight: 500;
  cursor: pointer; transition: all 0.15s;
}
.btn-cancel:hover { background: var(--sunken); }

.btn-save {
  padding: 9px 24px; border: none; border-radius: 8px;
  background: var(--brand-main); color: #fff;
  font-size: 14px; font-weight: 600; cursor: pointer;
  transition: background 0.2s;
}
.btn-save:hover:not(:disabled) { background: var(--brand-dark); }
.btn-save:disabled { opacity: 0.6; cursor: not-allowed; }

@media (max-width: 600px) {
  .form-grid { grid-template-columns: 1fr; }
}
</style>
