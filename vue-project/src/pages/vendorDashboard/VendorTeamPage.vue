<template>
  <div class="vendor-team">
    <PageHead :title="t('vendorWork.team.title')" :subtitle="t('vendorWork.team.subtitle')" />

    <div class="two-col">
      <section class="card">
        <div class="head">
          <div>
            <h3>{{ t('vendorWork.team.members') }}</h3>
            <p class="lede">{{ t('vendorWork.team.membersHint') }}</p>
          </div>
          <button v-if="isOwner" type="button" class="btn btn-primary btn-sm" @click="inviting = !inviting">
            + {{ t('vendorWork.team.invite') }}
          </button>
        </div>

        <form v-if="inviting" class="invite-form" @submit.prevent="invite">
          <label class="field"><span>{{ t('vendorWork.team.email') }} *</span><input v-model="draft.email" type="email" required /></label>
          <label class="field"><span>{{ t('vendorWork.team.firstName') }}</span><input v-model="draft.firstName" /></label>
          <label class="field"><span>{{ t('vendorWork.team.lastName') }}</span><input v-model="draft.lastName" /></label>
          <label class="field">
            <span>{{ t('vendorWork.team.role') }}</span>
            <select v-model="draft.role">
              <option v-for="role in ROLES" :key="role" :value="role">{{ t(`vendorWork.team.roles.${role}.name`) }} — {{ t(`vendorWork.team.roles.${role}.scope`) }}</option>
            </select>
          </label>
          <p class="note span2">{{ t('vendorWork.team.inviteNote') }}</p>
          <div class="span2 form-actions">
            <button type="button" class="btn btn-ghost btn-sm" @click="inviting = false">{{ t('vendorWork.team.cancel') }}</button>
            <button type="submit" class="btn btn-primary btn-sm" :disabled="busy">{{ t('vendorWork.team.send') }}</button>
          </div>
        </form>

        <p v-if="error" class="error" role="alert">{{ error }}</p>

        <ul v-if="members.length" class="lines">
          <li v-for="member in members" :key="member.id" class="line">
            <div class="person">
              <span class="av">{{ initials(fullName(member)) || '?' }}</span>
              <div>
                <b>{{ fullName(member) }}</b>
                <small>{{ member.email }}</small>
              </div>
            </div>
            <span class="row-end">
              <span class="pill slate">{{ member.role ? t(`vendorWork.team.roles.${member.role}.name`) : t('vendorWork.team.customRole') }}</span>
              <button v-if="isOwner" type="button" class="link-btn" @click="remove(member)">{{ t('vendorWork.team.remove') }}</button>
            </span>
          </li>
        </ul>
        <div v-else-if="!loading" class="empty-box">
          <b>{{ t('vendorWork.team.none') }}</b>
          <p>{{ t('vendorWork.team.noneHint') }}</p>
        </div>
      </section>

      <aside class="card">
        <h3>{{ t('vendorWork.team.byRole') }}</h3>
        <p class="lede">{{ t('vendorWork.team.byRoleHint') }}</p>
        <ul class="lines">
          <li class="line">
            <div><b>{{ t('vendorWork.team.roles.OWNER.name') }}</b><small>{{ t('vendorWork.team.roles.OWNER.scope') }}</small></div>
            <span class="pill green">{{ t('vendorWork.team.full') }}</span>
          </li>
          <li v-for="role in ROLES" :key="role" class="line">
            <div><b>{{ t(`vendorWork.team.roles.${role}.name`) }}</b><small>{{ t(`vendorWork.team.roles.${role}.scope`) }}</small></div>
            <span class="pill slate">{{ t(`vendorWork.team.roles.${role}.tag`) }}</span>
          </li>
        </ul>
        <RouterLink v-if="isOwner" class="text-link" :to="{ name: 'vendor.privileges' }">{{ t('vendorWork.team.finePermissions') }} →</RouterLink>
      </aside>
    </div>
  </div>
</template>

