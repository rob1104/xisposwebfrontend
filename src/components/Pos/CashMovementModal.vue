<template>
  <q-dialog
    v-model="internalValue"
    persistent
    transition-show="grow"
    transition-hide="fade"
    backdrop-filter="blur(12px) brightness(40%)"
  >
    <q-card class="premium-cash-card shadow-24 overflow-hidden">
      <q-card-section :class="['header-gradient q-pa-lg row items-center no-wrap transition-all',
        form.tipo === 'Retiro' ? 'bg-orange-gradient' : 'bg-cyan-gradient']">

        <div class="icon-circle shadow-5">
          <q-icon :name="form.tipo === 'Retiro' ? 'account_balance_wallet' : 'savings'" size="md" color="white" />
        </div>

        <div class="q-ml-md text-white">
          <div class="text-h6 text-bold tracking-tight">Gestión de Efectivo</div>
          <div class="row items-center">
            <q-badge color="white" text-color="dark" :label="`TURNO #${posStore.turno?.id}`" class="text-bold q-mr-sm" />
            <div class="text-caption opacity-80 uppercase text-bold letter-spacing-1">Caja en Operación</div>
          </div>
        </div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup color="white" class="opacity-60" />
      </q-card-section>

      <q-card-section class="q-pa-xl bg-dark-slate">
        <q-form @submit="handleSubmit" class="q-gutter-y-xl">

          <div class="action-selector-container">
            <div class="text-overline text-grey-5 q-mb-sm text-center font-bold tracking-widest">Tipo de Movimiento</div>
            <div class="row q-col-gutter-md">
              <div class="col-6">
                <div
                  @click="form.tipo = 'Retiro'"
                  :class="['action-box transition-all', form.tipo === 'Retiro' ? 'active-withdrawal' : 'inactive-box']"
                >
                  <q-icon name="upload" size="sm" />
                  <div class="text-bold">Retiro</div>
                </div>
              </div>
              <div class="col-6">
                <div
                  @click="form.tipo = 'Entrada'"
                  :class="['action-box transition-all', form.tipo === 'Entrada' ? 'active-income' : 'inactive-box']"
                >
                  <q-icon name="download" size="sm" />
                  <div class="text-bold">Ingreso</div>
                </div>
              </div>
            </div>
          </div>

          <div class="amount-container text-center">
            <div class="text-caption text-grey-5 uppercase text-bold q-mb-xs">Importe a registrar</div>
            <q-input
              v-model.number="form.monto"
              type="number"
              borderless
              dark
              input-class="text-h2 text-bold text-center font-mono amount-text"
              class="premium-input-amount"
              @focus="$event.target.select()"
              :rules="[val => val > 0 || 'Monto requerido']"
              autofocus
            >
              <template v-slot:prepend>
                <span class="text-h4 text-grey-6">$</span>
              </template>
            </q-input>
          </div>

          <div class="concept-container">
            <q-input
              v-model="form.concepto"
              label="Motivo o Concepto *"
              placeholder="Describa el origen o destino del efectivo..."
              type="textarea"
              filled
              dark
              color="cyan-5"
              rows="2"
              class="premium-textarea"
              :rules="[val => !!val || 'Campo obligatorio']"
            />
          </div>

          <div class="row q-col-gutter-md q-pt-md">
            <div class="col-12 col-sm-6">
              <q-btn label="Cancelar" flat color="grey-6" class="full-width btn-rounded" v-close-popup />
            </div>
            <div class="col-12 col-sm-6">
              <q-btn
                :label="form.tipo === 'Retiro' ? 'Confirmar Retiro' : 'Confirmar Ingreso'"
                :color="form.tipo === 'Retiro' ? 'orange-9' : 'cyan-9'"
                unelevated
                class="full-width text-bold btn-rounded shadow-8"
                type="submit"
                :loading="loading"
                size="lg"
              >
                <q-icon right :name="form.tipo === 'Retiro' ? 'logout' : 'login'" class="q-ml-sm" />
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

  const form = reactive({
    tipo: 'Retiro',
    monto: 0,
    concepto: ''
  })

  const handleSubmit = async () => {
    if (!posStore.turno?.id) {
      $q.notify({ color: 'negative', message: 'No hay un turno activo.', icon: 'warning' })
      return
    }

    loading.value = true
    try {
      const payload = { ...form, caja_turno_id: posStore.turno.id }
      await api.post('/api/caja/movimientos', payload)

      try {
        await PrintService.imprimirMovimientoCaja(payload, posStore.turno.id, auth.user?.name)
        $q.notify({ color: 'positive', message: `¡${form.tipo} registrado y ticket enviado!`, icon: 'print', position: 'top' })
      } catch (printError) {
        $q.notify({ color: 'warning', message: 'Guardado, pero falló impresión.', icon: 'priority_high' })
      }

      resetForm()
      internalValue.value = false
      emit('success')
    } catch (error) {
      $q.notify({ color: 'negative', message: 'Error al procesar movimiento.', icon: 'report_problem' })
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

<style lang="scss" scoped>
  // PALETA DE COLORES SLATE/DARK
  $dark-slate: #0f172a;
  $card-inner: #1e293b;
  $cyan-accent: #22d3ee;
  $orange-accent: #f59e0b;

  .premium-cash-card {
    width: 100%;
    max-width: 500px;
    border-radius: 28px;
    background: $dark-slate;
    border: 1px solid rgba(255,255,255,0.05);
  }

  .header-gradient {
    transition: background 0.5s ease;
    &.bg-orange-gradient { background: linear-gradient(135deg, #7c2d12 0%, #0f172a 100%); }
    &.bg-cyan-gradient { background: linear-gradient(135deg, #083344 0%, #0f172a 100%); }
  }

  .icon-circle {
    background: rgba(255,255,255,0.1);
    backdrop-filter: blur(5px);
    padding: 12px;
    border-radius: 18px;
    border: 1px solid rgba(255,255,255,0.1);
  }

  .bg-dark-slate { background: $dark-slate; }

  // SELECTOR DE ACCIÓN PERSONALIZADO
  .action-box {
    padding: 16px;
    border-radius: 20px;
    text-align: center;
    cursor: pointer;
    border: 1px solid rgba(255,255,255,0.05);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;

    &.inactive-box {
      background: rgba(255,255,255,0.03);
      color: #64748b;
    }

    &.active-withdrawal {
      background: rgba(245, 158, 11, 0.1);
      color: $orange-accent;
      border-color: rgba(245, 158, 11, 0.4);
      box-shadow: 0 4px 15px rgba(245, 158, 11, 0.2);
    }

    &.active-income {
      background: rgba(34, 211, 238, 0.1);
      color: $cyan-accent;
      border-color: rgba(34, 211, 238, 0.4);
      box-shadow: 0 4px 15px rgba(34, 211, 238, 0.2);
    }
  }

  // INPUTS PREMIUM
  .premium-input-amount {
    .amount-text {
      color: white;
      text-shadow: 0 0 20px rgba(34, 211, 238, 0.3);
    }
  }

  .premium-textarea {
    :deep(.q-field__control) {
      border-radius: 20px;
      background: rgba(255, 255, 255, 0.03) !important;
      border: 1px solid rgba(255, 255, 255, 0.05);
      &:hover { background: rgba(255, 255, 255, 0.05) !important; }
    }
  }

  .btn-rounded {
    border-radius: 18px;
    padding: 12px 0;
  }

  .font-mono { font-family: 'Roboto Mono', monospace; }
  .transition-all { transition: all 0.3s ease; }
</style>
