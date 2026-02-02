<template>
  <div class="footer">
    <RouterLink :to="to" class="account">
      <div class="acc-row">
        <div class="avatar">
          <img v-if="avatarUrl" :src="avatarUrl" alt="" />
          <span v-else class="initials">{{ initials }}</span>
        </div>
        <div class="meta">
          <div class="name">{{ name }}</div>
          <div class="role">{{ role }}</div>
        </div>
      </div>
    </RouterLink>
  </div>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  name: { type: String, required: true },
  role: { type: String, default: "" },
  avatarUrl: { type: String, default: "" },
  to: { type: String, default: "/mk/account" }
});

const initials = computed(() => {
  const parts = String(props.name || "").trim().split(/\s+/).slice(0, 2);
  return parts.map(p => p[0]?.toUpperCase()).join("") || "U";
});
</script>

<style scoped>
.footer { padding: 14px 10px 8px; }
.account { color: var(--neutral-100); text-decoration: none; opacity: .95; }

.acc-row{
  display:flex;
  align-items:center;
  gap:10px;
  padding: 10px 10px;
  border-radius: 14px;
  background: rgba(0,0,0,0.18);
}

.avatar{
  width: 34px; height: 34px;
  border-radius: 999px;
  overflow:hidden;
  background: rgba(255,255,255,0.10);
  display:flex; align-items:center; justify-content:center;
}
.avatar img{ width:100%; height:100%; object-fit: cover; }
.initials{ font-weight: 900; font-size: 12px; color: var(--neutral-100); }

.meta{ min-width:0; }
.name{ font-weight: 800; font-size: 13px; white-space:nowrap; overflow:hidden; text-overflow: ellipsis; }
.role{ font-size: 11px; opacity: .9; }
</style>
