<template>
  <q-page class="bg-black overflow-hidden" style="height: 100vh;">
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
          @remove="eliminarArticulo"
        />
      </div>

      <div class="col-12 col-md-4 q-pa-md">
        <PosSummary
          :total="totalVenta"
          :count="carrito.length"
          @pay="abrirPago"
          @clear="vaciarCarrito"
        />
      </div>
    </div>

    <div class="fixed-bottom bg-black border-top-grey text-white q-pa-sm text-caption row justify-around shadow-up-1 z-top">
      <span><b class="text-primary">[F2]</b> Buscar</span>
      <span><b class="text-primary">[F12]</b> Pagar</span>
      <span><b class="text-red-9">[DEL]</b> Eliminar Fila</span>
      <q-separator vertical inset />
      <span class="text-blue-grey-9 text-bold">
        T.C. HOY: <span class="text-primary">$ {{ posStore.turno?.tipo_cambio || '0.00' }}</span>
      </span>
    </div>

    <PosDialogSearch
      v-model="dialogoBuscador"
      @selected="agregarAlCarrito"
    />

    <PosDialogPayment
      v-model="dialogoPago"
      :total="totalVenta"
      @success="finalizarVenta"
    />

    <PosDialogCash v-model="dialogoCaja" />

    <PosDialogArqueo v-model="dialogoArqueo" />
  </q-page>
</template>

<script setup>
  import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
  import { useQuasar } from 'quasar'
  import { api } from 'src/boot/axios'
  import { useAuthStore } from 'src/stores/auth'
  import { usePosStore } from 'src/stores/pos'

  // Importación de sub-componentes
  import PosHeader from 'components/Pos/PosHeader.vue'
  import PosCart from 'components/Pos/PosCart.vue'
  import PosSummary from 'components/Pos/PosSummary.vue'
  import PosDialogSearch from 'components/Pos/PosDialogSearch.vue'
  import PosDialogPayment from 'components/Pos/PosDialogPayment.vue'
  import PosDialogCash from 'components/Pos/PosDialogCash.vue'
  import PosDialogArqueo from 'components/Pos/PosDialogArqueo.vue'

  const $q = useQuasar()
  const auth = useAuthStore()
  const posStore = usePosStore()

  // Estados Globales de la Venta
  const carrito = ref([])
  const dialogoBuscador = ref(false)
  const dialogoPago = ref(false)
  const dialogoCaja = ref(false)
  const dialogoArqueo = ref(false)

  // Lógica de Totales
  const totalVenta = computed(() => {
    return carrito.value.reduce((acc, item) => acc + (item.precio_venda * item.cantidad), 0)
  })

  // --- ACCIONES DEL CARRITO ---
  const agregarAlCarrito = (producto, cantidad = 1) => {
    const index = carrito.value.findIndex(p => p.id === producto.id)
    if (index !== -1) {
      carrito.value[index].cantidad++
    } else {
      // Añadir al inicio para que el cajero vea el último escaneado arriba
      carrito.value.unshift({ ...producto, cantidad: cantidad, uniqueId: Date.now() })
    }
  }

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

  // --- LOGICA DE ESCANEO ---
  const procesarEscaneo = async (input) => {
    let cantidadEscaneada = 1
    let codigoLimpio = input.trim()

    // Verificar si el input tiene formato de cantidad*codigo
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

  // --- LOGICA DE TURNOS Y PAGOS ---
  const abrirPago = () => {
    if (carrito.value.length === 0) return
    dialogoPago.value = true
  }

  const finalizarVenta = () => {
    carrito.value = []
    dialogoPago.value = false
  }

  const abrirMovimientoCaja = () => { dialogoCaja.value = true }
  const confirmarCierreTurno = () => { dialogoArqueo.value = true }

  const activarPantallaCompleta = () => {
    if (!$q.fullscreen.isActive) {
      $q.fullscreen.request() // Solicita modo pantalla completa
        .catch(err => console.error('No se pudo activar:', err))
    }
  }

  // --- ATAJOS DE TECLADO ---
  const manejarTecladoGlobal = (e) => {
    if (e.key === 'F2') { e.preventDefault(); dialogoBuscador.value = true }
    if (e.key === 'F12') { e.preventDefault(); abrirPago() }
  }

  onMounted(() => {
    activarPantallaCompleta()
    window.addEventListener('keydown', manejarTecladoGlobal)
  })
  onUnmounted(() => {
    window.removeEventListener('keydown', manejarTecladoGlobal)
  })
</script>

<style lang="scss" scoped>
  .border-top-grey { border-top: 1px solid #e0e0e0; }
  .shadow-up-1 { box-shadow: 0 -2px 10px rgba(0,0,0,0.05); }
</style>
