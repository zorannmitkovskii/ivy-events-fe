<template>
  <div v-if="modelValue" class="modal fade show d-block" style="background:rgba(0,0,0,.4)">
    <div class="modal-dialog">
      <div class="modal-content">

        <div class="modal-header">
          <h5 class="modal-title">Edit User</h5>
          <button class="btn-close" @click="$emit('close')"></button>
        </div>

        <div class="modal-body">

          <label>Name</label>
          <input v-model="userCopy.name" class="form-control mb-3">

          <label>Email</label>
          <input v-model="userCopy.email" class="form-control mb-3">

          <label>Role</label>
          <select v-model="userCopy.role" class="form-select mb-3">
            <option>User</option>
            <option>Manager</option>
            <option>Admin</option>
          </select>

        </div>

        <div class="modal-footer">
          <button class="btn btn-secondary" @click="$emit('close')">Cancel</button>
          <button class="btn btn-primary" @click="save">Save</button>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, watch } from "vue"

const props = defineProps({
  modelValue: Boolean,
  user: Object
})

const emit = defineEmits(["close", "save"])

const userCopy = reactive({})

watch(() => props.user, val => {
  Object.assign(userCopy, val || {})
})

function save(){
  emit("save", {...userCopy})
}
</script>
