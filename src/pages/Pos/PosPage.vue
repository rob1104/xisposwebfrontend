<template>
  <q-page class="bg-dark-pos column no-wrap overflow-hidden" style="height: 100vh;">

    <!-- Loading Spinner -->
    <div v-if="posStore.cargandoTurno" class="fixed-center text-center">
      <q-spinner-dots color="primary" size="4em" />
      <div class="text-white q-mt-md">Verificando turno...</div>
    </div>

    <!-- Vista Principal - Turno Abierto -->
    <template v-else-if="posStore.isTurnoAbierto">
      <PosHeader
        @cancel-sale="cancelarVenta"
        @scan="procesarEscaneo"
        @open-search="dialogoBuscador = true"
        @open-cash="abrirMovimientoCaja"
        @close-turn="confirmarCierreTurno"
      />

      <!-- Layout Principal Responsive -->
      <div class="col row q-col-gutter-x-sm q-pa-sm overflow-hidden main-content-area">

        <!-- Columna del Carrito - Adaptable -->
        <div class="col-12 col-md-7 col-lg-8 full-height column">
          <div class="col overflow-hidden bg-blue-grey-10 rounded-borders shadow-2 inner-panel border-subtle">
            <PosCart
              :items="carrito"
              @increment="incrementar"
              @decrement="decrementar"
              @request-price-change="abrirDialogoPrecio"
              class="full-height"
            />
          </div>
        </div>

        <div class="col-12 col-md-5 col-lg-4 full-height column q-mt-sm q-gutter-y-sm">
          <div class="row q-col-gutter-md">
            <div class="col">
              <q-btn
                color="green-4"
                icon="print"
                text-color="black"
                label="Reimprimir Último"
                class="full-width text-bold"
                size="md"
                @click="ejecutarReimpresion"
                :loading="reimprimiendo" />
            </div>
            <div class="col">
              <q-btn
                color="indigo-9"
                icon="pending_actions"
                label="Espera"
                class="full-width action-btn"
                unelevated
                @click="dialogoVentasPausadas = true">
                  <q-badge v-if="posStore.ventasEnEspera.length" color="red" floating>
                    {{ posStore.ventasEnEspera.length }}
                  </q-badge>
              </q-btn>
            </div>
          </div>

          <!-- Resumen de Venta -->
          <div class="col column">
            <PosSummary
              :resumen="totalVenta"
              :count="carrito.length"
              @pay="abrirPago"
              @clear="vaciarCarrito"
              class="col"
            />
          </div>
        </div>
      </div>

      <!-- Footer Responsive con Info -->
      <div class="pos-footer row items-center q-px-md shadow-up-5">
        <!-- Atajos de Teclado - Solo en pantallas medianas -->
        <div class="gt-sm row items-center q-gutter-x-md text-grey-5">
          <span><b class="text-yellow">[F5]</b> Buscar</span>
          <span><b class="text-yellow">[F7]</b> Pausar Venta</span>
          <span><b class="text-yellow">[F8]</b>Cargar Pausadas</span>
          <span><b class="text-yellow">[F12]</b> Cobrar Venta</span>
        </div>

        <q-space />

        <!-- Sucursal -->
        <div class="row items-center q-gutter-x-lg">
          <div class="status-item">
            <q-icon name="storefront" color="cyan" size="xs" class="q-mr-xs" />
            {{ auth.sucursalSeleccionada?.nombre || 'N/A' }}
          </div>
          <div class="status-item">
            <q-icon name="currency_exchange" color="amber" size="xs" class="q-mr-xs" />
            T.C: <span class="text-white text-bold">{{ posStore.turno?.tipo_cambio || '0.00' }}</span>
          </div>
          <q-slide-transition>
            <div v-if="ultimoCambio > 0" class="change-widget row items-center animate__animated animate__bounceInRight">
              <div class="text-overline q-mr-sm opacity-70">CAMBIO:</div>
              <div class="text-h6 text-bold text-light-green-13">$ {{ ultimoCambio.toFixed(2) }}</div>
              <q-btn flat round dense icon="close" size="xs" class="q-ml-sm" @click="ultimoCambio = 0" />
            </div>
          </q-slide-transition>
        </div>
      </div>
    </template>

    <!-- Vista de Caja Cerrada - Responsive -->
    <div v-else class="full-height flex flex-center bg-blue-grey-10 q-pa-md">
      <q-card
        style="width: 100%; max-width: 400px; border-radius: 20px;"
        class="bg-blue-grey-9 text-white q-pa-lg text-center shadow-24"
      >
        <q-icon name="lock" size="60px" color="yellow-8" class="q-mb-md" />
        <div class="text-h5 text-h4-md text-bold">CAJA CERRADA</div>
        <p class="text-grey-4 q-mt-md text-body2">
          Debe realizar la apertura de turno para comenzar a vender.
        </p>
        <q-btn
          label="ABRIR TURNO"
          color="positive"
          size="lg"
          class="full-width q-mt-lg text-bold"
          unelevated
          @click="dialogoApertura = true"
        />
         <q-btn
          label="REGRESAR A INICIO"
          size="lg"
          class="full-width q-mt-lg text-bold"
          unelevated
          @click="router.push('/')"
        />
      </q-card>
    </div>

    <!-- Diálogos -->
    <PosDialogApertura v-model="dialogoApertura" />
    <PosDialogSearch v-model="dialogoBuscador" @selected="agregarAlCarrito" />
    <PosDialogPayment
      v-model="dialogoPago"
      :resumen="totalVenta"
      :items="carrito"
      :cliente-seleccionado="clienteSeleccionado"
      @success="confirmarVenta"
    />
    <PosDialogArqueo v-model="dialogoArqueo" @closed="onTurnoCerrado" />
    <CashMovementModal v-model="showCashModal" @success="onMovementSuccess" />
    <PosDialogPriceChange v-model="dialogoCambiaPrecio" :item="itemSeleccionadoParaPrecio" @change="aplicarCambioPrecio" />
    <PosDialogoPausadas
        v-model="dialogoVentasPausadas"
        :ventas="posStore.ventasEnEspera"
        @recuperar="recuperarVenta"
      />
  </q-page>
