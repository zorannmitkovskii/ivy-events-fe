import { onMounted, onUnmounted } from 'vue';

export function useScrollReveal(containerRef, options = {}) {
  const { threshold = 0.15, rootMargin = '0px 0px -40px 0px' } = options;
  let observer = null;

  onMounted(() => {
    const root = containerRef?.value;
    if (!root) return;

    observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold, rootMargin }
    );

    root.querySelectorAll('[data-reveal]').forEach((el) => {
      observer.observe(el);
    });
  });

  onUnmounted(() => {
    if (observer) observer.disconnect();
  });
}
