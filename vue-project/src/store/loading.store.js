import { reactive } from "vue";

export const loadingStore = reactive({
  isNavigating: false,
});

export function startLoading() {
  loadingStore.isNavigating = true;
}

export function stopLoading() {
  loadingStore.isNavigating = false;
}
