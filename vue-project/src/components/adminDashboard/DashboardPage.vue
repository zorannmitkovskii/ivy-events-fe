<template>
  <div>
    <div class="cards-grid mb-4">
      <div class="card">
        <h5>Total Users</h5>
        <p>123</p>
      </div>
      <div class="card">
        <h5>Total Vendors</h5>
        <p>45</p>
      </div>
      <div class="card">
        <h5>Total Events</h5>
        <p>67</p>
      </div>
      <div class="card">
        <h5>Pending Tasks</h5>
        <p>12</p>
      </div>
    </div>
  </div>
</template>

<script setup></script>

<style scoped>
.cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 20px;
}

.card {
  background-color: var(--cards-color);
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0 2px 6px rgba(0,0,0,0.05);
}

.card h5 {
  margin: 0 0 10px 0;
  color: var(--text-color);
}
</style>
