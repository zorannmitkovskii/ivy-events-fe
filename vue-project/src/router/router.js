import { createRouter, createWebHistory } from "vue-router";
import { setLocale } from "@/i18n";
import { isAuthenticated } from "@/services/auth.service";

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
import CheckoutPurchasePage from "@/pages/onboarding/CheckoutPurchasePage.vue";
import EventLivePage from "@/pages/onboarding/EventLivePage.vue";

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
import BudgetPage from "@/pages/userDashboard/BudgetPage.vue";

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
      { path: "event-category", name: "event-category", component: EventCategoryPage, meta: { requiresAuth: true } },
      { path: "event-details", name: "event-details", component: EventBasicDetailsPage, meta: { requiresAuth: true } },
      { path: "checkout", name: "checkout", component: CheckoutPurchasePage, meta: { requiresAuth: true } },
      { path: "event-live", name: "event-live", component: EventLivePage, meta: { requiresAuth: true } },

      // AUTH
      {
        path: "auth",
        meta: { guestOnly: true },
        children: [
          { path: "login", name: "login", component: AuthLoginPage },
          { path: "signup", name: "signup", component: AuthSignupPage },
          { path: "forgot-password", name: "forgot-password", component: AuthForgotPasswordPage },
          { path: "reset-password", name: "reset-password", component: AuthResetPasswordPage },
          { path: "verify-email", name: "verify-email", component: AuthVerifyEmailPage }
        ]
      },

      // DASHBOARD (all pages share sidebar/topbar via DashboardLayout)
      {
        path: "dashboard",
        component: DashboardLayout,
        meta: { requiresAuth: true },
        children: [
          { path: "events/:eventId/overview", name: "dashboard.overview", component: OverviewPage },
          { path: "events/:eventId/guests", name: "dashboard.guests", component: GuestsPage },
          { path: "events/:eventId/tables", name: "dashboard.tables", component: TablesSeatingPage },
          { path: "events/:eventId/agenda", name: "dashboard.agenda", component: AgendaPage },
          { path: "events/:eventId/budget", name: "dashboard.budget", component: BudgetPage },
          { path: "events/:eventId/gallery", name: "dashboard.gallery", component: GalleryPage },
          { path: "events/:eventId/notifications", name: "dashboard.notifications", component: NotificationsPage },
          { path: "events/:eventId/team", name: "dashboard.team", component: TeamPage },
          { path: "events/:eventId/settings", name: "dashboard.settings", component: EventSettingsPage },

          // default dashboard redirect (if someone opens /mk/dashboard)
          {
            path: "",
            redirect: (to) => `/${to.params.lang}/dashboard/events/demo/overview`
          }
        ]
      }
    ]
  },

  // catch-all
  { path: "/:pathMatch(.*)*", redirect: "/mk" }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

/**
 * Demo access:
 * - allow /.../dashboard/events/demo/... without login
 * - allow any route with ?demo=1 without login
 */
router.beforeEach((to, from, next) => {
  const lang = to.params.lang || "mk";
  setLocale(lang);

  const eventId = to.params.eventId;
  const isDemo = eventId === "demo" || String(to.query.demo || "") === "1";

  // Auth-required routes (demo bypass)
  if (to.meta.requiresAuth && !isAuthenticated() && !isDemo) {
    next({
      path: `/${lang}/auth/login`,
      query: { redirect: to.fullPath }
    });
    return;
  }

  // Guest-only routes (if logged in, send to dashboard)
  if (to.meta.guestOnly && isAuthenticated()) {
    next(`/${lang}/dashboard/events/demo/overview`);
    return;
  }

  next();
});

export default router;
