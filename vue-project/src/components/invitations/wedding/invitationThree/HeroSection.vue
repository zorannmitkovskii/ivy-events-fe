<template>
  <section class="hero" id="hero">
    <div class="hero-background"></div>
    <div class="hero-overlay"></div>
    <div class="hero-content">
      <div class="hero-divider"></div>
      <h1>
        <span>{{ brideName }}</span>
        <span class="hero-ampersand">&</span>
        <span>{{ groomName }}</span>
      </h1>
      <p class="hero-date">{{ date }}</p>
      <a href="#rsvp" class="hero-cta">RSVP</a>
    </div>
  </section>
</template>

<script>
export default {
  name: 'HeroSection',
  props: {
    brideName: {
      type: String,
      required: true
    },
    groomName: {
      type: String,
      required: true
    },
    date: {
      type: String,
      required: true
    }
  }
}
</script>

<style scoped>
.hero {
  position: relative;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  overflow: hidden;
}

.hero-background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #D4A5A5 0%, #C8D5C7 100%);
  background-size: cover;
  background-position: center;
  z-index: 1;
}

.hero-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(to bottom, rgba(253, 251, 247, 0.45), rgba(248, 246, 241, 0.5));
  backdrop-filter: blur(1px);
  z-index: 2;
}

.hero-content {
  position: relative;
  z-index: 3;
  padding: 2rem;
  animation: fadeInUp 1.2s ease-out;
}

.hero-divider {
  width: 80px;
  height: 1px;
  background: var(--rose-accent);
  margin: 0 auto 2rem;
  opacity: 0;
  animation: fadeIn 1s ease-out 0.4s forwards;
}

.hero h1 {
  font-family: 'Cormorant Garamond', serif;
  font-size: clamp(3rem, 8vw, 6rem);
  font-weight: 300;
  color: var(--charcoal);
  letter-spacing: 0.05em;
  margin-bottom: 0.5rem;
  opacity: 0;
  animation: fadeInUp 1s ease-out 0.2s forwards;
}

.hero-ampersand {
  font-family: 'Crimson Text', serif;
  font-style: italic;
  font-size: 0.6em;
  margin: 0 0.3em;
  color: var(--rose-accent);
}

.hero-date {
  font-family: 'Lora', serif;
  font-size: clamp(1rem, 2vw, 1.3rem);
  font-weight: 400;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: var(--warm-gray);
  margin-bottom: 3rem;
  opacity: 0;
  animation: fadeInUp 1s ease-out 0.4s forwards;
}

.hero-cta {
  display: inline-block;
  padding: 1.2rem 3.5rem;
  background: transparent;
  border: 1.5px solid var(--rose-accent);
  color: var(--charcoal);
  font-family: 'Lora', serif;
  font-size: 1rem;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  text-decoration: none;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  opacity: 0;
  animation: fadeInUp 1s ease-out 0.6s forwards;
}

.hero-cta::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: var(--dusty-rose);
  transition: left 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: -1;
}

.hero-cta:hover::before {
  left: 0;
}

.hero-cta:hover {
  color: var(--charcoal);
  border-color: var(--dusty-rose);
}

@media (max-width: 768px) {
  .hero {
    height: 100svh;
  }
}
</style>
