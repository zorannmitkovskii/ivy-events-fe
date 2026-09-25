<template>
  <div>
    <PageHead :title="t('adminTags.title')" :subtitle="t('adminTags.subtitle')" />

    <form class="toolbar tag-filters" role="search" @submit.prevent>
      <input
        v-model="query"
        class="search"
        type="search"
        :placeholder="t('adminTags.search')"
        :aria-label="t('adminTags.search')"
      />
      <label class="only-missing">
        <input v-model="onlyMissing" type="checkbox" />
        {{ t('adminTags.onlyMissing') }}
      </label>
      <span class="spacer" />
      <span class="muted small">{{ t('adminTags.count', { n: shown.length }) }}</span>
    </form>

    <form class="card new-tag" data-testid="new-tag" @submit.prevent="create">
      <strong class="new-tag-title">{{ t('tags.admin.newTitle') }}</strong>
      <input
        v-for="code in LOCALES"
        :key="code"
        v-model="newNames[code]"
        type="text"
        :maxlength="MAX_NAME_LENGTH"
        :placeholder="t(`adminBlog.locales.${code}`)"
        :aria-label="t('tags.admin.newName', { language: t(`adminBlog.locales.${code}`) })"
      />
      <button type="submit" class="btn btn-primary btn-sm" :disabled="!newNames.mk.trim() || creating">
        {{ t('tags.admin.create') }}
      </button>
    </form>

    <p v-if="notice" class="notice" role="status">{{ notice }}</p>
    <p v-if="error" class="action-error" role="alert">{{ error }}</p>

    <p v-if="loading" class="empty">{{ t('adminTags.loading') }}</p>

    <p v-else-if="loadError" class="empty" role="alert">{{ loadError }}</p>

    <div v-else-if="shown.length" class="card tbl-card">
      <table class="tbl">
        <thead>
          <tr>
            <th>{{ t('adminTags.columns.tag') }}</th>
            <th v-for="code in LOCALES" :key="code">{{ t(`adminBlog.locales.${code}`) }}</th>
            <th>{{ t('adminTags.columns.posts') }}</th>
            <th>{{ t('tags.admin.vendors') }}</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="tag in shown" :key="tag.id" :data-slug="tag.slug">
            <td class="slug">#{{ tag.slug }}</td>
            <td v-for="code in LOCALES" :key="code">
              <input
                v-model="drafts[tag.id][code]"
                type="text"
                :maxlength="MAX_NAME_LENGTH"
                :class="{ missing: !drafts[tag.id][code].trim() }"
                :placeholder="t('adminTags.missing')"
                :aria-label="t('adminTags.nameLabel', { language: t(`adminBlog.locales.${code}`), tag: tag.slug })"
                @keydown.enter.prevent="save(tag)"
              />
            </td>
            <td class="count">
              <RouterLink v-if="tag.postCount" :to="{ name: 'admin.blog', params: { lang }, query: { tag: tag.slug } }">
                {{ t('adminTags.postCount', { n: tag.postCount }) }}
              </RouterLink>
              <span v-else class="muted">0</span>
            </td>
            <td class="count vendors">{{ tag.vendorCount || 0 }}</td>
            <td class="actions">
              <button
                type="button"
                class="btn btn-primary btn-sm"
                :disabled="!isDirty(tag) || busy === tag.id"
                @click="save(tag)"
              >{{ t('adminTags.save') }}</button>
              <template v-if="confirming === tag.id">
                <button type="button" class="btn btn-sm danger" :disabled="busy === tag.id" @click="remove(tag)">
                  {{ tag.postCount ? t('adminTags.confirmRemove', { n: tag.postCount }) : t('adminTags.confirmRemoveUnused') }}
                </button>
                <button type="button" class="btn btn-ghost btn-sm" @click="confirming = ''">{{ t('adminTags.cancel') }}</button>
              </template>
              <button v-else type="button" class="btn btn-ghost btn-sm" @click="confirming = tag.id">
                {{ t('adminTags.remove') }}
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <p v-else class="empty">{{ tags.length ? t('adminTags.empty') : t('adminTags.emptyAll') }}</p>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import PageHead from '@/components/dashboard/shell/PageHead.vue'
import { contentService } from '@/services/content.service'
import { getErrorMessage } from '@/services/apiError'

/*
  The blog's tags (IVY-909): each one's name in every language, how many posts
  carry it, and deleting it from all of them at once.

  A tag is created where it is used — typed on a post, named in that tab's
  language — or here, before anything carries it: the tags are shared with
  vendors, who pick from this list and never type their own. It is also where
  the other languages get filled in, which is why an empty name is marked and can be filtered for.
  Deleting asks twice, and the second button says how many posts lose it.
*/

