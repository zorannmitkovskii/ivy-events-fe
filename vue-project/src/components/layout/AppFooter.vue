<template>
  <footer class="footer">
    <div class="container">
      <div class="footer__top">
        <div class="footer__col">
          <div class="footer__title">ivy.events</div>
          <p>Create and share beautiful event invitations.</p>
        </div>
        <div class="footer__col">
          <div class="footer__title">Company</div>
          <ul>
            <li><a href="#">About</a></li>
            <li><a href="#">Blog</a></li>
            <li><a href="#">Careers</a></li>
          </ul>
        </div>
        <div class="footer__col">
          <div class="footer__title">Support</div>
          <ul>
            <li><a href="#">Help Center</a></li>
            <li><a href="#">Contact</a></li>
            <li><a href="#">Status</a></li>
          </ul>
        </div>
      </div>
      <div class="footer__bottom">
        <small>© {{ new Date().getFullYear() }} Ivy Events</small>
        <div class="flex gap-16">
          <a href="#">Privacy</a>
          <a href="#">Terms</a>
        </div>
      </div>
    </div>
  </footer>
</template>

<script setup>
</script>

<style scoped>
@import '@/assets/styles/variables.css';
@import '@/assets/styles/footer.css';
</style>
