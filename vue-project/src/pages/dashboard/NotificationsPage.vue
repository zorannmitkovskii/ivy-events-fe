<template>
  <div class="page">
    <PageHeader title="Notifications" subtitle="Send updates and RSVPs to your guests">
      <template #actions>
        <Button variant="primary">New Notification</Button>
      </template>
    </PageHeader>
    <div class="placeholder">This is a placeholder for notifications. Implement templates and composer here.</div>
  </div>
</template>

<script setup>
import PageHeader from '@/components/layout/PageHeader.vue'
import Button from '@/components/ui/Button.vue'
</script>

<style scoped>
.page { display: grid; gap: 14px; }
.placeholder { padding: 16px; border: 1px dashed #c9c9c9; border-radius: 12px; background: #fff; }
</style>
