<template>
  <q-dialog v-model="internalValue" persistent backdrop-filter="blur(10px)">
    <q-card style="width: 450px; border-radius: 25px;" class="bg-blue-grey-10 text-white shadow-24">
      <q-card-section class="bg-primary q-pa-lg text-center">
        <q-icon name="meeting_room" size="xl" />
        <div class="text-h5 text-bold q-mt-sm">ABRIR TURNO</div>
      </q-card-section>

      <q-card-section class="q-pa-xl q-gutter-y-lg">
        <div>
          <div class="text-overline text-grey-5 q-mb-xs">Fondo de Apertura</div>
          <q-input
            v-model.number="form.fondo_apertura"
            type="number"
            dark filled
            prefix="$"
            class="text-h4 amount-input"
            autofocus
          />
        </div>

        <div>
          <div class="text-overline text-TEXT-WHITE text-bold q-mb-xs">Tipo de Cambio Hoy (T.C.)</div>
          <q-input
            v-model.number="form.tipo_cambio"
            type="number"
            dark filled
            prefix="$"
            placeholder="Ej. 17.50"
            class="text-h5"
            @keyup.enter="abrirCaja"
          >
            <template v-slot:prepend>
              <q-icon name="currency_exchange" />
            </template>
          </q-input>
          <div class="text-caption text-grey-6 q-mt-xs italic">
            * Este valor se mostrará en la barra inferior del POS.
          </div>
        </div>
      </q-card-section>

      <q-card-actions class="q-pb-xl q-px-xl">
        <q-btn
          label="INICIAR TURNO"
          color="positive"
          class="full-width q-py-md text-bold"
          unelevated
          :loading="cargando"
          @click="abrirCaja"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
  import { ref, computed } from 'vue'
  import { usePosStore } from 'src/stores/pos'
  import { useQuasar } from 'quasar'

  const props = defineProps(['modelValue'])
  const emit = defineEmits(['update:modelValue'])
  const posStore = usePosStore()
  const $q = useQuasar()

  const form = ref({ fondo_apertura: 0, tipo_cambio: posStore.tipoCambioHoy || 0 })
  const cargando = ref(false)

  const internalValue = computed({
    get: () => props.modelValue,
    set: (val) => emit('update:modelValue', val)
  })

  const abrirCaja = async () => {
    cargando.value = true
    try {
      await posStore.abrirTurno(form.value)
      internalValue.value = false
      $q.notify({ color: 'positive', message: 'CAJA ABIERTA CORRECTAMENTE', icon: 'check' })
    } catch (e) {
      $q.notify({ color: 'negative', message: 'Error al abrir caja' })
    } finally {
      cargando.value = false
    }
  }
</script>
