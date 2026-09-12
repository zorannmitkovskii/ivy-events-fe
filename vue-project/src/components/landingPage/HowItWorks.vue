<template>
  <section class="steps section" id="how" aria-labelledby="steps-title">
    <div class="wrap">
      <div class="section-head">
        <h2 id="steps-title">{{ $t('home.howItWorks.title') }}</h2>
      </div>

      <div class="steps-grid">
        <div v-for="step in steps" :key="step.titleKey" class="step reveal">
          <h3>{{ $t(step.titleKey) }}</h3>
          <p>{{ $t(step.descKey) }}</p>
          <span class="time">{{ $t(step.timeKey) }}</span>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { useReveal } from '@/composables/useReveal'

useReveal()

/*
  Three steps, not four.

  The previous version listed choose / customise / send / track, which reads as
  four because "customise" and "track" are the same work seen from two ends.
  The redesign says it in three and puts a time against each — the honest
  version of "in under 10 minutes", which the old subtitle claimed for the
  whole thing including entering a guest list.
*/
const steps = [
  {
    titleKey: 'home.howItWorks.steps.chooseDesign.title',
    descKey: 'home.howItWorks.steps.chooseDesign.description',
    timeKey: 'home.howItWorks.steps.chooseDesign.time',
  },
  {
    titleKey: 'home.howItWorks.steps.addDetails.title',
    descKey: 'home.howItWorks.steps.addDetails.description',
    timeKey: 'home.howItWorks.steps.addDetails.time',
  },
  {
    titleKey: 'home.howItWorks.steps.shareLink.title',
    descKey: 'home.howItWorks.steps.shareLink.description',
    timeKey: 'home.howItWorks.steps.shareLink.time',
  },
]
</script>
