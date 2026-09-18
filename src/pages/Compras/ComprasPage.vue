<template>
  <q-page padding class="bg-grey-1">
    <div class="row q-col-gutter-md q-mb-lg">
      <div class="col-12 col-sm-6 col-md-3">
        <q-card flat bordered class="shadow-1 q-pa-sm bg-white rounded-borders">
          <q-item>
            <q-item-section avatar>
              <q-icon name="shopping_basket" color="primary" size="md" />
            </q-item-section>
            <q-item-section>
              <q-item-label class="text-caption text-grey-7">Inversión Total</q-item-label>
              <q-item-label class="text-h6 text-bold">${{ formatMoney(kpis.totalInvertido) }}</q-item-label>
            </q-item-section>
          </q-item>
        </q-card>
      </div>

      <div class="col-12 col-sm-6 col-md-3">
        <q-card flat bordered class="shadow-1 q-pa-sm bg-white rounded-borders">
          <q-item>
            <q-item-section avatar>
              <q-icon name="account_balance_wallet" color="negative" size="md" />
            </q-item-section>
            <q-item-section>
              <q-item-label class="text-caption text-grey-7">Deuda a Proveedores</q-item-label>
              <q-item-label class="text-h6 text-bold text-negative">${{ formatMoney(kpis.saldoDeuda) }}</q-item-label>
            </q-item-section>
          </q-item>
        </q-card>
      </div>

      <div class="col-12 col-sm-6 col-md-3">
        <q-card flat bordered class="shadow-1 q-pa-sm bg-white rounded-borders">
          <q-item>
            <q-item-section avatar>
              <q-icon name="event_repeat" color="orange" size="md" />
            </q-item-section>
            <q-item-section>
              <q-item-label class="text-caption text-grey-7">Compras a Crédito</q-item-label>
              <q-item-label class="text-h6 text-bold">{{ kpis.comprasCredito }}</q-item-label>
            </q-item-section>
          </q-item>
        </q-card>
      </div>

      <div class="col-12 col-sm-6 col-md-3">
        <q-card flat bordered class="shadow-1 q-pa-sm bg-white rounded-borders">
          <q-item>
            <q-item-section avatar>
              <q-icon name="confirmation_number" color="secondary" size="md" />
            </q-item-section>
            <q-item-section>
              <q-item-label class="text-caption text-grey-7">Total Compras</q-item-label>
              <q-item-label class="text-h6 text-bold">{{ compras.length }}</q-item-label>
            </q-item-section>
          </q-item>
        </q-card>
      </div>
    </div>

    <q-table
      :rows="compras"
      :columns="columns"
      row-key="id"
      flat bordered
      class="rounded-borders shadow-1 bg-white main-table"
      :loading="loading"
      :filter="filter"
    >
      <template v-slot:top>
        <div class="row items-center full-width q-gutter-sm flex-wrap">
          <div class="text-h6 text-primary flex items-center">
            <q-icon name="assignment" class="q-mr-sm" />
            Control de Compras
          </div>
          <q-space />
          
          <!-- Filtro de Fecha -->
          <q-select
            v-model="filtroFecha"
            :options="opcionesFiltroFecha"
            dense outlined
            class="bg-white q-mr-sm"
            style="min-width: 150px"
            emit-value map-options
            @update:model-value="aplicarFiltroFecha"
          />

          <!-- Selector de Rango Personalizado -->
          <q-input 
            v-if="filtroFecha === 'rango'" 
            v-model="rangoFechasTexto" 
            dense outlined readonly
            class="bg-white q-mr-sm"
            style="width: 220px"
            placeholder="Seleccionar rango"
          >
            <template v-slot:append>
              <q-icon name="event" class="cursor-pointer">
                <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                  <q-date v-model="fechaRango" range mask="YYYY-MM-DD" @update:model-value="aplicarFiltroPersonalizado">
                    <div class="row items-center justify-end">
                      <q-btn v-close-popup label="Cerrar" color="primary" flat />
                    </div>
                  </q-date>
                </q-popup-proxy>
              </q-icon>
            </template>
          </q-input>

          <q-input
            v-model="filter"
            placeholder="Buscar por folio o proveedor..."
            outlined dense
            class="q-mr-md bg-white custom-focus"
            style="width: 250px"
          >
            <template v-slot:append>
              <q-icon name="search" />
            </template>
          </q-input>
          
          <q-btn
            color="primary"
            icon="add_shopping_cart"
            label="Registrar Compra"
            rounded
            class="shadow-3 q-px-lg text-weight-bold"
            @click="mostrarForm = true"
          />
        </div>
      </template>

      <template v-slot:body-cell-fecha="props">
        <q-td :props="props">
          <div class="text-blue-grey-7 text-bold">{{ formatFecha(props.value) }}</div>
          <div class="text-caption text-grey-6">{{ formatHora(props.value) }}</div>
        </q-td>
      </template>

      <template v-slot:body-cell-folio="props">
        <q-td :props="props">
          <q-badge color="blue-grey-2" text-color="blue-grey-9" class="text-weight-bold q-pa-xs">
            {{ props.value }}
          </q-badge>
        </q-td>
      </template>

      <template v-slot:body-cell-proveedor="props">
        <q-td :props="props">
          <div class="row items-center">
            <q-avatar size="24px" color="blue-1" text-color="primary" icon="business" class="q-mr-sm" />
            <div>
              <div class="text-weight-bold">{{ props.value }}</div>
              <div class="text-caption text-grey" v-if="props.row.referencia">Ref: {{ props.row.referencia }}</div>
            </div>
          </div>
        </q-td>
      </template>

      <template v-slot:body-cell-metodo="props">
        <q-td :props="props">
          <q-chip
            :color="props.value === 'CREDITO' ? 'orange-2' : 'blue-2'"
            :text-color="props.value === 'CREDITO' ? 'orange-10' : 'blue-10'"
            dense square class="text-weight-bold" size="md"
          >
            {{ props.value }}
          </q-chip>
        </q-td>
      </template>

      <template v-slot:body-cell-estatus="props">
        <q-td :props="props">
          <q-chip
            :color="getStatusColor(props.value)"
            text-color="white"
            dense square class="text-weight-bold" size="md"
          >
            {{ props.value }}
          </q-chip>
        </q-td>
      </template>

      <template v-slot:body-cell-total="props">
        <q-td :props="props" class="text-weight-bold text-right">
          <span style="font-weight: bold; font-size: 18px; color:darkgreen;">
            ${{ formatMoney(props.value) }}
          </span>
        </q-td>
      </template>

      <template v-slot:body-cell-acciones="props">
        <q-td :props="props" class="text-center">
          <q-btn
            flat round dense
            color="purple-10"
            icon="picture_as_pdf"
            @click="descargarPDF(props.row)"
            :loading="descargandoId === props.row.id"
          >
            <q-tooltip>Descargar PDF</q-tooltip>
          </q-btn>


          <q-btn flat round dense color="blue-7" icon="visibility" @click="verDetalle(props.row)">
            <q-tooltip>Ver Partidas</q-tooltip>
          </q-btn>


           <q-btn
            flat round dense
            color="red-8"
            icon="cancel"
            @click="prepararCancelacion(props.row)"
            :disable="props.row.estatus === 'CANCELADA'"
          >
            <q-tooltip>Cancelar Compra</q-tooltip>
          </q-btn>
        </q-td>
      </template>
    </q-table>

    <q-dialog v-model="mostrarForm" persistent transition-show="scale" transition-hide="scale">
      <CompraForm @actualizar="mostrarForm = false;cargarCompras" />
    </q-dialog>

    <q-dialog v-model="dialogoCancel" persistent>
      <q-card style="width: 400px">
        <q-card-section class="bg-negative text-white">
          <div class="text-h6">Cancelar Compra</div>
        </q-card-section>

        <q-card-section class="q-pa-md">
          <div class="text-body2 q-mb-md">
            ¿Estás seguro de cancelar la compra <strong>{{ compraACancelar?.folio }}</strong>?
            Esta acción descontará los productos del inventario.
          </div>
          <q-input
            v-model="motivoCancelacion"
            label="Motivo de cancelación *"
            type="textarea"
            outlined
            dense
            autofocus
            :rules="[val => !!val || 'El motivo es obligatorio']"
          />
        </q-card-section>

        <q-card-actions align="right">
          <q-btn label="No" color="grey" v-close-popup />
          <q-btn
            label="Confirmar Cancelación"
            color="negative"
            @click="confirmarCancelacion"
            :loading="cancelando"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
      <DetalleCompraModal
        v-model="showDetalle"
        :compra-id="selectedCompraId"
        @download="onDownloadFromModal"
    />
  </q-page>
