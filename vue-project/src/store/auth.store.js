import { reactive } from "vue";

export const authStore = reactive({
  user: {
    firstName: "Zoran",
    lastName: "M.",
    eventId: "demo" // <-- from BE auth response in real system
  }
});
