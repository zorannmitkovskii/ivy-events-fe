<template>
  <section class="privileges">
    <PageHead :title="t('privileges.title')" :subtitle="t('privileges.subtitle')" />

    <p v-if="!isOwner" class="notice notice--refused">{{ t('privileges.ownersOnly') }}</p>

    <template v-else>
      <!-- The agency's rules first (2026 agency design), then the per-member
           editor. A vendor workspace has no such model to state. -->
      <template v-if="workspaceType === 'AGENCY'">
        <AgencyAccessModel />
        <h2 class="editor-title">{{ t('agencyScreens.permissions.editorTitle') }}</h2>
      </template>

      <p v-if="loading" class="notice">{{ t('privileges.loading') }}</p>
      <p v-else-if="error" class="notice notice--refused" role="alert">{{ error }}</p>

      <p v-else-if="!members.length" class="notice">{{ t('privileges.noMembers') }}</p>

      <div v-else class="members">
        <article v-for="member in members" :key="member.userId" class="member">
          <header class="member__head">
            <h3 class="member__id">{{ member.userId }}</h3>
            <span class="member__count">
              {{ t('privileges.heldCount', { held: member.privileges.length, all: catalogue.length }) }}
            </span>
          </header>

          <ul class="grid">
            <li v-for="privilege in catalogue" :key="privilege">
              <label class="check">
                <input
                  type="checkbox"
                  :checked="member.privileges.includes(privilege)"
                  :disabled="savingId === member.userId"
                  @change="toggle(member, privilege, $event.target.checked)"
                />
                <span>{{ label(privilege) }}</span>
              </label>
            </li>
          </ul>

          <footer class="member__foot">
            <button
              type="button"
              class="btn btn--primary"
              :disabled="savingId === member.userId || !isDirty(member)"
              @click="save(member)"
            >
              {{ savingId === member.userId ? t('privileges.saving') : t('privileges.save') }}
            </button>
            <button
              type="button"
              class="btn"
              :disabled="savingId === member.userId"
              @click="remove(member)"
            >
              {{ t('privileges.remove') }}
            </button>
          </footer>
        </article>
      </div>

      <!--
        Said once rather than as a disabled row against every owner: an owner
        has no record here at all, which is the point — there is nothing to
        untick and so no way to lock the business out of this screen.
      -->
      <p class="notice notice--rule">{{ t('privileges.ownerNote') }}</p>
    </template>
  </section>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import PageHead from '@/components/dashboard/shell/PageHead.vue'
import AgencyAccessModel from '@/components/agency/AgencyAccessModel.vue'
import { privilegesService } from '@/services/privileges.service'
import { usePrivileges } from '@/composables/usePrivileges'

const props = defineProps({
  /** AGENCY or VENDOR. The platform console manages its own elsewhere. */
  workspaceType: { type: String, required: true },
})

const { t, te } = useI18n()
const { ownerOf, load: loadPrivileges } = usePrivileges()

const catalogue = ref([])
const members = ref([])
const original = ref(new Map())
const loading = ref(true)
const error = ref('')
const savingId = ref(null)

const isOwner = computed(() => ownerOf(props.workspaceType))

onMounted(async () => {
  await loadPrivileges()
  if (!isOwner.value) {
    loading.value = false
    return
  }
  await refresh()
})

async function refresh() {
  loading.value = true
  error.value = ''
  try {
    const [cat, mem] = await Promise.all([
      privilegesService.catalogue(props.workspaceType),
      privilegesService.members(props.workspaceType),
    ])
    catalogue.value = unwrap(cat)
    members.value = unwrap(mem).map((m) => ({ ...m, privileges: [...(m.privileges || [])] }))
    // Kept so the save button can tell a real edit from a click and a click back.
    original.value = new Map(members.value.map((m) => [m.userId, [...m.privileges].sort().join(',')]))
  } catch (e) {
    error.value = messageOf(e)
  } finally {
    loading.value = false
  }
}

function toggle(member, privilege, checked) {
  member.privileges = checked
    ? [...member.privileges, privilege]
    : member.privileges.filter((p) => p !== privilege)
}

function isDirty(member) {
  return [...member.privileges].sort().join(',') !== (original.value.get(member.userId) ?? '')
}

async function save(member) {
  savingId.value = member.userId
  error.value = ''
  try {
    await privilegesService.replace(props.workspaceType, member.userId, member.privileges)
    original.value.set(member.userId, [...member.privileges].sort().join(','))
  } catch (e) {
    // The row keeps what the person ticked; the message says why it did not
    // stick. Reverting it silently would look like the click never happened.
    error.value = messageOf(e)
  } finally {
    savingId.value = null
  }
}

async function remove(member) {
  savingId.value = member.userId
  error.value = ''
  try {
    await privilegesService.removeMember(props.workspaceType, member.userId)
    members.value = members.value.filter((m) => m.userId !== member.userId)
  } catch (e) {
    error.value = messageOf(e)
  } finally {
    savingId.value = null
  }
}

/** `vendor:inquiries` reads as a label if one exists, and as itself if not. */
function label(privilege) {
  const key = `privileges.names.${privilege}`
  return te(key) ? t(key) : privilege
}

function unwrap(response) {
  return response?.data?.data ?? response?.data ?? []
}

function messageOf(e) {
  return e?.response?.data?.error?.message || e?.message || t('privileges.failed')
}
</script>

<style scoped>
.editor-title {
  margin: 0 0 12px;
  font-size: 22px;
}

.privileges { display: flex; flex-direction: column; gap: 16px; }

.notice {
  margin: 0;
  padding: 12px 14px;
  border-radius: 10px;
  background: var(--surface-2, #eef0eb);
  color: var(--ink-2, #4a544e);
  font-size: 14px;
}
.notice--refused { background: #fff3eb; color: #8a4530; }
.notice--rule { border-left: 3px solid var(--brand, #1f3d2b); }

.members { display: flex; flex-direction: column; gap: 14px; }

.member {
  border: 1px solid var(--line, #dce3dc);
  border-radius: 14px;
  padding: 16px;
  background: var(--surface, #fff);
}
.member__head { display: flex; justify-content: space-between; align-items: baseline; gap: 12px; }
.member__id { margin: 0; font-size: 15px; word-break: break-all; }
.member__count { font-size: 13px; color: var(--ink-2, #6b7670); white-space: nowrap; }

.grid {
  list-style: none;
  margin: 12px 0 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
  gap: 6px 14px;
}
.check { display: flex; align-items: center; gap: 8px; font-size: 14px; cursor: pointer; }

.member__foot { display: flex; gap: 8px; margin-top: 14px; }
.btn {
  padding: 8px 14px;
  border-radius: 9px;
  border: 1px solid var(--line, #dce3dc);
  background: transparent;
  cursor: pointer;
  font-size: 14px;
}
.btn--primary { background: var(--brand, #1f3d2b); color: #fff; border-color: transparent; }
.btn:disabled { opacity: .55; cursor: default; }

@media (max-width: 560px) {
  .member__head { flex-direction: column; align-items: flex-start; gap: 4px; }
  .member__foot { flex-direction: column; }
}
</style>
