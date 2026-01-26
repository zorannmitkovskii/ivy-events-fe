<template>
  <div class="modal fade" ref="modalRef" tabindex="-1">
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content card-rounded">

        <!-- HEADER -->
        <div class="modal-header bg-brand-dark text-brand-light">
          <h5 class="modal-title">{{ title }}</h5>
          <button type="button" class="btn-close" @click="close"></button>
        </div>

        <!-- BODY -->
        <div class="modal-body">
          <form @submit.prevent="handleSubmit">
            <div v-for="field in fields" :key="field.name" class="mb-3">

              <!-- TEXT INPUT -->
              <div v-if="field.type === 'text' || field.type === 'number'">
                <label class="form-label text-brand-dark">{{ field.label }}</label>
                <input
                  :type="field.type"
                  class="form-control"
                  v-model="formData[field.name]"
                  :placeholder="field.placeholder || ''"
                  :required="field.required || false"
                />
              </div>

              <!-- SELECT INPUT -->
              <div v-else-if="field.type === 'select'">
                <label class="form-label text-brand-dark">{{ field.label }}</label>
                <select
                  class="form-select"
                  v-model="formData[field.name]"
                  :required="field.required || false"
                >
                  <option value="" disabled>Select...</option>
                  <option
                    v-for="opt in field.options"
                    :key="opt.value"
                    :value="opt.value"
                  >
                    {{ opt.label }}
                  </option>
                </select>
              </div>

              <!-- TEXTAREA -->
              <div v-else-if="field.type === 'textarea'">
                <label class="form-label text-brand-dark">{{ field.label }}</label>
                <textarea
                  class="form-control"
                  rows="3"
                  v-model="formData[field.name]"
                ></textarea>
              </div>

            </div>

            <!-- FOOTER BUTTONS -->
            <div class="text-end mt-4">
              <button type="button" class="btn btn-secondary me-2" @click="close">
                Cancel
              </button>

              <button type="submit" class="btn btn-main bg-brand-dark border-0">
                {{ submitLabel }}
              </button>
            </div>
          </form>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { Modal } from 'bootstrap'

const props = defineProps({
  title: String,
  submitLabel: { type: String, default: "Save" },
  fields: { type: Array, required: true }, // [{ name, label, type, placeholder }]
})

const emit = defineEmits(["submit"])

const modalRef = ref(null)
let modal = null

const formData = reactive({})

onMounted(() => {
  modal = new Modal(modalRef.value)
  props.fields.forEach(f => formData[f.name] = "")
})

function open() {
  modal.show()
}

function close() {
  modal.hide()
}

function handleSubmit() {
  emit("submit", { ...formData })
  close()
}

defineExpose({ open, close })
</script>

<style scoped>
.card-rounded {
  border-radius: 14px;
}

.btn-main {
  background-color: var(--logo-brown) !important;
}

.btn-main:hover {
  background-color: #734f31 !important;
}

.text-brand-dark {
  color: var(--logo-brown) !important;
}
</style>
