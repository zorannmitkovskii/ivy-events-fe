<template>
  <section id="story">
    <h2 class="section-title">Our Story</h2>
    <p class="section-subtitle">How we fell in love</p>

    <div class="story-content">
      <div class="story-text">
        <p v-for="(paragraph, index) in storyParagraphs" :key="index">
          {{ paragraph }}
        </p>
      </div>
    </div>

    <div class="photo-grid">
      <div
        v-for="index in 6"
        :key="index"
        class="photo-item"
      ></div>
    </div>
  </section>
</template>

<script>
export default {
  name: 'OurStory',
  data() {
    return {
      storyParagraphs: [
        'We met on a crisp autumn day, when the leaves were just beginning to turn golden. What started as a chance encounter at a coffee shop turned into hours of conversation that felt like minutes. From that first meeting, we knew there was something special between us.',
        'Over the years, we\'ve shared countless adventures, quiet moments, and everything in between. We\'ve learned and grown together, supporting each other through life\'s challenges and celebrating its joys. Every day with you feels like coming home.',
        'Now, we\'re ready to begin the greatest adventure of all. We can\'t wait to celebrate this next chapter with the people we love most.'
      ]
    }
  }
}
</script>

<style scoped>
.story-content {
  max-width: 800px;
  margin: 0 auto 4rem;
}

.story-text {
  background: var(--warm-ivory);
  padding: 3rem;
  border-radius: 2px;
  margin-bottom: 2rem;
  border-left: 3px solid var(--dusty-rose);
  box-shadow: 0 2px 15px rgba(155, 145, 134, 0.06);
}

.story-text p {
  font-size: 1.05rem;
  line-height: 1.9;
  color: var(--charcoal);
  margin-bottom: 1.5rem;
}

.story-text p:last-child {
  margin-bottom: 0;
}

.photo-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
  margin-top: 3rem;
}

.photo-item {
  position: relative;
  aspect-ratio: 4/5;
  border-radius: 8px;
  overflow: hidden;
  background: linear-gradient(135deg, var(--blush), var(--muted-sage));
  box-shadow: 0 4px 20px rgba(155, 145, 134, 0.1);
  transition: transform 0.4s ease;
}

.photo-item:hover {
  transform: scale(1.02);
}

.photo-item::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(to bottom, rgba(253, 251, 247, 0.1), rgba(212, 165, 165, 0.15));
}

@media (max-width: 768px) {
  .photo-grid {
    grid-template-columns: 1fr;
  }

  .story-text {
    padding: 2rem;
  }
}
</style>
