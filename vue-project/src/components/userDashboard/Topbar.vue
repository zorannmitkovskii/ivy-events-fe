<template>
  <header class="d-flex align-items-center justify-content-between p-3 bg-white mb-3">
    <div class="d-flex align-items-center gap-3">
      <button class="btn btn-light btn-sm" @click="$router.push('/')">Home</button>
      <input class="form-control form-control-sm" placeholder="Search" style="width:280px" />
    </div>


    <div class="d-flex align-items-center gap-3">
      <div class="rounded-circle bg-light p-2">🔔</div>
      <div class="rounded-circle" style="width:36px;height:36px;overflow:hidden;border-radius:50%"><img src="https://i.pravatar.cc/40" /></div>
    </div>
  </header>
</template>


<script setup>
</script>


<style scoped>
</style>
