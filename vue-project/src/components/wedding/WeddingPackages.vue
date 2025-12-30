<template>
  <section class="px-6 py-12 bg-brand-light">
    <h2 class="text-brand-dark text-3xl font-bold text-center mb-8">
      {{ title }}
    </h2>

    <div class="d-flex justify-content-center gap-2 mb-4">
      <button
        class="btn"
        :class="btnClass(type === 'individual')"
        @click="type='individual'"
      >
        Individual
      </button>

      <button
        class="btn"
        :class="btnClass(type === 'organizer')"
        @click="type='organizer'"
      >
        Organizer
      </button>
    </div>

    <div class="row g-4 text-center">
      <div
        v-for="p in activePackages"
        :key="p.name"
        class="col-md-4"
      >
        <div class="card shadow h-100">
          <div class="card-body">
            <h4>{{ p.name }}</h4>
            <p class="text-muted">{{ p.desc }}</p>
            <h3 class="text-primary fw-bold">{{ p.price }}</h3>
            <button class="btn btn-primary mt-2 w-100">Choose</button>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>


<script setup>
import {ref,computed} from 'vue'

defineProps({
  title: String
})

const type = ref("individual")

const packages = {
  individual: [
    {name:"Basic",price:"$39",desc:"Perfect for simple weddings"},
    {name:"Ivy & Inc",price:"$99",desc:"More features & styling"},
    {name:"Pro",price:"$199",desc:"Advanced customization"}
  ],

  organizer: [
    {name:"Basic",price:"$79",desc:"Includes admin dashboard"},
    {name:"Ivy & Inc",price:"$149",desc:"Bulk messaging"},
    {name:"Pro",price:"$299",desc:"Full automation & branding"}
  ]
}

const activePackages = computed(() => packages[type.value])

function btnClass(active){
  return active
    ? "btn-primary"
    : "btn-outline-primary"
}
</script>

