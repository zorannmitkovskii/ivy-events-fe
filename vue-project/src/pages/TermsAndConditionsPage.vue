<template>
  <div class="terms-page">
    <Header />

    <!-- Hero -->
    <section class="hero">
      <div class="hero-inner">
        <span class="hero-eyebrow">Legal</span>
        <h1 class="hero-title">{{ $t('terms.title') }}</h1>
        <p class="hero-updated">{{ $t('terms.lastUpdated') }}</p>
      </div>
    </section>

    <!-- Content -->
    <section class="content-wrap">
      <aside class="toc">
        <nav class="toc-nav">
          <span class="toc-label">Contents</span>
          <a
            v-for="(key, i) in sectionKeys"
            :key="key"
            :href="`#section-${key}`"
            class="toc-link"
            :class="{ active: activeSection === key }"
            @click.prevent="scrollTo(key)"
          >
            <span class="toc-num">{{ String(i + 1).padStart(2, '0') }}</span>
            {{ $t(`terms.sections.${key}.title`) }}
          </a>
        </nav>
      </aside>

      <div class="terms-body">
        <p class="terms-intro">{{ $t('terms.intro') }}</p>

        <div
          v-for="(key, i) in sectionKeys"
          :key="key"
          :id="`section-${key}`"
          class="terms-section"
        >
          <div class="section-marker">
            <span class="section-num">{{ String(i + 1).padStart(2, '0') }}</span>
            <div class="section-line"></div>
          </div>
          <div class="section-content">
            <h2 class="section-title">{{ $t(`terms.sections.${key}.title`) }}</h2>
            <p class="section-text">{{ $t(`terms.sections.${key}.text`) }}</p>
          </div>
        </div>
      </div>
    </section>

    <Footer />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import Header from "@/components/header/Header.vue";
import Footer from "@/components/layout/Footer.vue";

const sectionKeys = [
  "acceptance",
  "services",
  "accounts",
  "payment",
  "content",
  "liability",
  "changes",
  "contact",
];

const activeSection = ref(sectionKeys[0]);

function scrollTo(key) {
  const el = document.getElementById(`section-${key}`);
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
}

let observer;
onMounted(() => {
  observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          activeSection.value = entry.target.id.replace("section-", "");
        }
      }
    },
    { rootMargin: "-20% 0px -60% 0px" }
  );
  sectionKeys.forEach((key) => {
    const el = document.getElementById(`section-${key}`);
    if (el) observer.observe(el);
  });
});

onUnmounted(() => {
  if (observer) observer.disconnect();
});
</script>

<style scoped>
.terms-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: #fafaf9;
}

/* ===== Hero ===== */
.hero {
  background: linear-gradient(160deg, var(--brand-main, #334338) 0%, #1a2b20 100%);
  padding: 100px 24px 72px;
  text-align: center;
}

.hero-inner {
  max-width: 680px;
  margin: 0 auto;
}

.hero-eyebrow {
  display: inline-block;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--brand-gold, #c4956a);
  margin-bottom: 16px;
}

.hero-title {
  font-family: 'Cormorant Garamond', serif;
  font-size: clamp(2rem, 5vw, 3rem);
  font-weight: 400;
  color: #fff;
  margin: 0 0 12px;
  line-height: 1.15;
}

.hero-updated {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.5);
  margin: 0;
}

/* ===== Content layout ===== */
.content-wrap {
  max-width: 1060px;
  margin: 0 auto;
  padding: 56px 24px 80px;
  display: flex;
  gap: 56px;
  flex: 1;
}

/* ===== Table of Contents ===== */
.toc {
  position: sticky;
  top: 100px;
  align-self: flex-start;
  width: 220px;
  flex-shrink: 0;
}

.toc-nav {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.toc-label {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--brand-gold, #c4956a);
  margin-bottom: 12px;
}

.toc-link {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 13px;
  color: #6b7280;
  text-decoration: none;
  transition: all 0.2s;
  line-height: 1.3;
}

.toc-link:hover {
  color: var(--brand-main, #334338);
  background: rgba(51, 67, 56, 0.04);
}

.toc-link.active {
  color: var(--brand-main, #334338);
  background: rgba(51, 67, 56, 0.06);
  font-weight: 600;
}

.toc-num {
  font-size: 11px;
  font-weight: 700;
  color: var(--brand-gold, #c4956a);
  font-variant-numeric: tabular-nums;
  flex-shrink: 0;
  width: 20px;
}

/* ===== Terms Body ===== */
.terms-body {
  flex: 1;
  min-width: 0;
}

.terms-intro {
  font-size: 1.0625rem;
  color: #4b5563;
  line-height: 1.75;
  margin: 0 0 48px;
  padding-bottom: 32px;
  border-bottom: 1px solid #e5e7eb;
}

.terms-section {
  display: flex;
  gap: 24px;
  margin-bottom: 40px;
  scroll-margin-top: 100px;
}

.section-marker {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding-top: 4px;
  flex-shrink: 0;
  width: 28px;
}

.section-num {
  font-size: 12px;
  font-weight: 700;
  color: var(--brand-gold, #c4956a);
  font-variant-numeric: tabular-nums;
}

.section-line {
  width: 1px;
  flex: 1;
  background: #e5e7eb;
  min-height: 20px;
}

.section-content {
  flex: 1;
  min-width: 0;
}

.section-title {
  font-family: 'Cormorant Garamond', serif;
  font-size: 1.375rem;
  font-weight: 500;
  color: var(--brand-main, #334338);
  margin: 0 0 10px;
  line-height: 1.3;
}

.section-text {
  font-size: 0.9375rem;
  color: #4b5563;
  line-height: 1.8;
  margin: 0;
}

/* ===== Responsive ===== */
@media (max-width: 900px) {
  .toc {
    display: none;
  }

  .content-wrap {
    padding: 36px 20px 60px;
  }
}

@media (max-width: 640px) {
  .hero {
    padding: 72px 20px 48px;
  }

  .terms-section {
    gap: 16px;
  }

  .section-marker {
    width: 22px;
  }

  .section-title {
    font-size: 1.2rem;
  }

  .terms-intro {
    font-size: 0.9375rem;
    margin-bottom: 32px;
    padding-bottom: 24px;
  }
}
</style>
