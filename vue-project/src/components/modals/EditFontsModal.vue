<template>
  <BaseModal :open="open" :title="t('editSection.fonts')" @close="emit('close')">
    <div class="fonts-modal">
      <!-- Heading Font -->
      <div class="font-section">
        <label class="font-section-label">{{ t('editSection.headingFont') }}</label>
        <div class="font-list">
          <button
            v-for="font in FONT_LIST"
            :key="'h-' + font.name"
            type="button"
            class="font-btn"
            :class="{ 'font-btn--active': selectedHeading === font.name }"
            :style="{ fontFamily: font.css }"
            @click="selectedHeading = font.name"
          >
            {{ font.name }}
          </button>
        </div>
      </div>

      <!-- Body Font -->
      <div class="font-section">
        <label class="font-section-label">{{ t('editSection.bodyFont') }}</label>
        <div class="font-list">
          <button
            v-for="font in FONT_LIST"
            :key="'b-' + font.name"
            type="button"
            class="font-btn"
            :class="{ 'font-btn--active': selectedBody === font.name }"
            :style="{ fontFamily: font.css }"
            @click="selectedBody = font.name"
          >
            {{ font.name }}
          </button>
        </div>
      </div>
    </div>

    <template v-if="!liveEdit" #footer>
      <ButtonMain variant="outline" type="button" @click="emit('close')">
        Cancel
      </ButtonMain>
      <ButtonMain variant="main" type="button" @click="onSave">
        Save
      </ButtonMain>
    </template>
  </BaseModal>
</template>

<script setup>
import { ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import BaseModal from '@/components/ui/BaseModal.vue';
import ButtonMain from '@/components/generic/ButtonMain.vue';

const { t } = useI18n();

const FONT_LIST = [
  { name: 'Playfair Display', css: "'Playfair Display', serif", category: 'serif' },
  { name: 'Cormorant Garamond', css: "'Cormorant Garamond', serif", category: 'serif' },
  { name: 'Lora', css: "'Lora', serif", category: 'serif' },
  { name: 'Merriweather', css: "'Merriweather', serif", category: 'serif' },
  { name: 'EB Garamond', css: "'EB Garamond', serif", category: 'serif' },
  { name: 'Libre Baskerville', css: "'Libre Baskerville', serif", category: 'serif' },
  { name: 'Crimson Text', css: "'Crimson Text', serif", category: 'serif' },
  { name: 'DM Serif Display', css: "'DM Serif Display', serif", category: 'serif' },
  { name: 'Montserrat', css: "'Montserrat', sans-serif", category: 'sans-serif' },
  { name: 'Lato', css: "'Lato', sans-serif", category: 'sans-serif' },
  { name: 'Open Sans', css: "'Open Sans', sans-serif", category: 'sans-serif' },
  { name: 'Raleway', css: "'Raleway', sans-serif", category: 'sans-serif' },
  { name: 'Poppins', css: "'Poppins', sans-serif", category: 'sans-serif' },
  { name: 'Nunito', css: "'Nunito', sans-serif", category: 'sans-serif' },
  { name: 'Work Sans', css: "'Work Sans', sans-serif", category: 'sans-serif' },
  { name: 'Inter', css: "'Inter', sans-serif", category: 'sans-serif' },
  { name: 'Great Vibes', css: "'Great Vibes', cursive", category: 'script' },
  { name: 'Dancing Script', css: "'Dancing Script', cursive", category: 'script' },
  { name: 'Parisienne', css: "'Parisienne', cursive", category: 'script' },
  { name: 'Alex Brush', css: "'Alex Brush', cursive", category: 'script' },
];

const props = defineProps({
  open: { type: Boolean, default: false },
  currentHeading: { type: String, default: '' },
  currentBody: { type: String, default: '' },
  liveEdit: { type: Boolean, default: false },
});

const emit = defineEmits(['close', 'save', 'change']);

const selectedHeading = ref(props.currentHeading);
const selectedBody = ref(props.currentBody);

watch(() => props.open, (v) => {
  if (v) {
    selectedHeading.value = props.currentHeading;
    selectedBody.value = props.currentBody;
    preloadFonts();
  }
}, { immediate: true });

function preloadFonts() {
  const families = FONT_LIST.map(f => f.name.replace(/ /g, '+')).join('&family=');
  const url = `https://fonts.googleapis.com/css2?family=${families}&text=AaBbCcDdEe&display=swap`;
  if (!document.querySelector(`link[href="${url}"]`)) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = url;
    document.head.appendChild(link);
  }
}

// Emit change in live-edit mode
watch([selectedHeading, selectedBody], () => {
  if (props.liveEdit) {
    emit('change', { heading: selectedHeading.value, body: selectedBody.value });
  }
});

function onSave() {
  emit('save', {
    heading: selectedHeading.value,
    body: selectedBody.value,
  });
}
</script>

<style scoped>
.fonts-modal {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.font-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.font-section-label {
  font-size: 13px;
  font-weight: 600;
  color: #374151;
}

.font-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-height: 200px;
  overflow-y: auto;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 4px;
}

.font-btn {
  display: block;
  width: 100%;
  padding: 10px 14px;
  border: 2px solid transparent;
  border-radius: 6px;
  background: #fff;
  font-size: 16px;
  color: #374151;
  cursor: pointer;
  text-align: left;
  transition: border-color 0.2s, background 0.2s;
}

.font-btn:hover {
  background: #f9fafb;
  border-color: #d1d5db;
}

.font-btn--active {
  border-color: var(--brand-main, #374151);
  background: #f3f4f6;
  font-weight: 600;
}
</style>
