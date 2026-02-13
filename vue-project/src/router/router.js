import { createRouter, createWebHistory } from "vue-router";
import { setLocale } from "@/i18n";
import { isAuthenticated } from "@/services/auth.service";
import { onboardingStore } from "@/store/onboarding.store";

// Marketing / Auth / Onboarding
import HomePage from "@/pages/marketing/HomePage.vue";
import FeaturesPage from "@/pages/marketing/FeaturesPage.vue";
import PricingPage from "@/pages/marketing/PricingPage.vue";
import FeatureRSVPPage from "@/pages/marketing/feautres/FeatureRSVPPage.vue";
import FeatureInvitationsPage from "@/pages/marketing/feautres/FeatureInvitationsPage.vue";

import AuthLoginPage from "@/pages/auth/AuthLoginPage.vue";
import AuthSignupPage from "@/pages/auth/AuthSignupPage.vue";
import AuthForgotPasswordPage from "@/pages/auth/AuthForgotPasswordPage.vue";
import AuthResetPasswordPage from "@/pages/auth/AuthResetPasswordPage.vue";
import AuthVerifyEmailPage from "@/pages/auth/AuthVerifyEmailPage.vue";

import EventCategoryPage from "@/pages/onboarding/EventCategoryPage.vue";
import EventBasicDetailsPage from "@/pages/onboarding/EventBasicDetailsPage.vue";
import EventInvitationsPage from "@/pages/onboarding/EventInvitationsPage.vue";
import CheckoutPurchasePage from "@/pages/onboarding/CheckoutPurchasePage.vue";
import EventLivePage from "@/pages/onboarding/EventLivePage.vue";
import RsvpSuccessSubmitPage from "@/pages/onboarding/RsvpSuccessSubmitPage.vue";

// Dashboard
import DashboardLayout from "@/layouts/DashboardLayout.vue";
import OverviewPage from "@/pages/dashboard/OverviewPage.vue";
import GuestsPage from "@/pages/dashboard/GuestsPage.vue";
import TablesSeatingPage from "@/pages/dashboard/TablesSeatingPage.vue";
import AgendaPage from "@/pages/dashboard/AgendaPage.vue";
import GalleryPage from "@/pages/dashboard/GalleryPage.vue";
import NotificationsPage from "@/pages/dashboard/NotificationsPage.vue";
import TeamPage from "@/pages/dashboard/TeamPage.vue";
import EventSettingsPage from "@/pages/dashboard/EventSettingsPage.vue";
import TasksPage from "@/pages/dashboard/TasksPage.vue";
import BudgetPage from "@/pages/userDashboard/BudgetPage.vue";
import SunsetGlass from "@/pages/invitaitons/wedding/SunsetGlass.vue";
import PersianWedding from "@/pages/invitaitons/wedding/PersianWedding.vue";
import ParisianWedding from "@/pages/invitaitons/wedding/ParisianWedding.vue";
import CoastalBreeze from "@/pages/invitaitons/wedding/CoastalBreeze.vue";

