import { ref, onMounted, onBeforeUnmount } from "vue";

export function useMediaQuery(query) {
  const matches = ref(false);
  let mql;

  function update() {
    matches.value = mql.matches;
  }

  onMounted(() => {
    mql = window.matchMedia(query);
    matches.value = mql.matches;
    mql.addEventListener("change", update);
  });

  onBeforeUnmount(() => {
    mql?.removeEventListener("change", update);
  });

  return matches;
}
