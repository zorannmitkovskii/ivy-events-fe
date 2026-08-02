import { createRouter, createWebHistory } from "vue-router";
import { setLocale } from "@/i18n";
import { isAuthenticated, hasRole } from "@/services/auth.service";
import { onboardingStore } from "@/store/onboarding.store";
import { startLoading, stopLoading } from "@/store/loading.store";
import { useVendorProfile } from "@/composables/useVendorProfile";
import { capabilityForRoute, firstTabFor } from "@/router/vendorTabs";
import { homeForCurrentUser } from "@/router/landing";

// Marketing (keep eager for above-the-fold)
import HomePage from "@/pages/marketing/HomePage.vue";

// Lazy-loaded pages
const FeaturesPage = () => import("@/pages/marketing/FeaturesPage.vue");
const PricingPage = () => import("@/pages/marketing/PricingPage.vue");
const FeatureRSVPPage = () => import("@/pages/marketing/feautres/FeatureRSVPPage.vue");
const FeatureInvitationsPage = () => import("@/pages/marketing/feautres/FeatureInvitationsPage.vue");

const AuthLoginPage = () => import("@/pages/auth/AuthLoginPage.vue");
const AuthSignupPage = () => import("@/pages/auth/AuthSignupPage.vue");
const AuthForgotPasswordPage = () => import("@/pages/auth/AuthForgotPasswordPage.vue");
const AuthResetPasswordPage = () => import("@/pages/auth/AuthResetPasswordPage.vue");
const AuthVerifyEmailPage = () => import("@/pages/auth/AuthVerifyEmailPage.vue");

const EventCategoryPage = () => import("@/pages/onboarding/EventCategoryPage.vue");
const EventInvitationsPage = () => import("@/pages/onboarding/EventInvitationsPage.vue");
const CheckoutPurchasePage = () => import("@/pages/onboarding/CheckoutPurchasePage.vue");
const EventLivePage = () => import("@/pages/onboarding/EventLivePage.vue");
const RsvpSuccessSubmitPage = () => import("@/pages/onboarding/RsvpSuccessSubmitPage.vue");

// Dashboard
const DashboardLayout = () => import("@/layouts/DashboardLayout.vue");
const OverviewPage = () => import("@/pages/dashboard/OverviewPage.vue");
const GuestsPage = () => import("@/pages/dashboard/GuestsPage.vue");
const TablesSeatingPage = () => import("@/pages/dashboard/TablesSeatingPage.vue");
const AgendaPage = () => import("@/pages/dashboard/AgendaPage.vue");
const OurStoryPage = () => import("@/pages/dashboard/OurStoryPage.vue");
const GalleryPage = () => import("@/pages/dashboard/GalleryPage.vue");
const NotificationsPage = () => import("@/pages/dashboard/NotificationsPage.vue");
const TeamPage = () => import("@/pages/dashboard/TeamPage.vue");
const EventSettingsPage = () => import("@/pages/dashboard/EventSettingsPage.vue");
const TasksPage = () => import("@/pages/dashboard/TasksPage.vue");
const BudgetPage = () => import("@/pages/userDashboard/BudgetPage.vue");

// Vendor Dashboard (restaurants and other suppliers with their own account)
const VendorDashboardLayout = () => import("@/layouts/VendorDashboardLayout.vue");
const VendorPackagesPage = () => import("@/pages/vendorDashboard/VendorPackagesPage.vue");
const VendorFloorPlansPage = () => import("@/pages/vendorDashboard/VendorFloorPlansPage.vue");
const VendorCalendarPage = () => import("@/pages/vendorDashboard/VendorCalendarPage.vue");
const VendorPortfolioPage = () => import("@/pages/vendorDashboard/VendorPortfolioPage.vue");

