<template>
  <q-page padding class="bg-grey-2">
    <div class="row items-center q-mb-md justify-between">
      <div class="row items-center">
        <div class="header-accent-box shadow-4 q-mr-md text-white">
          <q-icon name="inventory_2" size="2rem" />
        </div>
        <div>
          <div class="text-h5 text-bold text-grey-9" style="letter-spacing: -0.5px">Ventas por Producto</div>
          <div class="text-caption text-grey-7">Análisis de desplazamiento y rentabilidad por artículo.</div>
        </div>
      </div>
    </div>

    <!-- Filtros Gerenciales -->
    <q-card flat bordered class="q-mb-md rounded-borders-12 bg-white">
      <q-card-section>
        <div class="row q-col-gutter-md items-center">
          <div class="col-12 col-md-3">
            <q-input outlined dense v-model="filtros.inicio" type="date" label="Desde" />
          </div>
          <div class="col-12 col-md-3">
            <q-input outlined dense v-model="filtros.fin" type="date" label="Hasta" />
          </div>
          <div class="col-12 col-md-4" v-if="auth.isAdmin">
            <q-select outlined dense v-model="filtros.sucursal" :options="sucursales" option-label="nombre" label="Todas las Sucursales" clearable />
          </div>
          <div class="col-12 col-md-2 text-right">
            <q-btn unelevated color="primary" icon="search" label="Consultar" class="full-width rounded-borders-8" @click="cargarReporte" :loading="cargando" />
          </div>
        </div>
      </q-card-section>
    </q-card>

    <!-- Resumen KPIs -->
    <div class="row q-col-gutter-md q-mb-md">
      <div class="col-12 col-sm-6 col-md-3" v-for="kpi in kpiWidgets" :key="kpi.label">
        <q-card flat bordered class="kpi-card shadow-1" :class="kpi.border">
          <q-card-section class="q-pa-sm row items-center">
            <q-icon :name="kpi.icon" size="2rem" :class="kpi.color" class="q-mr-sm opacity-50" />
            <div>
              <div class="text-caption text-grey-7 text-bold uppercase letter-spacing-1 font-size-10">{{ kpi.label }}</div>
              <div class="text-h6 text-bold" :class="kpi.color">{{ kpi.value }}</div>
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- Gráficas (ApexCharts) -->
    <div class="row q-col-gutter-md q-mb-md" v-if="reporte.length > 0">
      <div class="col-12 col-md-6">
        <q-card flat bordered class="rounded-borders-12">
          <q-card-section class="text-bold text-grey-8 uppercase font-size-10">
            Top 10: Mayor Cantidad Vendida
          </q-card-section>
          <q-card-section>
            <apexchart type="bar" height="250" :options="chartOptionsCantidad" :series="chartSeriesCantidad"></apexchart>
          </q-card-section>
        </q-card>
      </div>
      <div class="col-12 col-md-6">
        <q-card flat bordered class="rounded-borders-12">
          <q-card-section class="text-bold text-grey-8 uppercase font-size-10">
            Top 10: Mayores Ingresos Generados
          </q-card-section>
          <q-card-section>
            <apexchart type="bar" height="250" :options="chartOptionsIngresos" :series="chartSeriesIngresos"></apexchart>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- Tabla Principal -->
    <q-card flat bordered class="premium-sales-table shadow-1">
      <q-table
        :rows="reporte"
        :columns="columns"
        row-key="id"
        flat
        :loading="cargando"
        :pagination="{ rowsPerPage: 15 }"
        rows-per-page-label="Registros por página:"
      >
        <template v-slot:top-right>
          <q-btn outline color="green-8" icon="file_download" label="Exportar Excel" class="q-mr-sm" @click="exportarExcel" />
          <q-btn outline color="red-8" icon="picture_as_pdf" label="Exportar PDF" @click="exportarPDFMasivo" />
        </template>
        
        <template v-slot:body="props">
          <q-tr :props="props" class="main-row">
            <q-td>
              <div class="text-bold" style="font-size: 11px">{{ props.row.codigo_barras }}</div>
            </q-td>
            <q-td>
              <div class="text-bold text-primary">{{ props.row.producto_nombre }}</div>
              <div class="text-caption text-grey-6">{{ props.row.categoria_nombre || 'Sin Categoría' }}</div>
            </q-td>
            <q-td class="text-center text-bold text-grey-9">
              {{ Number(props.row.total_vendido).toFixed(2) }}
            </q-td>
            <q-td class="text-right text-bold text-positive" style="font-size: 13px">
              ${{ Number(props.row.total_ingresos).toFixed(2) }}
            </q-td>
          </q-tr>
        </template>
      </q-table>
    </q-card>
  </q-page>
