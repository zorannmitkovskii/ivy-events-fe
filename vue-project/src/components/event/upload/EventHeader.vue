<template>
  <header class="event-header">
    <div class="icon">📷</div>
    <h1>{{ title }}</h1>
    <p class="date">{{ date }}</p>
    <p class="subtitle">Share your memories with everyone ✨</p>
  </header>
</template>

<script setup>
defineProps({
  title: String,
  date: String
})
</script>

<style scoped>
.event-header {
  text-align: center;
  margin-bottom: 32px;
}

.icon {
  background: #4AB37E;
  color: white;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12px;
}

h1 {
  font-size: 28px;
  font-weight: 700;
}

.date {
  color: #6b7280;
  margin-top: 4px;
}

.subtitle {
  margin-top: 8px;
  color: #374151;
}
</style>
