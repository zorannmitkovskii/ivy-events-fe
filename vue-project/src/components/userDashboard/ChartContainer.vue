<template>
    <div class="row g-4">

      <div class="col-12 col-md-6">
        <div class="chart-card card shadow-sm p-4 h-100">
          <h5 class="fw-bold text-brand-dark mb-3">{{ title1 }}</h5>
          <canvas :id="id1" height="120"></canvas>
        </div>
      </div>

      <div class="col-12 col-md-6">
        <div class="chart-card card shadow-sm p-4 h-100">
          <h5 class="fw-bold text-brand-dark mb-3">{{ title2 }}</h5>
          <canvas :id="id2" height="120"></canvas>
        </div>
      </div>

    </div>
</template>

<script>
export default {
  name: "ChartContainer",
  props: {
    title1: { type: String, required: true },
    id1: { type: String, required: true },
    title2: { type: String, required: true },
    id2: { type: String, required: true }
  }
};
</script>
