<template>
  <q-page class="bg-grey-1 q-pa-lg">
    <div class="row items-center justify-between q-mb-xl">
      <div class="row items-center">
        <div class="header-accent-box q-mr-md shadow-2">
          <q-icon name="analytics" color="white" size="md" />
        </div>
        <div>
          <div class="text-h5 text-bold text-grey-9 tracking-tight">Reporte Detallado de Ventas</div>
          <div class="text-caption text-primary text-bold text-uppercase letter-spacing-1">Analisis de datos</div>
        </div>
      </div>

      <div class="row q-gutter-sm bg-white q-pa-sm shadow-1 rounded-borders border-light">
        <q-input dense borderless v-model="filtros.inicio" type="date" label="Desde" class="q-px-sm" />
        <q-separator vertical inset />
        <q-input dense borderless v-model="filtros.fin" type="date" label="Hasta" class="q-px-sm" />
        <q-select
          v-if="auth.isAdmin"
          v-model="filtros.sucursal"
          :options="sucursales"
          option-label="nombre"
          option-value="id"
          label="Sucursal"
          dense borderless style="width: 180px" class="q-px-sm"
        />
        <q-btn color="primary" icon="search" label="Consultar" unelevated class="q-px-md" @click="cargarReporte" :loading="cargando" />
      </div>
    </div>

    <div class="row q-col-gutter-md q-mb-lg">
      <div class="col-12 col-md-3" v-for="kpi in kpis" :key="kpi.label">
        <q-card class="kpi-card shadow-1 no-border" :class="kpi.border">
          <q-card-section>
            <div class="text-overline text-grey-7">{{ kpi.label }}</div>
            <div class="text-h4 text-bold" :class="kpi.color">{{ kpi.value }}</div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <q-card class="admin-main-card no-border shadow-2">
      <q-table
        :rows="ventas"
        :columns="columns"
        row-key="id"
        flat
        class="premium-sales-table"
        :pagination="{ rowsPerPage: 15 }"
      >
      <template v-slot:header="props">
    <q-tr :props="props" class="bg-grey-2">
      <q-th auto-width />
      <q-th
        v-for="col in props.cols"
        :key="col.name"
        :props="props"
        class="text-bold text-grey-8"
        style="font-size: 0.85rem;"
      >
        {{ col.label }}
      </q-th>
    </q-tr>
  </template>
        <template v-slot:top-right>
          <q-btn outline color="green-8" icon="file_download" label="Exportar Excel" class="q-mr-sm" @click="exportarExcel" />
          <q-btn outline color="red-8" icon="picture_as_pdf" label="PDF" @click="exportarPDFMasivo" />
        </template>


        <template v-slot:body="props">
          <q-tr :props="props" class="main-row">
            <q-td auto-width>
              <q-btn size="sm" color="primary" round flat :icon="props.expand ? 'remove' : 'add'" @click="props.expand = !props.expand" />
            </q-td>
            <q-td class="text-bold text-primary">{{ props.row.folio }}</q-td>
            <q-td><div class="column">
              <div class="text-bold text-grey-9" style="font-size: 0.85rem;">
                {{ formatOnlyDate(props.row.created_at) }}
              </div>

              <div class="text-caption text-grey-6 text-italic">
                <q-icon name="access_time" size="10px" class="q-mr-xs" />
                {{ formatOnlyTime(props.row.created_at) }}
              </div>
            </div>
          </q-td>
            <q-td>{{ props.row.sucursal?.nombre }}</q-td>
            <q-td>{{ props.row.cliente?.nombre_comercial || 'Público En General' }}</q-td>
            <q-td class="text-right text-bold text-grey-9">${{ Number(props.row.total).toFixed(2) }}</q-td>
          </q-tr>

          <q-tr v-show="props.expand" :props="props" class="bg-blue-grey-1 expansion-row">
            <q-td colspan="100%">
              <div class="row q-col-gutter-md q-pa-md">
                <div class="col-12 col-md-8">
                  <div class="text-bold text-grey-8 q-mb-sm uppercase font-size-10">Desglose de Productos</div>
                  <q-markup-table flat bordered dense class="rounded-borders bg-white">
                    <thead class="bg-grey-2">
                      <tr><th class="text-center">Cant.</th><th class="text-left">Producto</th><th class="text-right">Precio</th><th class="text-right">Impuesto</th><th class="text-right">Total</th></tr>
                    </thead>
                    <tbody>
                      <tr v-for="det in props.row.detalles" :key="det.id">
                        <td class="text-center">{{ det.cantidad }}</td>
                        <td>{{ det.producto?.nombre }}</td>
                        <td class="text-right">${{ Number(det.precio_unitario).toFixed(2) }}</td>
                        <td class="text-right text-grey-6">${{ Number(det.impuesto_unitario).toFixed(2) }}</td>
                        <td class="text-right text-bold">${{ Number(det.total).toFixed(2) }}</td>
                      </tr>
                    </tbody>
                  </q-markup-table>
                </div>
                <div class="col-12 col-md-4">
                  <div class="text-bold text-grey-8 q-mb-sm uppercase font-size-10">Flujo de Caja (Pagos)</div>
                  <q-list bordered separator class="bg-white rounded-borders">
                    <q-item v-for="pago in props.row.pagos" :key="pago.id">
                      <q-item-section>
                        <q-item-label class="text-bold">{{ pago.metodo_pago }}</q-item-label>
                        <q-item-label caption v-if="pago.referencia_pago">Ref: {{ pago.referencia_pago }}</q-item-label>
                      </q-item-section>
                      <q-item-section side class="text-bold text-green-9">
                        ${{ Number(pago.monto).toFixed(2) }}
                      </q-item-section>
                    </q-item>
                  </q-list>
                </div>
              </div>
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
  import { useQuasar, date, exportFile } from 'quasar'
  import { useAuthStore } from 'src/stores/auth'
  import * as XLSX from 'xlsx'

  const $q = useQuasar()
  const auth = useAuthStore()
  const ventas = ref([])
  const resumen = ref({ total: 0, taxes: 0, conteo: 0, subtotal: 0 })
  const cargando = ref(false)
  const sucursales = ref([])
  const filtros = ref({
    inicio: date.formatDate(Date.now(), 'YYYY-MM-01'),
    fin: date.formatDate(Date.now(), 'YYYY-MM-DD'),
    sucursal: null
  })

  const formatOnlyDate = (val) => date.formatDate(val, 'DD [de] MMMM, YYYY')
  const formatOnlyTime = (val) => date.formatDate(val, 'hh:mm A')

  // KPIs Gerenciales basados en precisión decimal(14,6)
  const kpis = computed(() => [
  {
    label: 'Total Ventas',
    // Usamos el operador ?. y un fallback de 0 para evitar el error de toFixed
    value: `$${(resumen.value?.total_bruto || 0).toFixed(2)}`,
    color: 'text-primary',
    border: 'border-primary-left'
  },
  {
    label: 'IVA / Impuestos',
    value: `$${(resumen.value?.total_impuestos || 0).toFixed(2)}`,
    color: 'text-negative',
    border: 'border-red-left'
  },
  {
    label: 'Subtotal',
    value: `$${(resumen.value?.total_subtotal || 0).toFixed(2)}`,
    color: 'text-positive',
    border: 'border-green-left'
  },
  {
    label: 'Operaciones',
    value: resumen.value?.conteo || 0,
    color: 'text-grey-9',
    border: 'border-grey-left'
  }
])

  const columns = [
    { name: 'folio', label: 'FOLIO', align: 'left' },
    { name: 'fecha', label: 'FECHA', align: 'left' },
    { name: 'sucursal', label: 'SUCURSAL', align: 'left' },
    { name: 'cliente', label: 'CLIENTE', align: 'left' },
    { name: 'total', label: 'TOTAL VENTA', align: 'right' }
  ]

  const cargarReporte = async () => {
    cargando.value = true
    try {
      const params = {
        fecha_inicio: filtros.value.inicio,
        fecha_fin: filtros.value.fin,
        sucursal_id: filtros.value.sucursal?.id
      }
      const { data } = await api.get('/api/reportes/ventas-detalladas', { params })
      ventas.value = data.ventas
      resumen.value = data.resumen
    } finally { cargando.value = false }
  }

  const formatDate = (val) => date.formatDate(val, 'DD/MM/YYYY hh:mm A')

  // EXPORTACIÓN A EXCEL: Aplanamiento de datos para análisis
  const exportarExcel = () => {
    const dataExport = []
    ventas.value.forEach(v => {
      v.detalles.forEach(d => {
        dataExport.push({
          Folio: v.folio,
          Fecha: formatDate(v.created_at),
          Sucursal: v.sucursal?.nombre,
          Cliente: v.cliente?.nombre || 'Publico General',
          SKU: d.producto?.codigo_barras,
          Producto: d.producto?.nombre,
          Cantidad: d.cantidad,
          Precio_Unitario: d.precio_unitario,
          Impuesto: d.impuesto_unitario,
          Subtotal: d.subtotal,
          Total_Fila: d.total,
          Metodos_Pago: v.pagos.map(p => p.metodo_pago).join(', ')
        })
      })
    })
    const ws = XLSX.utils.json_to_sheet(dataExport)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Ventas_Detalladas")
    XLSX.writeFile(wb, `Reporte_Ventas_${filtros.value.inicio}_${filtros.value.fin}.xlsx`)
  }

  // EXPORTACIÓN A PDF: Basado en el backend DomPDF
  const exportarPDFMasivo = async () => {
    try {
      $q.loading.show({ message: 'Generando Documento PDF Gerencial...' })

      // Mapeo explícito de nombres de parámetros
      const params = {
        fecha_inicio: filtros.value.inicio,
        fecha_fin: filtros.value.fin,
        sucursal_id: filtros.value.sucursal?.id
      }

      const response = await api.get('/api/reportes/ventas-detalladas/pdf', {
        params,
        responseType: 'blob'
      })

      // Crear y descargar el archivo
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `Reporte_Ventas_${filtros.value.inicio}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)

    } catch (e) {
      $q.notify({ type: 'negative', message: 'No se encontraron datos para el rango seleccionado' })
    } finally {
      $q.loading.hide()
    }
  }

  onMounted(() => {
    cargarReporte()
    // Cargar sucursales si es admin
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
  .border-grey-left { border-left: 5px solid #757575; }

  .premium-sales-table {
    border-radius: 16px;
    :deep(thead tr th) {
      background-color: #f8fafc; color: #64748b; font-weight: 800;
    }
  }
  .font-size-10 { font-size: 10px; }
  .expansion-row { border-left: 4px solid var(--q-primary); }
  .letter-spacing-1 { letter-spacing: 1px; }
</style>
