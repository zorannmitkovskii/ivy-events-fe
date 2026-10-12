import { onMounted, onUnmounted } from 'vue';

export function useScrollReveal(containerRef, options = {}) {
  const { threshold = 0.15, rootMargin = '0px 0px -40px 0px' } = options;
  let observer = null;
  let mutations = null;

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

    const observeAll = () => {
      root.querySelectorAll('[data-reveal]:not(.revealed)').forEach((el) => observer.observe(el));
    };
    observeAll();

    // INV-602: a section drawn later (the guest preview's private link, a
    // section shown again) is a new element — watched too, or it would stay
    // invisible (opacity 0) for good.
    if (typeof MutationObserver !== 'undefined') {
      mutations = new MutationObserver(observeAll);
      mutations.observe(root, { childList: true, subtree: true });
    }
  });

  onUnmounted(() => {
    if (observer) observer.disconnect();
    if (mutations) mutations.disconnect();
  });
}