const routes = [
  // Redirect root to /mk
  { path: "/", redirect: "/mk" },

  // All localized routes under /:lang
  {
    path: "/:lang(mk|en)",
    children: [
      // MARKETING
      { path: "", name: "home", component: HomePage },
      { path: "features", name: "features", component: FeaturesPage },
      { path: "features/rsvp", name: "features-rsvp", component: FeatureRSVPPage },
      { path: "features/invitations", name: "features-invitations", component: FeatureInvitationsPage },
      { path: "pricing", name: "pricing", component: PricingPage },

      // ONBOARDING
      { path: "event-category", name: "EventCategoryPage", component: EventCategoryPage },
      { path: "event-details", name: "EventBasicDetailsPage", component: EventBasicDetailsPage },
      { path: "event-invitations", name: "EventInvitationsPage", component: EventInvitationsPage },
      { path: "checkout", name: "checkout", component: CheckoutPurchasePage, meta: { requiresAuth: true } },
      { path: "event-live", name: "event-live", component: EventLivePage, meta: { requiresAuth: true } },

      // RSVP
      { path: "rsvp-success", name: "RsvpSuccessSubmitPage", component: RsvpSuccessSubmitPage },

      // INVITATION PREVIEWS
      { path: "invitations/persian-wedding", name: "persianWedding", component: PersianWedding },
      { path: "invitations/parisian-wedding", name: "parisianWedding", component: ParisianWedding },
      { path: "invitations/coastal-breeze", name: "coastalBreeze", component: CoastalBreeze },
      { path: "invitations/sunset-glass", name: "sunsetGlass", component: SunsetGlass },

      // AUTH
      {
        path: "auth",
        meta: { guestOnly: true },
        children: [
          { path: "login", name: "login", component: AuthLoginPage },
          { path: "signup", name: "signup", component: AuthSignupPage },
          { path: "forgot-password", name: "forgot-password", component: AuthForgotPasswordPage },
          { path: "reset-password", name: "reset-password", component: AuthResetPasswordPage },
          { path: "verify-email", name: "AuthVerifyEmailPage", component: AuthVerifyEmailPage }
        ]
      },

      // DASHBOARD (all pages share sidebar/topbar via DashboardLayout)
      {
        path: "dashboard",
        component: DashboardLayout,
        meta: { requiresAuth: true },
        children: [
          { path: "events/overview", name: "dashboard.overview", component: OverviewPage },
          { path: "events/guests", name: "dashboard.guests", component: GuestsPage },
          { path: "events/tasks", name: "dashboard.tasks", component: TasksPage },
          { path: "events/tables", name: "dashboard.tables", component: TablesSeatingPage },
          { path: "events/agenda", name: "dashboard.agenda", component: AgendaPage },
          { path: "events/budget", name: "dashboard.budget", component: BudgetPage },
          { path: "events/gallery", name: "dashboard.gallery", component: GalleryPage },
          { path: "events/notifications", name: "dashboard.notifications", component: NotificationsPage },
          { path: "events/team", name: "dashboard.team", component: TeamPage },
          { path: "events/settings", name: "dashboard.settings", component: EventSettingsPage },

          // default dashboard redirect (if someone opens /mk/dashboard)
          {
            path: "",
            redirect: (to) => `/${to.params.lang}/dashboard/events/overview`
          }
        ]
      }
    ]
  },

  // alias name for overview to satisfy onboarding requirement
  {
    path: "/:lang(mk|en)/event-overview",
    name: "EventOverviewPage",
    redirect: (to) => `/${to.params.lang}/dashboard/events/overview`
  },

  // catch-all
  { path: "/:pathMatch(.*)*", redirect: "/mk" }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

router.beforeEach((to, from, next) => {
  const lang = to.params.lang || "mk";
  setLocale(lang);

  // Auth-required routes
  if (to.meta.requiresAuth && !isAuthenticated()) {
    next({
      path: `/${lang}/auth/login`,
      query: { redirect: to.fullPath }
    });
    return;
  }

  // Guest-only routes (if logged in, send to dashboard)
  if (to.meta.guestOnly && isAuthenticated()) {
    next(`/${lang}/dashboard/events/overview`);
    return;
  }

  // Onboarding guards
  const isVerifyPage = to.name === 'AuthVerifyEmailPage';
  const isCategoryPage = to.name === 'EventCategoryPage';
  const isDetailsPage = to.name === 'EventBasicDetailsPage';

  // Block category page until email is verified
  if (isCategoryPage && !onboardingStore.isEmailVerified) {
    next({ name: 'AuthVerifyEmailPage', params: { lang } });
    return;
  }

  // Block details page until category selected
  if (isDetailsPage && !onboardingStore.selectedCategory) {
    next({ name: 'EventCategoryPage', params: { lang } });
    return;
  }

  // Block invitations page until category selected and event created
  // Skip guard if user already has an event (coming from dashboard)
  const isInvitationsPage = to.name === 'EventInvitationsPage';
  if (isInvitationsPage && !onboardingStore.eventId) {
    if (!onboardingStore.selectedCategory) {
      next({ name: 'EventCategoryPage', params: { lang } });
      return;
    }
    next({ name: 'EventBasicDetailsPage', params: { lang } });
    return;
  }

  next();
});

export default router;
