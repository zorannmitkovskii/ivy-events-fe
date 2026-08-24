<template>
  <div class="profile">
    <p v-if="loading" class="state">{{ t('directory.loading') }}</p>
    <p v-else-if="notFound" class="state">{{ t('vendorProfile.notFound') }}</p>

    <article v-else-if="vendor">
      <header class="head">
        <img v-if="vendor.logoKey" class="logo" :src="mediaSrc(vendor.logoKey)" :alt="vendor.name" />
        <div>
          <h1>{{ vendor.name }}</h1>
          <p class="meta">
            {{ t(`vendorType.${vendor.type}`, readable(vendor.type)) }}
            <template v-if="vendor.city"> · {{ vendor.city }}</template>
          </p>
          <p v-if="rating?.average" class="rating">
            ★ {{ rating.average.toFixed(1) }}
            <span class="rating-count">{{ t('vendorProfile.fromReviews', { n: rating.reviewCount }) }}</span>
          </p>
        </div>
      </header>

      <section v-if="vendor.description" class="block">
        <p class="description">{{ vendor.description }}</p>
      </section>

      <!-- The fields come from the server with the data, so one page renders
           any vendor type and the two cannot drift apart. -->
      <section v-if="detailFields.length" class="block">
        <h2>{{ t('vendorProfile.details') }}</h2>
        <dl class="details">
          <div v-for="field in detailFields" :key="field.key">
            <dt>{{ t(field.labelKey, readable(field.key)) }}</dt>
            <dd>{{ vendor.values[field.key] }}</dd>
          </div>
        </dl>
      </section>

      <!-- The ask. Placed above the links because sending an inquiry is what
           this page is for, and an Instagram link is where a visitor leaves. -->
      <section class="block">
        <button v-if="!inquiryOpen && !inquirySent" class="btn" @click="inquiryOpen = true">
          {{ t('inquiry.contact') }}
        </button>

        <p v-if="inquirySent" class="sent" role="status">{{ t('inquiry.sent') }}</p>

        <form v-if="inquiryOpen && !inquirySent" class="inquiry" @submit.prevent="sendInquiry">
          <label class="field">
            <span>{{ t('inquiry.yourName') }}</span>
            <input v-model="inquiry.organizerName" type="text" required />
          </label>
          <label class="field">
            <span>{{ t('inquiry.email') }}</span>
            <input v-model="inquiry.contactEmail" type="email" />
          </label>
          <label class="field">
            <span>{{ t('inquiry.phone') }}</span>
            <input v-model="inquiry.contactPhone" type="tel" />
          </label>
          <label class="field">
            <span>{{ t('inquiry.date') }}</span>
            <input v-model="inquiry.eventDateLocal" type="date" />
          </label>
          <label class="field">
            <span>{{ t('inquiry.guests') }}</span>
            <input v-model.number="inquiry.guestCount" type="number" min="1" />
          </label>
          <label class="field">
            <span>{{ t('inquiry.budget') }}</span>
            <div class="range">
              <input v-model.number="inquiry.budgetMin" type="number" min="0" />
              <input v-model.number="inquiry.budgetMax" type="number" min="0" />
            </div>
          </label>
          <label class="field wide">
            <span>{{ t('inquiry.requirements') }}</span>
            <textarea v-model="inquiry.requirements" rows="3"></textarea>
          </label>

          <p class="hint">{{ t('inquiry.askedOnceHint') }}</p>

          <button class="btn" type="submit" :disabled="sending">{{ t('inquiry.send') }}</button>
          <p v-if="inquiryError" class="error" role="alert">{{ inquiryError }}</p>
        </form>
      </section>

      <section v-if="vendor.website || vendor.instagramUrl" class="block links">
        <a v-if="vendor.website" :href="vendor.website" target="_blank" rel="noopener">
          {{ t('vendorProfile.website') }}
        </a>
        <a v-if="vendor.instagramUrl" :href="vendor.instagramUrl" target="_blank" rel="noopener">
          Instagram
        </a>
      </section>

      <section class="block">
        <h2>{{ t('vendorProfile.reviews') }}</h2>

        <p v-if="!reviews.length" class="empty">{{ t('vendorProfile.noReviews') }}</p>

        <ul v-else class="reviews">
          <li v-for="review in reviews" :key="review.id">
            <div class="review-head">
              <span class="stars" :aria-label="t('vendorProfile.stars', { n: review.rating })">
                {{ '★'.repeat(review.rating) }}<span class="dim">{{ '★'.repeat(5 - review.rating) }}</span>
              </span>
              <span class="author">{{ review.authorName || t('vendorProfile.anonymous') }}</span>
              <!-- Said out loud which reviews a person vouched for rather than
                   the system verifying a booking. -->
              <span v-if="review.source === 'VERIFIED_IMPORT'" class="badge">
                {{ t('vendorProfile.verifiedByAdmin') }}
              </span>
            </div>
            <p v-if="review.comment" class="review-text">{{ review.comment }}</p>
            <p v-if="review.vendorResponse" class="response">
              <strong>{{ vendor.name }}:</strong> {{ review.vendorResponse }}
            </p>
            <button class="link-btn" @click="report(review)">{{ t('vendorProfile.report') }}</button>
          </li>
        </ul>

        <p v-if="rating?.howCalculated" class="how">{{ rating.howCalculated }}</p>
      </section>
    </article>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { vendorDirectoryService, vendorReviewService } from '@/services/vendorDirectory.service'
