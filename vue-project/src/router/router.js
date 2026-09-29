import { createRouter, createWebHistory } from "vue-router";
import { setLocale } from "@/i18n";
import { isAuthenticated, hasRole } from "@/services/auth.service";
import { onboardingStore } from "@/store/onboarding.store";
import { startLoading, stopLoading } from "@/store/loading.store";
import { useVendorProfile } from "@/composables/useVendorProfile";
import { capabilityForRoute, firstAllowedTab, firstTabFor, privilegeForRoute } from "@/router/vendorTabs";
import { usePrivileges } from "@/composables/usePrivileges";
import { resolveVendorHost, siteTarget } from "@/services/vendorHost";
import { api } from "@/services/api";
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
  //
  // `meta.seo` tells useSeo what a search engine should make of a page:
  // "server" — the page sets its own tags from the API; "private" — noindex,
  // for token links a guest was sent. Signed-in and auth routes are private
  // without saying so, via requiresAuth / guestOnly.
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
      { path: "rsvp-success", name: "RsvpSuccessSubmitPage", component: RsvpSuccessSubmitPage, meta: { seo: "private" } },

      // PAYMENT
      { path: "payment/result", name: "PaymentResult", component: () => import("@/pages/PaymentResultPage.vue"), meta: { seo: "private" } },

      // PUBLIC GALLERY UPLOAD (link sent to guests)
      { path: "gallery", name: "GalleryUpload", component: () => import("@/pages/GalleryUpload.vue"), meta: { seo: "private" } },

      // PUBLIC TABLE LOOKUP (guests find their table)
      { path: "table-lookup", name: "TableLookup", component: () => import("@/pages/TableLookupPage.vue"), meta: { seo: "private" } },

      // PUBLIC VENDOR MARKETPLACE (IVY-703)
      // The canonical shape is /vendors/{category}/{slug}. Category is in the
      // path so the URL says what the vendor does and the directory's own
      // facets are crawlable.
      { path: "vendors", name: "VendorDirectory", component: () => import("@/pages/VendorDirectoryPage.vue") },
      { path: "vendors/:category", name: "VendorCategory", component: () => import("@/pages/VendorDirectoryPage.vue") },
      { path: "vendors/:category/:slug", name: "VendorProfile", component: () => import("@/pages/VendorProfilePage.vue"), meta: { seo: "server" } },

      // THE PUBLIC DESIGN CATALOGUE (the redesign's "Покани")
      // Not to be confused with `event-invitations` above, which looks like the
      // same page and is step two of creating an event. This one is marketing:
      // it lists every active template and links into the previews.
      { path: "designs", name: "designs", component: () => import("@/pages/InvitationDesignsPage.vue") },

      // BLOG AND INSPIRATION HUBS (IVY-901, IVY-904)
      // Under the language prefix like every other public page: an article has
      // one address per language, and that address is what the canonical tag
      // and the sitemap both point at.
      { path: "blog", name: "Blog", component: () => import("@/pages/BlogPage.vue") },
      { path: "blog/:slug", name: "BlogPost", component: () => import("@/pages/BlogPostPage.vue"), meta: { seo: "server" } },
      // City is a query parameter rather than a path segment. Only approved
      // combinations exist, and a path pattern invites crawling every city
      // somebody can type.
      { path: "inspiration/:category", name: "Inspiration", component: () => import("@/pages/InspirationPage.vue"), meta: { seo: "server" } },
      // One shared tag: the articles and vendors filed under it.
      { path: "tags/:slug", name: "TagPage", component: () => import("@/pages/TagPage.vue"), meta: { seo: "server" } },

      // GUEST CONTRIBUTIONS AND THE LIVE WALL (IVY-605)
      // The wall runs on a screen at the venue; contribute is the guest form.
      { path: "wall", name: "LiveWall", component: () => import("@/pages/LiveWallPage.vue"), meta: { seo: "private" } },
      { path: "contribute", name: "Contribute", component: () => import("@/pages/ContributePage.vue"), meta: { seo: "private" } },

      // GUEST DAY-OF HUB (IVY-603) — opened with an invitation token, ?t=...
      // The token stays in the query only long enough to be read; the page
      // sends it in a POST body, never in a URL the server logs.
      { path: "hub", name: "GuestHub", component: () => import("@/pages/GuestHubPage.vue"), meta: { seo: "private" } },

      // INVITATION TEMPLATES (unified)
      { path: "invitations/:design", name: "weddingInvitation", component: () => import("@/pages/invitaitons/wedding/UnifiedWeddingInvitation.vue") },
      { path: "invitations/:design/private", name: "weddingInvitationPrivate", component: () => import("@/pages/invitaitons/wedding/UnifiedWeddingInvitation.vue"), meta: { seo: "private" } },

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
      { path: "organizer", name: "dashboard.organizer", component: () => import("@/pages/dashboard/OrganizerOverviewPage.vue"), meta: { requiresAuth: true, notForAdmin: true } },

      // AGENCY OWNER (IVY-1201). Separate from /organizer on purpose: that page
      // is built for somebody running their own events, this one for somebody
      // running an agency. Both are org-scoped by the backend already; only
      // this one is shaped for it.
      //
      // Under AgencyLayout since IVY-1401: these three were the only signed-in
      // screens with no shell, so the dashboard's tile grid was doing the
      // sidebar's job and there was no way back from the team screen.
      // The agency shell used to live at /org. Renamed to /agency in 2026-09
      // so the address matches the role that owns it. Kept as a redirect
      // rather than dropped: these are screens people bookmark, and an
      // agency owner landing on a 404 has no way to guess the new one.
      {
        path: "org/:rest(.*)*",
        redirect: (to) => `/${to.params.lang || 'mk'}/agency/${(to.params.rest || []).join('/')}`,
      },

      {
        path: "agency",
        component: () => import("@/layouts/AgencyLayout.vue"),
        meta: { requiresAuth: true, notForAdmin: true },
        children: [
          { path: "dashboard", name: "agency.dashboard", component: () => import("@/pages/dashboard/AgencyHomePage.vue") },
          { path: "settings", name: "agency.settings", component: () => import("@/pages/dashboard/AgencySettingsPage.vue") },
          // Who on the team may open what. Owner-only, and the page says so
          // rather than the router hiding it — a screen that vanishes is
          // harder to ask about than one that explains itself.
          {
            path: "privileges",
            name: "agency.privileges",
            component: () => import("@/pages/dashboard/WorkspacePrivilegesPage.vue"),
            props: { workspaceType: "AGENCY" },
          },
          // The pipeline is the agency's, not an event's. It sat under the
          // event shell, which gave it the wrong sidebar and no way back to
          // the agency; the old path still resolves, below.
          { path: "pipeline", name: "agency.pipeline", component: () => import("@/pages/dashboard/AgencyPipelinePage.vue") },
          // The agency's team (IVY-1203). requiresAgency and not requiresAdmin:
          // the screen is the admin panel's, the scope is one organization's.
          { path: "users", name: "agency.users", component: () => import("@/pages/dashboard/AgencyTeamPage.vue"), meta: { requiresAgency: true } },

          // The four the 2026 design adds to the agency sidebar. Each answers a
          // question that spans events, which is why none of them belongs in
          // the per-event shell: what is on this week, what the whole team owes,
          // who we book, and what we make.
          { path: "calendar", name: "agency.calendar", component: () => import("@/pages/dashboard/AgencyCalendarPage.vue") },
          { path: "tasks", name: "agency.tasks", component: () => import("@/pages/dashboard/AgencyTasksPage.vue") },
          { path: "vendors", name: "agency.vendors", component: () => import("@/pages/dashboard/AgencyVendorsPage.vue") },
          { path: "reports", name: "agency.reports", component: () => import("@/pages/dashboard/AgencyReportsPage.vue"), meta: { requiresAgency: true } },
          // The agency's public site: layout, copy, portfolio, tags, address.
          // The owner's alone — the server refuses a member too.
          { path: "site", name: "agency.site.edit", component: () => import("@/pages/dashboard/AgencySiteEditorPage.vue"), meta: { requiresAgency: true } },

          // The agency's book of events, inside the agency shell (2026 design,
          // "events by role"): every event for the owner, their own for a
          // member. Its own page since 2026-09 — the shared organiser overview
          // it used to reuse could not draw two roles differently.
          {
            path: "events",
            name: "agency.events",
            component: () => import("@/pages/dashboard/AgencyEventsPage.vue"),
          },
        ],
      },

      // DASHBOARD (all pages share sidebar/topbar via DashboardLayout)
      {
        path: "dashboard",
        component: DashboardLayout,
        meta: { requiresAuth: true, notForAdmin: true },
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
          // Moved to /agency/pipeline (IVY-1401). Kept as a redirect rather than
          // deleted: anyone who bookmarked it still lands on the page.
          { path: "pipeline", redirect: (to) => `/${to.params.lang}/agency/pipeline` },
          // Same screen as /agency/settings, reached by a second path. Redirected
          // rather than served twice, so the two cannot drift apart.
          { path: "agency", redirect: (to) => `/${to.params.lang}/agency/settings` },
          { path: "events/approvals", name: "dashboard.approvals", component: () => import("@/pages/dashboard/ClientApprovalsPage.vue") },

          // default dashboard redirect (if someone opens /mk/dashboard)
          { path: "", redirect: (to) => homeForCurrentUser(to.params.lang) }
        ]
      },

      // One vendor's own site (IVY-706).
      //
      // In production this is reached as `<slug>.ivyevents.mk/` and the slug
      // comes off the hostname. Locally there is no wildcard DNS, so the same
      // page is reachable by path — `/mk/s/studio-lumiere` — which is also
      // what makes it testable without touching DNS.
      {
        path: "s/:slug",
        name: "vendor.site",
        component: () => import("@/pages/VendorSitePage.vue"),
        meta: { seo: "server" },
      },

      // A couple's invitation at its own address (`ana-marko.ivyevents.mk`).
      // Reachable by path too, for the same reason the vendor one is: there
      // is no wildcard DNS on a laptop.
      {
        path: "i/:slug",
        name: "event.site",
        component: () => import("@/pages/EventSitePage.vue"),
        meta: { seo: "private" },
      },

      // An agency's public site (`ivena.ivyevents.mk`), reachable by path for
      // the same reason: the four layouts of the 2026 agency microsite design.
      {
        path: "a/:slug",
        name: "agency.site",
        component: () => import("@/pages/AgencySitePage.vue"),
        meta: { seo: "server" },
      },

      // The microsite as a visitor sees it (IVY-706). Outside the portal shell
      // on purpose: a preview wrapped in the vendor's own sidebar answers the
      // wrong question. The settings page has linked here since it was built,
      // but the route was never declared, so "Preview" led nowhere.
      {
        path: "vendor/microsite/preview",
        name: "vendor.microsite.preview",
        component: () => import("@/pages/vendorDashboard/VendorMicrositePreviewPage.vue"),
        meta: { requiresAuth: true, requiresVendor: true },
      },

      // VENDOR DASHBOARD
      {
        path: "vendor",
        component: VendorDashboardLayout,
        meta: { requiresAuth: true, requiresVendor: true },
        children: [
          { path: "packages", name: "vendor.packages", component: VendorPackagesPage },
          { path: "portfolio", name: "vendor.portfolio", component: VendorPortfolioPage },
          { path: "inbox", name: "vendor.inbox", component: () => import("@/pages/vendorDashboard/VendorInboxPage.vue") },
          { path: "application", name: "vendor.application", component: () => import("@/pages/vendorDashboard/VendorApplicationPage.vue") },
          { path: "microsite", name: "vendor.microsite", component: () => import("@/pages/vendorDashboard/VendorMicrositePage.vue") },
          { path: "calendar", name: "vendor.calendar", component: VendorCalendarPage },
          // The 2026 vendor design's home, profile, team and insights.
          { path: "home", name: "vendor.home", component: () => import("@/pages/vendorDashboard/VendorHomePage.vue") },
          { path: "profile", name: "vendor.profile", component: () => import("@/pages/vendorDashboard/VendorProfilePage.vue") },
          { path: "team", name: "vendor.team", component: () => import("@/pages/vendorDashboard/VendorTeamPage.vue") },
          { path: "insights", name: "vendor.insights", component: () => import("@/pages/vendorDashboard/VendorInsightsPage.vue") },
          {
            path: "privileges",
            name: "vendor.privileges",
            component: () => import("@/pages/dashboard/WorkspacePrivilegesPage.vue"),
            props: { workspaceType: "VENDOR" },
          },
          // The home: ungated, so every kind of vendor has it, and it is where
          // the new inquiries are.
          { path: "", redirect: (to) => `/${to.params.lang || 'mk'}/vendor/home` }
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
          // Payments (the 2026 design's "Плаќања"). The data was already there
          // — cPay writes a status per attempt — with no screen over it, so the
          // only way to answer "did that order go through" was the database.
          { path: "payments", name: "admin.payments", component: () => import("@/pages/adminDashboard/AdminPaymentsPage.vue") },
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

          // EDITORIAL (IVY-901..906). The blog CMS replaced the single-page
          // editor at /admin/content; that address still lands somewhere.
          // New and edit share one component, so saving a new post moves to
          // its own address without remounting the editor.
          { path: "blog", name: "admin.blog", component: () => import("@/pages/adminDashboard/blog/AdminBlogListPage.vue") },
          { path: "blog/new", name: "admin.blog.new", component: () => import("@/pages/adminDashboard/blog/AdminBlogEditorPage.vue") },
          { path: "blog/:id", name: "admin.blog.edit", component: () => import("@/pages/adminDashboard/blog/AdminBlogEditorPage.vue") },
          { path: "content", redirect: (to) => `/${to.params.lang}/admin/blog` },
          { path: "content-analytics", name: "admin.contentAnalytics", component: () => import("@/pages/adminDashboard/ContentAnalyticsPage.vue") },
          { path: "site-analytics", name: "admin.siteAnalytics", component: () => import("@/pages/adminDashboard/SiteAnalyticsPage.vue") },
          { path: "tags", name: "admin.tags", component: () => import("@/pages/adminDashboard/blog/AdminBlogTagsPage.vue") },

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
    // An in-page link (the admin dashboard's "Извештаи" tile → #charts) goes to
    // its section. Always returning the top made those links do nothing.
    if (to.hash) return { el: to.hash, top: 16, behavior: "smooth" };
    return { top: 0 };
  },
});

