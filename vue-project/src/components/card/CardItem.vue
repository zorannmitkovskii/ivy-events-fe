<template>
  <div class="card">
    <h3>{{ title }}</h3>

    <div class="icon">{{ icon }}</div>

    <p>{{ text }}</p>

    <button>{{ button }}</button>
  </div>
</template>

<script setup>
defineProps({
  title: String,
  icon: String,
  text: String,
  button: String
});
</script>

<style scoped>
.card {
  background: white;
  border-radius: 10px;
  padding: 35px 25px;
  text-align: center;
  color: #333;
  min-height: 240px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  box-shadow: 0 3px 6px rgba(0,0,0,0.15);
  transition: transform .2s;
}

.card:hover {
  transform: translateY(-4px);
}

.icon {
  font-size: 26px;
  margin: 10px 0;
}

button {
  background: #2f5233;
  border: none;
  color: white;
  padding: 8px 20px;
  border-radius: 5px;
  cursor: pointer;
  font-size: 14px;
}

button:hover {
  background: #244427;
}
</style>