</template>

<script setup>
  import { ref, onMounted, computed } from 'vue'
  import { api } from 'src/boot/axios'
  import { date } from 'quasar'
  import { useQuasar } from 'quasar'
  import CompraForm from 'src/components/Compras/CompraForm.vue'
  import { useAuthStore } from 'src/stores/auth'
  import DetalleCompraModal from 'src/components/Compras/DetalleCompraModal.vue'

  const authStore = useAuthStore()


  const $q = useQuasar()
  const compras = ref([])
  const loading = ref(false)
  const mostrarForm = ref(false)
  const filter = ref('')

  const filtroFecha = ref('hoy')
  const opcionesFiltroFecha = [
    { label: 'Hoy', value: 'hoy' },
    { label: 'Esta Semana', value: 'semana' },
    { label: 'Este Mes', value: 'mes' },
    { label: 'Rango Personalizado', value: 'rango' },
    { label: 'Todo el historial', value: 'todo' }
  ]
  const fechaRango = ref(null)

  const rangoFechasTexto = computed(() => {
    if (!fechaRango.value) return ''
    if (typeof fechaRango.value === 'string') return fechaRango.value
    return `${fechaRango.value.from} a ${fechaRango.value.to}`
  })

  const aplicarFiltroFecha = () => {
    if (filtroFecha.value !== 'rango') {
      cargarCompras()
    }
  }

  const aplicarFiltroPersonalizado = () => {
    if (fechaRango.value) {
      cargarCompras()
    }
  }

  const dialogoCancel = ref(false)
  const motivoCancelacion = ref('')
  const compraACancelar = ref(null)
  const cancelando = ref(false)
  const descargandoId = ref(null);

  const showDetalle = ref(false)
  const selectedCompraId = ref(null)

  const formatFecha = (f) => date.formatDate(f, 'DD MMM YYYY')
  const formatHora = (f) => date.formatDate(f, 'hh:mm A')

  const verDetalle = (row) => {
    selectedCompraId.value = row.id
    showDetalle.value = true
  }

