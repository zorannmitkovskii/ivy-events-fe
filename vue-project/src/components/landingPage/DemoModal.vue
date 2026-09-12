<template>
  <div
    v-if="demo"
    class="modal"
    role="dialog"
    aria-modal="true"
    aria-labelledby="demo-modal-title"
    @keydown.esc="close"
  >
    <div class="modal-bg" @click="close"></div>

    <div class="modal-box">
      <div class="modal-head">
        <b id="demo-modal-title">{{ $t('home.demos.modalTitle', { name: demo.title }) }}</b>
        <button ref="closeButton" type="button" class="icon-x" :aria-label="$t('common.close')" @click="close">×</button>
      </div>

      <div class="video-wrap">
        <video v-if="demo.src" ref="video" :src="demo.src" controls playsinline preload="none"></video>
        <div v-else class="video-empty">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true">
            <circle cx="12" cy="12" r="9" />
            <path d="m10 8.5 5 3.5-5 3.5z" fill="currentColor" />
          </svg>
          <b>{{ $t('home.demos.noRecordingTitle') }}</b>
          <span>{{ $t('home.demos.noRecordingBody') }}</span>
        </div>
      </div>

      <div class="modal-foot">
        <span class="small muted">{{ $t('home.demos.modalNote') }}</span>
        <router-link class="btn btn-primary btn-sm" :to="createTo">{{ $t('home.demos.makeOne') }}</router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { useRoute } from 'vue-router'

/**
 * The recording behind a demo card.
 *
 * Rendered only while a demo is chosen, rather than kept in the document
 * hidden: a `<video>` that is always present is a `<video>` that keeps its
 * source and its buffer between openings, and the mockup's version had to
 * remember to pause it on close for exactly that reason.
 *
 * @param demo `{ title, src }`, or null when nothing is open
 */
const props = defineProps({
  demo: { type: Object, default: null },
})

const emit = defineEmits(['close'])

const route = useRoute()
const lang = computed(() => route.params.lang || 'mk')
const createTo = computed(() => ({ name: 'signup', params: { lang: lang.value } }))

const closeButton = ref(null)

function close() {
  emit('close')
}

function onKeydown(e) {
  if (e.key === 'Escape') close()
}

/*
  The page behind a modal must not scroll, and focus has to move into it — a
  dialog nobody can tab to is a dialog a keyboard cannot close.
*/
watch(
  () => props.demo,
  async (open) => {
    if (open) {
      document.body.style.overflow = 'hidden'
      document.addEventListener('keydown', onKeydown)
      await nextTick()
      closeButton.value?.focus()
    } else {
      document.body.style.overflow = ''
      document.removeEventListener('keydown', onKeydown)
    }
  },
)

onBeforeUnmount(() => {
  document.body.style.overflow = ''
  document.removeEventListener('keydown', onKeydown)
})
</script>
