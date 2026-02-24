<template>
  <BaseModal :open="open" :title="isEdit ? t('eventDetail.editTitle') : t('eventDetail.addTitle')" @close="emit('close')">
    <form class="form" @submit.prevent="submit">
      <div class="two">
        <div class="field">
          <label>{{ t("eventDetail.form.type") }} *</label>
          <select class="input" v-model="draft.type">
            <option v-for="val in availableTypes" :key="val" :value="val">
              {{ t(`detailTypes.${val}`) }}
            </option>
          </select>
          <div v-if="errors.type" class="err">{{ errors.type }}</div>
        </div>
        <div class="field">
          <label>{{ t("eventDetail.form.eventDate") }}</label>
          <input type="date" class="input" v-model="draft.eventDate" />
        </div>
      </div>

      <div class="field">
        <label>{{ t("eventDetail.form.time") }}</label>
        <div class="time-selects">
          <select class="input" v-model="draft.hour">
            <option v-for="h in 24" :key="h-1" :value="String(h-1).padStart(2,'0')">
              {{ String(h-1).padStart(2,'0') }}
            </option>
          </select>
          <span class="time-sep">:</span>
          <select class="input" v-model="draft.minute">
            <option v-for="m in [0,5,10,15,20,25,30,35,40,45,50,55]" :key="m" :value="String(m).padStart(2,'0')">
              {{ String(m).padStart(2,'0') }}
            </option>
          </select>
        </div>
      </div>

      <div class="field">
        <label>{{ t("eventDetail.form.description") }}</label>
        <input type="text" class="input" v-model="draft.description" :placeholder="t('eventDetail.form.descriptionPh')" />
      </div>

      <AuthLocationInput
        v-model="draft.location"
        :label="t('eventDetail.form.location')"
        :placeholder="t('eventDetail.form.locationPh')"
        :types="[]"
        :pickOnMapLabel="t('common.pickOnMap')"
        :cancelLabel="t('common.cancel')"
        :useThisLocationLabel="t('common.useThisLocation')"
        :searchPlaceholder="t('common.searchPlaces')"
        :locatingLabel="t('common.locateMe')"
        :locatingLabelLoading="t('common.locating')"
        :selectedLabel="t('common.selected')"
        :loadingAddressLabel="t('common.loadingAddress')"
      >
        <template #icon>📍</template>
      </AuthLocationInput>

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
          {{ isEdit ? t("common.save") : t("agenda.addDialog.create") }}
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
import AuthLocationInput from "@/components/auth/AuthLocationInput.vue";
import { EventDetailType } from "@/enums/EventDetailType";

const { t } = useI18n();

const props = defineProps({
  open: { type: Boolean, default: false },
  item: { type: Object, default: null },
  items: { type: Array, default: () => [] },
});

const availableTypes = computed(() => {
  const usedTypes = props.items
    .filter((i) => !isEdit.value || i.id !== props.item?.id)
    .map((i) => i.type);
  return Object.values(EventDetailType).filter((t) => !usedTypes.includes(t));
});

const emit = defineEmits(["close", "submit", "delete"]);

const isEdit = computed(() => !!props.item?.id);

const draft = reactive({
  type: EventDetailType.CHURCH,
  eventDate: "",
  hour: "00",
  minute: "00",
  description: "",
  location: { name: "", address: "", lat: null, lng: null, placeId: null },
});

const errors = reactive({ type: "" });
const validationError = ref("");

watch(
  () => props.open,
  (v) => {
    if (!v) return;

    validationError.value = "";
    errors.type = "";

    if (props.item) {
      draft.type = props.item.type ?? EventDetailType.CHURCH;
      draft.eventDate = props.item.eventDate ?? "";
      draft.description = props.item.description ?? "";

      if (props.item.time) {
        const [sh, sm] = props.item.time.split(":");
        draft.hour = (sh ?? "00").padStart(2, "0");
        draft.minute = (sm ?? "00").padStart(2, "0");
      } else {
        draft.hour = "00";
        draft.minute = "00";
      }

      const loc = props.item.location ?? {};
      draft.location = {
        name: loc.name ?? "",
        address: loc.addressLine ?? "",
        lat: loc.latitude ?? null,
        lng: loc.longitude ?? null,
        placeId: loc.placeId ?? null,
      };
    } else {
      draft.type = availableTypes.value[0] ?? EventDetailType.CHURCH;
      draft.eventDate = "";
      draft.hour = "00";
      draft.minute = "00";
      draft.description = "";
      draft.location = { name: "", address: "", lat: null, lng: null, placeId: null };
    }
  }
);

function validate() {
  validationError.value = "";
  errors.type = draft.type ? "" : t("eventDetail.errors.typeRequired");
  return !errors.type;
}

function submit() {
  if (!validate()) return;

  const loc = draft.location || {};
  const hasLocation = loc.name || loc.address || loc.lat != null;

  const payload = {
    type: draft.type,
    eventDate: draft.eventDate || null,
    time: `${draft.hour}:${draft.minute}`,
    description: draft.description || null,
    location: hasLocation
      ? {
          name: loc.name || null,
          type: "VENUE",
          addressLine: loc.address || null,
          latitude: loc.lat,
          longitude: loc.lng,
          isActive: true,
        }
      : null,
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

.two {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.time-selects {
  display: flex;
  align-items: center;
  gap: 6px;
}

.time-selects .input {
  flex: 1;
  text-align: center;
}

.time-sep {
  font-weight: 700;
  font-size: 16px;
  color: var(--neutral-500);
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

@media (max-width: 600px) {
  .two {
    grid-template-columns: 1fr;
  }
}
</style>
