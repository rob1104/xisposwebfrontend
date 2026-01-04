<template>
  <q-dialog
    v-model="internalValue"
    @show="focoPago"
    persistent
    backdrop-filter="blur(8px) brightness(30%)"
  >
    <q-card style="width: 950px; max-width: 98vw; border-radius: 28px;" class="bg-blue-grey-10 text-white shadow-24 overflow-hidden">

      <div class="row">

        <div class="col-12 col-md-7 q-pa-md q-pa-lg-xl">
          <div class="row items-center q-mb-lg q-mb-md-xl">
            <q-avatar icon="payments" color="primary" text-color="white" size="50px" class="shadow-10 q-mr-md" />
            <div>
              <div class="text-h5 text-md-h4 text-bold tracking-tight">COBRAR</div>

            </div>
          </div>

          <div class="q-gutter-y-md q-gutter-y-md-lg">
            <div class="text-overline text-pink-4 text-bold q-ml-xs text-uppercase" style="font-size: 18px;">
              Seleccione Modo de Pago
            </div>
            <q-btn-toggle
              v-model="pagoActual.metodo"
              toggle-color="green"
              flat dark bordered
              spread
              class="premium-toggle"
              size="lg"
              :options="[
                {label: 'EFECTIVO', value: 'efectivo', icon: 'currency_exchange'},
                {label: 'TARJETA', value: 'tarjeta', icon: 'credit_card'}
              ]"
            />

            <q-input
              ref="inputMonto"
              v-model.number="pagoActual.monto"
              label="MONTO A ABONAR"
              dark filled
              class="text-h3 q-mt-md amount-input"
              type="number"
              prefix="$"
              color="cyan"
              @keyup.enter="agregarPago"
              @focus="seleccionarTexto"
              @click="seleccionarTexto"
            />

            <q-slide-transition>
              <div v-if="pagoActual.metodo === 'tarjeta'" class="row q-col-gutter-md q-mt-sm">
                <div class="col-12 col-sm-6">
                  <q-input
                    v-model="pagoActual.ultimos4"
                    label="Últimos 4 Dígitos"
                    dark filled
                    mask="####"
                    bg-color="blue-grey-9"
                    class="text-h6"
                  >
                    <template v-slot:prepend><q-icon name="password" /></template>
                  </q-input>
                </div>
                <div class="col-12 col-sm-6">
                  <q-input
                    v-model="pagoActual.referencia"
                    label="Número de Referencia"
                    dark filled
                    bg-color="blue-grey-9"
                    class="text-h6"
                  >
                    <template v-slot:prepend><q-icon name="receipt_long" /></template>
                  </q-input>
                </div>
              </div>
            </q-slide-transition>

            <q-btn
              label="REGISTRAR PAGO (ENTER)"
              color="primary"
              class="full-width q-py-lg text-bold text-h6 shadow-10"
              unelevated
              icon="add_circle"
              :disable="!pagoActual.monto"
              @click="agregarPago"
              style="border-radius: 15px;"
            />
          </div>

          <div class="q-pa-lg q-pa-md-xl bg-black shadow-up-10 q-mt-xl" style="border-radius: 20px;">
            <div v-if="saldoPendiente > 0">
              <div class="row justify-between items-center text-grey-5 text-h6">
                <span>Resta:</span>
                <span class="text-h4 text-red-5 text-bold">$ {{ saldoPendiente.toFixed(2) }}</span>
              </div>
              <q-linear-progress :value="porcentajePagado" color="primary" class="q-mt-sm" />
            </div>
            <div v-else class="row justify-between text-green-5 text-h4 text-bold">
              <span>CAMBIO:</span>
              <span>$ {{ cambio.toFixed(2) }}</span>
            </div>

            <div class="row q-col-gutter-sm q-mt-lg">
              <div class="col-12 col-sm-4 q-mb-sm q-mb-sm-none">
                <q-btn flat color="grey-5" label="CANCELAR" class="full-width q-py-md" v-close-popup />
              </div>
              <div class="col-12 col-sm-8">
                <q-btn
                  label="FINALIZAR VENTA"
                  color="positive"
                  class="full-width q-py-md text-bold text-h6"
                  :disable="saldoPendiente > 0"
                  :loading="procesando"
                  @click="procesarVenta"
                />
              </div>
            </div>
          </div>
        </div>

        <div class="col-12 col-md-5 bg-blue-grey-9 q-pa-lg q-pa-md-xl relative-position">
          <div class="text-right q-mb-xl">
            <div class="text-h5 text-md-h4 text-grey-5 uppercase">Total a Pagar</div>
            <div class="text-h3 text-md-h2 text-bold text-yellow glow-text q-mt-sm">$ {{ total.toFixed(2) }}</div>
          </div>

          <div class="column no-wrap" style="height: 100%; min-height: 300px;">
            <div class="text-overline text-grey-5 q-mb-sm q-ml-xs letter-spacing-1">
              Resumen de Abonos
            </div>

            <q-scroll-area
              style="height: 350px;"
              class="q-pr-md custom-scroll"
              :bar-style="{ borderRadius: '5px', background: 'var(--q-primary)', opacity: 0.5 }"
            >
              <q-list separator dark class="premium-list">
                <q-item
                  v-for="(p, index) in listaPagos"
                  :key="index"
                  class="q-px-sm q-py-md abono-item animate__animated animate__fadeInRight"
                >
                  <q-item-section avatar>
                    <div class="method-icon-container shadow-2">
                      <q-icon
                        :name="p.metodo === 'efectivo' ? 'payments' : 'credit_card'"
                        :color="p.metodo === 'efectivo' ? 'green-4' : 'blue-4'"
                        size="sm"
                      />
                    </div>
                  </q-item-section>

                  <q-item-section>
                    <q-item-label class="text-bold text-subtitle1 text-uppercase tracking-tight">
                      {{ p.metodo.toUpperCase() }}
                    </q-item-label>
                    <q-item-label caption v-if="p.ultimos4" class="text-blue-grey-3">
                      <q-badge outline color="blue-grey-4" class="q-mr-xs">**** {{ p.ultimos4 }}</q-badge>
                    </q-item-label>
                  </q-item-section>

                  <q-item-section side>
                    <div class="row items-center no-wrap">
                      <div class="text-white text-bold text-subtitle1 q-mr-md">
                        $ {{ p.monto.toFixed(2) }}
                      </div>
                      <q-btn
                        icon="delete_outline"
                        size="sm"
                        flat
                        round
                        color="red-4"
                        @click="eliminarPago(index)"
                      />
                    </div>
                  </q-item-section>
                </q-item>
              </q-list>

              <div v-if="listaPagos.length === 0" class="flex flex-center q-pa-xl text-grey-6 italic text-center">
                <q-icon name="history_toggle_off" size="md" class="q-mb-sm opacity-20" />
                <div class="full-width">No hay abonos registrados</div>
              </div>
            </q-scroll-area>
          </div>
        </div>
      </div>
    </q-card>
  </q-dialog>
