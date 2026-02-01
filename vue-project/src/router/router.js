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
import EventCategoryPage from "@/pages/onboarding/EventCategoryPage.vue";
import EventBasicDetailsPage from "@/pages/onboarding/EventBasicDetailsPage.vue";
import PricingPage from "@/pages/PricingPage.vue";
import CheckoutPurchasePage from "@/pages/onboarding/CheckoutPurchasePage.vue";
import EventLivePage from "@/pages/onboarding/EventLivePage.vue";

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
      { path: 'event-details', name: 'event-details', component: EventBasicDetailsPage },
      { path: 'pricing-page', name: 'pricing-page', component: PricingPage },
      { path: 'checkout-page', name: 'checkout-page', component: CheckoutPurchasePage },
      { path: 'event-live-page', name: 'event-live-page', component: EventLivePage }
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
  }
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
