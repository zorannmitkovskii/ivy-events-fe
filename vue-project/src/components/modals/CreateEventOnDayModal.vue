<template>
  <div v-if="open" class="backdrop" @click.self="close">
    <div class="sheet" role="dialog" aria-modal="true" :aria-label="t('createEventDay.title')">
      <header class="sheet__head">
        <h2 class="sheet__title">{{ t('createEventDay.title') }}</h2>
        <p class="sheet__day">{{ prettyDay }}</p>
      </header>

      <form class="form" @submit.prevent="submit">
        <label class="field">
          <span>{{ t('createEventDay.name') }}</span>
          <input
            ref="nameInput"
            v-model="name"
            type="text"
            :placeholder="t('createEventDay.namePh')"
            :disabled="saving"
            required
          />
        </label>

        <fieldset class="field field--types" :disabled="saving">
          <legend>{{ t('createEventDay.category') }}</legend>
          <div class="types">
            <button
              v-for="option in CATEGORIES"
              :key="option"
              type="button"
              class="type"
              :class="{ on: category === option }"
              :aria-pressed="category === option"
              @click="pick(option)"
            >{{ t(`createEventDay.categories.${option}`) }}</button>
          </div>
        </fieldset>

        <!--
          The same follow-up the onboarding flow asks. Birthday is the one
          category that does not say enough on its own — an adult's and a
          child's run different modules — and picking one silently is how the
          event ends up asking the wrong questions later.
        -->
        <fieldset v-if="needsTypeChoice" class="field field--types" :disabled="saving">
          <legend>{{ t('createEventDay.whichBirthday') }}</legend>
          <div class="types">
            <button
              v-for="option in BIRTHDAY_TYPES"
              :key="option"
              type="button"
              class="type"
              :class="{ on: typeCode === option }"
              :aria-pressed="typeCode === option"
              @click="typeCode = option"
            >{{ t(`createEventDay.types.${option}`) }}</button>
          </div>
        </fieldset>

        <p v-if="error" class="error" role="alert">{{ error }}</p>

        <footer class="sheet__foot">
          <button type="button" class="btn" :disabled="saving" @click="close">
            {{ t('createEventDay.cancel') }}
          </button>
          <button type="submit" class="btn btn--primary" :disabled="saving || !canSubmit">
            {{ saving ? t('createEventDay.saving') : t('createEventDay.create') }}
          </button>
        </footer>
      </form>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { eventsService } from '@/services/events.service'
import { getUsername } from '@/services/auth.service'
import { getErrorMessage } from '@/services/apiError'

/**
 * Creating an event on the day that was clicked.
 *
 * <p>The same questions the onboarding flow asks, in one sheet: a name, a
 * category, and — for a birthday — which kind. The date is the square that was
 * clicked, which is the whole reason this exists rather than sending somebody
 * to onboarding and making them find the day again.
 *
 * <p>Nothing else. A venue, a guest count and a budget at the moment somebody
 * taps a square is how a one-gesture action becomes a form people abandon;
 * those belong on the event, which opens next.
 */

const props = defineProps({
  open: { type: Boolean, default: false },
  /** ISO `YYYY-MM-DD`, straight from the calendar cell. */
  day: { type: String, default: '' },
})

const emit = defineEmits(['close', 'created'])

const { t, locale } = useI18n()

/** Every category the backend knows. Kept in its order, not alphabetised. */
const CATEGORIES = ['WEDDING', 'ENGAGEMENT', 'BIRTHDAY', 'CORPORATE', 'BABY_SHOWER', 'GALLERY', 'OTHER']

const BIRTHDAY_TYPES = ['BIRTHDAY_ADULT', 'BIRTHDAY_CHILD']

/** Everything except a birthday maps to exactly one type, so nothing is asked. */
const TYPE_FOR_CATEGORY = {
  WEDDING: 'WEDDING',
  ENGAGEMENT: 'ENGAGEMENT',
  CORPORATE: 'CORPORATE',
  BABY_SHOWER: 'BABY_SHOWER',
  GALLERY: 'GALLERY',
  OTHER: 'OTHER',
}

