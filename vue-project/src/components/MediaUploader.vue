<template>
  <div>
    <!-- upload area -->
    <div
      class="border rounded bg-light text-center p-5"
      @dragover.prevent
      @drop.prevent="handleDrop"
      @dragenter.prevent
    >
      <input
        ref="fileInput"
        type="file"
        accept="image/*,video/*"
        multiple
        class="d-none"
        @change="handleSelect"
      />

      <p class="mb-3">Drag & drop images/videos here</p>

      <button class="btn btn-outline-secondary" @click="openFileDialog">
        Browse Files
      </button>
    </div>
    <!-- Preview -->
    <div class="row mt-4">
      <div v-for="p in previews" :key="p.src" class="col-md-4 mb-3">

        <!-- image -->
        <img
          v-if="p.type === 'image'"
          :src="p.src"
          class="img-fluid rounded"
        />

        <!-- video -->
        <video
          v-else
          width="100%"
          controls
          class="rounded">
          <source :src="p.src" />
        </video>

      </div>
    </div>
    <!-- Selected preview list -->
    <div class="mt-4" v-if="files.length">
      <h5>Files selected ({{ files.length }})</h5>

      <ul class="list-group">
        <li v-for="(file, index) in files" :key="index" class="list-group-item">
          {{ file.name }}
        </li>
      </ul>

      <!-- upload button -->
      <button
        class="btn btn-primary mt-3"
        @click="uploadFiles"
        :disabled="uploading"
      >
        {{ uploading ? 'Uploading...' : 'Upload' }}
      </button>
    </div>
  </div>
</template>

<script setup>
import axios from "axios";
import { ref } from "vue";
import { baseUrl } from "../services/baseUrl";

const emit = defineEmits(["uploaded"]);

const files = ref([]);
const uploading = ref(false);
const fileInput = ref(null);

const openFileDialog = () => {
  fileInput.value.click();
};

const addFiles = (newFiles) => {
  const existingNames = new Set(files.value.map(f => f.name));

  newFiles.forEach(file => {
    if (!existingNames.has(file.name)) {
      files.value.push(file);
    }
  });
};

const handleSelect = (e) => {
  addFiles(Array.from(e.target.files));
  e.target.value = ""; // allow re-selecting same file
};

const handleDrop = (e) => {
  addFiles(Array.from(e.dataTransfer.files));
};

const uploadFiles = async () => {
  uploading.value = true;

  const formData = new FormData();
  files.value.forEach((f) => formData.append("files", f));

  try {
    const response = await axios.post(
      `${baseUrl}/api/media/upload`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

    emit("uploaded", response.data);
    files.value = []; // clear selection
  } finally {
    uploading.value = false;
  }
};
</script>
