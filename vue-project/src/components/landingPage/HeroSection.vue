<template>
  <section class="hero" id="top">
    <div class="copy">
      <p class="tag">{{ $t('home.hero.pill') }}</p>

      <h1>
        {{ $t('home.hero.titleLine1') }} <em>{{ $t('home.hero.titleAccent1') }}</em><br>
        {{ $t('home.hero.titleLine2') }} <em>{{ $t('home.hero.titleAccent2') }}</em> {{ $t('home.hero.titleLine3') }}
      </h1>

      <p class="lead">{{ $t('home.hero.subtitle') }}</p>

      <div class="cta">
        <router-link :to="resolvedPrimaryTo" class="btn">
          {{ $t('home.hero.primaryCta') }} ↗
        </router-link>
        <router-link :to="resolvedSecondaryTo" class="link">
          {{ $t('home.hero.secondaryCta') }} ↓
        </router-link>
      </div>

      <p class="rating">
        <b>★★★★★ {{ $t('home.hero.ratingScore') }}</b> · {{ $t('home.hero.ratingSource') }}
      </p>
    </div>

    <!--
      The invitation, floating, with two live-looking chips beside it. It is
      decoration and says so: `aria-hidden`, because a screen reader reading
      out a fictional couple's RSVP count between the headline and the call to
      action would be reading out a picture.
    -->
    <div class="stage" aria-hidden="true">
      <div class="invite">
        <small>{{ $t('home.hero.cardLabel') }}</small>
        <strong>{{ cardFirstName }} <i>&</i><br>{{ cardSecondName }}</strong>
        <hr>
        <span>{{ $t('home.hero.cardDate') }}<br>{{ $t('home.hero.cardLocation') }}</span>
        <button type="button" tabindex="-1">{{ $t('home.hero.cardCta') }}</button>
      </div>

      <div class="float f1">
        <b>● {{ $t('home.hero.chipConfirm') }}</b>
        <small>{{ $t('home.hero.chipConfirmSub') }}</small>
      </div>

      <div class="float f2">
        <b>{{ $t('home.hero.chipGuestsCount') }}</b>
        <small>{{ $t('home.hero.chipGuestsSub') }}</small>
        <i></i>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed } from "vue";
import { useRoute } from "vue-router";
import { useI18n } from "vue-i18n";

const route = useRoute();
const { t } = useI18n();
const lang = computed(() => route.params.lang || "mk");

const props = defineProps({
  primaryTo: { type: [String, Object], default: null },
  secondaryTo: { type: [String, Object], default: null }
});

const resolvedPrimaryTo = computed(() =>
  props.primaryTo || { name: 'signup', params: { lang: lang.value } }
);

const resolvedSecondaryTo = computed(() =>
  props.secondaryTo || { name: 'EventInvitationsPage', params: { lang: lang.value } }
);

/*
  The mock sets the two names on their own lines around a gold ampersand, and
  `home.hero.cardNames` is one string — "Ана & Марко" — in three locales. Split
  it here rather than adding two more keys, so a translator still edits the
  couple as one phrase. A name with no ampersand simply fills the first line.
*/
const cardNames = computed(() => String(t('home.hero.cardNames')).split("&"));
const cardFirstName = computed(() => (cardNames.value[0] || "").trim());
const cardSecondName = computed(() => (cardNames.value[1] || "").trim());
</script>