router.beforeEach(async (to) => {
  startLoading();
  const lang = to.params.lang || "mk";
  setLocale(lang);

  // On `<label>.ivyevents.mk` the address belongs to somebody — a supplier or
  // a couple — not to the marketplace. Which of the two is the registry's
  // answer, not a guess from the name: both draw from one namespace.
  const onSubdomain = resolveVendorHost();
  if (onSubdomain.viaHost && (to.name === "home" || to.path === "/")) {
    const target = await siteTarget(api);

    if (target?.kind === "VENDOR") {
      return { path: `/${lang}/s/${target.label}`, replace: true };
    }
    if (target?.kind === "EVENT") {
      return { path: `/${lang}/i/${target.label}`, replace: true };
    }
    if (target?.kind === "AGENCY") {
      return { path: `/${lang}/a/${target.label}`, replace: true };
    }
    // Claimed by nobody, or turned off by its owner. The marketplace front
    // page is a better answer than a blank screen.
  }

  // Auth-required routes
  if (to.meta.requiresAuth && !isAuthenticated()) {
    return {
      path: `/${lang}/auth/login`,
      query: { redirect: to.fullPath }
    };
  }

  // The platform administrator works in the admin console (IVY-908). Their
  // account also carries USER, so without this the event, organiser and
  // agency screens open for them like for anybody — somebody's event in a
  // shell never meant for the platform. They have /admin/events for that.
  if (hasRole("ADMIN") && to.matched.some((record) => record.meta.notForAdmin)) {
    return `/${lang}/admin/dashboard`;
  }

  // Admin-only routes
  if (to.meta.requiresAdmin && !hasRole("ADMIN")) {
    return homeForCurrentUser(lang);
  }

  // Agency-owner routes (IVY-1203). A platform administrator is let through
  // too: they manage every organization, so refusing them their own product's
  // agency screen would be a rule with no purpose.
  if (to.meta.requiresAgency && !hasRole("AGENCY") && !hasRole("ADMIN")) {
    return homeForCurrentUser(lang);
  }

  // Vendor-only routes. Sent to their own home rather than to the couple's
  // dashboard, which would be an empty screen for a restaurant.
  if (to.meta.requiresVendor && !(hasRole("VENDOR") || hasRole("VENDOR_MEMBER"))) {
    return homeForCurrentUser(lang);
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
      return { name: firstTabFor(profile.capabilities), params: { lang } };
    }
  }

  // Staff typing the address of a screen the owner did not give them. The
  // server refuses the data as well; this spares them a screen of errors.
  if (to.meta.requiresVendor && hasRole("VENDOR_MEMBER") && !hasRole("VENDOR")) {
    const { load: loadPrivileges, can: mayOpen } = usePrivileges();
    await loadPrivileges();
    const privilege = privilegeForRoute(to.name);
    if (privilege && !mayOpen(privilege)) {
      const fallback = firstAllowedTab(mayOpen);
      const target = fallback ?? "vendor.home";
      if (target !== to.name) return { name: target, params: { lang } };
    }
  }

  // Guest-only routes (if logged in, send to appropriate dashboard)
  if (to.meta.guestOnly && isAuthenticated()) {
    return homeForCurrentUser(lang);
  }

  // Onboarding guards
  const isCategoryPage = to.name === 'EventCategoryPage';

  // Block category page until email is verified (authenticated users are implicitly verified)
  if (isCategoryPage && !onboardingStore.isEmailVerified && !isAuthenticated()) {
    return { name: 'AuthVerifyEmailPage', params: { lang } };
  }

  // Block invitations page until category selected (for authenticated users in onboarding)
  // Allow unauthenticated users to browse freely (guest invitation flow)
  // Both names render the same screen: the bare onboarding step and the one
  // inside the dashboard shell. The gate applies to either.
  const isInvitationsPage = to.name === 'EventInvitationsPage' || to.name === 'dashboard.invitations';
  if (isInvitationsPage && !onboardingStore.selectedCategory && isAuthenticated() && !onboardingStore.eventId) {
    return { name: 'EventCategoryPage', params: { lang } };
  }

  return true;
});

router.afterEach(() => {
  stopLoading();
});

export default router;
