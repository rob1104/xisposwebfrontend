<template>
  <q-page class="bg-blue-grey-10 overflow-hidden" style="height: 100vh;">

    <div v-if="posStore.cargandoTurno" class="fixed-center text-center">
      <q-spinner-dots color="primary" size="4em" />
      <div class="text-white q-mt-md">Verificando turno...</div>
    </div>

    <template v-else-if="posStore.isTurnoAbierto">
      <PosHeader
        @scan="procesarEscaneo"
        @open-search="dialogoBuscador = true"
        @open-cash="abrirMovimientoCaja"
        @close-turn="confirmarCierreTurno"
      />

      <div class="row" style="height: calc(100vh - 140px);">
        <div class="col-12 col-md-8 q-pa-md">
          <PosCart
            :items="carrito"
            @increment="incrementar"
            @decrement="decrementar"
          />
        </div>
        <div class="col-12 col-md-4 q-pa-md">
          <q-btn
            color="green-4"
            icon="print"
            text-color="black"
            label="Reimprimir Último Ticket"
            class="full-width q-mb-md"
            @click="ejecutarReimpresion"
            :loading="reimprimiendo"
          />
          <PosSummary
            :resumen="totalVenta"
            :count="carrito.length"
            @pay="abrirPago"
            @clear="vaciarCarrito"
          />
        </div>
      </div>

      <div class="fixed-bottom bg-blue-grey-9 text-white q-pa-sm text-caption row justify-around shadow-up-1">
        <span><b class="text-yellow">[F2]</b> Buscar</span>
        <span><b class="text-yellow">[F12]</b> Cobrar</span>
        <q-separator vertical inset />
        <span class="text-bold text-yellow">SUCURSAL: <span class="text-white">{{ auth.sucursalSeleccionada?.nombre }}</span></span>
        <q-separator vertical inset />
        <span class="text-bold text-yellow">TIPO DE CAMBIO: <span class="text-white">{{ posStore.turno.tipo_cambio }}</span></span>
      </div>
    </template>

    <div v-else class="full-height flex flex-center bg-blue-grey-10">
      <q-card style="width: 400px; border-radius: 20px;" class="bg-blue-grey-9 text-white q-pa-lg text-center shadow-24">
        <q-icon name="lock" size="80px" color="yellow-8" class="q-mb-md" />
        <div class="text-h4 text-bold">CAJA CERRADA</div>
        <p class="text-grey-4 q-mt-md">Debe realizar la apertura de turno para comenzar a vender.</p>
        <q-btn
          label="ABRIR TURNO"
          color="positive"
          size="lg"
          class="full-width q-mt-lg text-bold"
          unelevated
          @click="dialogoApertura = true"
        />
      </q-card>
    </div>

    <PosDialogApertura v-model="dialogoApertura" />
    <PosDialogSearch v-model="dialogoBuscador" @selected="agregarAlCarrito" />

    <PosDialogPayment
      v-model="dialogoPago"
      :resumen="totalVenta"
      :items="carrito"
      @success="confirmarVenta"
    />

    <PosDialogArqueo v-model="dialogoArqueo" @closed="onTurnoCerrado" />

    <CashMovementModal
      v-model="showCashModal"
      @success="onMovementSuccess"
    />

  </q-page>
</template>

