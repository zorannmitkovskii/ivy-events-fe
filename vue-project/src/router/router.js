import { createRouter, createWebHistory } from 'vue-router'
import HomePage from "@/pages/HomePage.vue";
import FeaturesPage from "@/pages/marketing/FeaturesPage.vue";
import FeatureRSVPPage from "@/pages/marketing/feautres/FeatureRSVPPage.vue";
import FeatureInvitationsPage from "@/pages/marketing/feautres/FeatureInvitationsPage.vue";
import AuthLoginPage from "@/pages/auth/AuthLoginPage.vue";
import AuthSignupPage from "@/pages/auth/AuthSignupPage.vue";
import AuthForgotPasswordPage from "@/pages/auth/AuthForgotPasswordPage.vue";
import AuthResetPasswordPage from "@/pages/auth/AuthResetPasswordPage.vue";
import AuthVerifyEmailPage from "@/pages/auth/AuthVerifyEmailPage.vue";
import { setLocale } from '@/i18n'
import EventCategoryPage from "@/pages/EventCategoryPage.vue";

const routes = [
  // Marketing shell (MK default)
  {
    path: '/',
    children: [
      { path: '', name: 'home', component: HomePage },
      { path: 'features', name: 'features', component: FeaturesPage },
      { path: 'features/rsvp', name: 'features-rsvp', component: FeatureRSVPPage },
      { path: 'features/invitations', name: 'features-invitations', component: FeatureInvitationsPage },
      { path: 'event-category', name: 'event-categories', component: EventCategoryPage },
      // { path: 'features/tables', name: 'features-tables', component: FeatureTablesPage },
      // { path: 'features/tasks', name: 'features-tasks', component: FeatureTasksPage },
      // { path: 'features/budget', name: 'features-budget', component: FeatureBudgetPage },
      // { path: 'features/gallery', name: 'features-gallery', component: FeatureGalleryPage },
      // { path: 'features/notifications', name: 'features-notifications', component: FeatureNotificationsPage },
      // { path: 'features/live-mode', name: 'features-live-mode', component: FeatureLiveModePage },
      // { path: 'pricing', name: 'pricing', component: PricingPage },
      // { path: 'how-it-works', name: 'how-it-works', component: HowItWorksPage },
      // { path: 'templates', name: 'templates', component: TemplatesPage },
      // { path: 'faq', name: 'faq', component: FaqPage },
      // { path: 'blog', name: 'blog', component: BlogPage },
      // { path: 'contact', name: 'contact', component: ContactPage },
      // { path: 'privacy', name: 'privacy', component: PrivacyPage },
      // { path: 'terms', name: 'terms', component: TermsPage },
    ],
  },

  // English marketing shell (/en)
  {
    path: '/en',
    children: [
      { path: '', name: 'home-en', component: HomePage },
      { path: 'features', name: 'features-en', component: FeaturesPage },
      { path: 'features/rsvp', name: 'features-rsvp-en', component: FeatureRSVPPage },
      { path: 'features/invitations', name: 'features-invitations-en', component: FeatureInvitationsPage },
    ],
  },

  // Auth shell (MK default)
  {
    path: '/auth',
    // component: AuthLayout,
    meta: { guestOnly: true },
    children: [
      { path: 'login', name: 'login', component: AuthLoginPage },
      { path: 'signup', name: 'signup', component: AuthSignupPage },
      { path: 'forgot-password', name: 'forgot-password', component: AuthForgotPasswordPage },
      { path: 'reset-password', name: 'reset-password', component: AuthResetPasswordPage },
      { path: 'verify-email', name: 'verify-email', component: AuthVerifyEmailPage },
    ],
  },

  // English Auth shell (/en/auth)
  {
    path: '/en/auth',
    meta: { guestOnly: true },
    children: [
      { path: 'login', name: 'login-en', component: AuthLoginPage },
      { path: 'signup', name: 'signup-en', component: AuthSignupPage },
      { path: 'forgot-password', name: 'forgot-password-en', component: AuthForgotPasswordPage },
      { path: 'reset-password', name: 'reset-password-en', component: AuthResetPasswordPage },
      { path: 'verify-email', name: 'verify-email-en', component: AuthVerifyEmailPage },
    ],
  },
  //
  // // Admin shell (ADMIN only)
  // {
  //   path: '/admin',
  //   component: AdminLayout,
  //   meta: { requiresAuth: true, roles: [ROLES.ADMIN] },
  //   children: [
  //     { path: 'overview', name: 'admin-overview', component: AdminOverview },
  //     { path: 'users', name: 'admin-users', component: AdminUsersList },
  //     { path: 'users/:userId', name: 'admin-user-details', component: AdminUserDetails, props: true },
  //     { path: 'events', name: 'admin-events', component: AdminEventsList },
  //     { path: 'events/:eventId', name: 'admin-event-audit', component: AdminEventAudit, props: true },
  //     { path: 'plans', name: 'admin-plans', component: AdminPlans },
  //     { path: 'plans/features', name: 'admin-feature-flags', component: AdminFeatureFlags },
  //     { path: 'billing/transactions', name: 'admin-transactions', component: AdminTransactions },
  //     { path: 'billing/refunds', name: 'admin-refunds', component: AdminRefunds },
  //     { path: 'sms/analytics', name: 'admin-sms-analytics', component: AdminSmsAnalytics },
  //     { path: 'sms/logs', name: 'admin-sms-logs', component: AdminSmsLogs },
  //     { path: 'moderation/gallery', name: 'admin-gallery-moderation', component: AdminGalleryModeration },
  //     { path: 'support/tickets', name: 'admin-support-tickets', component: AdminSupportTickets },
  //     { path: 'support/announcements', name: 'admin-announcements', component: AdminAnnouncements },
  //     { path: 'settings', name: 'admin-settings', component: AdminSettings },
  //     { path: 'settings/email-templates', name: 'admin-email-templates', component: AdminEmailTemplates },
  //     { path: 'settings/notification-templates', name: 'admin-notification-templates', component: AdminNotificationTemplates },
  //     { path: '', redirect: { name: 'admin-overview' } },
  //   ],
  // },
  //
  // // Shared dashboard (HOST + ORGANIZER)
  // {
  //   path: '/dashboard',
  //   component: DashboardLayout,
  //   meta: { requiresAuth: true, roles: [ROLES.HOST, ROLES.ORGANIZER] },
  //   children: [
  //     { path: 'home', name: 'dashboard-home', component: DashboardHome },
  //
  //     // Events
  //     { path: 'events', name: 'events-list', component: EventsList },
  //     { path: 'events/create', name: 'event-create', component: EventCreate },
  //
  //     // Event scoped pages
  //     {
  //       path: 'events/:eventId',
  //       name: 'event',
  //       // This can be a layout wrapper for event navigation (tabs/sidebar)
  //       component: () => import('@/layouts/EventLayout.vue'),
  //       props: true,
  //       children: [
  //         { path: 'overview', name: 'event-overview', component: EventOverview },
  //
  //         // Invitation
  //         { path: 'invitation', name: 'event-invitation', component: InvitationBuilder },
  //         { path: 'invitation/theme', name: 'event-invitation-theme', component: InvitationTheme },
  //         { path: 'invitation/share', name: 'event-invitation-share', component: InvitationShare },
  //
  //         // RSVP
  //         { path: 'rsvp/settings', name: 'event-rsvp-settings', component: RsvpSettings },
  //         { path: 'rsvp/responses', name: 'event-rsvp-responses', component: RsvpResponses },
  //         { path: 'rsvp/reminders', name: 'event-rsvp-reminders', component: RsvpReminders },
  //
  //         // Guests
  //         { path: 'guests', name: 'event-guests', component: GuestsList },
  //         { path: 'guests/groups', name: 'event-guest-groups', component: GuestGroups },
  //         { path: 'guests/import-export', name: 'event-guests-import-export', component: GuestsImportExport },
  //         { path: 'guests/messages', name: 'event-guests-messages', component: GuestsMessages },
  //
  //         // Tables
  //         { path: 'tables', name: 'event-tables', component: TablesOverview },
  //         { path: 'tables/seating', name: 'event-seating', component: SeatingPlanner },
  //         { path: 'tables/rules', name: 'event-seating-rules', component: SeatingRules },
  //         { path: 'tables/export', name: 'event-tables-export', component: TablesExport },
  //
  //         // Tasks
  //         { path: 'tasks', name: 'event-tasks', component: TasksList },
  //         { path: 'tasks/categories', name: 'event-task-categories', component: TaskCategories },
  //         { path: 'tasks/reminders', name: 'event-task-reminders', component: TaskReminders },
  //
  //         // Budget
  //         { path: 'budget', name: 'event-budget', component: BudgetOverview },
  //         { path: 'budget/categories', name: 'event-budget-categories', component: BudgetCategories },
  //         { path: 'budget/payments', name: 'event-budget-payments', component: BudgetPayments },
  //         { path: 'budget/export', name: 'event-budget-export', component: BudgetExport },
  //
  //         // Vendors
  //         { path: 'vendors', name: 'event-vendors', component: VendorsList },
  //         { path: 'vendors/:vendorId', name: 'event-vendor-details', component: VendorDetails, props: true },
  //
  //         // Gallery
  //         { path: 'gallery', name: 'event-gallery', component: EventGallery },
  //         { path: 'gallery/moderation', name: 'event-gallery-moderation', component: GalleryModeration },
  //
  //         // Notifications
  //         { path: 'notifications', name: 'event-notifications', component: NotificationsCenter },
  //         { path: 'notifications/templates', name: 'event-notification-templates', component: NotificationTemplates },
  //         { path: 'notifications/logs', name: 'event-notification-logs', component: NotificationLogs },
  //
  //         // Premium-only pages (you can also gate them by plan feature flags)
  //         { path: 'team', name: 'event-team', component: EventTeam, meta: { premiumOnly: true } },
  //         { path: 'live', name: 'event-live', component: LiveEventMode, meta: { premiumOnly: true } },
  //
  //         // Settings
  //         { path: 'settings', name: 'event-settings', component: EventSettings },
  //         { path: 'settings/archive', name: 'event-archive', component: EventArchive },
  //
  //         { path: '', redirect: { name: 'event-overview' } },
  //       ],
  //     },
  //
  //     // Billing
  //     { path: 'billing', name: 'billing', component: BillingOverview },
  //     { path: 'billing/sms', name: 'billing-sms', component: BillingSms },
  //     { path: 'billing/invoices', name: 'billing-invoices', component: BillingInvoices },
  //
  //     // Account
  //     { path: 'account/profile', name: 'account-profile', component: AccountProfile },
  //     { path: 'account/security', name: 'account-security', component: AccountSecurity },
  //     { path: 'account/notifications', name: 'account-notifications', component: AccountNotifications },
  //
  //     { path: '', redirect: { name: 'dashboard-home' } },
  //   ],
  // },
  //
  // // Public guest-facing flows (no login)
  // {
  //   path: '/public',
  //   component: PublicLayout,
  //   children: [
  //     { path: 'invite/:eventSlug', name: 'public-invite', component: PublicInvite, props: true },
  //     { path: 'rsvp/:eventSlug', name: 'public-rsvp', component: PublicRsvp, props: true },
  //     { path: 'seat/:eventSlug', name: 'public-seat', component: PublicSeatLookup, props: true },
  //     { path: 'gallery/:eventSlug', name: 'public-gallery', component: PublicGallery, props: true },
  //     { path: 'updates/:eventSlug', name: 'public-updates', component: PublicUpdates, props: true },
  //   ],
  // },
  //
  // // Not found
  // { path: '/:pathMatch(.*)*', name: 'not-found', component: NotFound },
]

const router = createRouter({
  history: createWebHistory(),
  routes
});

router.beforeEach((to, from, next) => {
  // Set locale by URL prefix: '/en' -> English, otherwise Macedonian (default)
  if (to.path === '/en' || to.path.startsWith('/en/')) {
    setLocale('en')
  } else {
    setLocale('mk')
  }

  if (to.meta.requiresAuth) {
    // If a route requires auth, send the user to our app's login page.
    // The Login page will handle authentication via the backend.
    if (!to.path.startsWith('/login')) {
      next({ path: '/login', query: { redirect: to.fullPath } });
      return;
    }
  }
  next();
});

export default router