import { inquiriesService } from '@/services/inquiries.service'
import { baseUrl } from '@/services/baseUrl'

const { t } = useI18n()
const route = useRoute()

const vendor = ref(null)
const reviews = ref([])
const rating = ref(null)
const loading = ref(true)
const notFound = ref(false)

const inquiryOpen = ref(false)
const inquirySent = ref(false)
const inquiryError = ref('')
const sending = ref(false)

// Asked once, up front. The first reply is otherwise always the same four
// questions, and a three-day exchange becomes one answer.
const inquiry = reactive({
  organizerName: '',
  contactEmail: '',
  contactPhone: '',
  eventDateLocal: '',
  guestCount: null,
  budgetMin: null,
  budgetMax: null,
  requirements: '',
})

async function sendInquiry() {
  sending.value = true
  inquiryError.value = ''
  try {
    await inquiriesService.send(vendor.value.id, {
      organizerName: inquiry.organizerName,
      contactEmail: inquiry.contactEmail || null,
      contactPhone: inquiry.contactPhone || null,
      // Sent with the browser's own offset: a wedding on the 12th must not
      // become the 11th because the server runs in UTC.
      eventDate: inquiry.eventDateLocal
        ? new Date(`${inquiry.eventDateLocal}T12:00`).toISOString()
        : null,
      guestCount: inquiry.guestCount,
      budgetMin: inquiry.budgetMin,
      budgetMax: inquiry.budgetMax,
      location: vendor.value.city,
      requirements: inquiry.requirements,
    })
    inquirySent.value = true
    inquiryOpen.value = false
  } catch (e) {
    inquiryError.value = e?.detail || e?.message || ''
  } finally {
    sending.value = false
  }
}

onMounted(load)
watch(() => route.params.slug, load)

async function load() {
  loading.value = true
  notFound.value = false

  try {
    const response = await vendorDirectoryService.bySlug(route.params.slug)
    vendor.value = response?.data ?? response
    applyMetadata()
    await loadReviews()
  } catch {
    // 404 covers suspended and rejected as well as never-existed. Saying "this
    // exists but you may not see it" tells a competitor more than it tells
    // anybody else.
    notFound.value = true
  } finally {
    loading.value = false
  }
}

async function loadReviews() {
  if (!vendor.value?.id) return
  try {
    const [list, summary] = await Promise.all([
      vendorDirectoryService.reviews(vendor.value.id),
      vendorDirectoryService.rating(vendor.value.id),
    ])
    reviews.value = list?.data ?? list ?? []
    rating.value = summary?.data ?? summary ?? null
  } catch {
    reviews.value = []
  }
}

/**
 * Sets the page's title, description and canonical from the server.
 *
 * <p>Read rather than assembled here, so this and the build-time prerender
 * cannot disagree about what the page is called.
 */
async function applyMetadata() {
  try {
    const response = await vendorDirectoryService.seo(route.params.slug, route.params.lang)
    const seo = response?.data ?? response
    if (!seo) return

    document.title = seo.title
    setMeta('description', seo.description)
    setLink('canonical', seo.canonicalUrl)
    setMeta('robots', seo.noindex ? 'noindex,follow' : 'index,follow')
    setJsonLd(seo.structuredData)
  } catch {
    // A missing title is not worth failing the page over.
  }
}

function setMeta(name, content) {
  if (!content) return
  let tag = document.querySelector(`meta[name="${name}"]`)
  if (!tag) {
    tag = document.createElement('meta')
    tag.setAttribute('name', name)
    document.head.appendChild(tag)
  }
  tag.setAttribute('content', content)
}

