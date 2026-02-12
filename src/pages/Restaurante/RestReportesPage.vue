<template>
  <div class="q-pa-md">

    <div class="row items-center justify-end q-mb-lg q-gutter-sm">
      <div class="text-subtitle1 text-grey-7 q-mr-md">Período de Análisis:</div>

      <q-btn-group unelevated class="shadow-1">
        <q-btn
          :color="filtroRapido === 'hoy' ? 'primary' : 'white'"
          :text-color="filtroRapido === 'hoy' ? 'white' : 'grey-8'"
          label="Hoy"
          @click="setFiltro('hoy')"
        />
        <q-btn
          :color="filtroRapido === 'semana' ? 'primary' : 'white'"
          :text-color="filtroRapido === 'semana' ? 'white' : 'grey-8'"
          label="Esta Semana"
          @click="setFiltro('semana')"
        />
        <q-btn
          :color="filtroRapido === 'mes' ? 'primary' : 'white'"
          :text-color="filtroRapido === 'mes' ? 'white' : 'grey-8'"
          label="Este Mes"
          @click="setFiltro('mes')"
        />
      </q-btn-group>

      <q-input dense outlined v-model="fechaDisplay" readonly class="bg-white" style="width: 220px">
        <template v-slot:append>
          <q-icon name="event" class="cursor-pointer" color="primary">
            <q-popup-proxy cover transition-show="scale" transition-hide="scale">
              <q-date v-model="rangoFechas" range mask="YYYY-MM-DD">
                <div class="row items-center justify-end">
                  <q-btn v-close-popup label="Aplicar" color="primary" flat @click="cargarDatos" />
                </div>
              </q-date>
            </q-popup-proxy>
          </q-icon>
        </template>
      </q-input>
    </div>

    <div v-if="loading" class="row justify-center q-py-xl">
      <q-spinner-dots color="primary" size="4em" />
    </div>

    <div v-else class="animate-fade">

      <div class="row q-col-gutter-md q-mb-lg">

        <div class="col-12 col-md-4">
          <q-card class="kpi-card bg-white text-dark shadow-2 border-left-primary">
            <q-card-section class="row items-center">
              <div class="col">
                <div class="text-caption text-grey text-uppercase text-bold">Ventas Totales</div>
                <div class="text-h4 text-primary text-bold">$ {{ formatMoney(data.kpis.ventas) }}</div>
              </div>
              <div class="col-auto">
                <q-avatar color="primary" text-color="white" icon="attach_money" size="lg" />
              </div>
            </q-card-section>
          </q-card>
        </div>

        <div class="col-12 col-md-4">
          <q-card class="kpi-card bg-white text-dark shadow-2 border-left-warning">
            <q-card-section class="row items-center">
              <div class="col">
                <div class="text-caption text-grey text-uppercase text-bold">Órdenes Cerradas</div>
                <div class="text-h4 text-orange-9 text-bold">{{ data.kpis.ordenes }}</div>
              </div>
              <div class="col-auto">
                <q-avatar color="orange-1" text-color="orange-9" icon="receipt_long" size="lg" />
              </div>
            </q-card-section>
          </q-card>
        </div>

        <div class="col-12 col-md-4">
          <q-card class="kpi-card bg-white text-dark shadow-2 border-left-positive">
            <q-card-section class="row items-center">
              <div class="col">
                <div class="text-caption text-grey text-uppercase text-bold">Ticket Promedio</div>
                <div class="text-h4 text-green-8 text-bold">$ {{ formatMoney(data.kpis.ticket_promedio) }}</div>
              </div>
              <div class="col-auto">
                <q-avatar color="green-1" text-color="green-8" icon="trending_up" size="lg" />
              </div>
            </q-card-section>
          </q-card>
        </div>
      </div>

      <div class="row q-col-gutter-lg">

        <div class="col-12 col-md-7">
          <q-card class="shadow-2 rounded-borders">
            <q-card-section>
              <div class="text-h6 text-primary">🏆 Productos Más Vendidos</div>
              <div class="text-caption text-grey">Ranking por volumen de ventas</div>
            </q-card-section>

            <q-list separator>
              <q-item v-for="(prod, index) in data.productos" :key="index" class="q-py-md">
                <q-item-section avatar>
                  <q-avatar color="grey-2" text-color="primary" font-size="16px">#{{ index + 1 }}</q-avatar>
                </q-item-section>

                <q-item-section>
                  <div class="row justify-between items-center q-mb-xs">
                    <span class="text-bold">{{ prod.nombre }}</span>
                    <span class="text-grey-8">{{ prod.cantidad_vendida }} unids.</span>
                  </div>
                  <q-linear-progress
                    :value="calcularPorcentaje(prod.cantidad_vendida)"
                    size="10px"
                    color="primary"
                    class="rounded-borders"
                    track-color="grey-2"
                  />
                  <div class="text-caption text-grey q-mt-xs">Generó: $ {{ formatMoney(prod.total_generado) }}</div>
                </q-item-section>
              </q-item>

              <div v-if="data.productos.length === 0" class="text-center q-pa-lg text-grey">
                No hay datos de ventas en este período.
              </div>
            </q-list>
          </q-card>
        </div>

        <div class="col-12 col-md-5">
          <q-card class="shadow-2 rounded-borders full-height">
            <q-card-section>
              <div class="text-h6 text-primary">👥 Rendimiento de Personal</div>
              <div class="text-caption text-grey">Meseros con mayor facturación</div>
            </q-card-section>

            <q-list>
              <q-item v-for="user in data.meseros" :key="user.mesero_id" class="q-my-sm">
                <q-item-section avatar>
                  <q-avatar size="md" color="primary" text-color="white">
                     {{ user.mesero?.name?.charAt(0) || 'U' }}
                  </q-avatar>
                </q-item-section>

                <q-item-section>
                  <q-item-label class="text-bold">{{ user.mesero?.name || 'Usuario ' + user.mesero_id }}</q-item-label>
                  <q-item-label caption>{{ user.total_ordenes }} órdenes atendidas</q-item-label>
                </q-item-section>

                <q-item-section side>
                  <q-badge color="green-1" text-color="green-9" class="q-pa-sm text-subtitle2">
                    $ {{ formatMoney(user.total_dinero) }}
                  </q-badge>
                </q-item-section>
              </q-item>

               <div v-if="data.meseros.length === 0" class="text-center q-pa-lg text-grey">
                Sin actividad de meseros.
              </div>
            </q-list>
          </q-card>
        </div>

      </div>
      <div class="row q-mt-xl">
  <div class="col-12">
    <div class="text-h6 text-primary q-mb-md flex items-center">
      <q-icon name="receipt_long" class="q-mr-sm" /> Transacciones Detalladas
    </div>

    <q-card class="shadow-2 rounded-borders overflow-hidden border-top-primary">

      <q-card-section class="bg-grey-1 row items-center q-py-sm">
        <div class="text-subtitle2 text-grey-7">Historial de Órdenes</div>
        <q-space />
        <q-input
          dense borderless v-model="filterTabla"
          placeholder="Buscar..." class="bg-white q-px-md rounded-borders shadow-1"
          style="width: 250px"
        >
          <template v-slot:prepend><q-icon name="search" class="text-primary" /></template>
        </q-input>
      </q-card-section>

      <q-table
        flat
        :rows="data.ordenes"
        :columns="columnasOrdenes"
        row-key="id"
        :filter="filterTabla"
        :pagination="{ rowsPerPage: 10 }"
        class="premium-table"
      >
        <template v-slot:body-cell-codigo="props">
          <q-td :props="props">
            <div class="row items-center">
              <q-icon name="tag" color="grey-5" size="xs" class="q-mr-xs" />
              <span class="text-weight-bold text-grey-9 font-mono">
                {{ props.row.codigo_cobro || props.row.id }}
              </span>
            </div>
          </q-td>
        </template>

        <template v-slot:body-cell-fecha="props">
          <q-td :props="props">
            <div class="text-weight-medium text-dark">{{ formatDate(props.row.updated_at, 'DD MMM YYYY') }}</div>
            <div class="text-caption text-grey-6">{{ formatDate(props.row.updated_at, 'HH:mm A') }}</div>
          </q-td>
        </template>

        <template v-slot:body-cell-mesa="props">
          <q-td :props="props">
            <q-chip
              dense
              :color="props.row.mesa ? 'indigo-1' : 'orange-1'"
              :text-color="props.row.mesa ? 'indigo-9' : 'deep-orange-9'"
              class="text-weight-bold"
            >
              <q-avatar :icon="props.row.mesa ? 'table_bar' : 'takeout_dining'" :color="props.row.mesa ? 'indigo-9' : 'deep-orange-9'" text-color="white" />
              {{ props.row.mesa ? props.row.mesa.nombre : 'Para Llevar' }}
            </q-chip>
          </q-td>
        </template>

        <template v-slot:body-cell-mesero="props">
          <q-td :props="props">
            <div class="row items-center">
              <q-avatar size="28px" color="primary" text-color="white" class="q-mr-sm shadow-1">
                {{ props.row.mesero?.name?.charAt(0) || '?' }}
              </q-avatar>
              <span class="text-grey-9">{{ props.row.mesero?.name || 'Sin Mesero' }}</span>
            </div>
          </q-td>
        </template>

        <template v-slot:body-cell-estatus="props">
          <q-td :props="props" align="center">
            <q-badge
              rounded
              class="q-py-xs q-px-sm shadow-1"
              :color="props.row.estatus === 'Cobrada' ? 'positive' : 'blue-grey'"
              :label="props.row.estatus"
            />
          </q-td>
        </template>

        <template v-slot:body-cell-total="props">
          <q-td :props="props" align="right">
            <div class="text-h6 text-green-9 text-weight-bold">
              $ {{ formatMoney(props.row.total) }}
            </div>
          </q-td>
        </template>

        <template v-slot:body-cell-acciones="props">
          <q-td :props="props" align="right">
            <q-btn flat round color="primary" icon="visibility" @click="verDetalles(props.row)">
              <q-tooltip>Ver Ticket</q-tooltip>
            </q-btn>
          </q-td>
        </template>
      </q-table>
    </q-card>
  </div>
