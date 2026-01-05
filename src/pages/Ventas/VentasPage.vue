<template>
  <q-page padding class="bg-blue-grey-1 text-blue-grey-10">
    <div class="row q-col-gutter-md q-mb-lg">
      <div class="col-12 col-sm-6 col-md-3">
        <q-card flat bordered class="kpi-card shadow-1 bg-white rounded-borders">
          <q-item>
            <q-item-section avatar>
              <q-avatar color="blue-1" text-color="blue-9" icon="leaderboard" size="50px" />
            </q-item-section>
            <q-item-section>
              <q-item-label class="text-caption text-grey-7 uppercase text-bold">Ventas Totales</q-item-label>
              <q-item-label class="text-h5 text-bold text-blue-9">${{ formatMoney(kpis.totalVentas) }}</q-item-label>
            </q-item-section>
          </q-item>
        </q-card>
      </div>

      <div class="col-12 col-sm-6 col-md-3">
        <q-card flat bordered class="kpi-card shadow-1 bg-white rounded-borders">
          <q-item>
            <q-item-section avatar>
              <q-avatar color="green-1" text-color="green-9" icon="payments" size="50px" />
            </q-item-section>
            <q-item-section>
              <q-item-label class="text-caption text-grey-7 uppercase text-bold">Efectivo</q-item-label>
              <q-item-label class="text-h5 text-bold text-green-9">${{ formatMoney(kpis.totalEfectivo) }}</q-item-label>
            </q-item-section>
          </q-item>
        </q-card>
      </div>

      <div class="col-12 col-sm-6 col-md-3">
        <q-card flat bordered class="kpi-card shadow-1 bg-white rounded-borders">
          <q-item>
            <q-item-section avatar>
              <q-avatar color="cyan-1" text-color="cyan-9" icon="credit_card" size="50px" />
            </q-item-section>
            <q-item-section>
              <q-item-label class="text-caption text-grey-7 uppercase text-bold">Tarjetas / Transf.</q-item-label>
              <q-item-label class="text-h5 text-bold text-cyan-9">${{ formatMoney(kpis.totalBancos) }}</q-item-label>
            </q-item-section>
          </q-item>
        </q-card>
      </div>

      <div class="col-12 col-sm-6 col-md-3">
        <q-card flat bordered class="kpi-card shadow-1 bg-white rounded-borders">
          <q-item>
            <q-item-section avatar>
              <q-avatar color="amber-1" text-color="amber-9" icon="request_quote" size="50px" />
            </q-item-section>
            <q-item-section>
              <q-item-label class="text-caption text-grey-7 uppercase text-bold">Impuestos (IVA)</q-item-label>
              <q-item-label class="text-h5 text-bold text-amber-9">${{ formatMoney(kpis.totalImpuestos) }}</q-item-label>
            </q-item-section>
          </q-item>
        </q-card>
      </div>
    </div>

    <q-table
      :rows="ventas"
      :columns="columns"
      row-key="id"
      flat bordered
      class="rounded-borders shadow-2 bg-white main-sales-table"
      :loading="loading"
      :filter="filter"
    >
      <template v-slot:top>
        <div class="row items-center full-width">
          <div class="text-h5 text-blue-grey-9 text-bold flex items-center">
            <q-icon name="receipt_long" class="q-mr-sm" color="primary" />
            Historial de Ventas
          </div>
          <q-space />
          <q-input
            v-model="filter"
            placeholder="Buscar folio o cliente..."
            outlined dense
            class="bg-white"
            style="width: 350px"
          >
            <template v-slot:append><q-icon name="search" /></template>
          </q-input>
          <q-btn
            color="primary"
            icon="point_of_sale"
            label="Ir al POS"
            rounded push
            class="q-ml-md q-px-lg"
            to="/pos"
          />
        </div>
      </template>

      <template v-slot:body-cell-folio="props">
        <q-td :props="props">
          <q-badge color="purple-1" text-color="blue-grey-10" class="text-bold font-mono q-pa-sm" style="font-size: 16px">
            {{ props.value }}
          </q-badge>
        </q-td>
      </template>

      <template v-slot:body-cell-fecha="props">
        <q-td :props="props">
          <div class="text-blue-grey-7 text-bold">{{ formatFecha(props.value) }}</div>
          <div class="text-caption text-grey-6">{{ formatHora(props.value) }}</div>
        </q-td>
      </template>

      <template v-slot:body-cell-cliente="props">
        <q-td :props="props">
          <div class="row items-center">
            <q-avatar size="30px" color="blue-grey-1" text-color="blue-grey-7" icon="person" class="q-mr-sm" />
            <div class="text-bold">{{ props.value || 'PUBLICO GENERAL' }}</div>
          </div>
        </q-td>
      </template>

      <template v-slot:body-cell-metodo="props">
      <q-td :props="props" class="text-center">
        <q-chip
          :color="getMetodoInfo(props.row.pagos).color"
          :text-color="getMetodoInfo(props.row.pagos).textColor"
          dense
          square
          class="text-bold"
          size="sm"
        >
          <q-icon :name="getMetodoInfo(props.row.pagos).icon" size="14px" class="q-mr-xs" />
          {{ getMetodoInfo(props.row.pagos).label }}
        </q-chip>
      </q-td>
    </template>

      <template v-slot:body-cell-status="props">
        <q-td :props="props">
          <q-chip
            :color="props.value === 'Completada' ? 'green-1' : 'red-1'"
            :text-color="props.value === 'Completada' ? 'green-9' : 'red-9'"
            class="text-bold"
            dense icon="circle" size="sm"
          >
            {{ props.value.toUpperCase() }}
          </q-chip>
        </q-td>
      </template>

      <template v-slot:body-cell-total="props">
        <q-td :props="props" class="text-right">
          <div class="text-h6 text-bold text-blue-grey-9 font-mono">
            ${{ formatMoney(props.value) }}
          </div>
        </q-td>
      </template>

      <template v-slot:body-cell-acciones="props">
        <q-td :props="props" class="text-center">
          <q-btn flat round dense color="primary" icon="visibility" @click="verVenta(props.row)">
            <q-tooltip>Detalles de Venta</q-tooltip>
          </q-btn>
          <q-btn flat round dense color="secondary" icon="print">
            <q-tooltip>Reimprimir Ticket</q-tooltip>
          </q-btn>
          <q-btn
            flat round dense color="negative" icon="delete_sweep"
            @click="prepararCancelacion(props.row)"
            :disable="props.row.status === 'Cancelada'"
          >
            <q-tooltip>Cancelar Venta</q-tooltip>
          </q-btn>
        </q-td>
      </template>
    </q-table>
    <venta-detalle
      v-model="dialogoDetalle"
      :venta="ventaSeleccionada"
    />

    <q-dialog v-model="dialogoCancel" persistent>
      <q-card style="width: 450px; border-radius: 15px;">
        <q-card-section class="bg-negative text-white row items-center">
          <q-icon name="warning" size="sm" class="q-mr-sm" />
          <div class="text-h6 text-bold">Cancelar Venta</div>
        </q-card-section>

        <q-card-section class="q-pa-md">
          <div class="text-body2 q-mb-md">
            ¿Estás seguro de cancelar la venta <strong>{{ ventaACancelar?.folio }}</strong>? <br>
            <span class="text-negative text-bold">Esta acción devolverá los productos al inventario y registrará una entrada.</span>
          </div>

          <q-input
            v-model="motivoCancelacion"
            label="Motivo de la cancelación *"
            type="textarea"
            outlined
            dense
            autofocus
            color="negative"
            :rules="[val => !!val && val.length >= 5 || 'El motivo es obligatorio']"
          />
        </q-card-section>

        <q-card-actions align="right" class="q-pa-md bg-grey-1">
          <q-btn flat label="No, mantener venta" color="grey-7" v-close-popup />
          <q-btn
            label="Confirmar cancelación"
            color="negative"
            unelevated
            class="text-bold"
            @click="confirmarAnulacion"
            :loading="cancelando"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

  </q-page>
