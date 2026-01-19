<template>
  <q-dialog v-model="internalValue" position="right" full-height>
    <q-card style="width: 450px;" class="bg-blue-grey-10 text-white shadow-24">
      <q-card-section class="bg-indigo-9 row items-center">
        <div class="text-h6"><q-icon name="pending_actions" class="q-mr-sm" />Ventas en Espera</div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>

      <q-separator dark />

      <q-card-section class="q-pa-none col scroll">
        <q-list dark separator padding>
          <q-item v-for="v in ventas" :key="v.id" clickable v-ripple @click="$emit('recuperar', v)">
            <q-item-section avatar>
              <q-avatar color="indigo-7" text-color="white" icon="history" />
            </q-item-section>

            <q-item-section>
              <q-item-label class="text-bold text-subtitle1">Total: $ {{ v.total.toFixed(2) }}</q-item-label>
              <q-item-label caption class="text-grey-4">{{ v.count }} Artículos | {{ v.fecha }}</q-item-label>
            </q-item-section>

            <q-item-section side>
              <q-icon name="chevron_right" color="cyan" />
            </q-item-section>
          </q-item>

          <div v-if="ventas.length === 0" class="full-height flex flex-center q-pa-xl text-center opacity-40">
            <div>
              <q-icon name="layers_clear" size="4rem" class="q-mb-md" />
              <div class="text-h6">No hay ventas pausadas</div>
            </div>
          </div>
        </q-list>
      </q-card-section>

      <q-card-section class="bg-blue-grey-9 text-caption text-grey-5 italic">
        * Seleccione un ticket para cargarlo al carrito principal y continuar la venta.
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup>
  import { computed } from 'vue'
  const props = defineProps(['modelValue', 'ventas'])
  const emit = defineEmits(['update:modelValue', 'recuperar'])

  const internalValue = computed({
    get: () => props.modelValue,
    set: (val) => emit('update:modelValue', val)
  })
</script>
