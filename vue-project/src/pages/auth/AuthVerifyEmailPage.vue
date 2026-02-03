<template>
  <AuthShell>
    <AuthCard>
      <AuthBrandHeader :title="$t('auth.brand')" />

      <AuthCardTitle
        :title="$t('auth.verify.title')"
        :subtitle="$t('auth.verify.subtitle', { email })"
      />
      <form class="auth-form">
        <AuthInput v-model="code" @complete="onVerify"  label=""/>

        <ButtonMain
          :label="$t('auth.verify.cta')"
          to="#"
          variant="main"
          @click.prevent="onVerify"
        />
      </form>



      <div class="auth-links">
        <button class="link" type="button" @click="onResend">
          {{ $t('auth.verify.resend') }}
        </button>

        <button class="link" type="button" @click="onChangeEmail">
          {{ $t('auth.verify.changeEmail') }}
        </button>
      </div>
    </AuthCard>
  </AuthShell>
</template>

<script setup>
import { ref } from "vue";
import ButtonMain from "@/components/generic/ButtonMain.vue";
import AuthShell from "@/components/auth/AuthShell.vue";
import AuthCardTitle from "@/components/auth/AuthCardTitle.vue";
import AuthCard from "@/components/auth/AuthCard.vue";
import AuthInput from "@/components/auth/AuthInput.vue";

const email = ref("label@example.com"); // replace with real state/router param
const code = ref("");

function onVerify() {
  // call API verify
  console.log("verify code", code.value);
}

function onResend() {
  console.log("resend code");
}

function onChangeEmail() {
  console.log("change email");
}
</script>

<style scoped>
.auth-links {
  display: grid;
  gap: 10px;
  margin-top: 12px;
  justify-items: center;
}

.link {
  background: transparent;
  border: 0;
  color: var(--brand-main);
  font-weight: 600;
  cursor: pointer;
  text-decoration: underline;
  text-underline-offset: 4px;
}
</style>