// Reutilizamos la función de PDF que ya habías creado
const onDownloadFromModal = (compra) => {
  descargarPDF(compra) // Tu función existente
}

  const prepararCancelacion = (row) => {
    compraACancelar.value = row
    motivoCancelacion.value = ''
    dialogoCancel.value = true
  }

  const confirmarCancelacion = async () => {
    if (motivoCancelacion.value.trim().length < 5) {
      $q.notify({
        message: 'Escribe un motivo más detallado (mínimo 5 letras)',
        color: 'orange',
        icon: 'warning'
      })
      return
    }

    cancelando.value = true
    try {
      await api.put(`/api/compras/${compraACancelar.value.id}/cancelar`, {
        motivo: motivoCancelacion.value
      })

      $q.notify({
        message: `Compra ${compraACancelar.value.folio} cancelada y stock revertido.`,
        color: 'positive',
        icon: 'check_circle',
        position: 'top' // Se ve mejor arriba para confirmaciones importantes
      });

      dialogoCancel.value = false
      await cargarCompras() // Recarga la tabla y actualiza los KPIs automáticamente
    } catch (error) {
      const msgError = error.response?.data?.error || 'No se pudo cancelar la compra. Intente de nuevo.';
      $q.notify({
        message: msgError,
        color: 'negative',
        icon: 'error'
      });
    } finally {
      cancelando.value = false
    }
  }

  // KPIs Computados Dinámicos
  const kpis = computed(() => {
    const totalInvertido = compras.value.reduce((s, c) => s + parseFloat(c.total), 0)
    const saldoDeuda = compras.value.reduce((s, c) => s + parseFloat(c.saldo), 0)
    const comprasCredito = compras.value.filter(c => c.metodo_pago === 'CREDITO').length
    return { totalInvertido, saldoDeuda, comprasCredito }
  })

  const columns = [
    { name: 'fecha', label: 'Fecha', field: 'fecha', format: val => formatFechaFull(val), align: 'left', sortable: true },
    { name: 'folio', label: 'Folio', field: 'folio', align: 'left', sortable: true },
    { name: 'proveedor', label: 'Proveedor', field: row => row.provider?.razon_social, align: 'left', sortable: true },
    { name: 'metodo', label: 'Método', field: 'metodo_pago', align: 'center' },
    { name: 'estatus', label: 'Estatus', field: 'estatus', align: 'center' },
    { name: 'total', label: 'Total', field: 'total', align: 'right', sortable: true },
    { name: 'acciones', label: 'Acciones', field: 'acciones', align: 'center' }
  ]

  const getStatusColor = (status) => {
    switch (status) {
      case 'PAGADA': return 'positive';
      case 'PENDIENTE': return 'orange-8';
      case 'CANCELADA': return 'negative';
      default: return 'grey';
    }
  }

  const formatMoney = (val) => Number(val).toLocaleString('en-US', { minimumFractionDigits: 2 })

  const cargarCompras = async () => {
    loading.value = true
    try {
      let params = {}
      const hoy = new Date()
      
      if (filtroFecha.value === 'hoy') {
        const d = date.formatDate(hoy, 'YYYY-MM-DD')
        params = { inicio: d, fin: d }
      } else if (filtroFecha.value === 'semana') {
        const tempDate = new Date(hoy)
        const day = tempDate.getDay()
        const diff = tempDate.getDate() - day + (day === 0 ? -6 : 1) // adjust when day is sunday
        const inicio = new Date(tempDate.setDate(diff))
        const fin = new Date(tempDate.setDate(inicio.getDate() + 6))
        params = { 
          inicio: date.formatDate(inicio, 'YYYY-MM-DD'), 
          fin: date.formatDate(fin, 'YYYY-MM-DD') 
        }
      } else if (filtroFecha.value === 'mes') {
        const inicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1)
        const fin = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0)
        params = { 
          inicio: date.formatDate(inicio, 'YYYY-MM-DD'), 
          fin: date.formatDate(fin, 'YYYY-MM-DD') 
        }
      } else if (filtroFecha.value === 'rango') {
        if (fechaRango.value) {
          if (typeof fechaRango.value === 'string') {
             params = { inicio: fechaRango.value, fin: fechaRango.value }
          } else {
             params = { inicio: fechaRango.value.from, fin: fechaRango.value.to }
          }
        }
      }

      // El interceptor enviará automáticamente X-Sucursal-Id
      const { data } = await api.get('/api/compras', { params })
      compras.value = data.data || data
    } catch (e) {
      $q.notify({ color: 'negative', message: 'Error al cargar compras' })
    } finally {
      loading.value = false
    }
  }

  const formatFechaFull = (fecha) => {
    if (!fecha) return '-'
    // date.formatDate(objetoFecha, mascara)
    return date.formatDate(fecha, 'DD/MM/YYYY, HH:mm:ss')
  }

  const descargarPDF = async (compra) => {
    descargandoId.value = compra.id
    try {
      const response = await api.get(`/api/compras/${compra.id}/pdf`, {
        responseType: 'blob' // Importante para archivos binarios
      })

      // Creamos un link temporal para forzar la descarga
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `Compra_${compra.folio}.pdf`)
      document.body.appendChild(link)
      link.click()

      // Limpieza
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      $q.notify({
        color: 'positive',
        message: 'PDF generado correctamente',
        icon: 'download'
      })
    } catch (error) {
      $q.notify({
        color: 'negative',
        message: 'Error al generar el PDF',
        icon: 'error'
      })
    } finally {
      descargandoId.value = null
    }
  }

  onMounted(cargarCompras)

</script>

<style lang="scss" scoped>
  .custom-focus .q-field__control {
    transition: all 0.3s ease;
  }
  .custom-focus.q-field--focused .q-field__control {
    background-color: rgba(142, 0, 0, 0.04) !important;
    border-color: $primary;
  }
  .main-table {
    background: white;
    :deep(thead th) {
      font-weight: bold;
      text-transform: uppercase;
      color: white;
      background: #263238;
      border-bottom: 2px solid $primary;
    }
  }
</style>
