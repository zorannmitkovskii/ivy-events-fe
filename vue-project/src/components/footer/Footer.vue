<template>
  <footer class="bg-dark text-white py-5">
    <div class="container">

      <div class="row g-4">

        <!-- logo -->
        <div class="col-md-4">
          <div class="d-flex align-items-center gap-2 mb-3">
            <div
              class="footer-logo"
            >
              <i class="fas fa-calendar-star text-white fs-4"></i>
            </div>
            <span class="fs-3 fw-bold">EventPro</span>
          </div>

          <p class="text-white-50">
            Plan events effortlessly from vision to experience.
          </p>
        </div>

        <!-- company -->
        <div class="col-md-2">
          <h5 class="fw-bold mb-3">Company</h5>
          <ul class="list-unstyled">
            <li v-for="item in company" :key="item" class="mb-2">
              <a href="#" class="text-white-50 text-decoration-none">
                {{ item }}
              </a>
            </li>
          </ul>
        </div>

        <!-- support -->
        <div class="col-md-2">
          <h5 class="fw-bold mb-3">Support</h5>
          <ul class="list-unstyled">
            <li v-for="item in support" :key="item" class="mb-2">
              <a href="#" class="text-white-50 text-decoration-none">
                {{ item }}
              </a>
            </li>
          </ul>
        </div>

        <!-- social -->
        <div class="col-md-4">
          <h5 class="fw-bold mb-3">Connect</h5>
          <div class="d-flex gap-2">
            <a
              v-for="icon in socials"
              :key="icon"
              href="#"
              class="btn btn-outline-light rounded-circle social-icon"
            >
              <i :class="icon"></i>
            </a>
          </div>
        </div>

      </div>

      <hr class="my-4 border-secondary">

      <div class="text-center text-white-50">
        <p class="mb-0">© 2024 EventPro. All rights reserved.</p>
      </div>

    </div>
  </footer>
</template>

<script setup>
const company = [
  "About Us",
  "Careers",
  "Blog",
  "Contact"
]

const support = [
  "Help Center",
  "Terms",
  "Privacy",
  "Cookies"
]

const socials = [
  "fab fa-facebook-f",
  "fab fa-twitter",
  "fab fa-instagram",
  "fab fa-linkedin-in"
]
</script>

<style scoped>
.footer-logo {
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg,var(--primary-main),var(--primary-light));
  border-radius: 12px;
  display:flex;
  align-items:center;
  justify-content:center;
}

.social-icon {
  width:40px;
  height:40px;
  padding:0;
  display:flex;
  align-items:center;
  justify-content:center;
}
</style>
