<template>
  <AuthLayout>
    <template #left>
      <div class="card">
        <AuthBrand name="Lumière Events" />

        <h1 class="title">Create your account</h1>
        <p class="subtitle">Begin planning your unforgettable celebration.</p>
        <div class="accent-line" aria-hidden="true"></div>

        <SocialAuthButton
          label="Continue with Google"
          icon-src="https://www.svgrepo.com/show/475656/google-color.svg"
          @click="onGoogle"
        />

        <AuthDivider label="Or continue with email" />

        <div class="form">
          <AuthInput v-model="fullName" label="Full Name" placeholder="Jane Doe">
            <template #icon>👤</template>
          </AuthInput>

          <AuthInput v-model="email" label="Email Address" placeholder="jane@example.com" type="email">
            <template #icon>✉️</template>
          </AuthInput>

          <AuthInput v-model="password" label="Password" placeholder="••••••••" type="password">
            <template #icon>🔒</template>
          </AuthInput>

          <AuthInput v-model="confirmPassword" label="Confirm Password" placeholder="••••••••" type="password">
            <template #icon>✅</template>
          </AuthInput>

          <AuthCheckbox v-model="agree">
            I agree to the <a href="/terms">Terms of Service</a> and <a href="/privacy">Privacy Policy</a>
          </AuthCheckbox>

          <!-- Use your ButtonMain (RouterLink) -->
          <ButtonMain
            label="Create Account"
            to="/register"
            variant="main"
            class="cta"
          />

          <p class="signin">
            Already have an account?
            <RouterLink to="/login">Sign in</RouterLink>
          </p>

          <div class="bottom-links">
            <a href="/help">Help</a>
            <span>•</span>
            <a href="/contact">Contact</a>
          </div>
        </div>
      </div>
    </template>

    <template #right>
      <RightPromoPanel
        title="Планирајте го вашиот совршен ден"
        subtitle="Од списоци на гости до распоред на седење, управувајте со секој детал на вашата свадба на едно место."
        :items="[
      'Креирајте прекрасни венчални веб-страници',
      'Управувајте со листата на гости лесно',
      'Дизајнирајте совршен распоред на седење',
      'Соработувајте со вашиот партнер',
      'Најдете и резервирајте доверливи добавувачи'
    ]"
        background-url="/images/wedding-bg.jpg"
      />
    </template>
  </AuthLayout>
</template>

<script setup>
import { ref } from "vue";
import { RouterLink } from "vue-router";

import AuthLayout from "@/components/layout/AuthLayout.vue";
import AuthBrand from "@/components/auth/AuthBrand.vue";
import SocialAuthButton from "@/components/auth/SocialAuthButton.vue";
import AuthDivider from "@/components/auth/AuthDivider.vue";
import AuthInput from "@/components/auth/AuthInput.vue";
import AuthCheckbox from "@/components/auth/AuthCheckbox.vue";

import ButtonMain from "@/components/generic/ButtonMain.vue";
import RightPromoPanel from "@/components/auth/RightPromoPanel.vue";

const fullName = ref("");
const email = ref("");
const password = ref("");
const confirmPassword = ref("");
const agree = ref(false);

function onGoogle() {
  // trigger your oauth flow here
  console.log("google");
}
</script>

<style scoped>
.card {
  width: 100%;
  max-width: 420px;
}

.title {
  font-family: var(--font-family, inherit), serif;
  font-size: 42px;
  line-height: 1.1;
  margin: 8px 0 6px;
  color: var(--neutral-900);
  font-weight: 500;
}

.subtitle {
  margin: 0 0 12px;
  color: var(--neutral-700);
  font-size: 14px;
}

.accent-line {
  width: 34px;
  height: 3px;
  background: var(--brand-gold);
  border-radius: 99px;
  margin: 10px 0 18px;
}

.form {
  display: grid;
  gap: 14px;
}

.cta {
  width: 100%;
  justify-content: center;
}

.signin {
  margin: 6px 0 0;
  font-size: 12px;
  color: rgba(51, 67, 56, 0.7);
  text-align: center;
}

.signin a {
  color: var(--neutral-900);
  font-weight: 700;
  text-decoration: none;
}

.signin a:hover {
  text-decoration: underline;
}

.bottom-links {
  margin-top: 10px;
  display: flex;
  justify-content: center;
  gap: 12px;
  font-size: 12px;
  color: rgba(51, 67, 56, 0.55);
}

.bottom-links a {
  color: rgba(51, 67, 56, 0.75);
  text-decoration: none;
}

.bottom-links a:hover {
  text-decoration: underline;
}
</style>
