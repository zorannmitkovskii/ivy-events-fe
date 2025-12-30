<template>
  <div class="card shadow-sm mb-4">
    <div class="card-header bg-brand-light">
      <h5 class="m-0 text-brand-dark">Wedding Details</h5>
    </div>

    <div class="card-body">
      <div class="row g-3">
        <div class="col-md-6">
          <label class="form-label">Wedding Date</label>
          <input type="date" class="form-control" v-model="form.date" />
        </div>
        <div class="col-md-6">
          <label class="form-label">Wedding Time</label>
          <input type="time" class="form-control" v-model="form.time" />
        </div>
        <div class="col-12">
          <label class="form-label">Wedding Location</label>
          <input type="text" class="form-control" v-model="form.location" />
        </div>
        <div class="col-12">
          <label class="form-label">Ceremony Details</label>
          <textarea class="form-control" rows="3" v-model="form.ceremony"></textarea>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps(["form"]);
</script>
