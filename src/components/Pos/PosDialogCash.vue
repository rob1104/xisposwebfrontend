<template>
  <q-dialog v-model="internalValue" persistent>
    <q-card style="width: 450px; border-radius: 20px;" class="bg-white text-blue-grey-9 shadow-24">

      <q-card-section
        :class="formCaja.tipo === 'Entrada' ? 'bg-positive' : 'bg-negative'"
        class="text-white q-pa-lg"
      >
        <div class="text-h6 uppercase text-bold row items-center">
          <q-icon
            :name="formCaja.tipo === 'Entrada' ? 'add_circle' : 'remove_circle'"
            class="q-mr-sm"
            size="md"
          />
          {{ formCaja.tipo }} de Efectivo
        </div>
        <div class="text-caption opacity-80 uppercase tracking-widest">Movimiento de Caja Interno</div>
      </q-card-section>

      <q-card-section class="q-gutter-y-md q-pa-xl">
        <q-btn-toggle
          v-model="formCaja.tipo"
          spread
          no-caps
          unelevated
          toggle-color="primary"
          color="grey-2"
          text-color="grey-7"
          toggle-text-color="white"
          class="rounded-borders border-grey"
          :options="[
            {label: 'ENTRADA', value: 'Entrada', icon: 'trending_up'},
            {label: 'RETIRO', value: 'Retiro', icon: 'trending_down'}
          ]"
        />

        <q-input
          v-model.number="formCaja.monto"
          label="Monto a registrar ($) *"
          outlined
          type="number"
          prefix="$"
          class="text-h5 bg-grey-1"
          color="primary"
          stack-label
        />

        <q-input
          v-model="formCaja.concepto"
          label="Concepto / Motivo de la operación *"
          outlined
          autogrow
          color="primary"
          placeholder="Ej. Pago de servicios, Refuerzo de fondo..."
          class="bg-grey-1"
          rows="3"
        />
        <div class="text-caption text-grey-6 italic">
          * Este movimiento afectará el saldo final del Corte X.
        </div>
      </q-card-section>

      <q-card-actions align="right" class="q-pa-md bg-grey-1 border-top-grey">
        <q-btn flat label="CANCELAR" color="grey-7" v-close-popup />
        <q-btn
          :label="'CONFIRMAR ' + formCaja.tipo"
          :color="formCaja.tipo === 'Entrada' ? 'positive' : 'negative'"
          unelevated
          class="q-px-lg text-bold"
          @click="guardarMovimientoCaja"
          :loading="procesandoCaja"
          :disable="!formCaja.monto || !formCaja.concepto"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
  import { ref, computed } from 'vue'
  import { api } from 'src/boot/axios'
  import { useQuasar } from 'quasar'
  import { usePosStore } from 'src/stores/pos' //

  // Propiedades para sincronización v-model con el padre
  const props = defineProps(['modelValue'])
  const emit = defineEmits(['update:modelValue'])

  const $q = useQuasar()
  const posStore = usePosStore()
  const procesandoCaja = ref(false)

  // Estado interno del formulario
  const formCaja = ref({
    tipo: 'Entrada',
    monto: 0,
    concepto: ''
  })

  /**
   * Propiedad computada para sincronizar el estado del diálogo
   */
  const internalValue = computed({
    get: () => props.modelValue,
    set: (val) => emit('update:modelValue', val)
  })

  /**
   * Envía el movimiento al servidor vinculándolo al turno activo
   */
  const guardarMovimientoCaja = async () => {
    if (!posStore.turno?.id) {
      $q.notify({ message: 'No hay un turno activo para registrar el movimiento.', color: 'negative' })
      return
    }

    procesandoCaja.value = true
    try {
      const payload = {
        ...formCaja.value,
        caja_turno_id: posStore.turno.id // Vinculación contable obligatoria
      }

      await api.post('/api/pos/movimiento-caja', payload)

      $q.notify({
        color: 'positive',
        message: `${formCaja.value.tipo.toUpperCase()} REGISTRADA CORRECTAMENTE`,
        icon: 'check_circle'
      })

      // Resetear y cerrar
      internalValue.value = false
      formCaja.value = { tipo: 'Entrada', monto: 0, concepto: '' }

    } catch (e) {
      const errorMsg = e.response?.data?.message || 'Error al procesar el movimiento de caja'
      $q.notify({ color: 'negative', message: errorMsg, icon: 'report_problem' })
    } finally {
      procesandoCaja.value = false
    }
}
</script>

<style lang="scss" scoped>
  /* Estilo Premium Clara para consistencia visual */
  .tracking-widest {
    letter-spacing: 0.1em;
  }

  .border-grey {
    border: 1px solid #e0e0e0;
  }

  .border-top-grey {
    border-top: 1px solid #eeeeee;
  }

  .bg-grey-1 {
    background-color: #fafafa !important;
  }

  /* Efecto visual de intensidad para el botón según el tipo */
  .q-btn {
    transition: all 0.3s ease;
  }
</style>
