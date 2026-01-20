import { createRouter, createWebHistory } from 'vue-router'
import LandingPage from '../pages/LandingPage.vue'
import WeddingsPage from "@/pages/category/WeddingsPage.vue";
import BabyPage from "@/pages/category/BabyPage.vue";
import BusinessPage from "@/pages/category/BusinessPage.vue";
import HolidayPage from "@/pages/category/HolidayPage.vue";
import KidsBirthdaysPage from "@/pages/category/KidsBirthdaysPage.vue";
import AdultBirthdaysPage from "@/pages/category/AdultBirthdaysPage.vue";
import ContactUsPage from "@/pages/help/ContactUsPage.vue";
import LoginPage from "@/pages/LoginPage.vue";
import InvitationPage from "@/pages/invitaiton/InvitationPage.vue";
import BasicInfo from "@/pages/userDashboard/BasicInfo.vue";
import Guests from "@/pages/userDashboard/Guests.vue";
import Budget from "@/pages/userDashboard/Budget.vue";
import Tables from "@/pages/userDashboard/Tables.vue";
import Vendors from "@/pages/userDashboard/Vendors.vue";
import Tasks from "@/pages/userDashboard/Tasks.vue";
import Timeline from "@/pages/userDashboard/Timeline.vue";
import Gallery from "@/pages/userDashboard/Gallery.vue";
import DashboardHomePage from "@/pages/userDashboard/DashboardHomePage.vue";
import ProfilePage from "@/pages/userDashboard/ProfilePage.vue";
import AccountPage from "@/pages/userDashboard/AccountPage.vue";
import AdminPage from "@/pages/adminDashboard/AdminPage.vue";
import AdminUsersPage from "@/pages/adminDashboard/AdminUsersPage.vue";
import AdminVendorsPage from "@/pages/adminDashboard/AdminVendorsPage.vue";
import AdminLocationPage from "@/pages/adminDashboard/AdminLocationPage.vue";
import AdminPackagesPage from "@/pages/adminDashboard/AdminPackagesPage.vue";
import AdminEventPage from "@/pages/adminDashboard/AdminEventPage.vue";
import AdminCategoriesPage from "@/pages/adminDashboard/AdminCategoriesPage.vue";
import GalleryUpload from "@/pages/GalleryUpload.vue";
import SignupPage from "@/pages/SignupPage.vue";
import EventUploadPage from "@/pages/EventUploadPage.vue";

const routes = [
  { path: '/', component: LandingPage },
  { path: '/weddings', component: WeddingsPage },
  { path: '/baby', component: BabyPage },
  { path: '/business', component: BusinessPage },
  { path: '/holiday', component: HolidayPage },
  { path: '/kidsbirthdays', component: KidsBirthdaysPage },
  { path: '/adultbirthdays', component: AdultBirthdaysPage },
  { path: '/about', component: ContactUsPage },
  { path: '/terms', component: ContactUsPage },
  { path: '/organizer', component: ContactUsPage },
  { path: '/blog', component: ContactUsPage },
  { path: '/faq', component: ContactUsPage },
  { path: '/contactus', component: ContactUsPage },
  { path: '/login', component: LoginPage },
  { path: '/signup', component: SignupPage },
  { path: '/invitation', component: InvitationPage },
  { path: '/dashboard', component: DashboardHomePage },
  { path: '/basic', component: BasicInfo },
  { path: '/guests', component: Guests },
  { path: '/budget', component: Budget },
  { path: '/tables', component: Tables },
  { path: '/vendors', component: Vendors },
  { path: '/tasks', component: Tasks },
  { path: '/timeline', component: Timeline },
  { path: '/gallery', component: Gallery },
  { path: '/profilepage', component: ProfilePage },
  { path: '/account', component: AccountPage },
  { path: '/admin', component: AdminPage },
  { path: '/admin/users', component: AdminUsersPage },
  { path: '/admin/vendors', component: AdminVendorsPage },
  { path: '/admin/locations', component: AdminLocationPage },
  { path: '/admin/packages', component: AdminPackagesPage },
  { path: '/admin/events', component: AdminEventPage },
  { path: '/admin/categories', component: AdminCategoriesPage },
  // { path: '/upload', component: GalleryUpload }
  { path: '/upload', component: EventUploadPage }
]

const router = createRouter({
  history: createWebHistory(),
  routes
});

router.beforeEach((to, from, next) => {
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
