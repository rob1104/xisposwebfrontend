<template>
  <q-dialog v-model="internalValue" persistent transition-show="scale" transition-hide="scale">
    <q-card style="width: 480px; border-radius: 20px;" class="bg-blue-grey-7 text-white shadow-24 border-primary-top">

      <q-card-section class="row items-center q-pa-lg">
        <div class="bg-primary q-pa-sm border-radius-12 shadow-5">
          <q-icon name="account_balance_wallet" size="md" color="white" />
        </div>
        <div class="q-ml-md">
          <div class="text-h6 text-bold text-white tracking-tight">Movimiento de caja</div>
          <div class="text-caption text-primary text-bold uppercase letter-spacing-1">
            Turno activo: #{{ posStore.turno?.id || '---' }}
          </div>
        </div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup color="grey-5" />
      </q-card-section>

      <q-separator dark />

      <q-card-section class="q-pa-xl">
        <q-form @submit="handleSubmit" class="q-gutter-y-lg">

          <div>
            <div class="text-subtitle2 text-grey-5 q-mb-sm text-center font-medium">¿Qué acción desea realizar?</div>
            <q-btn-toggle
              v-model="form.tipo"
              spread
              no-caps
              unelevated
              toggle-color="primary"
              color="blue-grey-9"
              text-color="grey-5"
              toggle-text-color="white"
              class="border-radius-15 overflow-hidden shadow-2"
              :options="[
                { label: 'Retiro (Salida)', value: 'Retiro', icon: 'call_made' },
                { label: 'Ingreso (Entrada)', value: 'Entrada', icon: 'call_received' }
              ]"
            />
          </div>

          <div class="text-center">
            <q-input
              v-model.number="form.monto"
              label="Importe a registrar"
              type="number"
              filled
              dark
              color="primary"
              label-color="primary"
              input-class="text-h3 text-bold text-center text-primary"
              class="amount-input"
              @focus="$event.target.select()"
              :rules="[val => val > 0 || 'El monto debe ser mayor a 0']"
              autofocus
            >
              <template v-slot:prepend>
                <q-icon name="attach_money" color="primary" size="lg" />
              </template>
            </q-input>
          </div>

          <q-input
            v-model="form.concepto"
            label="Descripción del movimiento *"
            placeholder="Ej. Pago de fletes, reposición de cambio..."
            type="textarea"
            filled
            dark
            color="primary"
            rows="2"
            class="concepto-input"
            :rules="[val => !!val || 'Debe especificar un motivo']"
          />

          <div class="row q-col-gutter-md q-pt-md">
            <div class="col-12 col-sm-6">
              <q-btn label="Cancelar" flat color="grey-5" class="full-width border-radius-12" v-close-popup />
            </div>
            <div class="col-12 col-sm-6">
              <q-btn
                label="Confirmar"
                color="primary"
                unelevated
                class="full-width text-bold border-radius-12 shadow-3"
                type="submit"
                :loading="loading"
                size="lg"
              >
                <q-icon right name="check_circle" class="q-ml-sm" />
              </q-btn>
            </div>
          </div>
        </q-form>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup>
  import { ref, reactive, computed } from 'vue'
  import { api } from 'boot/axios'
  import { usePosStore } from 'src/stores/pos'
  import { useQuasar } from 'quasar'
  import { useAuthStore } from 'src/stores/auth'
  import { PrintService } from 'src/services/PrintService'

  const props = defineProps(['modelValue'])
  const emit = defineEmits(['update:modelValue', 'success'])

  const $q = useQuasar()
  const posStore = usePosStore()
  const auth = useAuthStore()
  const loading = ref(false)

  const internalValue = computed({
    get: () => props.modelValue,
    set: (val) => emit('update:modelValue', val)
  })

  // Retiro como opción por defecto [Petición del usuario]
  const form = reactive({
    tipo: 'Retiro',
    monto: 0,
    concepto: ''
  })

  const handleSubmit = async () => {
    if (!posStore.turno?.id) {
      $q.notify({ color: 'negative', message: 'Error: No se detectó un turno de caja activo.', icon: 'warning' })
      return
    }

    loading.value = true
    try {
      const payload = {
        ...form,
        caja_turno_id: posStore.turno.id
      }

      // Registro en base de datos
      await api.post('/api/caja/movimientos', payload)

      // Impresión de comprobante físico
      try {
        await PrintService.imprimirMovimientoCaja(
          payload,
          posStore.turno.id,
          auth.user?.name
        )
        $q.notify({
          color: 'positive',
          message: `¡${form.tipo} registrado y ticket enviado!`,
          icon: 'print',
          position: 'top'
        })
      } catch (printError) {
        $q.notify({
          color: 'warning',
          message: 'Movimiento guardado, pero falló la impresión.',
          caption: printError.message,
          icon: 'priority_high'
        })
      }

      resetForm()
      internalValue.value = false
      emit('success')
    } catch (error) {
      const msg = error.response?.data?.message || 'Hubo un problema al procesar el movimiento.'
      $q.notify({ color: 'negative', message: msg, icon: 'report_problem' })
    } finally {
      loading.value = false
    }
  }

  const resetForm = () => {
    form.tipo = 'Retiro'
    form.monto = 0
    form.concepto = ''
  }
</script>

<style scoped>
  .border-radius-20 { border-radius: 20px; }
  .border-radius-15 { border-radius: 15px; }
  .border-radius-12 { border-radius: 12px; }

  .border-primary-top {
    border-top: 5px solid var(--q-primary);
  }

  .tracking-tight { letter-spacing: -0.5px; }
  .letter-spacing-1 { letter-spacing: 1px; }

  /* Estilo premium para inputs dark */
  .amount-input :deep(.q-field__control),
  .concepto-input :deep(.q-field__control) {
    border-radius: 15px;
    background: rgba(255, 255, 255, 0.05) !important;
  }

  .amount-input :deep(.q-field__native) {
    padding-top: 10px;
    padding-bottom: 10px;
  }

  /* Animación suave para el toggle */
  .q-btn-toggle {
    border: 1px solid rgba(255, 255, 255, 0.1);
  }
</style>