<script setup>
  import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
  import { useQuasar } from 'quasar'
  import { api } from 'src/boot/axios'
  import { useAuthStore } from 'src/stores/auth'
  import { usePosStore } from 'src/stores/pos'
  import { useConfigStore } from 'src/stores/config'

  // Sub-componentes
  import PosHeader from 'components/Pos/PosHeader.vue'
  import PosCart from 'components/Pos/PosCart.vue'
  import PosSummary from 'components/Pos/PosSummary.vue'
  import PosDialogSearch from 'components/Pos/PosDialogSearch.vue'
  import PosDialogPayment from 'components/Pos/PosDialogPayment.vue'
  import PosDialogArqueo from 'components/Pos/PosDialogArqueo.vue'
  import PosDialogApertura from 'src/components/Pos/PosDialogApertura.vue'
  import CashMovementModal from 'src/components/Pos/CashMovementModal.vue'
  import { PrintService } from 'src/services/PrintService'

  const $q = useQuasar()
  const auth = useAuthStore()
  const posStore = usePosStore()
  const configStore = useConfigStore()


  const dialogoApertura = ref(false)
  const carrito = ref([])
  const dialogoBuscador = ref(false)
  const dialogoPago = ref(false)
  const dialogoArqueo = ref(false)
  const reimprimiendo = ref(false)

  const showCashModal = ref(false)

  let intervaloFoco = null

    /**
   * Recupera el foco hacia el input de escaneo si no hay diálogos bloqueando
   */
  const recuperarFocoEscaner = () => {
    // Solo re-enfocar si TODOS los diálogos están cerrados
    const ningunDialogoAbierto =
      !dialogoBuscador.value &&
      !dialogoPago.value &&
      !dialogoArqueo.value &&
      !dialogoApertura.value &&
      !showCashModal.value


    if (ningunDialogoAbierto) {
      // Buscamos el input dentro del componente de cabecera
      const input = document.querySelector('.foco-escaner input')

      // Solo enfocamos si no es ya el elemento activo para evitar parpadeos
      if (input && document.activeElement !== input) {
        input.focus()
      }
    }
  }

  watch(dialogoBuscador, (val) => {
    if (!val) { // Si se cierra
      nextTick(() => recuperarFocoEscaner())
    }
  })

  /**
   * Lógica de Totales Refactorizada
   * Devuelve un objeto con subtotal, impuestos y total.
   */
  const totalVenta = computed(() => {
    // Inicializamos siempre con ceros para evitar errores de 'undefined'
    const inicial = { subtotal: 0, impuestos: 0, total: 0 }

    if (!carrito.value.length) return inicial

    return carrito.value.reduce((acc, item) => {
      // 1. Tasa de impuestos (IVA, etc.)
      const tasaTotal = (item.impuestos?.reduce((sum, imp) => sum + Number(imp.porcentaje), 0) || 0) / 100

      // 2. Cálculo por línea
      const totalLinea = Number(item.precio) * Number(item.cantidad)
      const subtotalLinea = totalLinea / (1 + tasaTotal)
      const impuestosLinea = totalLinea - subtotalLinea

      acc.subtotal += subtotalLinea
      acc.impuestos += impuestosLinea
      acc.total += totalLinea

      return acc
    }, inicial)
  })

  const ejecutarReimpresion = async () => {
    reimprimiendo.value = true

    try {
      await PrintService.reimprimirUltimoTicket(configStore)
      $q.notify({
        color: 'positive',
        message: 'Reimpresión enviada',
        icon: 'print'
      })
    } catch (e) {
      $q.notify({
        color: 'negative',
        message: e.message || 'Error al reimprimir',
        icon: 'warning'
      })
    } finally {
      reimprimiendo.value = false
    }
  }

  const agregarAlCarrito = (producto, cantidad = 1) => {
    const index = carrito.value.findIndex(p => p.id === producto.id)
    if (index !== -1) {
      carrito.value[index].cantidad += Number(cantidad)
    } else {
      carrito.value.unshift({
        ...producto,
        cantidad: Number(cantidad),
        uniqueId: Date.now()
      })
    }
  }

  const confirmarVenta = async (datosDesdeDialogo) => {
    $q.loading.show({ message: 'Registrando venta...' })

    try {
      const payload = {
        total: totalVenta.value.total, // Usamos el número total del objeto desglosado
        items: carrito.value.map(item => ({
          id: item.id,
          cantidad: item.cantidad,
          precio: item.precio // Mantenemos consistencia en el nombre
        })),
        tipo_pago: datosDesdeDialogo.tipo_pago,
        cliente_id: datosDesdeDialogo.cliente_id,
        pagos: datosDesdeDialogo.pagos, // Recibidos del diálogo
        sucursal_id: auth.sucursalSeleccionada?.id,
        caja_turno_id: posStore.turno?.id
      }


      // ÚNICA petición al servidor
      const { data } = await api.post('/api/pos/finalizar-venta', payload)

      if (data.id) {

        try {
          await PrintService.imprimirTicketReal(data, carrito.value, totalVenta.value, data.configticket, data.cliente)
          $q.notify({ color: 'positive', message: `VENTA ${data.folio} E IMPRESIÓN EXITOSA`, icon: 'print' })
        } catch (printErr) {
          $q.notify({ color: 'warning', message: printErr.message, icon: 'warning' })
        }

        // Reinicio del POS
        carrito.value = []
        dialogoPago.value = false
        nextTick(() => {
          document.querySelector('.foco-escaner input')?.focus()
        })
      }
    } catch (e) {
      console.log("Errir " + e.message)
    } finally {
      $q.loading.hide()
    }
  }

  // --- MÉTODOS DE SOPORTE ---
  const incrementar = (item) => item.cantidad++
  const decrementar = (item) => {
    if (item.cantidad > 1) item.cantidad--
    else eliminarArticulo(item)
  }
  const eliminarArticulo = (item) => {
    const index = carrito.value.findIndex(p => p.uniqueId === item.uniqueId)
    if (index !== -1) carrito.value.splice(index, 1)
  }
  const vaciarCarrito = () => {
    if (carrito.value.length === 0) return
    $q.dialog({ title: 'Limpiar', message: '¿Vaciar carrito?', cancel: true })
      .onOk(() => { carrito.value = [] })
  }

  const procesarEscaneo = async (input) => {
    let cantidadEscaneada = 1
    let codigoLimpio = input.trim()

    if (codigoLimpio.includes('*')) {
      const partes = codigoLimpio.split('*')
      cantidadEscaneada = parseFloat(partes[0]) || 1
      codigoLimpio = partes[1] || ''
    }

    if (!codigoLimpio) return

    try {
      const res = await api.get(`/api/pos/producto/${codigoLimpio}`)
      if (res.data) agregarAlCarrito(res.data, cantidadEscaneada)
    } catch (e) {
      $q.notify({ message: 'PRODUCTO NO ENCONTRADO', color: 'negative', position: 'center', icon: 'warning' })
    }
  }

  const abrirPago = () => {
    if (carrito.value.length === 0) {
      $q.notify({ message: 'Agregue productos para cobrar', color: 'warning', position: 'center' })
      return
    }
    dialogoPago.value = true
  }

  const abrirMovimientoCaja = () => {  showCashModal.value = true }

  const confirmarCierreTurno = () => { dialogoArqueo.value = true }
  const onTurnoCerrado = () => {
    carrito.value = []
    posStore.turno = null
    $q.notify({ color: 'positive', message: 'TURNO CERRADO', icon: 'lock', position: 'center' })
  }

  const manejarTecladoGlobal = (e) => {
    if (e.key === 'F2') { e.preventDefault(); dialogoBuscador.value = true }
    if (e.key === 'F12') { e.preventDefault(); abrirPago() }
  }

  onMounted(async() => {
    window.addEventListener('keydown', manejarTecladoGlobal)
    await posStore.verificarTurno()
    if(!posStore.isTurnoAbierto) dialogoApertura.value = true
    intervaloFoco = setInterval(recuperarFocoEscaner, 2500);
  })

  onUnmounted(() => {
    if (intervaloFoco) clearInterval(intervaloFoco);
    window.removeEventListener('keydown', manejarTecladoGlobal)
  })

  const onMovementSuccess = () => {
    showCashModal.value = false
  }

</script>

<style lang="scss" scoped>
  .border-top-grey { border-top: 1px solid #e0e0e0; }
  .shadow-up-1 { box-shadow: 0 -2px 10px rgba(0,0,0,0.05); }
</style>
