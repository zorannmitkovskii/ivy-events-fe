<template>
  <div class="event-upload-page">
    <EventHeader
      title="Summer Beach Party 2024"
      date="June 15, 2024"
    />

    <MediaUploader @uploaded="onUploaded" />

    <UploadNotice />
  </div>
</template>

<script setup>

import EventHeader from "@/components/event/upload/EventHeader.vue";
import UploadNotice from "@/components/event/upload/UploadNotice.vue";
import MediaUploader from "@/components/MediaUploader.vue";

const eventId = 'evt_123456'

const onUploaded = (files) => {
  console.log('Uploaded files:', files)
}
</script>

<style scoped>
.event-upload-page {
  min-height: 100vh;
  background: #f5fbf8;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 48px 16px;
}
</style>
