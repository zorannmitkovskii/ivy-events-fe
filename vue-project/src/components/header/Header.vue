<template>
  <nav class="navbar navbar-expand-lg navbar-light bg-brand-light shadow-sm py-3">
    <div class="container">
      <BrandLogo />
      <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
        <span class="navbar-toggler-icon"></span>
      </button>

      <div class="collapse navbar-collapse" id="navbarNav">
        <ul class="navbar-nav ms-auto align-items-lg-center">
          <NavLinks />
          <LoginButton />
          <SignUpButton />
        </ul>
      </div>
    </div>
  </nav>
</template>

<script setup>
import NavLinks from './NavLinks.vue'
import LoginButton from './LoginButton.vue'
import BrandLogo from './BrandLogo.vue'
import SignUpButton from "@/components/header/SignUpButton.vue";
</script>
