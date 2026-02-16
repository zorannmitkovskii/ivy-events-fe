<template>
  <section class="hero-banner" :style="heroStyle">
    <div class="hero-overlay"></div>
    <div class="hero-content">
      <div class="leaf-border">
        <svg class="leaf-top-left" width="60" height="60" viewBox="0 0 60 60" fill="none">
          <path d="M5 55C5 55 10 30 30 15C50 0 55 5 55 5C55 5 50 15 35 30C20 45 5 55 5 55Z" fill="#A8B89C" opacity="0.6"/>
          <path d="M8 50C8 50 15 35 28 25C41 15 48 12 48 12" stroke="#8B9E7E" stroke-width="1" fill="none"/>
        </svg>
        <svg class="leaf-top-right" width="60" height="60" viewBox="0 0 60 60" fill="none">
          <path d="M55 55C55 55 50 30 30 15C10 0 5 5 5 5C5 5 10 15 25 30C40 45 55 55 55 55Z" fill="#A8B89C" opacity="0.6"/>
          <path d="M52 50C52 50 45 35 32 25C19 15 12 12 12 12" stroke="#8B9E7E" stroke-width="1" fill="none"/>
        </svg>
        <svg class="leaf-bottom-left" width="60" height="60" viewBox="0 0 60 60" fill="none">
          <path d="M5 5C5 5 10 30 30 45C50 60 55 55 55 55C55 55 50 45 35 30C20 15 5 5 5 5Z" fill="#A8B89C" opacity="0.6"/>
          <path d="M8 10C8 10 15 25 28 35C41 45 48 48 48 48" stroke="#8B9E7E" stroke-width="1" fill="none"/>
        </svg>
        <svg class="leaf-bottom-right" width="60" height="60" viewBox="0 0 60 60" fill="none">
          <path d="M55 5C55 5 50 30 30 45C10 60 5 55 5 55C5 5 10 45 25 30C40 15 55 5 55 5Z" fill="#A8B89C" opacity="0.6"/>
          <path d="M52 10C52 10 45 25 32 35C19 45 12 48 12 48" stroke="#8B9E7E" stroke-width="1" fill="none"/>
        </svg>

        <p class="couple-names">{{ brideName }} <span class="ampersand">&amp;</span> {{ groomName }}</p>
        <div class="gold-divider">
          <span class="divider-line"></span>
          <svg class="divider-leaf" width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M12 2C12 2 8 8 4 12C8 12 12 8 12 2Z" fill="#C8A870"/>
            <path d="M12 2C12 2 16 8 20 12C16 12 12 8 12 2Z" fill="#D4B896"/>
          </svg>
          <span class="divider-line"></span>
        </div>
        <p class="wedding-date">{{ weddingDate }}</p>

        <button class="rsvp-pill" @click="scrollToRsvp">RSVP</button>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  brideName: { type: String, required: true },
  groomName: { type: String, required: true },
  weddingDate: { type: String, required: true },
  couplePhotoUrl: { type: String, default: null }
});

const heroStyle = computed(() => {
  if (props.couplePhotoUrl) {
    return { backgroundImage: `url(${props.couplePhotoUrl})` };
  }
  return {};
});

function scrollToRsvp() {
  const el = document.getElementById('rsvp-section');
  if (el) {
    el.scrollIntoView({ behavior: 'smooth' });
  }
}
</script>

<style scoped>
.hero-banner {
  position: relative;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-size: cover;
  background-position: center;
  background-color: #A8B89C;
  background-image: linear-gradient(135deg, #A8B89C 0%, #8B9E7E 30%, #E8C4C0 70%, #D4A69E 100%);
}

.hero-overlay {
  position: absolute;
  inset: 0;
  background: rgba(250, 248, 245, 0.82);
  backdrop-filter: blur(2px);
}

.hero-content {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 680px;
  padding: 20px;
}

.leaf-border {
  position: relative;
  text-align: center;
  padding: 80px 40px;
  border: 1px solid rgba(139, 158, 126, 0.3);
  border-radius: 8px;
  background: rgba(250, 248, 245, 0.5);
}

.leaf-top-left,
.leaf-top-right,
.leaf-bottom-left,
.leaf-bottom-right {
  position: absolute;
}

.leaf-top-left { top: -10px; left: -10px; }
.leaf-top-right { top: -10px; right: -10px; }
.leaf-bottom-left { bottom: -10px; left: -10px; }
.leaf-bottom-right { bottom: -10px; right: -10px; }

.couple-names {
  font-family: 'Playfair Display', serif;
  font-size: 56px;
  font-weight: 700;
  color: #3D4A3A;
  line-height: 1.2;
  margin: 0 0 16px;
}

.ampersand {
  display: block;
  font-size: 36px;
  color: #C8A870;
  margin: 8px 0;
  font-style: italic;
}

.gold-divider {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin: 20px 0;
}

.divider-line {
  display: block;
  width: 80px;
  height: 1px;
  background: linear-gradient(90deg, transparent, #C8A870, transparent);
}

.divider-leaf {
  flex-shrink: 0;
}

.wedding-date {
  font-family: 'Lato', sans-serif;
  font-size: 16px;
  letter-spacing: 3px;
  text-transform: uppercase;
  color: #5C6858;
  margin: 0 0 40px;
}

.rsvp-pill {
  display: inline-block;
  padding: 14px 48px;
  border: none;
  border-radius: 50px;
  background: linear-gradient(135deg, #8B9E7E 0%, #6B7D60 100%);
  color: #FAF8F5;
  font-family: 'Lato', sans-serif;
  font-size: 14px;
  letter-spacing: 3px;
  text-transform: uppercase;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 6px 20px rgba(139, 158, 126, 0.35);
}

.rsvp-pill:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 30px rgba(139, 158, 126, 0.45);
}

@media (max-width: 768px) {
  .couple-names {
    font-size: 38px;
  }

  .ampersand {
    font-size: 28px;
  }

  .leaf-border {
    padding: 60px 24px;
  }

  .leaf-top-left,
  .leaf-top-right,
  .leaf-bottom-left,
  .leaf-bottom-right {
    width: 40px;
    height: 40px;
  }
}
</style>
