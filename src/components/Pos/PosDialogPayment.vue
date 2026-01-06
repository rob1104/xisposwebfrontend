<template>
  <q-dialog v-model="internalValue"
          @show="onShowDialog"
          @hide="onHideDialog"
          persistent
          backdrop-filter="blur(8px) brightness(30%)">
    <q-card style="width: 1000px; max-width: 98vw; border-radius: 24px;" class="bg-blue-grey-10 text-white shadow-24 overflow-hidden">


      <q-card-section class="q-pa-md bg-blue-grey-9">
        <div class="row items-center q-col-gutter-md">
          <div class="col-12 col-md-6">
            <div class="text-overline text-grey-4 q-ml-xs">Identificación del Cliente</div>
            <q-select
              v-model="clienteLocal"
              :options="filterOptions"
              use-input
              outlined
              dark
              dense
              fill-input
              hide-selected
              input-debounce="300"
              @filter="filterFn"
              option-label="nombre_comercial"
              option-value="id"
              bg-color="blue-grey-8"
              color="cyan"
              placeholder="Buscar por Nombre o RFC..."
            >
              <template v-slot:prepend>
                <q-icon :name="clienteLocal?.id === 1 ? 'person_outline' : 'person'"
                        :color="clienteLocal?.id === 1 ? 'grey-5' : 'cyan'" />
              </template>

              <template v-slot:append>
                <q-btn v-if="clienteLocal?.id !== 1" round dense flat icon="close" @click.stop="resetClient" />
              </template>

              <template v-slot:option="scope">
                <q-item v-bind="scope.itemProps" class="text-white">
                  <q-item-section avatar>
                    <q-icon name="account_circle" :color="scope.opt.limite_credito > 0 ? 'green' : 'grey'" />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label>{{ scope.opt.nombre_comercial }}</q-item-label>
                    <q-item-label caption class="text-grey-4">RFC: {{ scope.opt.rfc || 'Público General' }}</q-item-label>
                  </q-item-section>
                  <q-item-section side v-if="scope.opt.limite_credito > 0">
                    <q-badge color="green-9" label="CRÉDITO" />
                  </q-item-section>
                </q-item>
              </template>
            </q-select>
          </div>

          <div class="col-12 col-md-6 text-right" v-if="clienteLocal?.id !== 1">
            <div class="text-caption text-grey-5 uppercase">Estado de Crédito</div>
            <div class="text-subtitle2">
              Disponible: <span class="text-green-4 text-bold">${{ (clienteLocal.limite_credito - clienteLocal.saldo_actual).toFixed(2) }}</span>
            </div>
          </div>
        </div>
      </q-card-section>

      <q-tabs
        v-model="tipoPagoTab"
        class="bg-blue-grey-9 text-grey-5"
        active-color="white"
        indicator-color="primary"
        align="justify"
        inline-label
      >
        <q-tab name="contado" icon="payments" label="VENTA DE CONTADO" class="q-py-md" />
        <q-tab name="credito" icon="event_repeat" label="VENTA A CRÉDITO" class="q-py-md" />
      </q-tabs>

      <q-tab-panels v-model="tipoPagoTab" animated class="bg-transparent">

        <q-tab-panel name="contado" class="q-pa-none">
          <div class="row">
            <div class="col-12 col-md-7 q-pa-lg q-pa-lg-xl">
              <div class="row items-center q-mb-lg">
                <q-avatar icon="payments" color="primary" text-color="white" size="50px" class="shadow-10 q-mr-md" />
                <div>
                  <div class="text-h5 text-bold tracking-tight">REGISTRAR PAGOS</div>
                  <div class="text-caption text-grey-5">Venta al contado y pagos múltiples</div>
                </div>
              </div>

              <div class="q-gutter-y-md">
                <div class="text-overline text-pink-4 text-bold q-ml-xs text-uppercase">
                  Seleccione Método
                </div>
                <q-btn-toggle
                  v-model="pagoActual.metodo"
                  toggle-color="green"
                  flat dark bordered spread
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
                  dark filled
                  class="text-h3 amount-input"
                  type="number"
                  prefix="$"
                  color="cyan"
                  @keyup.enter="agregarPago"
                  @click="seleccionarTexto"
                />

                <q-slide-transition>
                  <div v-if="pagoActual.metodo === 'tarjeta'" class="row q-col-gutter-md q-mt-sm">
                    <div class="col-6">
                      <q-input v-model="pagoActual.ultimos4" label="Últimos 4" dark filled mask="####" bg-color="blue-grey-9" />
                    </div>
                    <div class="col-6">
                      <q-input v-model="pagoActual.referencia" label="Referencia" dark filled bg-color="blue-grey-9" />
                    </div>
                  </div>
                </q-slide-transition>

                <q-btn
                  label="AGREGAR PAGO (ENTER)"
                  color="primary"
                  class="full-width q-py-lg text-bold text-h6 shadow-10"
                  unelevated
                  icon="add_circle"
                  :disable="!pagoActual.monto"
                  @click="agregarPago"
                  style="border-radius: 15px;"
                />
              </div>

              <div class="q-pa-lg bg-black shadow-up-10 q-mt-xl" style="border-radius: 20px;">
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
                  <div class="col-4">
                    <q-btn flat color="grey-5" label="CANCELAR" class="full-width q-py-md" v-close-popup />
                  </div>
                  <div class="col-8">
                    <q-btn
                      label="FINALIZAR VENTA - F1"
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
                <div class="text-h5 text-grey-5 uppercase">Total a Pagar</div>
                <div class="text-h3 text-bold text-yellow glow-text">$ {{ resumen.total.toFixed(2) }}</div>
              </div>

              <div class="column no-wrap" style="height: 100%; min-height: 350px;">
                <div class="text-overline text-grey-5 q-mb-sm q-ml-xs">Abonos Realizados</div>

                <q-scroll-area style="height: 400px;" class="custom-scroll q-pr-md">
                  <q-list separator dark>
                    <q-item v-for="(p, index) in listaPagos" :key="index" class="q-py-md animate__animated animate__fadeInRight">
                      <q-item-section avatar>
                        <q-icon :name="p.metodo === 'efectivo' ? 'payments' : 'credit_card'" color="green-4" size="sm" />
                      </q-item-section>

                      <q-item-section>
                        <q-item-label class="text-bold text-uppercase">{{ p.metodo }}</q-item-label>
                        <q-item-label caption v-if="p.ultimos4" class="text-grey-4">**** {{ p.ultimos4 }}</q-item-label>
                      </q-item-section>

                      <q-item-section side>
                        <div class="row items-center no-wrap">
                          <div class="text-white text-bold q-mr-md">$ {{ p.monto.toFixed(2) }}</div>
                          <q-btn icon="delete" size="sm" flat round color="red-4" @click="eliminarPago(index)" />
                        </div>
                      </q-item-section>
                    </q-item>
                  </q-list>

                  <div v-if="listaPagos.length === 0" class="flex flex-center q-pa-xl text-grey-6 italic text-center">
                    <q-icon name="history_toggle_off" size="md" class="q-mb-sm opacity-20" />
                    <div class="full-width">Esperando pagos...</div>
                  </div>
                </q-scroll-area>
              </div>
            </div>
          </div>
        </q-tab-panel>

        <q-tab-panel name="credito" class="q-pa-xl">
          <div v-if="clienteLocal && clienteLocal.id !== 1" class="row q-col-gutter-xl items-center">
            <div class="col-12 col-md-6">
              <div class="text-h4 text-bold q-mb-md">Validación de Crédito</div>

              <div v-if="!clienteValidoParaCredito" class="bg-red-9 q-pa-lg rounded-borders shadow-10">
                <q-icon name="error" size="lg" class="q-mb-md" />
                <div class="text-h6 text-bold">CRÉDITO RESTRINGIDO</div>
                <p>Para vender a crédito es obligatorio seleccionar un cliente con línea de crédito autorizada (No aplica para Público General).</p>
              </div>

              <div v-else class="q-gutter-y-md">
                <q-card dark bordered class="bg-blue-grey-9 border-primary">
                  <q-card-section class="row items-center">
                    <q-avatar size="60px" color="primary" icon="person" class="q-mr-md shadow-5" />
                    <div>
                      <div class="text-h5 text-bold">{{ clienteLocal.nombre_comercial }}</div>
                      <div class="text-caption text-grey-4">RFC: {{ clienteLocal.rfc || 'Sin Registro' }}</div>
                    </div>
                  </q-card-section>
                  <q-separator dark />
                  <q-card-section class="row text-center q-col-gutter-md">
                    <div class="col-4">
                      <div class="text-caption text-grey-5 uppercase">Límite</div>
                      <div class="text-h6 text-bold text-yellow">${{ clienteLocal.limite_credito }}</div>
                    </div>
                    <div class="col-4">
                      <div class="text-caption text-grey-5 uppercase">Saldo Actual</div>
                      <div class="text-h6 text-bold text-orange">${{ clienteLocal.saldo_actual }}</div>
                    </div>
                    <div class="col-4">
                      <div class="text-caption text-grey-5 uppercase">Días Crédito</div>
                      <div class="text-h6 text-bold text-cyan">{{ clienteLocal.dias_credito }} d</div>
                    </div>
                  </q-card-section>
                </q-card>

                <q-banner v-if="clienteExcedeLimite" class="bg-red-10 text-white rounded-borders">
                  <template v-slot:avatar><q-icon name="warning" /></template>
                  ATENCIÓN: Esta venta excede el límite de crédito disponible ($ {{ (clienteLocal.limite_credito - clienteSeleccionado.saldo_actual).toFixed(2) }}).
                </q-banner>

                <q-banner v-if="clienteLocal.vender_vencido == 0" class="bg-orange-10 text-white rounded-borders">
                  <template v-slot:avatar><q-icon name="history_toggle_off" /></template>
                  RESTRICCIÓN: El cliente no permite ventas con facturas vencidas. El sistema validará esto al procesar.
                </q-banner>
              </div>
            </div>

            <div class="col-12 col-md-6 text-center">
              <div class="text-grey-5 text-h5 uppercase q-mb-sm">Total por Cobrar</div>
              <div class="text-h1 text-bold text-white glow-primary">$ {{ resumen.total.toFixed(2) }}</div>
              <div class="text-h6 text-grey-5 q-mt-md">Vencimiento: {{ fechaVencimientoSugerida }}</div>

              <q-btn
                label="CONFIRMAR VENTA A CRÉDITO"
                color="primary"
                size="xl"
                class="q-mt-xl full-width text-bold shadow-10"
                icon="fact_check"
                :disable="!clienteValidoParaCredito || clienteExcedeLimite"
                :loading="procesando"
                @click="procesarVenta"
              />
              <q-btn flat label="Regresar" color="grey-5" class="q-mt-md" v-close-popup />
            </div>
          </div>
          <div v-else class="flex flex-center column q-pa-xl bg-blue-grey-9 rounded-borders shadow-10">
            <q-icon name="account_box" size="80px" color="grey-7" class="q-mb-md" />
            <div class="text-h5 text-bold text-grey-5 text-center">
              DEBE SELECCIONAR UN CLIENTE <br> CON CRÉDITO AUTORIZADO
            </div>
          </div>
        </q-tab-panel>

      </q-tab-panels>
    </q-card>
  </q-dialog>
