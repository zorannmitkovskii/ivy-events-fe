<template>
  <section class="guest section" aria-labelledby="guest-title">
    <div class="wrap">
      <div class="section-head">
        <h2 id="guest-title">{{ $t('home.guest.title') }}</h2>
        <p>{{ $t('home.guest.subtitle') }}</p>
      </div>

      <div class="phones3">
        <!-- Left: what a guest sees when they send photographs back. -->
        <div class="phone sm">
          <div class="screen light">
            <div class="scr-top">
              ← {{ $t('home.guest.back') }}<span>{{ $t('home.guest.couple') }} · {{ $t('home.guest.sampleDate') }}</span>
            </div>
            <h3>{{ $t('home.guest.upload.title') }}</h3>
            <p class="sub">{{ $t('home.guest.upload.subtitle') }}</p>
            <label class="fld">
              <span>{{ $t('home.guest.upload.nameLabel') }}</span>
              <i>{{ $t('home.guest.upload.namePlaceholder') }}</i>
            </label>
            <div class="drop">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true">
                <rect x="3" y="4" width="18" height="16" rx="2" />
                <circle cx="9" cy="10" r="2" />
                <path d="m21 16-5-5-8 9" />
              </svg>
              <b>{{ $t('home.guest.upload.drop') }}</b>
              <small>{{ $t('home.guest.upload.formats') }}</small>
            </div>
            <span class="scr-btn">{{ $t('home.guest.upload.cta') }}</span>
            <p class="tiny">{{ $t('home.guest.upload.privacy') }}</p>
          </div>
        </div>

        <!--
          Middle: the invitation itself, sealed. Pressing the seal opens it —
          the one thing on this page a visitor is invited to do, and the whole
          point of the section, so it is a real button rather than a picture of
          one.
        -->
        <div class="phone">
          <div class="screen envelope" :class="{ open: opened }">
            <button type="button" class="seal-btn" :aria-label="$t('home.guest.openInvitation')" @click="opened = true">
              <span class="flap"></span>
              <span class="seal"><i>{{ $t('home.guest.seal') }}<small>&amp;</small>{{ $t('home.guest.sealTrail') }}</i></span>
              <span class="hint">{{ $t('home.guest.tapToOpen') }}</span>
            </button>

            <div class="opened" :aria-hidden="opened ? null : 'true'">
              <p class="kicker">{{ $t('home.guest.invite.kicker') }}</p>
              <p class="names">{{ $t('home.guest.coupleLead') }} <em>&amp;</em> {{ $t('home.guest.coupleTrail') }}</p>
              <p class="when">
                {{ $t('home.guest.invite.whenDate') }}<br />{{ $t('home.guest.invite.whenPlace') }}
              </p>
              <div class="cd">
                <div v-for="unit in COUNTDOWN" :key="unit.key">
                  <b>{{ unit.value }}</b>
                  <span>{{ $t(`home.guest.invite.${unit.key}`) }}</span>
                </div>
              </div>
              <span class="scr-btn">{{ $t('home.guest.invite.rsvp') }}</span>
              <button type="button" class="close-env" :tabindex="opened ? null : -1" @click="opened = false">
                {{ $t('home.guest.invite.close') }}
              </button>
            </div>
          </div>
        </div>

        <!-- Right: finding your table on the night. -->
        <div class="phone sm">
          <div class="screen light">
            <div class="scr-top"><span>{{ $t('home.guest.couple') }} · {{ $t('home.guest.sampleDate') }}</span></div>
            <h3>{{ $t('home.guest.seat.title') }}</h3>
            <p class="sub">{{ $t('home.guest.seat.subtitle') }}</p>
            <div class="srch">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <circle cx="11" cy="11" r="6" />
                <path d="m20 20-4.5-4.5" />
              </svg>{{ $t('home.guest.guestQuery') }}
            </div>
            <div class="found">
              <span class="tb"><small>{{ $t('home.guest.seat.table') }}</small>4</span>
              <div>
                <b>{{ $t('home.guest.guestName') }}</b>
                <small>{{ $t('home.guest.seat.where') }}</small>
              </div>
              <em>{{ $t('home.guest.seat.onMap') }}</em>
            </div>
            <p class="lbl">{{ $t('home.guest.seat.mapLabel') }}</p>
            <div class="map">
              <span class="stg">{{ $t('home.guest.seat.stage') }}</span>
              <i v-for="table in TABLES" :key="table" :class="{ me: table === MY_TABLE }">{{ table }}</i>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref } from 'vue'

/*
  Three phones: what a guest is handed, what they send back, and how they find
  their seat on the night.

  New with the standalone home page, and it is where the RSVP demo from the old
  hero went — the hero is now a category carousel, and the guest's side of the
  product earns a section of its own rather than a corner of the opening.

  Everything here is a fixed sample except the envelope, which really opens.
  The two side phones are screenshots drawn in HTML: their fields are `<span>`
  and `<i>`, not inputs, because a form a visitor can type into but never
  submit is worse than a picture of one.
*/

const MY_TABLE = 4
const TABLES = [1, 2, 3, 4, 5, 6, 7, 8]

const COUNTDOWN = [
  { key: 'days', value: '38' },
  { key: 'hours', value: '06' },
  { key: 'minutes', value: '14' },
]

const opened = ref(false)
</script>
