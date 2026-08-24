<template>
  <!--
    Not a card any more. The redesign puts the auth form straight onto the
    paper of the right-hand column — no white panel, no gold top rule, no
    shadow — so this component is now only the grouping the pages already
    expect plus the footer line under the form.
  -->
  <div class="auth-body">
    <slot />
  </div>
  <p v-if="$slots.footer" class="authalt">
    <slot name="footer" />
  </p>
</template>

<script setup></script>

<style scoped>
.auth-body {
  display: contents;
}

.authalt {
  margin-top: 26px;
  text-align: center;
  font: 13px/1.7 var(--font-display);
  color: var(--ink-3);
}
</style>
