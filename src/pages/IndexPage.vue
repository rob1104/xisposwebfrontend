<template>
  <q-page class="q-pa-lg bg-grey-3">
    <div class="row items-center q-mb-xl">
      <div class="col-12 col-md-6">
        <div class="text-h4 text-bold text-grey-9">Panel de Inicio</div>
        <div v-if="auth.roles[0] !== 'Cajero'" class="text-subtitle1 text-grey-7">Resumen de inventario y operaciones.</div>
      </div>
      <q-space />
      <div class="col-12 col-md-3">
        <q-select
          v-if="auth.roles[0] !== 'Cajero'"
          v-model="sucursalFiltro"
          :options="auth.sucursales"
          option-label="nombre"
          outlined dense bg-color="white"
          label="Filtrar por Sucursal"
          class="shadow-2 border-radius-10"
        >
          <template v-slot:prepend><q-icon name="storefront" color="primary" /></template>
        </q-select>
      </div>
    </div>

    <div v-if="auth.roles[0] !== 'Cajero'" class="row q-col-gutter-lg q-mb-lg">
      <div class="col-12 col-sm-6 col-md-3" v-for="kpi in kpis" :key="kpi.title">
        <q-card class="shadow-5 border-radius-15 kpi-card clickable" v-ripple>
          <q-card-section class="row items-center no-wrap">
            <q-avatar :icon="kpi.icon" :color="kpi.color" text-color="white" size="lg" shadow-2 />
            <div class="q-ml-md">
              <div class="text-caption text-grey-7 text-bold text-uppercase">{{ kpi.title }}</div>
              <div class="text-h5 text-bold">{{ kpi.value }}</div>
            </div>
          </q-card-section>
          <q-linear-progress :value="kpi.progress" :color="kpi.color" class="q-mt-none" />
        </q-card>
      </div>
    </div>

    <div v-if="auth.roles[0] !== 'Cajero'" class="row q-col-gutter-lg q-mb-lg">
      <div class="col-12 col-lg-8">
        <q-card class="shadow-5 border-radius-15 full-height">
          <q-card-section class="row items-center q-pb-none">
            <div class="text-h6 text-bold text-grey-8">Flujo de Inventario (Últimos 7 días)</div>
            <q-space />
            <q-btn flat round icon="more_vert" color="grey-7" />
          </q-card-section>
          <q-card-section>
            <apexchart height="300" type="area" :options="chartOptions" :series="chartSeries" />
          </q-card-section>
        </q-card>
      </div>

      <div v-if="auth.roles[0] !== 'Cajero'" class="col-12 col-lg-4">
        <q-card class="shadow-5 border-radius-15 full-height bg-white">
          <q-card-section class="bg-red-8 text-white row items-center">
            <q-icon name="warning" size="sm" class="q-mr-sm" />
            <div class="text-h6 text-bold">Stock Crítico</div>
          </q-card-section>
          <q-card-section class="q-pa-none">
            <q-list separator>
              <q-item v-for="item in criticalStock" :key="item.id" class="q-py-md">
                <q-item-section avatar>
                  <q-avatar rounded color="red-1" text-color="red-9" icon="priority_high" />
                </q-item-section>

                <q-item-section>
                  <q-item-label class="text-bold">{{ item.producto?.nombre }}</q-item-label>
                  <q-item-label caption>Sucursal: {{ item.sucursal?.nombre }}</q-item-label>
                </q-item-section>

                <q-item-section side>
                  <q-badge color="red-9" :label="`${item.stock_actual} unid.`" />
                </q-item-section>
              </q-item>
            </q-list>
          </q-card-section>
          <q-card-actions align="center">
            <q-btn flat color="red-9" label="Ver Reporte Completo" icon-right="arrow_forward" />
          </q-card-actions>
        </q-card>
      </div>



    </div>

    <div v-if="auth.roles[0] !== 'Cajero'" class="row q-col-gutter-lg">
      <div class="col-12 col-md-12">
        <q-card class="shadow-5 border-radius-15">
          <q-card-section class="row items-center">
            <div class="text-h6 text-bold text-grey-8">Actividad Reciente</div>
            <q-space />
            <q-badge outline color="primary" label="Global" />
          </q-card-section>
          <q-card-section class="q-pa-none">
            <q-table
              :rows="recentMovements"
              :columns="columns"
              flat
              dense
              hide-pagination
            >
              <template v-slot:body-cell-tipo="props">
                <q-td :props="props">
                  <q-chip dense :color="props.value === 'ENTRADA' ? 'positive' : 'negative'" text-color="white" size="sm">
                    {{ props.value }}
                  </q-chip>
                </q-td>
              </template>
            </q-table>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <div class="row q-col-gutter-lg">
       <TurnoHistorial :sucursalId="sucursalFiltro" />
    </div>
  </q-page>
