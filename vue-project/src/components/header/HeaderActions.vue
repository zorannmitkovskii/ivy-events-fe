<template>
  <div class="actions desktop-actions">
    <ButtonOutline
      label="Sign In"
      to="/login"
    />
    <ButtonPrimary
      label="Get Started"
      to="/register"
    />
  </div>
</template>

<script setup>
import ButtonOutline from "@/components/header/ButtonOutline.vue";
import ButtonPrimary from "@/components/header/ButtonPrimary.vue";
</script>

<style scoped>
.actions {
  display: flex;
  gap: 12px;
}
</style>
