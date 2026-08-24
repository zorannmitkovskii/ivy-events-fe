<template>
  <section class="catering">
    <PageHeader :title="t('catering.title')" :subtitle="t('catering.subtitle')" />

    <p v-if="loading" class="muted">{{ t('catering.loading') }}</p>

    <!-- No venue booked yet is the ordinary case, not an error: the couple
         books the restaurant first and picks the menu afterwards. -->
    <p v-else-if="noVenue" class="muted">{{ t('catering.noVenue') }}</p>

    <p v-else-if="error" class="error">{{ error }}</p>

    <template v-else>
      <div class="venue">
        <span class="venue-name">{{ overview.vendorName }}</span>
        <span v-if="overview.startsAt" class="venue-date">{{ formatDate(overview.startsAt) }}</span>
      </div>

      <p v-if="!overview.packages.length" class="muted">{{ t('catering.noPackages') }}</p>

      <ul v-else class="packages">
        <li
          v-for="pkg in overview.packages"
          :key="pkg.id"
          class="package"
          :class="{ chosen: pkg.id === overview.chosenPackageId }"
        >
          <header class="package-head">
            <div>
              <h2>{{ pkg.name }}</h2>
              <p v-if="pkg.description" class="package-desc">{{ pkg.description }}</p>
            </div>
            <div class="price-col">
              <span v-if="pkg.pricePerPerson" class="price">
                {{ pkg.pricePerPerson }} {{ pkg.currency }}
                <small>{{ t('catering.perPerson') }}</small>
              </span>
              <span v-if="pkg.minGuests" class="min-guests">
                {{ t('catering.minGuests', { count: pkg.minGuests }) }}
              </span>
            </div>
          </header>

          <dl class="courses">
            <template v-for="group in coursesOf(pkg)" :key="group.course">
              <dt>{{ t(`catering.course.${group.course}`) }}</dt>
              <dd>{{ group.items.map((item) => item.name).join(' · ') }}</dd>
            </template>
          </dl>

          <footer class="package-foot">
            <span v-if="pkg.id === overview.chosenPackageId" class="chosen-badge">
              {{ t('catering.chosen') }}
            </span>
            <button v-else class="btn-primary" :disabled="saving" @click="choose(pkg)">
              {{ t('catering.choose') }}
            </button>
          </footer>
        </li>
      </ul>
    </template>
  </section>
</template>

<script setup>
import PageHeader from '@/components/ui/PageHeader.vue'
import { onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useAuthUser } from "@/composables/useAuthUser";
import { eventCateringService } from "@/services/vendorPortal.service";

const { t, locale } = useI18n();
const { eventId } = useAuthUser();

const overview = ref(null);
const loading = ref(true);
const saving = ref(false);
const noVenue = ref(false);
const error = ref(null);

onMounted(reload);

async function reload() {
  loading.value = true;
  error.value = null;
  try {
    const { data } = await eventCateringService.overview(eventId.value);
    overview.value = data;
    noVenue.value = false;
  } catch (e) {
    // The backend says "no venue booked" with a 400; anything else is a fault
    // worth showing rather than dressing up as an empty screen.
    if (e?.response?.status === 400) {
      noVenue.value = true;
    } else {
      error.value = message(e);
    }
  } finally {
    loading.value = false;
  }
}

async function choose(pkg) {
  saving.value = true;
  error.value = null;
  try {
    await eventCateringService.choosePackage(eventId.value, pkg.id);
    overview.value = { ...overview.value, chosenPackageId: pkg.id };
  } catch (e) {
    error.value = message(e);
  } finally {
    saving.value = false;
  }
}

/**
 * Grouped by course in the order the kitchen serves them, which is the order
 * the items already carry — reading a package as a flat list makes a starter
 * and a dessert look like alternatives.
 */
function coursesOf(pkg) {
  const groups = [];
  for (const item of pkg.items ?? []) {
    const last = groups[groups.length - 1];
    if (last && last.course === item.course) {
      last.items.push(item);
    } else {
      groups.push({ course: item.course, items: [item] });
    }
  }
  return groups;
}

function formatDate(value) {
  return new Date(value).toLocaleDateString(locale.value, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  });
}

function message(e) {
  return e?.response?.data?.error?.detail ?? e?.response?.data?.message ?? e.message;
}
</script>

<style scoped>

h1 {
  font-size: 1.2rem;
  margin: 0;
}

.subtitle {
  margin: 0.25rem 0 0;
  color: #6b665e;
  font-size: 0.9rem;
}

.venue {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0.75rem;
  margin-bottom: 1.25rem;
}

.venue-name {
  font-size: 1.05rem;
  font-weight: 600;
}

.venue-date {
  color: #6b665e;
  font-size: 0.9rem;
}

.packages {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 1rem;
}

.package {
  background: #fff;
  border: 1px solid #e8e4dc;
  border-radius: 12px;
  padding: 1rem;
}

.package.chosen {
  border-color: #1f3d2b;
  box-shadow: 0 0 0 1px #1f3d2b;
}

.package-head {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: flex-start;
}

.package-head h2 {
  margin: 0;
  font-size: 1rem;
}

.package-desc {
  margin: 0.25rem 0 0;
  color: #6b665e;
  font-size: 0.9rem;
}

.price-col {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.125rem;
  white-space: nowrap;
}

.price {
  font-weight: 600;
}

.price small {
  font-weight: 400;
  color: #6b665e;
}

.min-guests {
  font-size: 0.8rem;
  color: #6b665e;
}

.courses {
  display: grid;
  grid-template-columns: minmax(6rem, auto) 1fr;
  gap: 0.375rem 1rem;
  margin: 0.875rem 0 0;
  font-size: 0.9rem;
}

.courses dt {
  color: #6b665e;
  text-transform: lowercase;
}

.courses dd {
  margin: 0;
}

.package-foot {
  margin-top: 0.875rem;
  display: flex;
  justify-content: flex-end;
}

.chosen-badge {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  background: #1f3d2b;
  color: #fff;
  border-radius: 999px;
  padding: 0.3rem 0.8rem;
}

.btn-primary {
  min-height: 44px;
  padding: 0.5rem 1.25rem;
  border-radius: 999px;
  border: none;
  background: #1f3d2b;
  color: #fff;
  cursor: pointer;
  font: inherit;
}

.muted {
  color: #6b665e;
}

.error {
  color: #a4292c;
}
</style>
