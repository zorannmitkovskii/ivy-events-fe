<template>
  <div class="cards">
    <CardItem
      title="Music"
      icon="🎵"
      text="Which song shouldn't be missing?"
      button="Suggest song"
    />

    <CardItem
      title="Dress code"
      icon="🧥"
      text="Guidelines about the event dress code"
      button="+ Information"
    />

    <CardItem
      title="Transport"
      icon="🚗"
      text="Useful considerations about transportation"
      button="+ Information"
    />

    <CardItem
      title="Accommodation"
      icon="🏨"
      text="Some details about the accommodation"
      button="+ Information"
    />

    <CardItem
      title="Notes and tips"
      icon="💡"
      text="Additional information to keep in mind"
      button="See more…"
    />
  </div>
</template>

<script setup>
import CardItem from "./CardItem.vue";
</script>

<style scoped>
.cards {
  margin-top: 50px;
  display: grid;
  gap: 25px;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  max-width: 900px;
  margin-left: auto;
  margin-right: auto;
}
</style>