</template>

<script setup>
  import { ref, onMounted, watch } from 'vue'
  import { api } from 'boot/axios'
  import { useAuthStore } from 'stores/auth'
  import TurnoHistorial from 'src/components/Pos/TurnoHistorial.vue'
  import VueApexCharts from 'vue3-apexcharts'

  const auth = useAuthStore()
  const apexchart = VueApexCharts
  const loading = ref(true)
  const sucursalFiltro = ref(auth.sucursalSeleccionada?.id)

  // Refs para datos reales
  const kpis = ref([])
  const criticalStock = ref([])
  const recentMovements = ref([])
  const chartSeries = ref([])
  const chartOptions = ref({
    chart: { toolbar: { show: false }, fontFamily: 'inherit' },
    stroke: { curve: 'smooth', width: 3 },
    xaxis: { categories: [] },
    colors: ['#1976D2', '#F44336'], // Azul entradas, Rojo salidas
    fill: { type: 'gradient', gradient: { opacityFrom: 0.4, opacityTo: 0.1 } }
  })

  const columns = [
  {
    name: 'fecha',
    label: 'Fecha',
    field: row => row.created_at ? row.created_at.substring(0, 10) : '',
    align: 'left'
  },
  {
    name: 'producto',
    label: 'Producto',
    field: row => row.producto?.nombre || 'N/A',
    align: 'left'
  },
  {
    name: 'tipo',
    label: 'Tipo',
    field: 'tipo_movimiento',
    align: 'center'
  },
  {
    name: 'cantidad',
    label: 'Cant.',
    field: 'cantidad',
    align: 'right'
  }
]

  const fetchDashboardData = async () => {
    loading.value = true
    try {
      const { data } = await api.get('/api/dashboard/summary', {
        params: { sucursal_id: sucursalFiltro.value }
      })

      kpis.value = data.kpis
      criticalStock.value = data.criticos
      recentMovements.value = data.recientes

      // Actualizar Gráfica
      chartSeries.value = [
        { name: 'Entradas', data: data.chart.entradas },
        { name: 'Salidas', data: data.chart.salidas }
      ]
      chartOptions.value = {
        ...chartOptions.value,
        xaxis: { categories: data.chart.categories }
      }

    } catch (e) {
      console.error("Error cargando dashboard", e)
    } finally {
      loading.value = false
    }
  }

  // Recargar cuando cambie el filtro de sucursal
  watch(sucursalFiltro, () => fetchDashboardData())

  onMounted(() => {
    fetchDashboardData()
  })
</script>

<style lang="scss" scoped>
  .border-radius-15 { border-radius: 15px; }
  .border-radius-10 { border-radius: 10px; }
  .kpi-card {
    transition: all 0.3s ease;
    &:hover {
      transform: translateY(-5px);
      box-shadow: 0 10px 20px rgba(0,0,0,0.15) !important;
    }
  }
  .opacity-70 { opacity: 0.7; }
</style>