</template>

<script setup>
  import { ref, onMounted, computed } from 'vue'
  import { api } from 'src/boot/axios'
  import { useQuasar, date } from 'quasar'
  import { useAuthStore } from 'src/stores/auth'
  import * as XLSX from 'xlsx'

  const $q = useQuasar()
  const auth = useAuthStore()
  const reporte = ref([])
  const kpisRaw = ref({})
  const cargando = ref(false)
  const sucursales = ref([])
  const filtros = ref({
    inicio: date.formatDate(Date.now(), 'YYYY-MM-01'),
    fin: date.formatDate(Date.now(), 'YYYY-MM-DD'),
    sucursal: null
  })

  // Configuración Chart: Cantidad
  const chartSeriesCantidad = computed(() => {
    return [{
      name: 'Cant. Vendida',
      data: reporte.value.slice(0, 10).map(r => Number(r.total_vendido))
    }]
  })
  
  const chartOptionsCantidad = computed(() => {
    return {
      chart: { type: 'bar', toolbar: { show: false } },
      plotOptions: { bar: { horizontal: true, borderRadius: 4, dataLabels: { position: 'top' } } },
      colors: ['#0284c7'],
      dataLabels: { enabled: true, offsetX: 10, style: { fontSize: '10px', colors: ['#64748b'] } },
      xaxis: { categories: reporte.value.slice(0, 10).map(r => r.producto_nombre.substring(0,25) + '...') },
      tooltip: { theme: 'light' }
    }
  })

  // Configuración Chart: Ingresos (Ordenamos de nuevo por ingresos)
  const topIngresos = computed(() => {
    return [...reporte.value].sort((a, b) => b.total_ingresos - a.total_ingresos).slice(0, 10)
  })

  const chartSeriesIngresos = computed(() => {
    return [{
      name: 'Ingresos',
      data: topIngresos.value.map(r => Number(r.total_ingresos).toFixed(2))
    }]
  })

  const chartOptionsIngresos = computed(() => {
    return {
      chart: { type: 'bar', toolbar: { show: false } },
      plotOptions: { bar: { horizontal: true, borderRadius: 4, dataLabels: { position: 'top' } } },
      colors: ['#059669'],
      dataLabels: { enabled: true, offsetX: 15, style: { fontSize: '10px', colors: ['#64748b'] }, formatter: function (val) { return "$" + val } },
      xaxis: { categories: topIngresos.value.map(r => r.producto_nombre.substring(0,25) + '...'), labels: { formatter: function (val) { return "$" + val } } },
      tooltip: { theme: 'light' }
    }
  })

  const kpiWidgets = computed(() => [
    {
      label: 'Productos Únicos',
      value: kpisRaw.value?.productos_distintos || 0,
      color: 'text-purple',
      icon: 'category',
      border: 'border-purple-left'
    },
    {
      label: 'Artículos Vendidos',
      value: Number(kpisRaw.value?.cantidad_total || 0).toFixed(2),
      color: 'text-primary',
      icon: 'production_quantity_limits',
      border: 'border-primary-left'
    },
    {
      label: 'Ingresos Totales',
      value: `$${Number(kpisRaw.value?.ingresos_totales || 0).toFixed(2)}`,
      color: 'text-positive',
      icon: 'monetization_on',
      border: 'border-green-left'
    },
    {
      label: 'Producto Estrella',
      value: (kpisRaw.value?.producto_estrella || 'N/A').substring(0, 15),
      color: 'text-grey-9',
      icon: 'star',
      border: 'border-grey-left'
    }
  ])

  const columns = [
    { name: 'codigo', label: 'CÓDIGO/SKU', align: 'left', sortable: true },
    { name: 'producto', label: 'PRODUCTO / CATEGORÍA', align: 'left', sortable: true },
    { name: 'cantidad', label: 'CANTIDAD VENDIDA', align: 'center', sortable: true, sort: (a, b, rowA, rowB) => rowA.total_vendido - rowB.total_vendido },
    { name: 'ingresos', label: 'TOTAL INGRESOS', align: 'right', sortable: true, sort: (a, b, rowA, rowB) => rowA.total_ingresos - rowB.total_ingresos }
  ]

  const cargarReporte = async () => {
    cargando.value = true
    try {
      const params = {
        fecha_inicio: filtros.value.inicio,
        fecha_fin: filtros.value.fin,
        sucursal_id: filtros.value.sucursal?.id
      }
      const { data } = await api.get('/api/reportes/ventas-por-producto', { params })
      reporte.value = data.reporte
      kpisRaw.value = data.kpis
    } finally { cargando.value = false }
  }

  const exportarExcel = () => {
    const dataExport = reporte.value.map(r => ({
      Codigo_Barras: r.codigo_barras,
      Producto: r.producto_nombre,
      Categoria: r.categoria_nombre || 'Sin Categoría',
      Cantidad_Vendida: Number(r.total_vendido),
      Ingresos_Totales: Number(r.total_ingresos)
    }))
    
    const ws = XLSX.utils.json_to_sheet(dataExport)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Ventas_Por_Producto")
    XLSX.writeFile(wb, `Reporte_Ventas_Productos_${filtros.value.inicio}_${filtros.value.fin}.xlsx`)
  }

  const exportarPDFMasivo = async () => {
    try {
      $q.loading.show({ message: 'Generando Reporte PDF...' })
      const params = {
        fecha_inicio: filtros.value.inicio,
        fecha_fin: filtros.value.fin,
        sucursal_id: filtros.value.sucursal?.id
      }
      const response = await api.get('/api/reportes/ventas-por-producto/pdf', {
        params,
        responseType: 'blob'
      })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `Ventas_Productos_${filtros.value.inicio}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (e) {
      $q.notify({ type: 'negative', message: 'No hay datos para generar el PDF' })
    } finally {
      $q.loading.hide()
    }
  }

  onMounted(() => {
    cargarReporte()
    if (auth.isAdmin) api.get('/api/sucursales').then(r => sucursales.value = r.data)
  })
</script>

<style lang="scss" scoped>
  .header-accent-box {
    background: linear-gradient(135deg, var(--q-primary) 0%, #00838f 100%);
    padding: 12px; border-radius: 12px;
  }
  .kpi-card { border-radius: 12px; background: white; }
  .border-primary-left { border-left: 5px solid var(--q-primary); }
  .border-red-left { border-left: 5px solid #d32f2f; }
  .border-green-left { border-left: 5px solid #2e7d32; }
  .border-purple-left { border-left: 5px solid #8b5cf6; }
  .border-grey-left { border-left: 5px solid #757575; }

  .premium-sales-table {
    border-radius: 16px;
    :deep(thead tr th) {
      background-color: #f8fafc; color: #64748b; font-weight: 800;
    }
  }
  .font-size-10 { font-size: 10px; }
  .letter-spacing-1 { letter-spacing: 1px; }
</style>