</template>

<script setup>
  import { ref, onMounted, computed } from 'vue'
  import { api } from 'src/boot/axios'
  import { date, useQuasar } from 'quasar'
  import VentaDetalle from 'src/components/Ventas/VentaDetalle.vue'

  const $q = useQuasar()
  const ventas = ref([])
  const loading = ref(false)
  const filter = ref('')

  const dialogoDetalle = ref(false)
  const ventaSeleccionada = ref({ detalles: [], pagos: [] })

  const dialogoCancel = ref(false)
  const motivoCancelacion = ref('')
  const ventaACancelar = ref(null)
  const cancelando = ref(false)

    /**
   * Abre el diálogo y prepara los datos de la venta a cancelar
   */
  const prepararCancelacion = (row) => {
    ventaACancelar.value = row
    motivoCancelacion.value = ''
    dialogoCancel.value = true
  }

    /**
   * Ejecuta la petición al servidor para cancelar y revertir stock
   */
  const confirmarAnulacion = async () => {
    if (motivoCancelacion.value.trim().length < 5) return

    cancelando.value = true
    try {
      // La ruta coincide con la lógica de Compras
      const { data } = await api.put(`/api/ventas/${ventaACancelar.value.id}/cancelar`, {
        motivo: motivoCancelacion.value
      })

      $q.notify({
        message: data.message || `Venta ${ventaACancelar.value.folio} anulada y stock revertido.`,
        color: 'positive',
        icon: 'check_circle',
        position: 'top'
      })

      dialogoCancel.value = false
      await cargarVentas() // Recarga la tabla para actualizar KPIs
    } catch (error) {
      const msg = error.response?.data?.error || 'No se pudo cancelar la venta'
      $q.notify({ color: 'negative', message: msg, icon: 'report_problem' })
    } finally {
      cancelando.value = false
    }
  }

  // KPIs DINÁMICOS
  const kpis = computed(() => {
    const totalVentas = ventas.value.reduce((s, v) => s + Number(v.total), 0)
    const totalImpuestos = ventas.value.reduce((s, v) => s + Number(v.impuestos), 0)

    // Cálculo por método de pago basado en la relación 'pagos'
    const totalEfectivo = ventas.value.reduce((s, v) => {
      // Filtramos solo los pagos hechos en efectivo
      const efectivoNetoVenta = v.pagos?.filter(p => p.metodo_pago === 'Efectivo')
        .reduce((sum, p) => {
          // Restamos el cambio entregado al monto recibido
          const montoReal = Number(p.monto) - Number(p.cambio_entregado || 0)
          return sum + montoReal
        }, 0) || 0

      return s + efectivoNetoVenta
    }, 0)

    return {
      totalVentas,
      totalImpuestos,
      totalEfectivo,
      totalBancos: totalVentas - totalEfectivo
    }
  })

  const columns = [
    { name: 'fecha', label: 'Fecha/Hora', field: 'created_at', align: 'left', sortable: true },
    { name: 'folio', label: 'Folio', field: 'folio', align: 'left', sortable: true },
    { name: 'cliente', label: 'Cliente', field: row => row.cliente?.nombre, align: 'left' },
    { name: 'metodo', label: 'Método de pago', align: 'center' },
    { name: 'status', label: 'Estatus', field: 'status', align: 'center' },
    { name: 'total', label: 'Total', field: 'total', align: 'right', sortable: true },
    { name: 'acciones', label: 'Acciones', align: 'center' }
  ]

  // FORMATOS
  const formatMoney = (val) => Number(val).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  const formatFecha = (f) => date.formatDate(f, 'DD MMM YYYY')
  const formatHora = (f) => date.formatDate(f, 'hh:mm A')

  const cargarVentas = async () => {
    loading.value = true
    try {
      const { data } = await api.get('/api/ventas')
      ventas.value = data
    } catch (e) {
      $q.notify({ color: 'negative', message: 'Error al cargar historial' })
    } finally {
      loading.value = false
    }
  }

    /**
   * Función para ver el detalle de una venta específica
   */
  const verVenta = async (venta) => {
    $q.loading.show({ message: 'Cargando comprobante...' })
    try {
      // Obtenemos la venta con sus relaciones de detalles, productos y pagos
      const { data } = await api.get(`/api/ventas/${venta.id}`)
      ventaSeleccionada.value = data
      dialogoDetalle.value = true
    } catch (e) {
      $q.notify({ color: 'negative', message: 'No se pudo cargar la información' })
    } finally {
      $q.loading.hide()
    }
  }

    /**
   * Lógica para determinar el estilo del chip basado en los pagos
   */
  const getMetodoInfo = (pagos) => {
    // Caso sin pagos registrados
    if (!pagos || pagos.length === 0) {
      return { label: 'S/P', color: 'grey-2', textColor: 'grey-7', icon: 'help' }
    }

    // Caso Mixto: Más de un método de pago utilizado
    if (pagos.length > 1) {
      return { label: 'MIXTO', color: 'purple-1', textColor: 'purple-9', icon: 'account_balance_wallet' }
    }

    // Caso Único: Se evalúa el método específico
    const metodo = pagos[0].metodo_pago.toUpperCase()

    if (metodo === 'EFECTIVO') {
      return { label: 'EFECTIVO', color: 'cyan-1', textColor: 'cyan-9', icon: 'payments' }
    }

    // Por defecto se asume Tarjeta/Bancos
    return { label: 'TARJETA', color: 'brown-1', textColor: 'brown-9', icon: 'credit_card' }
  }

  onMounted(cargarVentas)
</script>

<style lang="scss" scoped>
  .kpi-card {
    transition: transform 0.3s ease;
    &:hover {
      transform: translateY(-5px);
      box-shadow: 0 10px 20px rgba(0,0,0,0.1) !important;
    }
  }
  .main-sales-table {
    border-radius: 15px;
    :deep(.q-table__top) {
      border-bottom: 1px solid #f0f0f0;
    }
  }
  .font-mono { font-family: 'Roboto Mono', monospace; }
</style>
