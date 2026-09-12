<template>
  <SitePage>
    <section class="page-hero">
      <div class="wrap">
        <h1>{{ $t('packages.heroTitle') }}</h1>
        <p class="lead">{{ $t('packages.heroLead') }}</p>
        <div class="row">
          <a class="btn btn-ghost" href="#gallery-plans">{{ $t('packages.gallery.jump') }}</a>
          <a class="btn btn-ghost" href="#compare">{{ $t('packages.compare.jump') }}</a>
        </div>
      </div>
    </section>

    <!--
      The same component the landing page uses, rather than a second copy. This
      page and the pricing block on the home page had drifted into two
      implementations of one thing — same API call, same card, different markup
      — and only one of them ever got fixed.
    -->
    <PackagesSection id="invitation-plans" />

    <section class="section band" id="gallery-plans">
      <div class="wrap">
        <div>
          <h2>{{ $t('packages.gallery.title') }}</h2>
          <p style="margin-top: 18px; font-size: 18px">{{ $t('packages.gallery.text') }}</p>
          <router-link class="btn btn-light" :to="{ name: 'signup', params: { lang } }">
            {{ $t('packages.gallery.cta') }}
          </router-link>
        </div>

        <div class="gal-tiers">
          <div v-for="tier in galleryTiers" :key="tier.size" class="tier" :class="{ featured: tier.featured }">
            <span v-if="tier.featured" class="badge-gold">
              <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="m12 2 2.9 6.3 6.9.8-5.1 4.7 1.4 6.8L12 17.3l-6.1 3.3 1.4-6.8L2.2 9.1l6.9-.8Z" />
              </svg>{{ $t('packages.gallery.mostChosen') }}
            </span>
            <b>{{ tier.size }}</b>
            <strong>{{ tier.name }}</strong>
            <span>{{ $t(tier.noteKey) }}</span>
            <router-link
              class="btn btn-sm"
              :class="tier.featured ? 'btn-gold' : 'btn-light'"
              :to="{ name: 'signup', params: { lang } }"
            >{{ $t('packages.gallery.choose') }}</router-link>
          </div>
        </div>
      </div>
    </section>

    <section class="section" id="compare">
      <div class="wrap">
        <div class="section-head">
          <h2>{{ $t('packages.compare.title') }}</h2>
          <p>{{ $t('packages.compare.lead') }}</p>
        </div>

        <!-- The table scrolls inside its own box rather than pushing the page
             sideways on a phone, which is what `.compare-wrap` is for. -->
        <div class="compare-wrap">
          <table class="compare">
            <thead>
              <tr>
                <th>{{ $t('packages.compare.feature') }}</th>
                <th>Basic</th>
                <th class="pro">Pro<span>{{ $t('packages.popular') }}</span></th>
                <th>Premium</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in compareRows" :key="row.labelKey">
                <td>{{ $t(row.labelKey) }}</td>
                <td v-for="(has, i) in row.plans" :key="i" :class="{ no: !has }">
                  <svg v-if="has" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true">
                    <path d="m5 12.5 4.5 4.5L19 7.5" />
                  </svg>
                  <span v-else aria-hidden="true">—</span>
                  <span class="sr-only">{{ has ? $t('packages.compare.included') : $t('packages.compare.notIncluded') }}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>

    <section class="section" style="padding-top: 0">
      <div class="wrap">
        <div class="split">
          <div class="section-head" style="margin: 0">
            <h2>{{ $t('packages.faq.title') }}</h2>
          </div>
          <div>
            <details v-for="(item, idx) in faqs" :key="item.qKey" :open="idx === 0">
              <summary>{{ $t(item.qKey) }}</summary>
              <p>{{ $t(item.aKey) }}</p>
            </details>
          </div>
        </div>
      </div>
    </section>

    <section class="section final">
      <div class="wrap">
        <div>
          <h2>{{ $t('packages.finalTitle') }}</h2>
          <p>{{ $t('packages.finalBody') }}</p>
        </div>
        <router-link class="btn btn-primary" :to="{ name: 'signup', params: { lang } }">
          {{ $t('header.actions.createInvitation') }}
        </router-link>
      </div>
    </section>
  </SitePage>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import SitePage from '@/layouts/SitePage.vue'
import PackagesSection from '@/components/landingPage/PackagesSection.vue'

const route = useRoute()
const lang = computed(() => route.params.lang || 'mk')

/*
  Sizes and names are the product's, not a translator's — "3 GB" and "Gallery
  Plus" read the same in every locale, and only the one-line note under each
  changes.
*/
const galleryTiers = [
  { size: '1 GB', name: 'Gallery Basic', noteKey: 'packages.gallery.tierSmall' },
  { size: '3 GB', name: 'Gallery Plus', noteKey: 'packages.gallery.tierMedium', featured: true },
  { size: '10 GB', name: 'Gallery Premium', noteKey: 'packages.gallery.tierLarge' },
]

const compareRows = [
  { labelKey: 'packages.compare.invitation', plans: [true, true, true] },
  { labelKey: 'packages.compare.guestList', plans: [true, true, true] },
  { labelKey: 'packages.compare.allDesigns', plans: [false, true, true] },
  { labelKey: 'packages.compare.seating', plans: [false, true, true] },
  { labelKey: 'packages.compare.menu', plans: [false, true, true] },
  { labelKey: 'packages.compare.printed', plans: [false, true, true] },
  { labelKey: 'packages.compare.advancedTasks', plans: [false, false, true] },
  { labelKey: 'packages.compare.notifications', plans: [false, false, true] },
  { labelKey: 'packages.compare.prioritySupport', plans: [false, false, true] },
]

const faqs = [
  { qKey: 'packages.faq.upgradeQ', aKey: 'packages.faq.upgradeA' },
  { qKey: 'packages.faq.twoEventsQ', aKey: 'packages.faq.twoEventsA' },
  { qKey: 'packages.faq.printedQ', aKey: 'packages.faq.printedA' },
  { qKey: 'packages.faq.invoiceQ', aKey: 'packages.faq.invoiceA' },
]
</script>

<style scoped>
/* A cell says "included" or "not included" to a screen reader; the tick and
   the dash say it to everyone else. The design has only the glyphs, which
   read as nothing at all out loud. */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}
</style>