</div>

<q-dialog v-model="showDialogDetalle" transition-show="scale" transition-hide="scale">
  <q-card style="width: 450px; max-width: 90vw;" class="rounded-borders overflow-hidden">

    <q-card-section class="bg-primary text-white q-py-md">
      <div class="row items-center">
        <div class="col">
          <div class="text-caption opacity-80">Folio de Orden</div>
          <div class="text-h5 text-weight-bold">{{ ordenSeleccionada?.codigo_cobro || 'ID-' + ordenSeleccionada?.id }}</div>
        </div>
        <div class="col-auto">
          <q-chip color="white" text-color="primary" icon="event" dense>
            {{ formatDate(ordenSeleccionada?.updated_at, 'DD/MM/YYYY HH:mm') }}
          </q-chip>
        </div>
      </div>
    </q-card-section>

    <q-card-section class="q-pa-none scroll" style="max-height: 50vh;">
      <q-list separator>
        <q-item v-for="det in ordenSeleccionada?.detalles" :key="det.id" class="q-py-md">
          <q-item-section avatar>
            <q-avatar color="grey-2" text-color="primary" size="md" font-size="14px" class="text-weight-bold">
              {{ parseFloat(det.cantidad) }}x
            </q-avatar>
          </q-item-section>

          <q-item-section>
            <q-item-label class="text-weight-bold text-grey-9">{{ det.producto?.nombre || 'Producto Eliminado' }}</q-item-label>
            <q-item-label caption v-if="det.notas" class="text-orange-9 bg-orange-1 q-px-xs rounded-borders inline-block q-mt-xs">
              <q-icon name="sticky_note_2" size="xs"/> {{ det.notas }}
            </q-item-label>
            <q-item-label caption v-else class="text-purple">
               $ {{ formatMoney(det.precio) }} c/u
            </q-item-label>
          </q-item-section>

          <q-item-section side>
            <span class="text-weight-bold text-dark">$ {{ formatMoney(det.cantidad * det.precio) }}</span>
          </q-item-section>
        </q-item>
      </q-list>
    </q-card-section>

    <q-separator />

    <q-card-section class="bg-grey-1">
      <div class="row justify-between items-center q-mb-sm text-grey-7">
        <span>Artículos:</span>
        <span>{{ ordenSeleccionada?.detalles?.length || 0 }}</span>
      </div>
      <div class="row justify-between items-center">
        <span class="text-h6 text-grey-9 text-weight-bold">TOTAL PAGADO</span>
        <span class="text-h4 text-primary text-weight-bold">$ {{ formatMoney(ordenSeleccionada?.total) }}</span>
      </div>
    </q-card-section>

    <q-card-actions align="right">
      <q-btn flat label="Cerrar" color="grey-8" v-close-popup />
      <q-btn label="Reimprimir Ticket" icon="print" color="primary" unelevated @click="reimprimirTicket" />
    </q-card-actions>

  </q-card>