const LOCALES = ['mk', 'en', 'sq']
/** Mirrors `BlogTagService.MAX_NAME_LENGTH`; the server still decides. */
const MAX_NAME_LENGTH = 40
const NOTICE_MS = 4000

const { t } = useI18n()
const route = useRoute()

const lang = computed(() => route.params.lang || 'mk')

const tags = ref([])
const drafts = reactive({})
const query = ref('')
const onlyMissing = ref(false)
const loading = ref(true)
const loadError = ref('')
const error = ref('')
const notice = ref('')
const busy = ref('')
const confirming = ref('')
const newNames = reactive({ mk: '', en: '', sq: '' })
const creating = ref(false)

let noticeTimer = null

const shown = computed(() => {
  const needle = query.value.trim().toLowerCase()
  return tags.value.filter((tag) =>
    (!onlyMissing.value || tag.missingLocales?.length) &&
    (!needle || [tag.slug, ...Object.values(tag.names || {})].some((text) => text.toLowerCase().includes(needle))))
})

onMounted(load)
onBeforeUnmount(() => clearTimeout(noticeTimer))

const unwrap = (response) => response?.data ?? response

const namesOf = (tag) => Object.fromEntries(LOCALES.map((code) => [code, tag.names?.[code] || '']))

function isDirty(tag) {
  return LOCALES.some((code) => drafts[tag.id][code].trim() !== (tag.names?.[code] || ''))
}

async function load() {
  loading.value = true
  try {
    const list = unwrap(await contentService.tags()) || []
    for (const tag of list) drafts[tag.id] = namesOf(tag)
    tags.value = list
    loadError.value = ''
  } catch (failure) {
    loadError.value = getErrorMessage(failure)
  } finally {
    loading.value = false
  }
}

/** Blank names are sent blank: the server removes them, so "not translated" has one shape. */
async function save(tag) {
  if (!isDirty(tag)) return
  busy.value = tag.id
  error.value = ''
  try {
    const saved = unwrap(await contentService.renameTag(tag.id, { ...drafts[tag.id] }))
    drafts[saved.id] = namesOf(saved)
    tags.value = tags.value.map((existing) => (existing.id === saved.id ? saved : existing))
    flash(t('adminTags.saved', { tag: saved.slug }))
  } catch (failure) {
    error.value = getErrorMessage(failure)
  } finally {
    busy.value = ''
  }
}

async function remove(tag) {
  busy.value = tag.id
  error.value = ''
  try {
    await contentService.removeTag(tag.id)
    tags.value = tags.value.filter((existing) => existing.id !== tag.id)
    confirming.value = ''
    flash(t('adminTags.removed', { tag: tag.slug }))
  } catch (failure) {
    error.value = getErrorMessage(failure)
  } finally {
    busy.value = ''
  }
}

/** Adds a tag nobody carries yet, so vendors can pick it. The slug comes from the Macedonian name. */
async function create() {
  creating.value = true
  error.value = ''
  try {
    const created = unwrap(await contentService.createTag({ names: { ...newNames } }))
    drafts[created.id] = namesOf(created)
    tags.value = [...tags.value, created].sort((a, b) => a.slug.localeCompare(b.slug))
    for (const code of LOCALES) newNames[code] = ''
    flash(t('tags.admin.created', { tag: created.slug }))
  } catch (failure) {
    error.value = getErrorMessage(failure)
  } finally {
    creating.value = false
  }
}

function flash(message) {
  notice.value = message
  clearTimeout(noticeTimer)
  noticeTimer = setTimeout(() => { notice.value = '' }, NOTICE_MS)
}
</script>

<style scoped>
/* `.toolbar`, `.tbl`, `.card` and `.btn` are the design's, in `ivy/dash.css`.
   Local: the name inputs, the marking of a missing translation and the table
   card without padding of its own. */
.tag-filters {
  align-items: center;
}

.new-tag {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.new-tag input {
  flex: 1 1 140px;
  min-width: 0;
}

.new-tag-title {
  flex-basis: 100%;
  font-size: 14px;
}

.only-missing {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
}

.card.tbl-card {
  padding: 0;
  overflow-x: auto;
}

.slug {
  font-weight: 600;
  white-space: nowrap;
}

.tbl input[type='text'] {
  width: 100%;
  min-width: 120px;
}

.tbl input.missing {
  border-style: dashed;
  border-color: var(--gold);
}

.count {
  white-space: nowrap;
}

.actions {
  display: flex;
  gap: 6px;
  justify-content: flex-end;
  white-space: nowrap;
}

.danger {
  background: var(--danger, #b3261e);
  border-color: transparent;
  color: #fff;
}

.notice,
.action-error {
  margin: 0 0 12px;
  font-size: 14px;
}

.action-error {
  color: var(--danger, #b3261e);
}
</style>
