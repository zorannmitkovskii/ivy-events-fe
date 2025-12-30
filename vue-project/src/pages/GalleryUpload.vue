<template>
  <DashboardLayout>
    <div class="container py-4">
      <h1 class="text-brand-dark mb-4">Upload Media</h1>

      <MediaUploader @uploaded="handleUploaded" />
    </div>
  </DashboardLayout>
</template>

<script setup>
import MediaUploader from "@/components/MediaUploader.vue"
import DashboardLayout from "@/components/userDashboard/dashboard/DashboardLayout.vue";

const handleUploaded = (uploadedFiles) => {
  console.log("Files uploaded:", uploadedFiles)
}
</script>
