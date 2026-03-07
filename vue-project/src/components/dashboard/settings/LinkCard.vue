<template>
  <div class="link-card">
    <div class="link-card-header">
      <h3 class="link-card-title">{{ title }}</h3>
      <p class="link-card-desc">{{ description }}</p>
    </div>

    <div v-if="url" class="link-card-body">
      <div class="url-box">
        <span class="url-text">{{ url }}</span>
        <button class="copy-btn" type="button" @click="copyToClipboard">
          <i :class="copied ? 'bi bi-check-lg' : 'bi bi-clipboard'"></i>
          {{ copied ? t('invitationLinks.copied') : t('invitationLinks.copyLink') }}
        </button>
      </div>

      <div class="qr-section">
        <canvas ref="qrCanvas" class="qr-canvas"></canvas>
        <button class="qr-download-btn" type="button" @click="downloadQr">
          {{ t('invitationLinks.downloadQr') }}
        </button>
      </div>
    </div>

    <div v-else class="link-card-empty">
      {{ t('invitationLinks.noLink') }}
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, nextTick } from "vue";
import { useI18n } from "vue-i18n";

const { t } = useI18n();

const props = defineProps({
  title: { type: String, required: true },
  description: { type: String, default: "" },
  url: { type: String, default: "" },
  qrFileName: { type: String, default: "qr-code.png" },
});

const qrCanvas = ref(null);
const copied = ref(false);

async function renderQr() {
  await nextTick();
  if (!qrCanvas.value || !props.url) return;
  try {
    const QRCode = await import("qrcode");
    await QRCode.toCanvas(qrCanvas.value, props.url, {
      width: 180,
      margin: 2,
      color: { dark: "#2f3e36", light: "#ffffff" },
    });
  } catch (e) {
    console.error("QR render failed", e);
  }
}

function downloadQr() {
  if (!qrCanvas.value) return;
  const link = document.createElement("a");
  link.download = props.qrFileName;
  link.href = qrCanvas.value.toDataURL("image/png");
  link.click();
}

async function copyToClipboard() {
  if (!props.url) return;
  try {
    await navigator.clipboard.writeText(props.url);
  } catch {
    const ta = document.createElement("textarea");
    ta.value = props.url;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
  }
  copied.value = true;
  setTimeout(() => { copied.value = false; }, 2000);
}

onMounted(renderQr);
watch(() => props.url, renderQr);
</script>

<style scoped>
.link-card {
  background: var(--dash-cream-card);
  border-radius: var(--dash-radius);
  box-shadow: var(--dash-shadow-sm);
  border: 1px solid var(--dash-cream-border);
  padding: 24px;
}

.link-card-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--dash-charcoal);
  margin: 0 0 4px;
}

.link-card-desc {
  font-size: 13px;
  color: var(--dash-muted);
  margin: 0 0 16px;
}

.url-box {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: var(--dash-cream);
  border: 1px solid var(--dash-cream-border);
  border-radius: 10px;
}

.url-text {
  flex: 1;
  font-size: 13px;
  color: var(--dash-ink);
  word-break: break-all;
  font-family: monospace;
}

.copy-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border: 1px solid var(--dash-cream-border);
  background: var(--dash-cream-card);
  border-radius: 10px;
  font-size: 13px;
  font-weight: 600;
  color: var(--dash-sage);
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.15s ease;
}

.copy-btn:hover {
  border-color: var(--dash-sage-light);
  background: var(--dash-sage-ghost);
}

.qr-section {
  margin-top: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.qr-canvas {
  display: block;
  border: 1px solid var(--dash-cream-border);
  border-radius: 10px;
}

.qr-download-btn {
  padding: 8px 16px;
  border: 1px solid var(--dash-cream-border);
  background: var(--dash-cream-card);
  border-radius: 10px;
  font-size: 13px;
  font-weight: 600;
  color: var(--dash-sage);
  cursor: pointer;
  transition: all 0.15s ease;
}

.qr-download-btn:hover {
  border-color: var(--dash-sage-light);
  background: var(--dash-sage-ghost);
}

.link-card-empty {
  font-size: 13px;
  color: var(--dash-muted);
  padding: 12px 0;
}

@media (max-width: 640px) {
  .url-box {
    flex-direction: column;
    align-items: stretch;
  }
  .copy-btn {
    justify-content: center;
  }
}
</style>
