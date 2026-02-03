<template>
  <Teleport to="body">
    <div v-if="open" class="backdrop" @click.self="$emit('close')">
      <div class="modal" role="dialog" aria-modal="true">
        <div class="head">
          <div class="title">{{ title }}</div>
          <button class="x" type="button" @click="$emit('close')">✕</button>
        </div>

        <div class="body">
          <slot />
        </div>

        <div v-if="$slots.footer" class="foot">
          <slot name="footer" />
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
defineProps({
  open: { type: Boolean, default: false },
  title: { type: String, default: "" }
});
defineEmits(["close"]);
</script>

<style scoped>
.backdrop{
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.45);
  display: grid;
  place-items: center;
  padding: 18px;
  z-index: 9999; /* ✅ super high */
}

.modal{
  width: min(560px, 100%);
  background: rgba(255,255,255,0.96);
  border: 1px solid rgba(0,0,0,0.12);
  border-radius: 16px;
  box-shadow: 0 30px 70px rgba(0,0,0,0.22);
  overflow: hidden;
}

.head{
  display:flex;
  align-items:center;
  justify-content:space-between;
  padding: 14px 16px;
  border-bottom: 1px solid rgba(0,0,0,0.06);
}

.title{
  font-weight: 950;
  font-size: 16px;
}

.x{
  border: 0;
  background: transparent;
  cursor: pointer;
  font-size: 18px;
  opacity: .8;
}

.body{ padding: 16px; }

.foot{
  padding: 14px 16px;
  border-top: 1px solid rgba(0,0,0,0.06);
  display:flex;
  justify-content:flex-end;
  gap: 10px;
}
</style>
