<template>
  <BaseModal :open="open" :title="isEdit ? t('ourStory.editDialog.title') : t('ourStory.addDialog.title')" @close="emit('close')">
    <form class="form" @submit.prevent="submit">
      <div class="field">
        <label>{{ t("ourStory.form.title") }} *</label>
        <input class="input" v-model="draft.title" :placeholder="t('ourStory.addDialog.titlePh')" />
        <div v-if="errors.title" class="err">{{ errors.title }}</div>
      </div>

      <div class="field">
        <label>{{ t("ourStory.form.type") }} *</label>
        <select class="input" v-model="draft.type">
          <option v-for="(val, key) in StoryType" :key="key" :value="val">
            {{ t(`storyTypes.${val}`) }}
          </option>
        </select>
        <div v-if="errors.type" class="err">{{ errors.type }}</div>
      </div>

      <div class="field">
        <label>{{ t("ourStory.form.description") }}</label>
        <textarea
          class="input textarea"
          v-model="draft.description"
          :placeholder="t('ourStory.addDialog.descriptionPh')"
          rows="3"
        />
      </div>

      <div v-if="validationError" class="err-box">{{ validationError }}</div>
    </form>

    <template #footer>
      <ButtonMain v-if="isEdit" variant="danger" type="button" @click="emit('delete', item.id)">
        {{ t("common.delete") }}
      </ButtonMain>

      <div class="footer-right">
        <ButtonMain variant="outline" type="button" @click="emit('close')">
          {{ t("common.cancel") }}
        </ButtonMain>
        <ButtonMain variant="main" type="button" @click="submit">
          {{ isEdit ? t("common.save") : t("ourStory.addDialog.create") }}
        </ButtonMain>
      </div>
    </template>
  </BaseModal>
</template>

<script setup>
import { reactive, ref, watch, computed } from "vue";
import { useI18n } from "vue-i18n";
import BaseModal from "@/components/ui/BaseModal.vue";
import ButtonMain from "@/components/generic/ButtonMain.vue";
import { StoryType } from "@/enums/StoryType";

const { t } = useI18n();

const props = defineProps({
  open: { type: Boolean, default: false },
  item: { type: Object, default: null }
});

const emit = defineEmits(["close", "submit", "delete"]);

const isEdit = computed(() => !!props.item?.id);

const draft = reactive({
  title: "",
  type: StoryType.HOW_WE_MET,
  description: "",
});

const errors = reactive({ title: "", type: "" });
const validationError = ref("");

watch(
  () => props.open,
  (v) => {
    if (!v) return;

    validationError.value = "";
    errors.title = "";
    errors.type = "";

    if (props.item) {
      draft.title = props.item.title ?? "";
      draft.type = props.item.type ?? StoryType.HOW_WE_MET;
      draft.description = props.item.description ?? "";
    } else {
      draft.title = "";
      draft.type = StoryType.HOW_WE_MET;
      draft.description = "";
    }
  }
);

function validate() {
  validationError.value = "";
  errors.title = draft.title.trim() ? "" : t("ourStory.errors.titleRequired");
  errors.type = draft.type ? "" : t("ourStory.errors.typeRequired");

  return !(errors.title || errors.type);
}

function submit() {
  if (!validate()) return;

  const payload = {
    title: draft.title.trim(),
    description: draft.description.trim() || null,
    type: draft.type,
  };

  if (isEdit.value) {
    payload.id = props.item.id;
  }

  emit("submit", payload);
}
</script>

<style scoped>
.form {
  display: grid;
  gap: 14px;
}

.field label {
  font-size: 12px;
  font-weight: 700;
  color: var(--neutral-500);
  display: block;
  margin-bottom: 6px;
  letter-spacing: 0.03em;
  text-transform: uppercase;
}

.input {
  width: 100%;
  border: 2px solid var(--neutral-300);
  background: var(--bg-main);
  border-radius: 10px;
  padding: 10px 12px;
  font-size: 14px;
  color: var(--brand-main);
  outline: none;
  transition: border-color 0.2s ease;
}

.input:focus {
  border-color: var(--brand-gold);
}

.textarea {
  resize: vertical;
  font-family: inherit;
  min-height: 72px;
}

.err {
  margin-top: 6px;
  font-size: 12px;
  color: var(--error);
  font-weight: 600;
}

.err-box {
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid #ffd2d2;
  background: #fff5f5;
  color: #b00020;
  font-weight: 600;
  font-size: 13px;
}

.footer-right {
  display: flex;
  gap: 10px;
  margin-left: auto;
}
</style>