</q-dialog>
    </div>
  </div>
</template>

<script setup>
  import { ref, onMounted, computed, watch } from 'vue'
  import { api } from 'src/boot/axios'
  import { date } from 'quasar'

  const loading = ref(false)
  const filtroRapido = ref('hoy')
  const rangoFechas = ref({ from: date.formatDate(Date.now(), 'YYYY-MM-DD'), to: date.formatDate(Date.now(), 'YYYY-MM-DD') })

  const showDialogDetalle = ref(false)
  const ordenSeleccionada = ref(null)

  // Estructura inicial de datos
  const data = ref({
    kpis: { ventas: 0, ordenes: 0, ticket_promedio: 0 },
    meseros: [],
    productos: [],
    ordenes: []
  })

  // Tabla de órdenes
  const filterTabla = ref('')

  const columnasOrdenes = [
    { name: 'codigo', label: 'FOLIO', field: row => row.codigo_cobro || row.id, align: 'left', sortable: true },
    { name: 'fecha', label: 'FECHA', field: 'updated_at', align: 'left', sortable: true },
    { name: 'mesa', label: 'UBICACIÓN', field: 'mesa', align: 'left', sortable: true },
    { name: 'mesero', label: 'ATENDIÓ', field: row => row.mesero?.name, align: 'left', sortable: true },
    { name: 'estatus', label: 'ESTADO', field: 'estatus', align: 'center', sortable: true },
    { name: 'total', label: 'TOTAL', field: 'total', align: 'right', sortable: true },
    { name: 'acciones', label: '', align: 'right' } // Columna invisible para el botón
  ]

  const formatDate = (fecha, formato) => date.formatDate(fecha, formato)

  const verDetalles = (row) => {
    ordenSeleccionada.value = row
    showDialogDetalle.value = true
  }

  const reimprimirTicket = () => {
      // Aquí puedes llamar a tu endpoint de impresión si lo necesitas
      $q.notify({ message: 'Enviando a impresora...', color: 'positive', icon: 'print' })
  }


  // Texto visual del input de fecha
  const fechaDisplay = computed(() => {
    if (typeof rangoFechas.value === 'string') return rangoFechas.value // Un solo día
    return `${rangoFechas.value.from} al ${rangoFechas.value.to}`
  })

  const cargarDatos = async () => {
    loading.value = true
    try {
      let from, to;

      // Quasar date range puede ser un string (un dia) o objeto (rango)
      if (typeof rangoFechas.value === 'string') {
          from = rangoFechas.value
          to = rangoFechas.value
      } else {
          from = rangoFechas.value.from
          to = rangoFechas.value.to
      }

      // Añadir horas para cubrir todo el día
      const params = {
        desde: `${from} 00:00:00`,
        hasta: `${to} 23:59:59`
      }

      const res = await api.get('/api/restaurante/admin/reportes', { params })
      data.value = res.data

    } catch (e) {
      console.error(e)
    } finally {
      loading.value = false
    }
  }

  // Helpers
  const formatMoney = (val) => parseFloat(val).toFixed(2)

  const calcularPorcentaje = (cantidad) => {
    if (data.value.productos.length === 0) return 0
    const max = data.value.productos[0].cantidad_vendida // El primero es el mayor
    return max > 0 ? cantidad / max : 0
  }

  const setFiltro = (tipo) => {
    filtroRapido.value = tipo
    const hoy = new Date()

    if (tipo === 'hoy') {
      const str = date.formatDate(hoy, 'YYYY-MM-DD')
      rangoFechas.value = { from: str, to: str }
    }
    else if (tipo === 'semana') {
      // Semana actual (Lunes a Domingo)
      const lunes = date.subtractFromDate(hoy, { days: hoy.getDay() - 1 }) // Ajustar lógica según inicio semana
      rangoFechas.value = {
          from: date.formatDate(lunes, 'YYYY-MM-DD'),
          to: date.formatDate(hoy, 'YYYY-MM-DD')
      }
    }
    else if (tipo === 'mes') {
      const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1)
      rangoFechas.value = {
          from: date.formatDate(inicioMes, 'YYYY-MM-DD'),
          to: date.formatDate(hoy, 'YYYY-MM-DD')
      }
    }

    cargarDatos()
  }

  onMounted(() => {
    setFiltro('hoy') // Cargar hoy por defecto
  })
</script>

<style scoped>
  .kpi-card {
    border-radius: 12px;
    height: 100%;
    transition: transform 0.2s;
  }
  .kpi-card:hover {
    transform: translateY(-3px);
  }

  /* Bordes de color a la izquierda para identificar */
  .border-left-primary { border-left: 5px solid #1976D2; }
  .border-left-warning { border-left: 5px solid #F57C00; }
  .border-left-positive { border-left: 5px solid #21BA45; }

  .animate-fade {
    animation: fadeIn 0.5s ease-out;
  }
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .premium-table :deep(thead tr:first-child th) {
    background-color: #f8f9fa;
    font-weight: bold;
    color: #546e7a;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .border-top-primary {
    border-top: 4px solid #1976D2; /* Ajusta a tu color primario */
  }

  .bg-gradient-primary {
    background: linear-gradient(135deg, #1976D2 0%, #0D47A1 100%);
  }

  .font-mono {
    font-family: 'Roboto Mono', monospace;
    letter-spacing: -0.5px;
  }

  .opacity-80 {
    opacity: 0.8;
  }

</style>
