<template>
  <section class="faqwrap" id="faq">
    <div class="intro">
      <p class="tag">{{ t('home.faq.subtitle') }}</p>
      <h2>{{ t('home.faq.title') }}</h2>
    </div>

    <div class="faqlist">
      <article
        v-for="(item, idx) in faqs"
        :key="idx"
        :class="{ open: openIdx === idx }"
      >
        <button
          type="button"
          :aria-expanded="openIdx === idx ? 'true' : 'false'"
          @click="toggle(idx)"
        >
          <span>{{ item.question }}</span>
          <b aria-hidden="true">{{ openIdx === idx ? '−' : '+' }}</b>
        </button>
        <p>{{ item.answer }}</p>
      </article>
    </div>
  </section>
</template>

<script setup>
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';

const { tm, t } = useI18n();
const faqs = tm('homepageFaqs') || [];
const openIdx = ref(0);

function toggle(idx) {
  openIdx.value = openIdx.value === idx ? -1 : idx;
}
</script>

<style scoped>
/*
  `.faqlist` and its open/closed transition are the design's, in
  `ivy/site.css`. Only the surrounding band is local: the design's FAQ lives
  on its own page under a `pagehero`, and on the home page it has to sit
  between two coloured sections instead.
*/
.faqwrap {
  background: var(--paper);
  /*
    A block formatting context, so `.faqlist`'s 120px bottom margin stays
    inside the band. Without it that margin collapses straight out through the
    section, and the space it was meant to put under the questions appears
    BELOW the paper instead — as a 120px strip of the page's cream between the
    FAQ and the closing call to action.

    The margin is right where it is: on the FAQ page the list sits directly on
    the page and that space is the section's own. Here the section has a
    background, so the space has to be inside it.
  */
  display: flow-root;
}

.faqwrap .intro {
  padding-bottom: 0;
}

.faqwrap .faqlist {
  margin-top: 40px;
}

/*
  The answers are long — several are five or six lines — and the design's
  180px cap on an open panel clipped them mid-sentence. Height has to be a
  fixed number for the transition to run at all, so this is a ceiling generous
  enough for the longest answer in the bundle rather than an auto height.
*/
.faqwrap .faqlist article.open > p {
  max-height: 420px;
}
</style>
