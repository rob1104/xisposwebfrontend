<template>
  <q-dialog
    v-model="internalValue"
    @show="onShowDialog"
    @hide="onHideDialog"
    persistent
    backdrop-filter="blur(10px) brightness(25%)"
  >
    <q-card style="width: 950px; max-width: 95vw; border-radius: 20px;" class="bg-blue-grey-10 text-white shadow-24 overflow-hidden premium-border">

      <q-card-section class="q-py-sm q-px-md bg-blue-grey-9 border-bottom-subtle row items-center justify-between">
        <div class="row items-center">
          <q-icon name="person_pin" color="cyan" size="sm" class="q-mr-sm" />
          <div class="text-overline text-grey-4 q-mr-md">CLIENTE ASIGNADO:</div>
        </div>

        <div style="min-width: 300px;">
          <q-select
            v-model="clienteLocal"
            :options="filterOptions"
            use-input
            outlined dark dense flat
            hide-selected fill-input
            input-debounce="300"
            @filter="filterFn"
            option-label="nombre_comercial"
            option-value="id"
            bg-color="transparent"
            color="cyan"
            class="compact-select"
            placeholder="Buscar cliente (Nombre/RFC)..."
          >
            <template v-slot:no-option>
              <q-item><q-item-section class="text-grey">No hay resultados</q-item-section></q-item>
            </template>
             <template v-slot:prepend>
                <q-icon name="search" size="xs" color="grey-6" />
             </template>
             <template v-slot:append>
                <div v-if="clienteLocal" class="row items-center">
                    <span class="text-subtitle2 q-mr-sm text-cyan">{{ clienteLocal.nombre_comercial }}</span>
                    <q-btn v-if="clienteLocal.id !== 1" round dense flat icon="cancel" size="sm" color="grey-5" @click.stop="resetClient" />
                 </div>
              </template>

            <template v-slot:option="scope">
              <q-item v-bind="scope.itemProps" class="text-white" dense>
                <q-item-section avatar>
                  <q-icon name="account_circle" size="sm" :color="scope.opt.limite_credito > 0 ? 'green' : 'grey'" />
                </q-item-section>
                <q-item-section>
                  <q-item-label>{{ scope.opt.nombre_comercial }}</q-item-label>
                  <q-item-label caption class="text-grey-5" style="font-size: 0.7rem;">RFC: {{ scope.opt.rfc || 'Público General' }}</q-item-label>
                </q-item-section>
                <q-item-section side v-if="scope.opt.limite_credito > 0">
                  <q-badge color="green-9" text-color="white" label="CRÉDITO" rounded class="q-px-sm" />
                </q-item-section>
              </q-item>
            </template>
          </q-select>
        </div>
      </q-card-section>

      <div class="row no-wrap" style="min-height: 550px;">

        <div class="col-8 bg-blue-grey-9 column">
           <div class="q-pa-md pb-0">
             <q-tabs
              v-model="tipoPagoTab"
              class="bg-blue-grey-8 text-grey-5 rounded-borders"
              active-color="white"
              active-bg-color="cyan-7"
              indicator-color="transparent"
              align="justify"
              dense
              narrow-indicator
              style="border: 1px solid rgba(255,255,255,0.1);"
            >
              <q-tab name="contado" icon="payments" label="CONTADO" class="rounded-borders q-ma-xs" style="border-radius: 12px;" />
              <q-tab name="credito" icon="fact_check" label="CRÉDITO" class="rounded-borders q-ma-xs" style="border-radius: 12px;" />
            </q-tabs>
          </div>

          <q-tab-panels v-model="tipoPagoTab" animated class="bg-transparent col column justify-between">

            <q-tab-panel name="contado" class="q-pa-none column full-height">
              <div class="col q-pa-md q-px-lg column q-gutter-y-md">

                 <div class="row items-center justify-between bg-blue-grey-8 q-pa-sm rounded-borders" style="border: 1px solid rgba(255,255,255,0.05);">
                    <q-btn-toggle
                      v-model="pagoActual.moneda"
                      no-caps unelevated dense
                      toggle-color="blue-grey-10"
                      toggle-text-color="cyan"
                      color="transparent"
                      text-color="grey-5"
                      class="text-bold"
                      :options="[
                        { label: 'MXN ($)', value: 'MXN' },
                        { label: 'USD ($)', value: 'USD' }
                      ]"
                    />
                     <q-badge v-if="pagoActual.moneda === 'USD'" color="yellow-9" text-color="black" class="text-bold q-py-xs q-px-sm">
                        T.C. ${{ tipoCambio }}
                      </q-badge>
                </div>


                <div class="relative-position">
                    <div class="text-overline text-grey-5 q-mb-xs q-ml-xs">MONTO A RECIBIR</div>
                    <q-input
                        ref="inputMonto"
                        v-model.number="pagoActual.monto"
                        dark filled borderless
                        class="text-h3 text-bold premium-amount-input animate__animated animate__pulse"
                        :class="pagoActual.moneda === 'USD' ? 'usd-mode' : 'mxn-mode'"
                        type="number"
                        :prefix="pagoActual.moneda === 'USD' ? '$' : '$'"
                        input-class="text-right"
                        @keyup.enter="agregarPago"
                        @click="seleccionarTexto"
                        autofocus
                    >
                     <template v-slot:hint v-if="pagoActual.moneda === 'USD'">
                       <div class="text-right text-yellow-7 text-subtitle2 text-bold">
                          = $ {{ montoConvertidoAPesos }} MXN
                       </div>
                     </template>
                    </q-input>
                </div>

                <div class="row q-col-gutter-sm items-start">
                  <div class="text-overline text-grey-5 q-mb-xs q-ml-xs">FORMA DE PAGO</div>
                    <div class="col-auto">
                      <q-btn-toggle
                      v-model="pagoActual.metodo"
                      toggle-color="green-5"
                      flat dark bordered dense
                      class="premium-toggle-small q-mt-md"
                      :options="[
                        {value: 'efectivo', icon: 'payments'},
                        {value: 'tarjeta', icon: 'credit_card'}
                      ]"
                    >

                      <template v-slot:option-efectivo><q-icon name="payments" size="sm" class="q-pa-xs" /></template>
                       <template v-slot:option-tarjeta><q-icon name="credit_card" size="sm" class="q-pa-xs" /></template>
                    </q-btn-toggle>
                   </div>

                   <div class="col row q-col-gutter-sm" v-if="pagoActual.metodo === 'tarjeta'">
                      <div class="col-4">
                        <q-input v-model="pagoActual.ultimos4" label="Últimos 4" dense dark filled mask="####" bg-color="blue-grey-8" class="q-mt-xs" />
                      </div>
                      <div class="col-8">
                        <q-input v-model="pagoActual.referencia" label="Referencia Bancaria" dense dark filled bg-color="blue-grey-8" class="q-mt-xs" />
                      </div>
                   </div>
                </div>

                <q-space />

                <q-btn
                  label="AGREGAR PAGO (ENTER)"
                  color="primary"
                  class="full-width q-py-sm text-bold shadow-3 glow-on-hover"
                  unelevated
                  icon="add_circle_outline"
                  :disable="!pagoActual.monto || pagoActual.monto <= 0"
                  @click="agregarPago"
                  style="border-radius: 12px;"
                />
              </div>

              <div class="col-auto bg-blue-grey-10 q-pa-md border-top-subtle row items-center">
                <div class="col">
                  <div v-if="saldoPendiente > 0" class="text-left">
                     <div class="text-overline text-grey-5">FALTA POR CUBRIR</div>
                     <div class="text-h4 text-red-4 text-bold tracking-tight">$ {{ saldoPendiente.toFixed(2) }}</div>
                     <q-linear-progress :value="porcentajePagado" color="red-4" track-color="blue-grey-8" class="q-mt-sm rounded-borders" style="height: 6px;" />
                  </div>
                  <div v-else class="text-left animate__animated animate__fadeIn">
                     <div class="text-overline text-green-4">CAMBIO A ENTREGAR (MXN)</div>
                     <div class="text-h3 text-green-4 text-bold tracking-tight glow-text-green">$ {{ cambio.toFixed(2) }}</div>
                  </div>
                </div>

                <div class="col-auto column q-gutter-y-sm q-ml-lg" style="min-width: 180px;">
                    <q-btn
                      label="COBRAR (F1)"
                      color="positive"
                      size="lg"
                      class="full-width text-bold shadow-5"
                      :disable="saldoPendiente > 0"
                      :loading="procesando"
                      @click="procesarVenta"
                      icon="print"
                      style="border-radius: 14px;"
                    />
                     <q-btn flat color="grey-5" label="Cancelar" dense class="full-width" v-close-popup style="font-size: 0.8rem;" />
                </div>
              </div>
            </q-tab-panel>

            <q-tab-panel name="credito" class="q-pa-xl column flex-center text-center">
               <div v-if="!clienteValidoParaCredito" class="text-grey-5 column flex-center">
                  <q-icon name="person_off" size="4rem" color="red-4" class="q-mb-md opacity-50" />
                  <div class="text-h6">Crédito No Disponible</div>
                  <p class="text-caption">Seleccione un cliente autorizado.</p>
               </div>

               <div v-else class="full-width" style="max-width: 500px;">
                  <q-icon name="fact_check" size="4rem" color="primary" class="q-mb-md glow-icon-primary" />
                  <div class="text-overline text-primary q-mb-none">CONFIRMAR VENTA A CRÉDITO PARA:</div>
                  <div class="text-h5 text-bold text-white q-mb-lg">{{ clienteLocal.nombre_comercial }}</div>

                   <div class="row q-col-gutter-md q-mb-xl bg-blue-grey-8 rounded-borders q-pa-md" style="border: 1px solid rgba(255,255,255,0.05)">
                      <div class="col-6">
                         <div class="text-caption text-grey-4 uppercase">Nuevo Saldo</div>
                         <div class="text-h6 text-orange-4 text-bold">$ {{ (Number(clienteLocal.saldo_actual) + resumen.total).toFixed(2) }}</div>
                      </div>
                      <div class="col-6 border-left-subtle">
                          <div class="text-caption text-grey-4 uppercase">Vence</div>
                          <div class="text-subtitle1 text-cyan text-bold">{{ fechaVencimientoSugerida }}</div>
                      </div>
                   </div>

                    <q-banner v-if="clienteExcedeLimite" dense rounded class="bg-red-10 text-white q-mb-md text-left">
                      <template v-slot:avatar><q-icon name="warning" size="sm" /></template>
                      <span class="text-caption text-bold">Excede límite de crédito disponible.</span>
                    </q-banner>

                   <q-btn
                    label="AUTORIZAR CRÉDITO (F1)"
                    color="primary"
                    size="lg"
                    class="full-width text-bold shadow-10"
                    :disable="clienteExcedeLimite"
                    :loading="procesando"
                    @click="procesarVenta"
                    icon="check_circle"
                    style="border-radius: 14px;"
                  />
               </div>
            </q-tab-panel>

          </q-tab-panels>
        </div>


        <div class="col-4 bg-blue-grey-10 column border-left-cyan shadow-l-subtle">

          <div class="q-pa-lg text-right bg-total-gradient">
            <div class="text-overline text-cyan-3 text-bold" style="letter-spacing: 1px;">TOTAL A PAGAR</div>
            <div class="text-h2 text-bold text-yellow-4 glow-text-yellow tracking-tight overflow-hidden text-ellipsis">
              $ {{ resumen.total.toFixed(2) }} <span class="text-h6">MXN</span>
            </div>

            <q-slide-transition>
              <div v-if="pagoActual.moneda === 'USD'" class="q-mt-sm">
                <q-badge color="yellow-9" text-color="black" class="text-bold q-pa-sm shadow-2">
                  <q-icon name="currency_exchange" class="q-mr-md" />
                  <span style="font-size: 24px;">${{ totalVentaEnDolares }} USD</span>
                </q-badge>
              </div>
            </q-slide-transition>

            <div class="text-caption text-grey-5 q-mt-xs">{{ items.length }} artículos en la venta</div>
          </div>

          <q-separator dark color="cyan-9" class="opacity-30" />

          <div class="col column q-pa-md">
             <div class="text-overline text-grey-6 q-mb-sm">HISTORIAL DE PAGOS</div>
            <q-scroll-area class="col custom-scroll-dark">
              <q-list dark separator dense>
                <q-item v-for="(p, index) in listaPagos" :key="index" class="q-py-sm rounded-borders q-mb-xs bg-blue-grey-9-soft animate__animated animate__fadeInRight fast">
                  <q-item-section avatar style="min-width: 30px;">
                    <q-icon :name="p.metodo === 'efectivo' ? 'payments' : 'credit_card'" :color="p.metodo === 'efectivo' ? 'green-4' : 'blue-4'" size="xs" />
                  </q-item-section>

                  <q-item-section>
                    <div class="row items-center justify-between">
                        <div>
                           <span class="text-bold text-subtitle2">{{ p.metodo === 'efectivo' ? 'Efectivo' : 'Tarjeta' }}</span>
                           <span v-if="p.moneda_original === 'USD'" class="text-caption text-yellow-8 q-ml-xs">({{p.monto_original.toFixed(2)}} USD)</span>
                        </div>
                         <span class="text-bold text-subtitle1">$ {{ p.monto.toFixed(2) }}</span>
                    </div>
                    <div v-if="p.ultimos4" class="text-caption text-grey-5" style="font-size: 0.7rem;">Ref: {{ p.referencia }} (xxxx-{{ p.ultimos4 }})</div>
                  </q-item-section>

                  <q-item-section side>
                    <q-btn icon="close" size="sm" flat round color="red-4" dense @click="eliminarPago(index)" class="opacity-50 hover-opacity-100" />
                  </q-item-section>
                </q-item>
              </q-list>

              <div v-if="listaPagos.length === 0" class="full-height flex flex-center text-grey-7 italic">
                <div class="text-center opacity-30">
                   <q-icon name="receipt_long" size="md" />
                   <div class="text-caption">Sin pagos registrados</div>
                </div>
              </div>
            </q-scroll-area>
          </div>

        </div>
      </div>
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
  const pagoActual = ref({
    metodo: 'efectivo',
    moneda: 'MXN',
    monto: 0,
    ultimos4: '',
    referencia: ''
  })
  const procesando = ref(false)
  const inputMonto = ref(null)

  // --- CÁLCULOS DINÁMICOS ---
  const totalPagado = computed(() => listaPagos.value.reduce((acc, p) => acc + p.monto, 0))
  const saldoPendiente = computed(() => Math.max(0, props.resumen.total - totalPagado.value))
  const cambio = computed(() => Math.max(0, totalPagado.value - props.resumen.total))
  const porcentajePagado = computed(() => totalPagado.value / props.resumen.total)
  const tipoCambio = computed(() => posStore.turno?.tipo_cambio || 1)

  const montoConvertidoAPesos = computed(() => {
    if(pagoActual.value.moneda === "USD") {
      return Number((pagoActual.value.monto * tipoCambio.value).toFixed(2))
    } else {
      return Number(pagoActual.value.monto.toFixed(2))
    }
  })

  const totalVentaEnDolares = computed(() => {
    const tc = tipoCambio.value || 1
    if (tc === 0) return 0
    // Dividimos el total en pesos entre el tipo de cambio
    return Number((props.resumen.total / tc).toFixed(2))
  })


  const focoPago = () => {
    listaPagos.value = []
    pagoActual.value = {
      metodo: 'efectivo',
      moneda: 'MXN',
      monto: 0,
      ultimos4: '',
      referencia: ''
    }
    nextTick(() => { inputMonto.value?.select() })
  }

  const agregarPago = () => {

    if (pagoActual.value.monto <= 0) return

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

    let montoRecibidoMN = montoConvertidoAPesos.value
    let esEfectivo = pagoActual.value.metodo === 'efectivo'
    let cubreTotal = montoRecibidoMN >= saldoPendiente.value

    const nuevoPago = {
      ...pagoActual.value,
      monto: montoConvertidoAPesos.value,
      moneda_original: pagoActual.value.moneda,
      monto_original: pagoActual.value.monto,
      tc_aplicado: tipoCambio.value
    }

    listaPagos.value.push(nuevoPago)

    if(esEfectivo && cubreTotal) {
      procesarVenta()
      return
    }

    const pendiente = props.resumen.total - totalPagado.value
    pagoActual.value = {
      metodo: 'efectivo',
      moneda: 'MXN',
      monto: 0,
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
      cambio_calculado: cambio.value,
      // Lógica de pagos: Mapeamos la lista solo si es Contado
      pagos: tipoPagoTab.value === 'credito' ? [] : listaPagos.value.map(p => ({
        // Normalizamos el nombre del método para la DB (Efectivo/Tarjeta)
        metodo_pago: p.metodo.charAt(0).toUpperCase() + p.metodo.slice(1).toLowerCase(),
        monto: p.monto,

        //Nuevos
        moneda: p.moneda_original || 'MXN',
        monto_original: p.monto_original || p.monto,
        tc_aplicado: p.tc_aplicado || 1,

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

watch(() => pagoActual.value.moneda, () => {
  // nextTick es vital: espera a que Quasar termine de cambiar
  // los prefijos y estilos del input antes de seleccionar
  nextTick(() => {
    if (inputMonto.value) {
      inputMonto.value.focus()
      inputMonto.value.select()
    }
  })
})

  onMounted(() => {
    resetClient()
  })

    /**
   * Se ejecuta al abrir el diálogo
   */
  const onShowDialog = () => {
    focoPago();

    if(props.clienteSeleccionado) {
      clienteLocal.value = props.clienteSeleccionado
    }

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
      e.preventDefault() // Evita que el navegador abra la ayuda

      // Solo procesamos si el botón de finalizar no está deshabilitado por lógica de negocio
      // Para Contado: saldo debe ser 0. Para Crédito: cliente debe ser válido y no exceder límite.
      if (tipoPagoTab.value === 'contado') {
        if (saldoPendiente.value <= 0 && !procesando.value) {
          procesarVenta()
        }
      } else {
        if (clienteValidoParaCredito.value && !clienteExcedeLimite.value && !procesando.value) {
          procesarVenta()
        }
      }
    }
  }

</script>

<style lang="scss" scoped>


  // Bordes y Sombra
  .premium-border {
      border: 1px solid rgba(0, 188, 212, 0.3); // Borde cian sutil
  }
  .border-bottom-subtle { border-bottom: 1px solid rgba(255,255,255,0.08); }
  .border-top-subtle { border-top: 1px solid rgba(255,255,255,0.08); }
  .border-left-subtle { border-left: 1px solid rgba(255,255,255,0.08); }
  .border-left-cyan { border-left: 2px solid rgba(0, 188, 212, 0.5); }
  .shadow-l-subtle { box-shadow: -5px 0 15px rgba(0,0,0,0.2) inset; }


  // Tipografía y Efectos
  .tracking-tight { letter-spacing: -1.5px; }
  .glow-text-yellow { text-shadow: 0 0 30px rgba(255, 235, 59, 0.4); }
  .glow-text-green { text-shadow: 0 0 20px rgba(76, 175, 80, 0.4); }
  .glow-icon-primary { filter: drop-shadow(0 0 10px rgba(25, 118, 210, 0.5)); }
  .glow-on-hover:hover { box-shadow: 0 4px 15px rgba(25, 118, 210, 0.4); transition: all 0.3s ease; }

  // Input de Monto Gigante Rediseñado
  .premium-amount-input :deep(.q-field__control) {
      height: auto; // Altura automática
      padding: 15px 10px;
      border-radius: 16px;
      background: rgba(0,0,0,0.2) !important; // Fondo más oscuro
      border: 2px solid transparent; // Borde base transparente
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  /* Ocultar flechas en Chrome, Safari, Edge y Opera */
  .premium-amount-input :deep(input::-webkit-outer-spin-button),
  .premium-amount-input :deep(input::-webkit-inner-spin-button) {
    -webkit-appearance: none;
    margin: 0;
  }

  /* Ocultar flechas en Firefox */
  .premium-amount-input :deep(input[type=number]) {
    -moz-appearance: textfield;
  }

  // Modos de color del Input según moneda
  .mxn-mode :deep(.q-field__control) {
    border-color: rgba(0, 188, 212, 0.3); // Cian apagado
      &:hover, &.q-field--focused {
        border-color: #00bcd4; // Cian brillante al enfocar
        box-shadow: 0 0 15px rgba(0, 188, 212, 0.2);
        background: rgba(0, 188, 212, 0.05) !important;
      }
      :deep(.q-field__prefix) { color: #00bcd4; font-weight: bold; font-size: 2rem; }
  }

  .usd-mode :deep(.q-field__control) {
    border-color: rgba(242, 192, 55, 0.4); // Dorado apagado
      &:hover, &.q-field--focused {
        border-color: #f2c037; // Dorado brillante
        box-shadow: 0 0 15px rgba(242, 192, 55, 0.2);
        background: rgba(242, 192, 55, 0.05) !important;
      }
      :deep(.q-field__prefix) { color: #f2c037; font-weight: bold; font-size: 2rem; }
      :deep(input) { color: #f2c037 !important; } // Texto dorado también
  }

  // Utilidades
  .compact-select :deep(.q-field__control) { min-height: 32px !important; padding: 0 8px; }
  .pb-0 { padding-bottom: 0 !important; }
  .opacity-30 { opacity: 0.3; }
  .opacity-50 { opacity: 0.5; }
  .hover-opacity-100:hover { opacity: 1; }

  .bg-total-gradient {
      background: linear-gradient(145deg, rgba(38, 50, 56, 1) 0%, rgba(30, 40, 45, 1) 100%);
  }

  .bg-blue-grey-9-soft { background: rgba(55, 71, 79, 0.7); }

  .custom-scroll-dark {
      // Estilizar la barra de desplazamiento si se desea (opcional para Webkit)
      &::-webkit-scrollbar { width: 6px; }
      &::-webkit-scrollbar-track { background: rgba(0,0,0,0.1); }
      &::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 10px; }
  }
  .fast { animation-duration: 0.3s; }

  // Ajustes para pantallas muy pequeñas (aunque el diseño base ya es compacto)
  @media (max-height: 700px) {
    .row.no-wrap { min-height: 450px !important; }
    .premium-amount-input { font-size: 2.5rem !important; }
  }
</style>
