<template>
  <div class="agency-team">
    <header class="page-head">
      <RouterLink :to="dashboardLink" class="back">{{ t('agencyTeam.backToDashboard') }}</RouterLink>
    </header>

    <UserDirectory
      :title="t('agencyTeam.title')"
      :subtitle="t('agencyTeam.subtitle')"
      :role-options="ROLE_OPTIONS"
      :protected-roles="PROTECTED_ROLES"
      :default-roles="DEFAULT_ROLES"
    />

    <!--
      Said once, on the screen where it bites. An agency owner who tries to add
      a second owner gets a 400 from the server naming the role; being told
      beforehand is cheaper than being refused.
    -->
    <p class="note">{{ t('agencyTeam.roleNote') }}</p>
  </div>
</template>

<script setup>
/**
 * The agency's own team (IVY-1203).
 *
 * <p>The same table and the same endpoints as the platform administrator's
 * users screen. The difference is entirely the caller: since IVY-1203
 * {@code /v1/api/admin/users} accepts ORG_ADMIN and narrows every answer to the
 * organization in their token, so this page never names an organization and
 * has no way to ask about another one.
 *
 * <p>Two roles rather than three. An agency hires organizers and adds client
 * accounts; minting platform administrators, or a second owner, stays with the
 * platform (option 4a, approved 2026-08-12).
 */
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { RouterLink, useRoute } from 'vue-router'
import UserDirectory from '@/components/users/UserDirectory.vue'

const ROLE_OPTIONS = ['ORGANIZER', 'USER']
const PROTECTED_ROLES = ['ADMIN', 'ORG_ADMIN']
const DEFAULT_ROLES = ['ORGANIZER']

const { t } = useI18n()
const route = useRoute()

const dashboardLink = computed(() => `/${route.params.lang || 'mk'}/org/dashboard`)
</script>

<style scoped>
.agency-team { padding: 1.5rem; }

.page-head { display: flex; justify-content: flex-end; margin-bottom: 0.75rem; }

.back {
  font-size: 0.875rem;
  color: var(--brand-main);
  text-decoration: none;
}
.back:hover { text-decoration: underline; }

.note {
  margin-top: 1rem;
  font-size: 0.8125rem;
  color: var(--ink-3);
}
</style>
