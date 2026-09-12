<template>
  <!--
    The redesign's split auth page: an invitation and a line about planning on
    the left, the form on the right. It replaces the centred card on a blurred
    blob background — the card is gone entirely, the form sits directly on the
    paper, and below 900px the whole left half is dropped rather than stacked,
    because a decorative panel above the fold is what a small screen has least
    room for.
  -->
  <div class="ivy-site">
    <main class="authpage">
      <router-link :to="`/${lang}`" class="brand">
        <span class="ivy-logo authbrand" role="img" aria-label="Ivy Events"></span>
      </router-link>

      <section class="authvisual" aria-hidden="true">
        <div class="authinvite">
          <small>{{ $t('auth.common.visualLabel') }}</small>
          <strong>{{ cardFirstName }} <i>&</i> {{ cardSecondName }}</strong>
          <span>{{ $t('auth.common.visualDate') }}</span>
        </div>
        <blockquote>{{ $t('auth.common.visualQuote') }}</blockquote>
      </section>

      <section class="authform">
        <slot />
      </section>
    </main>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { useRoute } from "vue-router";
import { useI18n } from "vue-i18n";

const route = useRoute();
const { t } = useI18n();
const lang = computed(() => route.params.lang || "mk");

// Same split as the hero card: the couple is one translated phrase, and the
// design sets the two halves around a gold ampersand.
const names = computed(() => String(t('home.hero.cardNames')).split("&"));
const cardFirstName = computed(() => (names.value[0] || "").trim());
const cardSecondName = computed(() => (names.value[1] || "").trim());
</script>

<style scoped>
.authbrand {
  --logo-h: 26px;
}

/* The form column holds a title block, a form and a footer link, and the
   design's `.authform` centres them as siblings. The slot introduces no
   wrapper of its own, so they stay direct children and that still holds. */
.authform :deep(form) {
  display: grid;
  gap: 14px;
}
</style>
