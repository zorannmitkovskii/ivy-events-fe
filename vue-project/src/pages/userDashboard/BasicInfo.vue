<template>
  <DashboardLayout>
    <div class="container py-3">
      <h1 class="text-brand-dark mb-4">Basic Information</h1>

      <WeddingCoupleCard :form="form" />
      <WeddingDetailsCard :form="form" />
      <WeddingScheduleCard :form="form" />

      <div class="text-end">
        <button class="btn btn-brand-dark px-4" @click="save">Save Information</button>
      </div>
    </div>
  </DashboardLayout>
</template>

<script setup>
import { reactive } from "vue";
import DashboardLayout from "@/components/userDashboard/dashboard/DashboardLayout.vue";
import WeddingCoupleCard from "@/components/userDashboard/basic-info/WeddingCoupleCard.vue";
import WeddingDetailsCard from "@/components/userDashboard/basic-info/WeddingDetailsCard.vue";
import WeddingScheduleCard from "@/components/userDashboard/basic-info/WeddingScheduleCard.vue";

const form = reactive({
  partner1: "",
  partner2: "",
  email: "",
  phone: "",
  date: "",
  time: "",
  location: "",
  ceremony: "",
  getReady: "",
  ceremonyTime: "",
  receptionTime: "",
  notes: "",
});

function save() {
  console.log("Saving", form);
  // TODO: backend call
}
</script>
