<template>
  <div id="weddingHero" class="carousel slide mb-5" data-bs-ride="carousel">
    <div class="carousel-inner rounded shadow">
      <div class="carousel-item active">
        <img src="https://picsum.photos/id/101/1600/700" class="d-block w-100">
        <div class="carousel-caption">
          <h2 class="fw-bold">Online Wedding Invitations</h2>
        </div>
      </div>

      <div class="carousel-item">
        <img src="https://picsum.photos/id/102/1600/700" class="d-block w-100">
        <div class="carousel-caption">
          <h2 class="fw-bold">Create Beautiful Experiences</h2>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const slides = [
  {id:1,image:"https://picsum.photos/id/101/1200/800",title:"Online Wedding Invitations"},
  {id:2,image:"https://picsum.photos/id/102/1200/800",title:"Create Beautiful Experiences"},
]
</script>
