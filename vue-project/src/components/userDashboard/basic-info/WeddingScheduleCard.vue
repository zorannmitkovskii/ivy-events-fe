<template>
  <div class="card shadow-sm mb-4">
    <div class="card-header bg-brand-light">
      <h5 class="m-0 text-brand-dark">Schedule</h5>
    </div>

    <div class="card-body">
      <div class="row g-3">
        <div class="col-md-4">
          <label class="form-label">Getting Ready</label>
          <input type="time" class="form-control" v-model="form.getReady" />
        </div>
        <div class="col-md-4">
          <label class="form-label">Ceremony Time</label>
          <input type="time" class="form-control" v-model="form.ceremonyTime" />
        </div>
        <div class="col-md-4">
          <label class="form-label">Reception Time</label>
          <input type="time" class="form-control" v-model="form.receptionTime" />
        </div>

        <div class="col-12">
          <label class="form-label">Notes</label>
          <textarea class="form-control" rows="3" v-model="form.notes"></textarea>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps(["form"]);
</script>
