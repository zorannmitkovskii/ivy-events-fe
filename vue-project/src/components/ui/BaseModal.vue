<template>
  <teleport to="body">
    <div v-if="open" class="overlay" @click.self="$emit('close')">
      <div class="modal">
        <header class="header">
          <h3 class="title">{{ title }}</h3>
          <button class="close" @click="$emit('close')">✕</button>
        </header>

        <section class="body">
          <slot />
        </section>

        <footer v-if="$slots.footer" class="footer">
          <slot name="footer" />
        </footer>
      </div>
    </div>
  </teleport>
</template>

<script setup>
defineProps({
  open: Boolean,
  title: String
});
defineEmits(["close"]);
</script>

<style scoped>
/* 🔥 overlay centers modal */
.overlay{
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

/* 🔥 modal is content-based height */
.modal{
  background: var(--bg-white);
  border-radius: 16px;
  width: 100%;
  max-width: 520px;
  max-height: 90vh;
  overflow: auto;

  box-shadow: 0 20px 60px rgba(0,0,0,0.25);
  display: flex;
  flex-direction: column;
}

/* header */
.header{
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 20px;
  border-bottom: 1px solid rgba(0,0,0,0.06);
}

.title{
  font-size: 18px;
  font-weight: 800;
  margin: 0;
}

.close{
  border: none;
  background: transparent;
  font-size: 18px;
  cursor: pointer;
}

/* body grows naturally */
.body{
  padding: 20px;
}

/* 🔥 footer buttons aligned right */
.footer{
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 16px 20px;
  border-top: 1px solid rgba(0,0,0,0.06);
}
</style>
