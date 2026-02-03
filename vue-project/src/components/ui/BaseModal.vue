<template>
  <teleport to="body">
    <div v-if="open" class="overlay" @click.self="$emit('close')">
      <div class="modal">
        <header class="header">
          <h3 class="title">{{ title }}</h3>
          <button class="close" type="button" @click="$emit('close')">✕</button>
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
/* overlay centers modal */
.overlay{
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

/* ✅ no rgba: use pseudo layer with opacity */
.overlay::before{
  content: "";
  position: absolute;
  inset: 0;
  background: var(--brand-main);
  opacity: 0.45;
}

/* modal */
.modal{
  position: relative;
  z-index: 1;

  background: #ffffff;
  border-radius: 16px;
  width: 100%;
  max-width: 520px;
  max-height: 90vh;
  overflow: auto;

  border: 1px solid var(--brand-dark);
  box-shadow: 0 20px 60px var(--brand-dark);

  display: flex;
  flex-direction: column;
}

/* header */
.header{
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 20px;
  border-bottom: 1px solid var(--brand-dark);
}

.title{
  font-size: 18px;
  font-weight: 800;
  margin: 0;
  color: var(--brand-main);
}

.close{
  border: 1px solid var(--brand-dark);
  background: #ffffff;
  border-radius: 10px;
  padding: 6px 10px;
  cursor: pointer;
  font-size: 16px;
  color: var(--brand-main);
}

/* body */
.body{
  padding: 20px;
}

/* footer buttons aligned right */
.footer{
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 16px 20px;
  border-top: 1px solid var(--brand-dark);
}
</style>