// Admin Dashboard
const AdminDashboardLayout = () => import("@/layouts/AdminDashboardLayout.vue");
const AdminEventPage = () => import("@/pages/adminDashboard/AdminEventPage.vue");
const AdminPackagesPage = () => import("@/pages/adminDashboard/AdminPackagesPage.vue");
const AdminUsersPage = () => import("@/pages/adminDashboard/AdminUsersPage.vue");

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
      { path: "event-category", name: "EventCategoryPage", component: EventCategoryPage, meta: { requiresAuth: true } },

      // Accepting a collaborator invitation (IVY-103). Deliberately NOT under
      // the "auth" block: that one is guestOnly, and claiming a code needs a
      // signed-in user — the code grants access to an event, it is not a way
      // to sign in. Someone arriving from an invite link without an account
      // registers first, then lands back here.
      {
        path: "invite",
        name: "AcceptInvite",
        component: () => import("@/pages/auth/AcceptInvitePage.vue"),
        meta: { requiresAuth: true },
      },
      { path: "event-invitations", name: "EventInvitationsPage", component: EventInvitationsPage },
      { path: "invitation-builder", name: "InvitationBuilderPage", redirect: to => ({ path: `/${to.params.lang}/invitations/my-wedding`, query: { edit: 'true' } }) },
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

      // INVITATION TEMPLATES (unified)
      { path: "invitations/:design", name: "weddingInvitation", component: () => import("@/pages/invitaitons/wedding/UnifiedWeddingInvitation.vue") },
      { path: "invitations/:design/private", name: "weddingInvitationPrivate", component: () => import("@/pages/invitaitons/wedding/UnifiedWeddingInvitation.vue") },

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

      // ORGANIZER standalone (no sidebar)
      { path: "organizer", name: "dashboard.organizer", component: () => import("@/pages/dashboard/OrganizerOverviewPage.vue"), meta: { requiresAuth: true } },

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
          { path: "events/catering", name: "dashboard.catering", component: () => import("@/pages/dashboard/CateringPage.vue") },
          { path: "events/agenda", name: "dashboard.agenda", component: AgendaPage },
          { path: "events/budget", name: "dashboard.budget", component: BudgetPage },
          { path: "events/our-story", name: "dashboard.our-story", component: OurStoryPage },
          { path: "events/wedding-details", name: "dashboard.wedding-details", component: () => import("@/pages/dashboard/WeddingDetailsPage.vue") },
          { path: "events/gallery", name: "dashboard.gallery", component: GalleryPage },
          { path: "events/notifications", name: "dashboard.notifications", component: NotificationsPage },
          { path: "events/team", name: "dashboard.team", component: TeamPage },
          { path: "events/settings", name: "dashboard.settings", component: EventSettingsPage },
          { path: "events/invitation-links", name: "dashboard.invitation-links", component: () => import("@/pages/dashboard/InvitationLinksPage.vue") },
          { path: "events/support", name: "dashboard.support", component: () => import("@/pages/dashboard/SupportPage.vue") },
          { path: "events/packages", name: "dashboard.packages", component: () => import("@/pages/dashboard/DashboardPackagesPage.vue") },

          // default dashboard redirect (if someone opens /mk/dashboard)
          { path: "", redirect: (to) => homeForCurrentUser(to.params.lang) }
        ]
      },

      // VENDOR DASHBOARD
      {
        path: "vendor",
        component: VendorDashboardLayout,
        meta: { requiresAuth: true, requiresVendor: true },
        children: [
          { path: "packages", name: "vendor.packages", component: VendorPackagesPage },
          { path: "floor-plans", name: "vendor.floorPlans", component: VendorFloorPlansPage },
          { path: "portfolio", name: "vendor.portfolio", component: VendorPortfolioPage },
          { path: "calendar", name: "vendor.calendar", component: VendorCalendarPage },
          // The calendar: the one section every kind of vendor has, so it is
          // the only safe landing spot before the profile has loaded.
          { path: "", redirect: (to) => `/${to.params.lang || 'mk'}/vendor/calendar` }
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
          { path: "email-templates", name: "admin.emailTemplates", component: () => import("@/pages/adminDashboard/AdminEmailTemplatesPage.vue") },
          { path: "email-send", name: "admin.emailSend", component: () => import("@/pages/adminDashboard/AdminEmailSendPage.vue") },

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

router.beforeEach(async (to, from, next) => {
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
    next(homeForCurrentUser(lang));
    return;
  }

  // Vendor-only routes. Sent to their own home rather than to the couple's
  // dashboard, which would be an empty screen for a restaurant.
  if (to.meta.requiresVendor && !hasRole("VENDOR")) {
    next(homeForCurrentUser(lang));
    return;
  }

  // A photographer typing /vendor/floor-plans by hand. The tab is already
  // hidden for them, but a hidden tab is a suggestion — this is the rule.
  // Only checked once the profile is known; a vendor with no row behind their
  // account falls through and the layout explains why the screens are empty.
  if (to.meta.requiresVendor) {
    const { load, can } = useVendorProfile();
    const profile = await load();
    const needed = capabilityForRoute(to.name);
    if (profile && needed && !can(needed)) {
      next({ name: firstTabFor(profile.capabilities), params: { lang } });
      return;
    }
  }

  // Guest-only routes (if logged in, send to appropriate dashboard)
  if (to.meta.guestOnly && isAuthenticated()) {
    next(homeForCurrentUser(lang));
    return;
  }

  // Onboarding guards
  const isVerifyPage = to.name === 'AuthVerifyEmailPage';
  const isCategoryPage = to.name === 'EventCategoryPage';

  // Block category page until email is verified (authenticated users are implicitly verified)
  if (isCategoryPage && !onboardingStore.isEmailVerified && !isAuthenticated()) {
    next({ name: 'AuthVerifyEmailPage', params: { lang } });
    return;
  }

  // Block invitations page until category selected (for authenticated users in onboarding)
  // Allow unauthenticated users to browse freely (guest invitation flow)
  const isInvitationsPage = to.name === 'EventInvitationsPage';
  if (isInvitationsPage && !onboardingStore.selectedCategory && isAuthenticated() && !onboardingStore.eventId) {
    next({ name: 'EventCategoryPage', params: { lang } });
    return;
  }

  next();
});

router.afterEach(() => {
  stopLoading();
});

export default router;