<script setup>
/**
 * The vendor's team (2026 vendor design, "Тим и дозволи").
 *
 * <p>Two named roles on top of the privilege system rather than beside it:
 * an editor looks after the profile and the portfolio, an assistant after
 * inquiries and the calendar. Each is a preset of privileges applied by the
 * server; the per-privilege screen stays one link away for anything finer.
 * Only the owner manages the team — the server says so too.
 */
import { computed, onMounted, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import PageHead from '@/components/dashboard/shell/PageHead.vue'
import { unwrap, vendorWorkspaceService } from '@/services/vendorWorkspace.service'
import { getErrorMessage } from '@/services/apiError'
import { getUserId, hasRole } from '@/services/auth.service'
import { initials } from '@/utils/agencyFormat.js'

const ROLES = ['EDITOR', 'ASSISTANT']

const { t } = useI18n()

const isOwner = computed(() => hasRole('VENDOR'))
const members = ref([])
const loading = ref(true)
const busy = ref(false)
const inviting = ref(false)
const error = ref('')
const draft = reactive({ email: '', firstName: '', lastName: '', role: 'ASSISTANT' })

const fullName = (member) => [member.firstName, member.lastName].filter(Boolean).join(' ') || member.email

async function load() {
  loading.value = true
  try {
    // The owner is listed by the role query too; removing yourself from here
    // would lock the business out, so the list is everybody else.
    members.value = (unwrap(await vendorWorkspaceService.team()) ?? []).filter((member) => member.id !== getUserId())
  } catch (failure) {
    error.value = getErrorMessage(failure)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  if (isOwner.value) load()
  else loading.value = false
})

async function invite() {
  busy.value = true
  error.value = ''
  try {
    await vendorWorkspaceService.invite({ ...draft })
    Object.assign(draft, { email: '', firstName: '', lastName: '', role: 'ASSISTANT' })
    inviting.value = false
    await load()
  } catch (failure) {
    error.value = getErrorMessage(failure)
  } finally {
    busy.value = false
  }
}

async function remove(member) {
  error.value = ''
  try {
    await vendorWorkspaceService.removeMember(member.id)
    members.value = members.value.filter((candidate) => candidate.id !== member.id)
  } catch (failure) {
    error.value = getErrorMessage(failure)
  }
}
</script>

<style scoped src="../../components/agency/agency-panels.css"></style>

<style scoped>
.two-col {
  display: grid;
  grid-template-columns: minmax(0, 1.25fr) minmax(300px, 0.85fr);
  gap: 16px;
  align-items: start;
}

.head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
}

.card h3 {
  margin: 0 0 4px;
  font-size: 19px;
}

.invite-form {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin: 12px 0;
  padding: 14px;
  border: 1px solid var(--line);
  border-radius: 10px;
  background: var(--mist-2);
}

.span2 {
  grid-column: 1 / -1;
}

.field > span {
  display: block;
  margin-bottom: 5px;
  color: var(--ink-3);
  font-size: 12.5px;
  font-weight: 600;
}

.field input,
.field select {
  width: 100%;
  min-height: 38px;
  padding: 8px 10px;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: var(--card);
  font: inherit;
  font-size: 14px;
}

.note {
  margin: 0;
  color: var(--ink-3);
  font-size: 12.5px;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.row-end {
  display: flex;
  align-items: center;
  gap: 10px;
}

.link-btn {
  border: 0;
  background: none;
  color: var(--rose-ink);
  font-size: 13px;
}

.empty-box {
  margin-top: 12px;
  padding: 26px;
  border: 1px dashed var(--line);
  border-radius: 10px;
  text-align: center;
  color: var(--ink-3);
}

.empty-box b {
  color: var(--ivy);
}

.text-link {
  display: inline-block;
  margin-top: 10px;
}

.error {
  color: var(--rose-ink);
}

@media (max-width: 1000px) {
  .two-col,
  .invite-form {
    grid-template-columns: 1fr;
  }
}
</style>