</template>

<script setup>
  import { ref, computed, nextTick } from 'vue'
  import { api } from 'src/boot/axios'
  import { useAuthStore } from 'src/stores/auth'
  import { usePosStore } from 'src/stores/pos'
  import { useQuasar } from 'quasar'

  const props = defineProps(['modelValue', 'total', 'items'])
  const emit = defineEmits(['update:modelValue', 'success'])

  const $q = useQuasar()
  const auth = useAuthStore()
  const posStore = usePosStore()

  // --- ESTADOS ---
  const internalValue = computed({
    get: () => props.modelValue,
    set: (val) => emit('update:modelValue', val)
  })

  const listaPagos = ref([])
  const pagoActual = ref({ metodo: 'efectivo', monto: 0, ultimos4: '', referencia: '' })
  const procesando = ref(false)
  const inputMonto = ref(null)

  // --- CÁLCULOS DINÁMICOS ---
  const totalPagado = computed(() => listaPagos.value.reduce((acc, p) => acc + p.monto, 0))
  const saldoPendiente = computed(() => Math.max(0, props.total - totalPagado.value))
  const cambio = computed(() => Math.max(0, totalPagado.value - props.total))
  const porcentajePagado = computed(() => totalPagado.value / props.total)

  const focoPago = () => {
    listaPagos.value = []
    pagoActual.value = { metodo: 'efectivo', monto: props.total, ultimos4: '', referencia: '' }
    nextTick(() => { inputMonto.value?.select() })
  }

  const agregarPago = () => {
    // 1. Validación básica de monto
    if (pagoActual.value.monto <= 0) return

    // 2. Validación estricta para Tarjeta
    if (pagoActual.value.metodo === 'tarjeta') {
      if (!pagoActual.value.ultimos4 || pagoActual.value.ultimos4.length < 4 || !pagoActual.value.referencia) {
        $q.notify({
          message: 'DATOS INCOMPLETOS: Capture los 4 dígitos y la referencia',
          color: 'negative',
          icon: 'warning',
          position: 'center'
        })
        return
      }
    }

    // 3. Si pasa las validaciones, se agrega al listado
    listaPagos.value.push({ ...pagoActual.value })

    // Resetear para el siguiente abono sugiriendo el resto
    const pendiente = props.total - totalPagado.value
    pagoActual.value = {
      metodo: 'efectivo',
      monto: pendiente > 0 ? pendiente : 0,
      ultimos4: '',
      referencia: ''
    }
    nextTick(() => { inputMonto.value?.focus() })
  }

  const eliminarPago = (index) => { listaPagos.value.splice(index, 1) }

    /**
   * Selecciona todo el contenido del campo cuando recibe el foco o un clic
   */
  const seleccionarTexto = (event) => {
    if (event.target) {
      // La función select() marca todo el texto del input
      event.target.select()
    }
  }

  const procesarVenta = async () => {
    procesando.value = true
    try {
      const payload = {
        items: props.items,
        total: props.total,
        pagos: listaPagos.value, // Soporta múltiples abonos
        total_pagado: totalPagado.value,
        cambio: cambio.value,
        sucursal_id: auth.sucursalSeleccionada?.id,
        caja_turno_id: posStore.turno?.id
      }
      const res = await api.post('/api/pos/finalizar-venta', payload)
      emit('success', res.data)
    } catch (e) {
      $q.notify({ color: 'negative', message: 'Error al procesar la venta' })
    } finally {
      procesando.value = false
    }
  }
</script>

<style lang="scss" scoped>
  /* Se ajustaron los tamaños para pantallas pequeñas mediante media queries */
  .amount-input :deep(.q-field__control) {
    height: 80px;
    font-size: 2rem;
    font-weight: 900;
    border-radius: 18px;
    background: rgba(255,255,255,0.05) !important;
  }

  @media (min-width: 1024px) {
    .amount-input :deep(.q-field__control) {
      height: 100px;
      font-size: 2.5rem;
    }
  }

  .glow-text {
    text-shadow: 0 0 25px rgba(255, 235, 59, 0.3);
  }

  .premium-toggle {
    border-radius: 15px;
    overflow: hidden;
    border: 1px solid rgba(255,255,255,0.1);
  }

  .letter-spacing-1 { letter-spacing: 2px; }
  .tracking-tight { letter-spacing: -1px; }

  .shadow-up-10 {
    box-shadow: 0 -15px 35px rgba(0,0,0,0.5);
  }

  /* Ajuste para que el scroll area no desaparezca en móviles */
  .custom-scroll {
    background: rgba(0,0,0,0.1);
    border-radius: 10px;
  }
</style>
