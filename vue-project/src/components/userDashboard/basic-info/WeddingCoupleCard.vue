<template>
  <div class="card shadow-sm mb-4">
    <div class="card-header bg-brand-light">
      <h5 class="m-0 text-brand-dark">Wedding Couple</h5>
    </div>

    <div class="card-body">
      <div class="row g-3">
        <div class="col-md-6">
          <label class="form-label">Partner 1 Name</label>
          <input type="text" class="form-control" v-model="form.partner1" />
        </div>
        <div class="col-md-6">
          <label class="form-label">Partner 2 Name</label>
          <input type="text" class="form-control" v-model="form.partner2" />
        </div>
        <div class="col-md-6">
          <label class="form-label">Contact Email</label>
          <input type="email" class="form-control" v-model="form.email" />
        </div>
        <div class="col-md-6">
          <label class="form-label">Contact Phone</label>
          <input type="text" class="form-control" v-model="form.phone" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps(["form"]);
</script>
