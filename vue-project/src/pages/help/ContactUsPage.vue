<template>
  <!--  <ComingSoon />-->
  <Header />
  <ContactUsForm />
  <Footer />
  <router-view />
</template>

<script setup>
import Header from '@/components/header/Header.vue'
import ContactUsForm from "@/components/help/ContactUsForm.vue";
</script>

<style scoped>
</style>
