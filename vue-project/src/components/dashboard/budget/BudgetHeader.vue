<template>
  <header class="header">
    <div>
      <h1 class="title">{{ title }}</h1>
      <p class="subtitle">{{ subtitle }}</p>
    </div>

    <div class="actions">
      <button type="button" class="btn btn-ghost" @click="emit('export')">
        ⭳ {{ exportLabel }}
      </button>

      <button type="button" class="btn btn-primary" @click="emit('add')">
        ＋ {{ addExpenseLabel }}
      </button>
    </div>
  </header>
</template>

<script setup>
defineProps({
  title: String,
  subtitle: String,
  exportLabel: String,
  addExpenseLabel: String
});

const emit = defineEmits(["add", "export"]);
</script>


<style scoped>
.header{
  max-width: 1150px;
  margin: 0 auto;
  padding: 26px 24px 14px;
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:12px;
  background: transparent;
}

.title{
  margin:0;
  font-size:30px;
  font-weight:900;
  letter-spacing:-0.02em;
  color: var(--brand-main);
}

.subtitle{
  margin:6px 0 0;
  font-size:13px;
  font-weight:700;
  color: var(--brand-dark);
}

.actions{
  display:flex;
  gap:10px;
  flex-wrap:wrap;
}

.btn{
  border-radius:12px;
  padding:10px 14px;
  font-weight:900;
  font-size:13px;
  cursor:pointer;
  border: 1px solid var(--brand-dark);
  background:#fff;
  color: var(--brand-main);
  transition: transform 120ms ease;
}

.btn:active{ transform: translateY(1px); }

.btn-ghost{
  background:#fff;
  color: var(--brand-main);
}

.btn-primary{
  background: var(--brand-gold);
  border-color: var(--brand-gold);
  color:#fff;
  box-shadow: 0 10px 22px #0000001A; /* hex alpha, not rgba */
}

@media (max-width: 720px){
  .header{ flex-direction:column; align-items:flex-start; }
}
</style>