</template>

<script setup>
  import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
  import { useQuasar } from 'quasar'
  import { api } from 'src/boot/axios'
  import { useRouter } from 'vue-router'
  import { useAuthStore } from 'src/stores/auth'
  import { usePosStore } from 'src/stores/pos'
  import { useConfigStore } from 'src/stores/config'

  import PosHeader from 'components/Pos/PosHeader.vue'
  import PosCart from 'components/Pos/PosCart.vue'
  import PosSummary from 'components/Pos/PosSummary.vue'
  import PosDialogSearch from 'components/Pos/PosDialogSearch.vue'
  import PosDialogPayment from 'components/Pos/PosDialogPayment.vue'
  import PosDialogArqueo from 'components/Pos/PosDialogArqueo.vue'
  import PosDialogApertura from 'src/components/Pos/PosDialogApertura.vue'
  import PosDialogPriceChange from 'src/components/Pos/PosDialogPriceChange.vue'
  import CashMovementModal from 'src/components/Pos/CashMovementModal.vue'
  import PosDialogoPausadas from 'src/components/Pos/PosDialogoPausadas.vue'
  import { PrintService } from 'src/services/PrintService'

  const $q = useQuasar()
  const auth = useAuthStore()
  const posStore = usePosStore()
  const router = useRouter()
  const configStore = useConfigStore()

  const dialogoApertura = ref(false)
  const carrito = ref([])
  const dialogoBuscador = ref(false)
  const dialogoPago = ref(false)
  const dialogoArqueo = ref(false)
  const reimprimiendo = ref(false)
  const showCashModal = ref(false)
  const dialogoVentasPausadas = ref(false)
  const dialogoCambiaPrecio = ref(false)
  const itemSeleccionadoParaPrecio = ref(null)
  const ultimoCambio = ref(0)
  const clienteSeleccionado = ref(null)

  const STORAGE_KEY = 'xispos_venta_backup'

  let intervaloFoco = null

  watch([carrito, clienteSeleccionado], ([nuevoCarrito, nuevoCliente]) => {
      if (nuevoCarrito.length > 0) {
        const estadoVenta = {
          carrito: nuevoCarrito,
          cliente: nuevoCliente
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(estadoVenta))
      } else {
        if (localStorage.getItem(STORAGE_KEY)) {
          localStorage.removeItem(STORAGE_KEY)
        }
      }
    },
    { deep: true }
  )

  const restaurarSesionPrevia = () => {
    const respaldo = localStorage.getItem(STORAGE_KEY)
    if (respaldo) {
      try {
        const data = JSON.parse(respaldo)

        if (data.carrito && data.carrito.length > 0) {
          carrito.value = data.carrito

          if (data.cliente) {
            clienteSeleccionado.value = data.cliente
            posStore.clienteSeleccionado = data.cliente
          }

          $q.notify({
            message: 'VENTA RESTAURADA',
            caption: 'Se recuperó una venta no finalizada.',
            color: 'indigo-9',
            icon: 'restore',
            position: 'center',
            timeout: 5000
          })
        }
      } catch (e) {
        console.error('Error al restaurar venta:', e)
        localStorage.removeItem(STORAGE_KEY)
      }
    }
  }

  const resetearCliente = async() => {
    try {
      const { data } = await api.get('/api/clientes/1')
      clienteSeleccionado.value = data
      posStore.clienteSeleccionado = clienteSeleccionado.value
    } catch (e) {
      console.error('Error al resetear cliente default')
    }
  }

  const cancelarVenta = () => {
    if (carrito.value.length === 0 && clienteSeleccionado.value?.id === 1) return
    $q.dialog({
      title: 'Cancelar Venta',
      message: '¿Estás seguro de borrar el carrito y resetear el cliente?',
      cancel: true,
      persistent: true,
      ok: { label: 'Sí, Cancelar', color: 'negative' }
    }).onOk(async () => {
      localStorage.removeItem(STORAGE_KEY)
      carrito.value = []
      await resetearCliente()
      $q.notify({ message: 'Venta cancelada y cliente reseteado', color: 'orange-9', icon: 'delete_sweep' })
    })
  }

  const ponerEnEspera = () => {
    if(carrito.value.length === 0) return
    posStore.pausarVenta(carrito.value, totalVenta.value.total)
    carrito.value = []
    $q.notify({
      message: 'VENTA EN ESPERA',
      caption: 'Se ha guardado el ticket temporalmente',
      color: 'indigo-7',
      icon: 'pause_circle',
      position: 'bottom'
    })
  }

  const recuperarVenta = (ventaPausada) => {
    if (carrito.value.length > 0) {
      // Si ya hay algo en el carrito, preguntamos o pausamos la actual
      $q.notify({ message: 'Primero vacíe o pause la venta actual', color: 'warning' })
      return
    }

    carrito.value = ventaPausada.items
    posStore.eliminarPausa(ventaPausada.id)
    $q.notify({ message: 'Ticket recuperado', color: 'positive', icon: 'play_circle' })
  }

  const abrirDialogoPrecio = (item) => {
    itemSeleccionadoParaPrecio.value = item
    dialogoCambiaPrecio.value = true
  }

  const aplicarCambioPrecio = ({ precio, motivo, autorizado_por }) => {
    const index = carrito.value.findIndex(p => p.uniqueId === itemSeleccionadoParaPrecio.value.uniqueId)
    if(index !== -1) {
      const valorNumerico = Number(precio)
      carrito.value[index].precio = valorNumerico
      carrito.value[index].motivo_cambio_precio = motivo
      carrito.value[index].autorizado_por = autorizado_por
      $q.notify({
        color: 'positive',
        message: `Precio actualizado: $${valorNumerico.toFixed(2)}`,
        caption: `Motivo: ${motivo}`
      })
    }
  }

  const recuperarFocoEscaner = () => {
    const ningunDialogoAbierto =
      !dialogoBuscador.value &&
      !dialogoPago.value &&
      !dialogoArqueo.value &&
      !dialogoApertura.value &&
      !showCashModal.value &&
      !dialogoCambiaPrecio.value

    if (ningunDialogoAbierto) {
      const input = document.querySelector('.foco-escaner input')
      if (input && document.activeElement !== input) {
        input.focus()
      }
    }
  }

  watch(dialogoBuscador, (val) => {
    if (!val) {
      nextTick(() => recuperarFocoEscaner())
    }
  })

  const totalVenta = computed(() => {
    const inicial = { subtotal: 0, impuestos: 0, total: 0 }
    if (!carrito.value.length) return inicial

    return carrito.value.reduce((acc, item) => {
      const tasaTotal = (item.impuestos?.reduce((sum, imp) => sum + Number(imp.porcentaje), 0) || 0) / 100
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

    const stockDisponible = producto.stock_actual || 0
    if (stockDisponible <= 0) {
      $q.notify({
        color: 'orange-9',
        message: 'PRODUCTO AGOTADO',
        caption: `El inventario actual es 0 para: ${producto.nombre}`,
        icon: 'production_quantity_limits',
        position: 'center',
        timeout: 3000
      })
      return
    }

    const index = carrito.value.findIndex(p => p.id === producto.id)

    let cantidadFinalDeseada = Number(cantidad)
    if (index !== -1) {
      cantidadFinalDeseada += Number(carrito.value[index].cantidad)
    }
    if (cantidadFinalDeseada > stockDisponible) {
      $q.notify({
        color: 'orange-9',
        message: 'INVENTARIO INSUFICIENTE',
        caption: `Solo tienes ${stockDisponible} uds. Intentas vender ${cantidadFinalDeseada}.`,
        icon: 'inventory',
        position: 'center',
        timeout: 3000
      })
      return
    }

    if (index !== -1) {
      carrito.value[index].cantidad += Number(cantidad)
    } else {
      carrito.value.unshift({
        ...producto,
        cantidad: Number(cantidad),
        uniqueId: Date.now(),
        precio_catalogo: Number(producto.precio)
      })
    }
  }

  const confirmarVenta = async (datosDesdeDialogo) => {
    const payload = {
      tipo_pago: datosDesdeDialogo.tipo_pago,
      cliente_id: datosDesdeDialogo.cliente_id,
      pagos: datosDesdeDialogo.pagos,
      items: carrito.value.map(item => ({
        id: item.id,
        cantidad: item.cantidad,
        precio: item.precio,
        total: item.precio * item.cantidad,
        precio_original: item.precio_catalogo,
        motivo_cambio: item.motivo_cambio_precio || null,
        autorizado_por: item.autorizado_por || null
      })),
      subtotal: totalVenta.value.subtotal,
      iva: totalVenta.value.iva,
      total: totalVenta.value.total
    }

    try {
      const { data: ventaExitosa } = await api.post('/api/pos/finalizar-venta', payload)

      if (ventaExitosa.id) {
        try {

          await PrintService.imprimirTicketReal(
            ventaExitosa,
            carrito.value,
            totalVenta.value,
            ventaExitosa.configticket,
            ventaExitosa.cliente,
            datosDesdeDialogo.pagos)

            $q.notify({
              color: 'positive',
              message: `VENTA ${ventaExitosa.folio} REGISTRADA E IMPRESA`,
              icon: 'print'
            })
          }
          catch (printError) {
            $q.notify({
              color: 'warning',
              message: 'Venta guardada, pero hubo un problema con la impresora.',
              caption: printError.message,
              icon: 'priority_high'
            })
          }
          finally {
            ultimoCambio.value = datosDesdeDialogo.cambio_calculado || 0
          }

          localStorage.removeItem(STORAGE_KEY)

        carrito.value = []
        await resetearCliente()
        dialogoPago.value = false
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Error crítico al finalizar la venta'
      $q.notify({
        color: 'negative',
        message: errorMsg,
        icon: 'report_problem',
        position: 'center'
      })
    }
  }

  const incrementar = (item) => {
    if (item.cantidad + 1 > item.stock_actual) {
      $q.notify({
        message: 'Tope de inventario alcanzado',
        color: 'orange-9',
        icon: 'Pan_tool',
        position: 'center',
        timeout: 1000
      })
      return
    }

    item.cantidad++
  }

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

    // DETECTAR TARJETA DE CLIENTE (Ejem: CTE-0000001)
    if (codigoLimpio.startsWith('CTE-')) {
      try {
        const { data } = await api.get(`/api/clientes/${codigoLimpio}/global`)
        if (data) {
          clienteSeleccionado.value = data
          $q.notify({
            message: `CLIENTE IDENTIFICADO: ${data.nombre_comercial}`,
            caption: `RFC: ${data.rfc || 'Sin RFC'}`,
            icon: 'person_add',
            color: 'cyan-9',
            position: 'center'
          })
        }
        posStore.clienteSeleccionado = clienteSeleccionado.value
        return
      }
      catch (e) {
        $q.notify({
          message: 'Código de cliente no encontrado',
          caption: 'Verifique que el número de cliente sea correcto',
          color: 'orange-9',
          position: 'center',
          icon: 'error'
        })
        return
      }
    }

    const PREFIJO_BASCULA = auth.sucursalSeleccionada?.bascula || '20'

    /*** B A S C U L A */
    if (codigoLimpio.startsWith(PREFIJO_BASCULA)) {
      //Estructura PPCCCCCVVVVVC
      const codProducto = codigoLimpio.substring(4, 7) //Digitos del producto
      const valorRaw = codigoLimpio.substring(7, 12)  //Peso
      cantidadEscaneada = parseFloat(valorRaw) / 1000
      codigoLimpio = codProducto
    }
    else if (codigoLimpio.includes('*')) {
      const partes = codigoLimpio.split('*')
      cantidadEscaneada = parseFloat(partes[0]) || 1
      codigoLimpio = partes[1] || ''
    }


    if (!codigoLimpio) return

    try {
      const res = await api.get(`/api/pos/producto/${codigoLimpio}`)
      console.log(res.data)
      if (res.data) {
        if (res.data.status == 0) {
          $q.notify({
            message: 'PRODUCTO DESACTIVADO',
            caption: `El producto ${res.data.nombre} no está disponible para venta.`,
            color: 'orange-9',
            position: 'center',
            icon: 'block',
            timeout: 2500
          })
          return
        }
        agregarAlCarrito(res.data, cantidadEscaneada)
      }
    } catch (e) {
      $q.notify({
        message: 'PRODUCTO NO ENCONTRADO',
        color: 'negative',
        position: 'center',
        icon: 'warning'
      })
    }
  }

  const abrirPago = () => {
    if (carrito.value.length === 0) {
      $q.notify({
        message: 'Agregue productos para cobrar',
        color: 'warning',
        position: 'center'
      })
      return
    }
    dialogoPago.value = true
  }

  const abrirMovimientoCaja = () => { showCashModal.value = true }

  const confirmarCierreTurno = () => { dialogoArqueo.value = true }

  const onTurnoCerrado = () => {
    carrito.value = []
    posStore.turno = null
    $q.notify({
      color: 'positive',
      message: 'TURNO CERRADO',
      icon: 'lock',
      position: 'center'
    })
  }


  watch(dialogoCambiaPrecio, (val) => {
  if (!val) {
      nextTick(() => recuperarFocoEscaner())
    }
  })

  const manejarTecladoGlobal = (e) => {
    if (e.key === 'F5') { e.preventDefault(); dialogoBuscador.value = true }
    if (e.key === 'F12') { e.preventDefault(); abrirPago() }

    if (e.key === 'F7') {
      e.preventDefault()
      ponerEnEspera()
    }
    if (e.key === 'F8') {
      e.preventDefault()
      dialogoVentasPausadas.value = true
    }

  }

  onMounted(async() => {
    window.addEventListener('keydown', manejarTecladoGlobal)
    await posStore.verificarTurno()
    await resetearCliente()
    restaurarSesionPrevia()
    if(!posStore.isTurnoAbierto) dialogoApertura.value = true
    intervaloFoco = setInterval(recuperarFocoEscaner, 2500)
  })

  onUnmounted(() => {
    if (intervaloFoco) clearInterval(intervaloFoco)
    window.removeEventListener('keydown', manejarTecladoGlobal)
  })

  const onMovementSuccess = () => {
    showCashModal.value = false
  }

</script>

<style lang="scss" scoped>
  .bg-dark-pos {
  background: radial-gradient(circle at top right, #1a2327, #0d1214);
}

.main-content-area {
  height: calc(100vh - 110px); // Ajuste según altura de Header y Footer
}

.inner-panel {
  background: rgba(38, 50, 56, 0.4);
  backdrop-filter: blur(5px);
}

.border-subtle {
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.action-btn {
  height: 45px;
  border-radius: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border: 1px solid rgba(255,255,255,0.1);
}

.pos-footer {
  height: 45px;
  background: #101619;
  border-top: 1px solid rgba(0, 188, 212, 0.2);
  font-size: 11px;
}

.shortcut {
  .key {
    background: #263238;
    color: #00e5ff;
    padding: 2px 6px;
    border-radius: 4px;
    margin-right: 4px;
    font-weight: bold;
    border: 1px solid rgba(0, 229, 255, 0.3);
  }
}

.status-item {
  color: #b0bec5;
  font-weight: 500;
  text-transform: uppercase;
}

.change-widget {
  background: rgba(76, 175, 80, 0.15);
  border: 1px solid rgba(76, 175, 80, 0.4);
  padding: 0 15px;
  height: 35px;
  border-radius: 20px;
  box-shadow: 0 0 15px rgba(76, 175, 80, 0.1);
}
  .border-top-grey {
    border-top: 1px solid #e0e0e0;
  }

  .shadow-up-1 {
    box-shadow: 0 -2px 10px rgba(0,0,0,0.05);
  }

  @media (max-width: 599px) {
    .q-page {
      font-size: 0.9rem;
    }
  }

  @media (min-width: 1440px) {
    .text-h4-md {
      font-size: 2rem !important;
    }
  }
</style>
