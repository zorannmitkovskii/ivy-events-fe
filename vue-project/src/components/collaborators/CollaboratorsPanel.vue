<template>
  <section class="collab">
    <header class="collab-head">
      <h2 class="collab-title">{{ $t('collaborators.title') }}</h2>
      <p class="collab-sub">
        {{ $t('collaborators.subtitle') }}
      </p>
    </header>

    <div class="collab-form">
      <label class="collab-label" for="collab-role">{{ $t('collaborators.role') }}</label>
      <select id="collab-role" v-model="role" class="collab-select" :disabled="creating">
        <option value="MEMBER">{{ $t('collaborators.roles.member') }}</option>
        <option value="ADMIN">{{ $t('collaborators.roles.admin') }}</option>
      </select>

      <button class="collab-btn" :disabled="creating || !eventId" @click="create">
        {{ creating
          ? ($t('common.loading'))
          : ($t('collaborators.create')) }}
      </button>
    </div>

    <!-- Shown once, right after creation. The server does not hand the code
         back on the list call in a form anyone should rely on re-reading, and
         the organizer needs to pass it on now. -->
    <div v-if="freshCode" class="collab-fresh">
      <span class="collab-code">{{ freshCode }}</span>
      <button class="collab-copy" @click="copy(freshCode)">
        {{ copied ? ($t('common.copied')) : ($t('common.copy')) }}
      </button>
      <p class="collab-hint">
        {{ $t('collaborators.shareHint') }}
      </p>
    </div>

    <p v-if="error" class="collab-error">{{ error }}</p>

    <ul v-if="invites.length" class="collab-list">
      <li v-for="i in invites" :key="i.code" class="collab-item">
        <span class="collab-code-sm">{{ i.code }}</span>
        <span class="collab-role">{{ i.role }}</span>
        <span :class="['collab-state', i.claimed ? 'is-claimed' : 'is-open']">
          {{ i.claimed
            ? ($t('collaborators.claimed'))
            : ($t('collaborators.pending')) }}
        </span>
      </li>
    </ul>
    <p v-else-if="!loading" class="collab-empty">
      {{ $t('collaborators.empty') }}
    </p>
  </section>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import { collaboratorsService } from '@/services/collaborators.service';
import { getErrorMessage } from '@/services/apiError';

const props = defineProps({
  eventId: { type: String, default: '' },
});

const role = ref('MEMBER');
const invites = ref([]);
const freshCode = ref('');
const copied = ref(false);
const creating = ref(false);
const loading = ref(false);
const error = ref('');

async function load() {
  if (!props.eventId) return;
  loading.value = true;
  error.value = '';
  try {
    invites.value = (await collaboratorsService.list(props.eventId)) || [];
  } catch (e) {
    error.value = getErrorMessage(e);
  } finally {
    loading.value = false;
  }
}

async function create() {
  creating.value = true;
  error.value = '';
  copied.value = false;
  try {
    const created = await collaboratorsService.invite(props.eventId, { role: role.value });
    freshCode.value = created.code;
    await load();
  } catch (e) {
    error.value = getErrorMessage(e);
  } finally {
    creating.value = false;
  }
}

async function copy(text) {
  try {
    await navigator.clipboard.writeText(text);
    copied.value = true;
  } catch {
    // Clipboard is blocked in plenty of contexts; the code is on screen and
    // selectable, so this is not worth an error message.
  }
}

onMounted(load);
watch(() => props.eventId, load);
</script>

<style scoped>
.collab { padding: 1.5rem; }
.collab-head { margin-bottom: 1.25rem; }
.collab-title { margin: 0 0 0.25rem; font-size: 1.25rem; }
.collab-sub { margin: 0; opacity: 0.75; font-size: 0.9375rem; }

.collab-form { display: flex; gap: 0.75rem; align-items: flex-end; flex-wrap: wrap; }
.collab-label {
  display: block; margin-bottom: 0.375rem;
  font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.04em;
}
.collab-select { padding: 0.625rem; border: 1px solid var(--border, #d8d8d8); border-radius: 0.5rem; }
.collab-btn {
  padding: 0.625rem 1.25rem; border: 0; border-radius: 0.5rem;
  background: var(--brand-dark, #33452f); color: #fff; cursor: pointer;
}
.collab-btn:disabled { opacity: 0.55; cursor: not-allowed; }

.collab-fresh {
  margin-top: 1.25rem; padding: 1rem;
  border: 1px dashed var(--brand-gold, #b99a5b); border-radius: 0.5rem;
}
.collab-code {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 1.375rem; letter-spacing: 0.2em;
}
.collab-copy {
  margin-left: 0.75rem; padding: 0.375rem 0.75rem;
  border: 1px solid var(--border, #d8d8d8); border-radius: 0.375rem;
  background: transparent; cursor: pointer;
}
.collab-hint { margin: 0.5rem 0 0; font-size: 0.8125rem; opacity: 0.75; }

.collab-error { margin-top: 1rem; color: var(--danger, #b3261e); font-size: 0.875rem; }
.collab-empty { margin-top: 1.25rem; opacity: 0.7; font-size: 0.9375rem; }

.collab-list { list-style: none; margin: 1.25rem 0 0; padding: 0; }
.collab-item {
  display: flex; gap: 1rem; align-items: center;
  padding: 0.625rem 0; border-top: 1px solid var(--border, #eee);
}
.collab-code-sm {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace; letter-spacing: 0.1em;
}
.collab-role { font-size: 0.8125rem; opacity: 0.75; }
.collab-state { margin-left: auto; font-size: 0.8125rem; }
.is-claimed { opacity: 0.6; }
.is-open { color: var(--brand-gold, #b99a5b); }
</style>
