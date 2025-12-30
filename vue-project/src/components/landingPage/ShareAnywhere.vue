<template>
  <section id="share" class="py-5 bg-brand-light">
    <div class="container">

      <!-- Heading -->
      <div class="text-center mb-5">
        <div class="mb-4">
          <img
            src="https://images.unsplash.com/photo-1557683316-973673baf926?w=100&h=100&fit=crop"
            alt="Ribbon"
            style="width: 80px; opacity: 0.3;"
          >
        </div>

        <h2 class="display-5 fw-bold mb-3" style="color: var(--neutral-900);">
          Share your link anywhere
        </h2>
        <p class="fs-5" style="color: var(--neutral-500);">
          Send it out via text, email, or even snail mail.
        </p>
      </div>

      <!-- Cards -->
      <div class="row g-4">
        <div
          class="col-md-4"
          v-for="(card, index) in shareCards"
          :key="index"
        >
          <div class="share-card text-center">

            <img :src="card.image" :alt="card.title" class="share-icon"/>

            <h4 class="fw-bold mb-3" style="color: var(--neutral-900);">
              {{ card.title }}
            </h4>

            <p class="mb-4" style="color: var(--neutral-500);">
              {{ card.text }}
            </p>

            <button class="btn btn-outline-success">
              Try it <i class="fas fa-arrow-right ms-2"></i>
            </button>

          </div>
        </div>
      </div>

    </div>
  </section>
</template>


<script setup>
const shareCards = [
  {
    title: "Email it",
    text: "Enter guest emails and we'll handle the rest",
    image: "https://images.unsplash.com/photo-1596526131083-e8c633c948d2?w=400&h=300&fit=crop"
  },
  {
    title: "Text it",
    text: "Easily send out your event link via SMS",
    image: "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=400&h=300&fit=crop"
  },
  {
    title: "Print it",
    text: "Print out your custom QR code to share IRL",
    image: "https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=400&h=300&fit=crop"
  }
]
</script>


<style scoped>
.share-card{
  padding: 30px;
  background:white;
  border-radius:20px;
  box-shadow:0 4px 20px rgba(0,0,0,0.05);
  border:1px solid #eee;
}
.share-icon{
  width:100%;
  height:200px;
  object-fit:cover;
  border-radius:15px;
  margin-bottom:20px;
}
</style>