function setLink(rel, href) {
  if (!href) return
  let tag = document.querySelector(`link[rel="${rel}"]`)
  if (!tag) {
    tag = document.createElement('link')
    tag.setAttribute('rel', rel)
    document.head.appendChild(tag)
  }
  tag.setAttribute('href', href)
}

function setJsonLd(data) {
  if (!data) return
  const id = 'vendor-json-ld'
  document.getElementById(id)?.remove()

  const script = document.createElement('script')
  script.id = id
  script.type = 'application/ld+json'
  script.textContent = JSON.stringify(data)
  document.head.appendChild(script)
}

/** Only the type-specific fields — name, city and description already have
 *  their own place on the page. */
const SHOWN_ELSEWHERE = ['name', 'description', 'city', 'logoKey', 'website', 'instagramUrl']

const detailFields = computed(() => {
  if (!vendor.value) return []
  return vendor.value.fields.filter(field =>
    !SHOWN_ELSEWHERE.includes(field.key) && vendor.value.values[field.key])
})

async function report(review) {
  try {
    await vendorReviewService.report(review.id)
    await loadReviews()
  } catch {
    // Reporting while signed out is the ordinary case; nothing useful to say.
  }
}

function mediaSrc(key) {
  return `${baseUrl}/v1/api/public/images/${encodeURIComponent(key)}`
}

function readable(value) {
  return (value || '').toLowerCase().replace(/_/g, ' ')
}
</script>

<style scoped>
.profile { max-width: 760px; margin: 0 auto; padding: 24px 16px; }

.head { display: flex; gap: 18px; align-items: center; margin-bottom: 24px; }
.head h1 { margin: 0; font-size: 26px; }
.logo { width: 88px; height: 88px; border-radius: 14px; object-fit: cover; }
.meta { margin: 4px 0 0; color: #8a8a8a; font-size: 14px; }
.rating { margin: 6px 0 0; color: #b8954e; font-size: 15px; }
.rating-count { color: #8a8a8a; font-size: 12.5px; margin-left: 6px; }

.block { margin-top: 26px; }
.block h2 { margin: 0 0 10px; font-size: 13px; text-transform: uppercase;
  letter-spacing: 0.06em; color: #8a8a8a; }
.description { margin: 0; line-height: 1.6; }

.details { margin: 0; display: grid; gap: 10px 24px; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); }
.details dt { font-size: 12px; color: #8a8a8a; }
.details dd { margin: 2px 0 0; }

.links { display: flex; gap: 16px; }
.links a { color: var(--brand); }

.reviews { list-style: none; margin: 0; padding: 0; }
.reviews li { padding: 14px 0; border-bottom: 1px solid #f0eee8; }
.review-head { display: flex; gap: 10px; align-items: baseline; flex-wrap: wrap; }
.stars { color: #b8954e; letter-spacing: 1px; }
.stars .dim { color: #ddd8cf; }
.author { font-weight: 600; font-size: 14px; }
.badge { font-size: 11px; padding: 2px 8px; border-radius: 999px; background: #f0efe9; color: #6b6b6b; }
.review-text { margin: 6px 0 0; }
.response { margin: 8px 0 0; padding: 8px 12px; border-radius: 8px; background: #faf8f4; font-size: 14px; }
.how { margin-top: 14px; font-size: 11.5px; color: #8a8a8a; }

.inquiry { display: grid; gap: 12px; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); margin-top: 12px; }
.inquiry .wide { grid-column: 1 / -1; }
.field { display: flex; flex-direction: column; gap: 4px; font-size: 12.5px; }
.field input, .field textarea {
  padding: 8px 10px; border: 1px solid #ddd8cf; border-radius: 8px;
  font-size: 14px; font-family: inherit;
}
.range { display: flex; gap: 8px; }
.range input { width: 100%; }
.hint { grid-column: 1 / -1; margin: 0; font-size: 11.5px; color: #8a8a8a; }
.sent { padding: 10px 14px; border-radius: 8px; background: #e6f2e2; color: #2f6b28; font-size: 14px; }

.btn { padding: 10px 18px; border: 0; border-radius: 10px; background: var(--brand);
  color: #fff; font-size: 15px; cursor: pointer; }
.btn:disabled { opacity: 0.5; cursor: default; }
.error { grid-column: 1 / -1; margin: 0; font-size: 13px; color: #a3271f; }

.empty, .state { color: #6b6b6b; text-align: center; padding: 20px 0; }
.link-btn { border: 0; background: none; color: #a09585; cursor: pointer; font-size: 12px; padding: 6px 0 0; }
</style>