const name = ref('')
const category = ref('WEDDING')
const typeCode = ref('WEDDING')
const saving = ref(false)
const error = ref('')
const nameInput = ref(null)

const needsTypeChoice = computed(() => category.value === 'BIRTHDAY')

const canSubmit = computed(
  () => name.value.trim().length > 0 && (!needsTypeChoice.value || !!typeCode.value),
)

const prettyDay = computed(() => {
  if (!props.day) return ''
  const date = new Date(`${props.day}T00:00:00`)
  if (Number.isNaN(date.getTime())) return props.day
  return date.toLocaleDateString(locale.value === 'en' ? 'en-GB' : 'mk-MK', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
})

function pick(option) {
  category.value = option
  // A birthday leaves the follow-up unanswered on purpose; everything else
  // has one answer, so asking would be a question with one option.
  typeCode.value = TYPE_FOR_CATEGORY[option] ?? ''
}

watch(
  () => props.open,
  async (isOpen) => {
    if (!isOpen) return
    // A fresh dialog each time: the previous attempt belongs to the day that
    // was clicked then, not to this one.
    name.value = ''
    pick('WEDDING')
    error.value = ''
    await nextTick()
    nameInput.value?.focus()
  },
)

function close() {
  if (saving.value) return
  emit('close')
}

async function submit() {
  if (!canSubmit.value) return
  saving.value = true
  error.value = ''
  try {
    const response = await eventsService.create({
      name: name.value.trim(),
      categoryType: category.value,
      typeCode: typeCode.value || undefined,
      date: props.day,
      // Sent for parity with onboarding. The server falls back to the token
      // when it is absent, which is what it should have done all along.
      username: getUsername(),
    })
    emit('created', response?.data?.data ?? response?.data ?? null)
    emit('close')
  } catch (e) {
    // The dialog stays open with what was typed. Closing it on a failure
    // means retyping, and the failure is usually a blip.
    error.value = getErrorMessage(e)
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.backdrop {
  position: fixed;
  inset: 0;
  background: rgba(16, 40, 30, .45);
  display: grid;
  place-items: center;
  padding: 16px;
  z-index: 60;
  overflow-y: auto;
}

.sheet {
  width: min(460px, 100%);
  background: var(--surface, #fff);
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 18px 50px rgba(0, 0, 0, .22);
}

.sheet__head { margin-bottom: 14px; }
.sheet__title { margin: 0; font-size: 18px; }
.sheet__day { margin: 4px 0 0; font-size: 13px; color: var(--ink-2, #6b7670); }

.form { display: flex; flex-direction: column; gap: 14px; }
.field { display: flex; flex-direction: column; gap: 5px; font-size: 13px; }
.field--types { border: 0; padding: 0; margin: 0; }
.field--types legend { padding: 0; margin-bottom: 7px; font-size: 13px; }

.field input {
  padding: 9px 11px;
  border: 1px solid var(--line, #dce3dc);
  border-radius: 9px;
  font-size: 14px;
  background: var(--surface, #fff);
  color: inherit;
}

.types { display: flex; flex-wrap: wrap; gap: 7px; }
.type {
  padding: 7px 12px;
  border: 1px solid var(--line, #dce3dc);
  border-radius: 999px;
  background: transparent;
  font-size: 13px;
  cursor: pointer;
  color: inherit;
}
.type.on { background: var(--brand, #1f3d2b); color: #fff; border-color: transparent; }

.error { margin: 0; font-size: 13px; color: #9b3d36; }

.sheet__foot { display: flex; justify-content: flex-end; gap: 8px; }
.btn {
  padding: 8px 15px;
  border-radius: 9px;
  border: 1px solid var(--line, #dce3dc);
  background: transparent;
  cursor: pointer;
  font-size: 14px;
}
.btn--primary { background: var(--brand, #1f3d2b); color: #fff; border-color: transparent; }
.btn:disabled { opacity: .55; cursor: default; }
</style>
