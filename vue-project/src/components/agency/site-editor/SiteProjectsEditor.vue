<template>
  <div class="se-projects">
    <p class="se-hint">{{ t('agencySite.editor.projectsHint') }}</p>

    <div v-for="(project, i) in projects" :key="project.id" class="se-project">
      <div class="se-project-head">
        <b>{{ project.title }}</b>
        <span v-if="!project.published" class="se-badge">{{ t('agencySite.editor.hidden') }}</span>
        <span class="se-spacer"></span>
        <button type="button" class="btn btn-ghost btn-sm" :disabled="i === 0 || busy" :aria-label="t('agencySite.editor.moveUp')" @click="move(i, -1)">↑</button>
        <button type="button" class="btn btn-ghost btn-sm" :disabled="i === projects.length - 1 || busy" :aria-label="t('agencySite.editor.moveDown')" @click="move(i, 1)">↓</button>
        <button type="button" class="btn btn-ghost btn-sm" @click="toggle(project.id)">
          {{ openId === project.id ? t('agencySite.editor.close') : t('agencySite.editor.edit') }}
        </button>
      </div>

      <div v-if="openId === project.id" class="se-project-body">
        <ProjectFields v-model="drafts[project.id]" />
        <div class="se-photos">
          <figure v-for="media in project.media" :key="media.id">
            <div class="se-photo" :style="{ backgroundImage: `url(&quot;${media.url}&quot;)` }"></div>
            <figcaption>{{ media.caption }}</figcaption>
            <button type="button" class="btn btn-ghost btn-sm" @click="removePhoto(project, media)">{{ t('agencySite.editor.remove') }}</button>
          </figure>
          <label v-if="project.media.length < MAX_PHOTOS" class="btn btn-ghost btn-sm se-upload">
            + {{ t('agencySite.editor.addPhoto') }}
            <input type="file" accept="image/jpeg,image/png,image/webp" @change="addPhoto(project, $event)" />
          </label>
        </div>
        <div class="se-row">
          <button type="button" class="btn btn-ghost btn-sm se-danger" :disabled="busy" @click="remove(project)">{{ t('agencySite.editor.deleteProject') }}</button>
          <span class="se-spacer"></span>
          <button type="button" class="btn btn-primary btn-sm" :disabled="busy" @click="save(project)">{{ t('agencySite.editor.save') }}</button>
        </div>
      </div>
    </div>

    <div class="se-new">
      <h4>{{ t('agencySite.editor.newProject') }}</h4>
      <ProjectFields v-model="fresh" />
      <div class="se-row">
        <span class="se-spacer"></span>
        <button type="button" class="btn btn-primary btn-sm" :disabled="busy || !fresh.title.trim()" @click="create">
          + {{ t('agencySite.editor.addProject') }}
        </button>
      </div>
    </div>

    <p v-if="error" class="se-error" role="alert">{{ error }}</p>
  </div>
</template>

<script setup>
/**
 * The portfolio: projects the agency writes up itself, with photos.
 *
 * <p>Nothing here comes from the agency's events — those carry a client's
 * name and date, which are the agency's to publish, not ours.
 */
import { reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import ProjectFields from './SiteProjectFields.vue'
import { agencySiteService } from '@/services/agencySite.service'
import { getErrorMessage } from '@/services/apiError'

/** The server allows twelve photos per project. */
const MAX_PHOTOS = 12

const projects = defineModel('projects', { type: Array, required: true })

const { t } = useI18n()
const busy = ref(false)
const error = ref('')
const openId = ref(null)
const drafts = reactive({})
const blank = () => ({ title: '', eventType: '', city: '', description: '', published: true })
const fresh = ref(blank())

function toggle(id) {
  if (openId.value === id) {
    openId.value = null
    return
  }
  const project = projects.value.find((p) => p.id === id)
  drafts[id] = {
    title: project.title || '',
    eventType: project.eventType || '',
    city: project.city || '',
    description: project.description || '',
    published: project.published,
  }
  openId.value = id
}

function replace(updated) {
  projects.value = projects.value.map((p) => (p.id === updated.id ? updated : p))
}

async function run(action) {
  busy.value = true
  error.value = ''
  try {
    await action()
  } catch (e) {
    error.value = getErrorMessage(e)
  } finally {
    busy.value = false
  }
}

const create = () => run(async () => {
  const created = await agencySiteService.createProject(fresh.value)
  projects.value = [...projects.value, created]
  fresh.value = blank()
})

const save = (project) => run(async () => replace(await agencySiteService.updateProject(project.id, drafts[project.id])))

const remove = (project) => run(async () => {
  await agencySiteService.deleteProject(project.id)
  projects.value = projects.value.filter((p) => p.id !== project.id)
  openId.value = null
})

const move = (index, step) => run(async () => {
  const ids = projects.value.map((p) => p.id)
  const [id] = ids.splice(index, 1)
  ids.splice(index + step, 0, id)
  projects.value = await agencySiteService.reorderProjects(ids)
})

function addPhoto(project, event) {
  const file = event.target.files?.[0]
  event.target.value = ''
  if (!file) return
  run(async () => replace(await agencySiteService.addProjectPhoto(project.id, file)))
}

const removePhoto = (project, media) => run(async () => replace(await agencySiteService.removeProjectPhoto(project.id, media.id)))
</script>

<style scoped>
.se-hint {
  margin: 0 0 12px;
  color: var(--ink-3);
  font-size: 13px;
}

.se-project,
.se-new {
  border: 1px solid var(--line);
  border-radius: 10px;
  margin-bottom: 10px;
  padding: 10px 14px;
  background: var(--card);
}

.se-new h4 {
  margin: 0 0 8px;
  font-size: 15px;
}

.se-project-head,
.se-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.se-row {
  margin-top: 10px;
}

.se-spacer {
  flex: 1;
}

.se-badge {
  padding: 2px 8px;
  border-radius: 999px;
  background: var(--line);
  color: var(--ink-3);
  font-size: 11px;
}

.se-project-body {
  margin-top: 10px;
}

.se-photos {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 10px;
  margin-top: 10px;
}

.se-photos figure {
  margin: 0;
  width: 110px;
  font-size: 11px;
}

.se-photo {
  height: 74px;
  border-radius: 8px;
  background: center / cover no-repeat;
}

.se-upload {
  position: relative;
  overflow: hidden;
}

.se-upload input {
  position: absolute;
  inset: 0;
  opacity: 0;
  cursor: pointer;
}

.se-danger {
  color: var(--red, #a33a2b);
}

.se-error {
  color: var(--red, #a33a2b);
  font-size: 12.5px;
}
</style>
