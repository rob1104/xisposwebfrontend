<template>
  <q-card class="bg-blue-grey-9 text-blue-grey-9 full-height flex flex-center shadow-2 rounded-borders border-primary-top" flat bordered>
    <q-card-section class="full-width q-pa-lg">
      <div class="text-center q-mb-xl">
        <div class="text-h5 text-white text-uppercase text-weight-bold">Total a Pagar</div>
        <div class="text-h2 text-bold text-light-green-13 q-ma-md">$ {{ total.toFixed(2) }}</div>
        <q-badge color="blue-1" text-color="primary" class="q-pa-md text-h6 text-bold" rounded>
          {{ count }} Artículos
        </q-badge>
      </div>

      <div class="q-gutter-y-md">
        <q-btn
          label="PAGAR (F12)"
          color="positive"
          class="full-width text-h5 text-bold q-py-lg shadow-3"
          unelevated size="xl"
          icon-right="shopping_cart_checkout"
          @click="$emit('pay')"
        />
        <q-btn flat color="orange" icon="delete_sweep" label="Vaciar" class="full-width" @click="$emit('clear')" />
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup>
  defineProps(['total', 'count'])
  defineEmits(['pay', 'clear'])
</script>

<style scoped>
  .border-primary-top { border-top: 6px solid var(--q-primary) !important; }
</style>
