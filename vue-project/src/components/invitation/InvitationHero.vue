<template>
  <div class="w-full h-screen flex">
    <!-- Left Image -->
<!--    <div class="w-1/2 h-full">-->
<!--      <img-->
<!--        :src="image"-->
<!--        alt="Couple"-->
<!--        class="w-full h-full object-cover"-->
<!--      />-->
<!--    </div>-->

    <!-- Right Content -->
    <div class="w-1/2 relative flex items-center justify-center bg-brand-light">
      <!-- Music Button -->
      <button
        class="absolute top-6 right-6 w-12 h-12 bg-brand-light text-brand-dark rounded-full
               flex items-center justify-center text-xl shadow-md hover:bg-green-800 transition"
      >
        🎵
      </button>

      <!-- Names & Date -->
      <div class="flex flex-col items-center text-center space-y-4">
        <p class="font-wedding text-3xl text-brand-dark">{{ firstName }}</p>

        <p class="text-3xl font-serif text-brand-dark">&</p>

        <p class="font-wedding text-3xl text-brand-dark">{{ secondName }}</p>

        <p class="text-brand-dark mt-6">{{ date }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  image: {
    type: String,
    required: true,
  },
  firstName: {
    type: String,
    default: "John",
  },
  secondName: {
    type: String,
    default: "Jane",
  },
  date: {
    type: String,
    default: "24.12.2025",
  },
});
</script>

<style scoped>
/* Optional: Your elegant script font */
.font-wedding {
  font-family: "Great Vibes", cursive;
}
</style>
