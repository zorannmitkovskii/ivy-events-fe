import { createRouter, createWebHistory } from "vue-router";
import { setLocale } from "@/i18n";
import { isAuthenticated, hasRole } from "@/services/auth.service";
import { onboardingStore } from "@/store/onboarding.store";
import { startLoading, stopLoading } from "@/store/loading.store";

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
import OurStoryPage from "@/pages/dashboard/OurStoryPage.vue";
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
import ModernCollage from "@/pages/invitaitons/wedding/ModernCollage.vue";
import ElegantChateau from "@/pages/invitaitons/wedding/ElegantChateau.vue";

// Admin Dashboard
import AdminDashboardLayout from "@/layouts/AdminDashboardLayout.vue";
import AdminEventPage from "@/pages/adminDashboard/AdminEventPage.vue";
import AdminPackagesPage from "@/pages/adminDashboard/AdminPackagesPage.vue";
import AdminUsersPage from "@/pages/adminDashboard/AdminUsersPage.vue";

const routes = [
  // Redirect root to /mk
  { path: "/", redirect: "/mk" },

  // All localized routes under /:lang
  {
    path: "/:lang(mk|en|sq)",
    children: [
      // MARKETING
      { path: "", name: "home", component: HomePage },
      { path: "features", name: "features", component: FeaturesPage },
      { path: "features/rsvp", name: "features-rsvp", component: FeatureRSVPPage },
      { path: "features/invitations", name: "features-invitations", component: FeatureInvitationsPage },
      { path: "pricing", name: "pricing", component: PricingPage },
      { path: "packages", name: "packages", component: () => import("@/pages/PackagesPage.vue") },
      { path: "about", name: "about", component: () => import("@/pages/AboutUsPage.vue") },
      { path: "terms", name: "terms", component: () => import("@/pages/TermsAndConditionsPage.vue") },
      { path: "contact", name: "contact", component: () => import("@/pages/ContactPage.vue") },
      { path: "feedback", name: "feedback", component: () => import("@/pages/FeedbackPage.vue") },
      { path: "faq", name: "faq", component: () => import("@/pages/FaqPage.vue") },

      // ONBOARDING
      { path: "event-category", name: "EventCategoryPage", component: EventCategoryPage },
      { path: "event-details", name: "EventBasicDetailsPage", component: EventBasicDetailsPage },
      { path: "event-invitations", name: "EventInvitationsPage", component: EventInvitationsPage },
      { path: "checkout", name: "checkout", component: CheckoutPurchasePage, meta: { requiresAuth: true } },
      { path: "event-live", name: "event-live", component: EventLivePage, meta: { requiresAuth: true } },

      // RSVP
      { path: "rsvp-success", name: "RsvpSuccessSubmitPage", component: RsvpSuccessSubmitPage },

      // PAYMENT
      { path: "payment/result", name: "PaymentResult", component: () => import("@/pages/PaymentResultPage.vue") },

      // PUBLIC GALLERY UPLOAD (link sent to guests)
      { path: "gallery", name: "GalleryUpload", component: () => import("@/pages/GalleryUpload.vue") },

      // PUBLIC TABLE LOOKUP (guests find their table)
      { path: "table-lookup", name: "TableLookup", component: () => import("@/pages/TableLookupPage.vue") },

      // INVITATION PREVIEWS
      { path: "invitations/persian-wedding", name: "persianWedding", component: PersianWedding },
      { path: "invitations/parisian-wedding", name: "parisianWedding", component: ParisianWedding },
      { path: "invitations/coastal-breeze", name: "coastalBreeze", component: CoastalBreeze },
      { path: "invitations/sunset-glass", name: "sunsetGlass", component: SunsetGlass },
      { path: "invitations/modern-collage", name: "modernCollage", component: ModernCollage },
      { path: "invitations/elegant-chateau", name: "elegantChateau", component: ElegantChateau },

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
          { path: "events/our-story", name: "dashboard.our-story", component: OurStoryPage },
          { path: "events/wedding-details", name: "dashboard.wedding-details", component: () => import("@/pages/dashboard/WeddingDetailsPage.vue") },
          { path: "events/gallery", name: "dashboard.gallery", component: GalleryPage },
          { path: "events/notifications", name: "dashboard.notifications", component: NotificationsPage },
          { path: "events/team", name: "dashboard.team", component: TeamPage },
          { path: "events/settings", name: "dashboard.settings", component: EventSettingsPage },
          { path: "events/support", name: "dashboard.support", component: () => import("@/pages/dashboard/SupportPage.vue") },
          { path: "events/packages", name: "dashboard.packages", component: () => import("@/pages/dashboard/DashboardPackagesPage.vue") },

          // default dashboard redirect (if someone opens /mk/dashboard)
          {
            path: "",
            redirect: (to) => `/${to.params.lang}/dashboard/events/overview`
          }
        ]
      },

      // ADMIN DASHBOARD
      {
        path: "admin",
        component: AdminDashboardLayout,
        meta: { requiresAuth: true, requiresAdmin: true },
        children: [
          { path: "events", name: "admin.events", component: AdminEventPage },
          { path: "packages", name: "admin.packages", component: AdminPackagesPage },
          { path: "users", name: "admin.users", component: AdminUsersPage },
          { path: "reviews", name: "admin.reviews", component: () => import("@/pages/adminDashboard/AdminReviewsPage.vue") },
          { path: "contacts", name: "admin.contacts", component: () => import("@/pages/adminDashboard/AdminContactsPage.vue") },
          { path: "faq", name: "admin.faq", component: () => import("@/pages/adminDashboard/AdminFaqPage.vue") },
          { path: "invitation-templates", name: "admin.invitationTemplates", component: () => import("@/pages/adminDashboard/AdminInvitationTemplatesPage.vue") },

          // default admin redirect
          {
            path: "",
            redirect: (to) => `/${to.params.lang}/admin/events`
          }
        ]
      }
    ]
  },

  // alias name for overview to satisfy onboarding requirement
  {
    path: "/:lang(mk|en|sq)/event-overview",
    name: "EventOverviewPage",
    redirect: (to) => `/${to.params.lang}/dashboard/events/overview`
  },

  // catch-all
  { path: "/:pathMatch(.*)*", redirect: "/mk" }
];

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) return savedPosition;
    return { top: 0 };
  },
});

router.beforeEach((to, from, next) => {
  startLoading();
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

  // Admin-only routes
  if (to.meta.requiresAdmin && !hasRole("ADMIN")) {
    next(`/${lang}/dashboard/events/overview`);
    return;
  }

  // Guest-only routes (if logged in, send to appropriate dashboard)
  if (to.meta.guestOnly && isAuthenticated()) {
    if (hasRole("ADMIN")) {
      next(`/${lang}/admin/events`);
    } else {
      next(`/${lang}/dashboard/events/overview`);
    }
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
  // Allow unauthenticated users to browse freely (guest invitation flow)
  const isInvitationsPage = to.name === 'EventInvitationsPage';
  if (isInvitationsPage && !onboardingStore.eventId && isAuthenticated()) {
    if (!onboardingStore.selectedCategory) {
      next({ name: 'EventCategoryPage', params: { lang } });
      return;
    }
    next({ name: 'EventBasicDetailsPage', params: { lang } });
    return;
  }

  next();
});

router.afterEach(() => {
  stopLoading();
});

export default router;
