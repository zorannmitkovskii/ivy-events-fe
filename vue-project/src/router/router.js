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

      // PUBLIC VENDOR MARKETPLACE (IVY-703)
      // The canonical shape is /vendors/{category}/{slug}. Category is in the
      // path so the URL says what the vendor does and the directory's own
      // facets are crawlable.
      { path: "vendors", name: "VendorDirectory", component: () => import("@/pages/VendorDirectoryPage.vue") },
      { path: "vendors/:category", name: "VendorCategory", component: () => import("@/pages/VendorDirectoryPage.vue") },
      { path: "vendors/:category/:slug", name: "VendorProfile", component: () => import("@/pages/VendorProfilePage.vue") },

      // BLOG AND INSPIRATION HUBS (IVY-901, IVY-904)
      // Under the language prefix like every other public page: an article has
      // one address per language, and that address is what the canonical tag
      // and the sitemap both point at.
      { path: "blog", name: "Blog", component: () => import("@/pages/BlogPage.vue") },
      { path: "blog/:slug", name: "BlogPost", component: () => import("@/pages/BlogPostPage.vue") },
      // City is a query parameter rather than a path segment. Only approved
      // combinations exist, and a path pattern invites crawling every city
      // somebody can type.
      { path: "inspiration/:category", name: "Inspiration", component: () => import("@/pages/InspirationPage.vue") },

      // GUEST CONTRIBUTIONS AND THE LIVE WALL (IVY-605)
      // The wall runs on a screen at the venue; contribute is the guest form.
      { path: "wall", name: "LiveWall", component: () => import("@/pages/LiveWallPage.vue") },
      { path: "contribute", name: "Contribute", component: () => import("@/pages/ContributePage.vue") },

      // GUEST DAY-OF HUB (IVY-603) — opened with an invitation token, ?t=...
      // The token stays in the query only long enough to be read; the page
      // sends it in a POST body, never in a URL the server logs.
      { path: "hub", name: "GuestHub", component: () => import("@/pages/GuestHubPage.vue") },

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

      // AGENCY OWNER (IVY-1201). Separate from /organizer on purpose: that page
      // is built for somebody running their own events, this one for somebody
      // running an agency. Both are org-scoped by the backend already; only
      // this one is shaped for it.
      //
      // Under AgencyLayout since IVY-1401: these three were the only signed-in
      // screens with no shell, so the dashboard's tile grid was doing the
      // sidebar's job and there was no way back from the team screen.
      {
        path: "org",
        component: () => import("@/layouts/AgencyLayout.vue"),
        meta: { requiresAuth: true },
        children: [
          { path: "dashboard", name: "org.dashboard", component: () => import("@/pages/dashboard/AgencyOverviewPage.vue") },
          { path: "settings", name: "org.settings", component: () => import("@/pages/dashboard/AgencySettingsPage.vue") },
          // The pipeline is the agency's, not an event's. It sat under the
          // event shell, which gave it the wrong sidebar and no way back to
          // the agency; the old path still resolves, below.
          { path: "pipeline", name: "org.pipeline", component: () => import("@/pages/dashboard/AgencyPipelinePage.vue") },
          // The agency's team (IVY-1203). requiresAgency and not requiresAdmin:
          // the screen is the admin panel's, the scope is one organization's.
          { path: "users", name: "org.users", component: () => import("@/pages/dashboard/AgencyTeamPage.vue"), meta: { requiresAgency: true } },
        ],
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
          { path: "events/catering", name: "dashboard.catering", component: () => import("@/pages/dashboard/CateringPage.vue") },
          { path: "events/check-in", name: "dashboard.check-in", component: () => import("@/pages/dashboard/CheckInPage.vue") },
          { path: "events/announcements", name: "dashboard.announcements", component: () => import("@/pages/dashboard/AnnouncementsPage.vue") },
          { path: "events/contributions", name: "dashboard.contributions", component: () => import("@/pages/dashboard/ContributionsPage.vue") },
          { path: "events/quotes", name: "dashboard.quotes", component: () => import("@/pages/dashboard/QuoteComparisonPage.vue") },
          { path: "events/post-event", name: "dashboard.post-event", component: () => import("@/pages/dashboard/PostEventPage.vue") },
          { path: "events/agenda", name: "dashboard.agenda", component: AgendaPage },
          { path: "events/budget", name: "dashboard.budget", component: BudgetPage },
          { path: "events/our-story", name: "dashboard.our-story", component: OurStoryPage },
          { path: "events/wedding-details", name: "dashboard.wedding-details", component: () => import("@/pages/dashboard/WeddingDetailsPage.vue") },
          { path: "events/gallery", name: "dashboard.gallery", component: GalleryPage },
          { path: "events/notifications", name: "dashboard.notifications", component: NotificationsPage },
          { path: "events/team", name: "dashboard.team", component: TeamPage },
          { path: "events/settings", name: "dashboard.settings", component: EventSettingsPage },
          { path: "events/invitation-links", name: "dashboard.invitation-links", component: () => import("@/pages/dashboard/InvitationLinksPage.vue") },
          // Picking an invitation from inside the product, with the shell kept
          // (IVY-1401). The same screen is also an onboarding step at
          // /event-invitations, and there it is deliberately bare — a wizard
          // has one job. Somebody who already has an event is not in a wizard,
          // and losing the sidebar mid-task left them with the back button.
          { path: "events/invitations", name: "dashboard.invitations", component: EventInvitationsPage },
          { path: "events/support", name: "dashboard.support", component: () => import("@/pages/dashboard/SupportPage.vue") },
          { path: "events/packages", name: "dashboard.packages", component: () => import("@/pages/dashboard/DashboardPackagesPage.vue") },

          // THE AGENCY SIDE (EPIC-10)
          // Pipeline and settings sit outside events/ because a lead is work
          // before there is an event to hang it on — which is the whole reason
          // the CRM exists rather than being a status field on an event.
          // Moved to /org/pipeline (IVY-1401). Kept as a redirect rather than
          // deleted: anyone who bookmarked it still lands on the page.
          { path: "pipeline", redirect: (to) => `/${to.params.lang}/org/pipeline` },
          // Same screen as /org/settings, reached by a second path. Redirected
          // rather than served twice, so the two cannot drift apart.
          { path: "agency", redirect: (to) => `/${to.params.lang}/org/settings` },
          { path: "events/approvals", name: "dashboard.approvals", component: () => import("@/pages/dashboard/ClientApprovalsPage.vue") },

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
          { path: "inbox", name: "vendor.inbox", component: () => import("@/pages/vendorDashboard/VendorInboxPage.vue") },
          { path: "application", name: "vendor.application", component: () => import("@/pages/vendorDashboard/VendorApplicationPage.vue") },
          { path: "microsite", name: "vendor.microsite", component: () => import("@/pages/vendorDashboard/VendorMicrositePage.vue") },
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
          // The dashboard (IVY-1101). Until now /admin redirected straight to
          // the events table and there was no overview at all — the component
          // that looked like one rendered four hardcoded numbers and no route
          // reached it.
          { path: "dashboard", name: "admin.dashboard", component: () => import("@/pages/adminDashboard/AdminOverviewPage.vue") },
          { path: "events", name: "admin.events", component: AdminEventPage },
          { path: "packages", name: "admin.packages", component: AdminPackagesPage },
          { path: "users", name: "admin.users", component: AdminUsersPage },
          // The organizer directory (IVY-1102). Separate from users: that one
          // is every account on the platform, this one is the people running
          // events and what each of them is carrying.
          { path: "organizers", name: "admin.organizers", component: () => import("@/pages/adminDashboard/AdminOrganizersPage.vue") },
          // No /admin/vendors route. `AdminVendorsPage.vue` looked like the
          // page this card wanted and was six hardcoded rows importing four
          // components from a directory that does not exist — it could not
          // render at all, which is why nothing ever routed it. Deleted with
          // the other mock dashboards (IVY-1103); the Vendors card points at
          // the approval queue, which is real.
          { path: "settings", name: "admin.settings", component: () => import("@/pages/adminDashboard/AdminSettingsPage.vue") },
          { path: "reviews", name: "admin.reviews", component: () => import("@/pages/adminDashboard/AdminReviewsPage.vue") },
          { path: "vendor-queue", name: "admin.vendorQueue", component: () => import("@/pages/adminDashboard/AdminVendorQueuePage.vue") },
          { path: "contacts", name: "admin.contacts", component: () => import("@/pages/adminDashboard/AdminContactsPage.vue") },
          { path: "faq", name: "admin.faq", component: () => import("@/pages/adminDashboard/AdminFaqPage.vue") },
          { path: "invitation-templates", name: "admin.invitationTemplates", component: () => import("@/pages/adminDashboard/AdminInvitationTemplatesPage.vue") },
          { path: "email-templates", name: "admin.emailTemplates", component: () => import("@/pages/adminDashboard/AdminEmailTemplatesPage.vue") },
          { path: "email-send", name: "admin.emailSend", component: () => import("@/pages/adminDashboard/AdminEmailSendPage.vue") },

          // EDITORIAL (IVY-901, IVY-902, IVY-905)
          { path: "content", name: "admin.content", component: () => import("@/pages/adminDashboard/ContentEditorPage.vue") },
          { path: "content-analytics", name: "admin.contentAnalytics", component: () => import("@/pages/adminDashboard/ContentAnalyticsPage.vue") },

          // default admin landing — the dashboard, not the events table
          {
            path: "",
            redirect: (to) => `/${to.params.lang}/admin/dashboard`
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

  // Agency-owner routes (IVY-1203). A platform administrator is let through
  // too: they manage every organization, so refusing them their own product's
  // agency screen would be a rule with no purpose.
  if (to.meta.requiresAgency && !hasRole("ORG_ADMIN") && !hasRole("ADMIN")) {
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
  // Both names render the same screen: the bare onboarding step and the one
  // inside the dashboard shell. The gate applies to either.
  const isInvitationsPage = to.name === 'EventInvitationsPage' || to.name === 'dashboard.invitations';
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