</template>

<script setup>
  import { ref, watch, computed, nextTick, onMounted } from 'vue'
  import { api } from 'src/boot/axios'
  import { useAuthStore } from 'src/stores/auth'
  import { usePosStore } from 'src/stores/pos'
  import { useQuasar } from 'quasar'

  const props = defineProps(['modelValue', 'resumen', 'items', 'clienteSeleccionado'])
  const emit = defineEmits(['update:modelValue', 'success'])

  const $q = useQuasar()
  const auth = useAuthStore()
  const posStore = usePosStore()

  // Variables para el buscador
  const clienteLocal = ref(null)
  const filterOptions = ref([])

  const tipoPagoTab = ref('contado') // Controla la pestaña activa


  /**
   * Función de búsqueda contra el backend
   */
  const filterFn = async (val, update, abort) => {
    if (val.length < 2) {
      update(() => { filterOptions.value = [] })
      return
    }
    update(async () => {
      try {
        const { data } = await api.get(`/api/clientes-search?q=${val}`)
        filterOptions.value = data
      } catch (e) { abort() }
    })
  }

  /**
   * Restablece al cliente por defecto (ID 1)
   */
  const resetClient = async () => {
    const { data } = await api.get('/api/clientes/1')
    clienteLocal.value = data
  }


  // --- VALIDACIONES DE CRÉDITO ---
  const clienteValidoParaCredito = computed(() => {
    // Verificamos que clienteLocal NO sea null y que no sea Público General (ID 1)
    if (!clienteLocal.value || clienteLocal.value.id === 1) return false

    // Verificamos que tenga un límite de crédito configurado
    return parseFloat(clienteLocal.value.limite_credito) > 0
  })

  const clienteExcedeLimite = computed(() => {
    if (!clienteLocal.value) return false

    const totalVenta = props.resumen.total
    const saldoActual = parseFloat(clienteLocal.value.saldo_actual || 0)
    const limite = parseFloat(clienteLocal.value.limite_credito || 0)

    return (saldoActual + totalVenta) > limite
  })

    const fechaVencimientoSugerida = computed(() => {
      // 1. Verificamos que clienteLocal exista y tenga datos
      if (!clienteLocal.value) return 'N/A'

      // 2. Obtenemos los días de crédito con un fallback de 0 para evitar NaN
      const dias = parseInt(clienteLocal.value.dias_credito) || 0

      const d = new Date()
      d.setDate(d.getDate() + dias)

      // Retornamos el formato local (ej: 05/01/2026)
      return d.toLocaleDateString('es-MX', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    })

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
  const saldoPendiente = computed(() => Math.max(0, props.resumen.total - totalPagado.value))
  const cambio = computed(() => Math.max(0, totalPagado.value - props.resumen.total))
  const porcentajePagado = computed(() => totalPagado.value / props.resumen.total)

  const focoPago = () => {
    listaPagos.value = []
    pagoActual.value = { metodo: 'efectivo', monto: props.resumen.total, ultimos4: '', referencia: '' }
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
    const pendiente = props.resumen.total - totalPagado.value
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
  // 1. VALIDACIÓN SEGÚN EL MODO SELECCIONADO
  if (tipoPagoTab.value === 'contado') {
    // Si es contado, verificamos que no falte dinero por registrar
    if (saldoPendiente.value > 0) {
      $q.notify({
        message: 'Debe cubrir el total de la venta para procesar el contado.',
        color: 'warning',
        icon: 'warning',
        position: 'top'
      })
      return
    }
  } else {
    // Si es crédito, validamos al cliente seleccionado
    if (!clienteValidoParaCredito.value) {
      $q.notify({ message: 'Seleccione un cliente con crédito autorizado', color: 'negative' })
      return
    }
    if (clienteExcedeLimite.value) {
      $q.notify({ message: 'La venta excede el límite de crédito del cliente', color: 'negative' })
      return
    }
  }

  // 2. CONSTRUCCIÓN DEL PAYLOAD PARA EL BACKEND
  procesando.value = true
  try {
    const payload = {
      // Usamos 'Crédito' con acento para coincidir con el ENUM de tu DB
      tipo_pago: tipoPagoTab.value === 'credito' ? 'Crédito' : 'Contado',
      cliente_id: clienteLocal.value?.id || null, // ID del buscador interno

      // Lógica de pagos: Mapeamos la lista solo si es Contado
      pagos: tipoPagoTab.value === 'credito' ? [] : listaPagos.value.map(p => ({
        // Normalizamos el nombre del método para la DB (Efectivo/Tarjeta)
        metodo_pago: p.metodo.charAt(0).toUpperCase() + p.metodo.slice(1).toLowerCase(),
        monto: p.monto,
        // Datos específicos de tarjeta
        tarjeta_ultimos_4: p.metodo === 'tarjeta' ? (p.ultimos4 || null) : null,
        referencia_pago: p.metodo === 'tarjeta' ? (p.referencia || null) : null,
        // Datos de flujo de efectivo
        efectivo_recibido: p.metodo === 'efectivo' ? (p.monto + cambio.value) : null,
        cambio_entregado: p.metodo === 'efectivo' ? cambio.value : null
      }))
    }

    // Emitimos el éxito para que PosPage.vue ejecute el api.post
    emit('success', payload)
    internalValue.value = false

  } catch (e) {
    $q.notify({ message: 'Error crítico al preparar la transacción', color: 'negative' })
  } finally {
    procesando.value = false
  }
}

  onMounted(() => {
    resetClient()
  })

    /**
   * Se ejecuta al abrir el diálogo
   */
  const onShowDialog = () => {
    focoPago(); // Mantiene tu lógica de foco inicial
    window.addEventListener('keydown', handleGlobalKeydown);
  };

  /**
   * Se ejecuta al cerrar el diálogo para limpiar memoria
   */
  const onHideDialog = () => {
    window.removeEventListener('keydown', handleGlobalKeydown);
  };

  const handleGlobalKeydown = (e) => {
    if (e.key === 'F1') {
      e.preventDefault(); // Evita que el navegador abra la ayuda

      // Solo procesamos si el botón de finalizar no está deshabilitado por lógica de negocio
      // Para Contado: saldo debe ser 0. Para Crédito: cliente debe ser válido y no exceder límite.
      if (tipoPagoTab.value === 'contado') {
        if (saldoPendiente.value <= 0 && !procesando.value) {
          procesarVenta();
        }
      } else {
        if (clienteValidoParaCredito.value && !clienteExcedeLimite.value && !procesando.value) {
          procesarVenta();
        }
      }
    }
  };

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
