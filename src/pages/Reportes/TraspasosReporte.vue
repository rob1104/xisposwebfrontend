<template>
  <q-page class="q-pa-lg bg-grey-2">
    <!-- Encabezado y Filtros -->
    <div class="row items-center q-mb-md justify-between">
      <div class="row items-center">
        <div class="header-accent-box shadow-4 q-mr-md">
          <q-icon name="sync_alt" color="white" size="lg" />
        </div>
        <div>
          <div class="text-h4 text-bold text-blue-grey-9" style="letter-spacing: -0.5px">Reporte de Traspasos</div>
          <div class="text-subtitle2 text-grey-7">Analítica de envíos y recepciones entre sucursales.</div>
        </div>
      </div>
    </div>

    <!-- Barra de Filtros Premium -->
    <q-card flat class="q-mb-lg bg-white shadow-1" style="border-radius: 16px;">
      <q-card-section>
        <div class="row q-col-gutter-md items-center">
          <div class="col-12 col-md-3">
            <div class="text-caption text-bold text-grey-7 q-mb-xs">Fecha de Inicio</div>
            <q-input outlined dense v-model="filtros.inicio" type="date" color="primary" class="bg-grey-1" />
          </div>
          <div class="col-12 col-md-3">
            <div class="text-caption text-bold text-grey-7 q-mb-xs">Fecha de Fin</div>
            <q-input outlined dense v-model="filtros.fin" type="date" color="primary" class="bg-grey-1" />
          </div>
          <div class="col-12 col-md-3">
            <div class="text-caption text-bold text-grey-7 q-mb-xs">Sucursal Involucrada</div>
            <q-select outlined dense v-model="filtros.sucursal" :options="sucursales" option-label="nombre" option-value="id" class="bg-grey-1" clearable placeholder="Todas las Sucursales" />
          </div>
          <div class="col-12 col-md-3">
            <div class="text-caption text-bold text-white q-mb-xs">.</div>
            <q-btn unelevated color="primary" icon="search" label="Consultar" class="full-width" style="border-radius: 8px" @click="cargarReporte" :loading="cargando" />
          </div>
        </div>
      </q-card-section>
    </q-card>

    <!-- Resumen KPI -->
    <div class="row q-col-gutter-md q-mb-lg">
      <div v-for="(kpi, index) in kpiWidgets" :key="index" class="col-12 col-sm-6 col-md-3">
        <q-card flat class="kpi-card shadow-1 q-pa-sm" :class="kpi.border">
          <q-card-section class="row items-center no-wrap">
            <div class="col">
              <div class="text-caption text-bold text-uppercase text-grey-6 font-size-10 letter-spacing-1">{{ kpi.label }}</div>
              <div class="text-h5 text-bold q-mt-xs" :class="kpi.color">{{ kpi.value }}</div>
            </div>
            <q-avatar size="48px" :color="kpi.color.replace('text-', '') + '-1'" :text-color="kpi.color.replace('text-', '')" class="q-ml-sm">
              <q-icon :name="kpi.icon" size="24px" />
            </q-avatar>
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
              <div class="text-bold text-primary" style="font-size: 11px">#{{ props.row.id }}</div>
              <div class="text-caption text-grey-7">{{ formatDateTime(props.row.fecha_envio) }}</div>
            </q-td>
            <q-td>
              <div class="text-bold">{{ props.row.sucursal_origen?.nombre || 'N/A' }}</div>
              <div class="text-caption text-grey-6">Enviado por: {{ props.row.user_envia?.name || 'N/A' }}</div>
            </q-td>
            <q-td>
              <div class="text-bold">{{ props.row.sucursal_destino?.nombre || 'N/A' }}</div>
              <div class="text-caption text-grey-6" v-if="props.row.estatus === 'Recibido'">Recibido por: {{ props.row.user_recibe?.name || 'N/A' }}</div>
              <div class="text-caption text-red-6" v-else-if="props.row.estatus === 'Cancelado'">Cancelado por: {{ props.row.user_recibe?.name || 'N/A' }}</div>
            </q-td>
            <q-td class="text-center">
              <q-badge :color="props.row.estatus === 'Recibido' ? 'positive' : (props.row.estatus === 'Cancelado' ? 'red-8' : 'orange-8')" class="text-bold q-px-sm">
                {{ props.row.estatus }}
              </q-badge>
            </q-td>
            <q-td>
              <div v-for="det in props.row.detalles" :key="det.id" class="q-mb-xs" style="font-size: 11px;">
                <span class="text-bold">{{ det.producto?.nombre || 'Desconocido' }}</span>
                <span class="text-grey-7"> - {{ Number(det.cantidad_enviada).toFixed(2) }} uds</span>
                <span v-if="props.row.estatus === 'Recibido' && det.cantidad_enviada != det.cantidad_recibida" class="text-red text-bold"> (Dif: {{ Number(det.cantidad_enviada - det.cantidad_recibida).toFixed(2) }})</span>
              </div>
              <div class="text-caption text-bold text-primary q-mt-xs" style="border-top: 1px solid #e2e8f0; padding-top: 2px;">Total: {{ calcularArticulos(props.row.detalles) }} uds</div>
            </q-td>
            <q-td class="text-right">
              <q-btn flat round dense color="primary" icon="print" @click="descargarPDFIndividual(props.row.id)">
                <q-tooltip>Reimprimir Comprobante</q-tooltip>
              </q-btn>
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

  const calcularArticulos = (detalles) => {
    if (!detalles) return 0;
    return detalles.reduce((sum, d) => sum + parseFloat(d.cantidad_enviada), 0).toFixed(2);
  }

  const formatDateTime = (val) => {
    if (!val) return '';
    return date.formatDate(val, 'DD/MM/YYYY HH:mm');
  }

  const kpiWidgets = computed(() => [
    {
      label: 'Total Traspasos',
      value: kpisRaw.value?.total_traspasos || 0,
      color: 'text-primary',
      icon: 'local_shipping',
      border: 'border-primary-left'
    },
    {
      label: 'Cancelados',
      value: kpisRaw.value?.cancelados || 0,
      color: 'text-red-8',
      icon: 'cancel',
      border: 'border-red-left'
    },
    {
      label: 'Pendientes',
      value: kpisRaw.value?.pendientes || 0,
      color: 'text-orange-8',
      icon: 'pending_actions',
      border: 'border-orange-left'
    },
    {
      label: 'Completados',
      value: kpisRaw.value?.completados || 0,
      color: 'text-positive',
      icon: 'check_circle',
      border: 'border-green-left'
    }
  ])

  const columns = [
    { name: 'folio', label: 'FOLIO / FECHA', align: 'left' },
    { name: 'origen', label: 'ORIGEN', align: 'left' },
    { name: 'destino', label: 'DESTINO', align: 'left' },
    { name: 'estatus', label: 'ESTATUS', align: 'center' },
    { name: 'articulos', label: 'ARTÍCULOS TRANSFERIDOS', align: 'left' },
    { name: 'acciones', label: '', align: 'right' }
  ]

  const cargarReporte = async () => {
    cargando.value = true
    try {
      const params = {
        fecha_inicio: filtros.value.inicio,
        fecha_fin: filtros.value.fin,
        sucursal_id: filtros.value.sucursal?.id
      }
      const { data } = await api.get('/api/reportes/traspasos', { params })
      reporte.value = data.traspasos
      kpisRaw.value = data.kpis
    } finally { cargando.value = false }
  }

  const descargarPDFIndividual = async (id) => {
    try {
      $q.loading.show({ message: 'Generando comprobante...' })
      const response = await api.get(`/api/transferencias/${id}/pdf`, { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `Comprobante_Traspaso_${id}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      $q.notify({ color: 'negative', message: 'Error al descargar el PDF' })
    } finally {
      $q.loading.hide()
    }
  }

  const exportarExcel = () => {
    const dataExport = reporte.value.map(r => ({
      Folio: r.id,
      Fecha_Envio: formatDateTime(r.fecha_envio),
      Sucursal_Origen: r.sucursal_origen?.nombre || '',
      Usuario_Envia: r.user_envia?.name || '',
      Sucursal_Destino: r.sucursal_destino?.nombre || '',
      Estatus: r.estatus,
      Fecha_Recepcion: formatDateTime(r.fecha_recepcion),
      Usuario_Involucrado: r.user_recibe?.name || '',
      Productos: r.detalles?.map(d => `${d.producto?.nombre || 'Desconocido'} - ${Number(d.cantidad_enviada)} uds`).join('\n') || '',
      Total_Articulos_Enviados: Number(calcularArticulos(r.detalles))
    }))
    
    const ws = XLSX.utils.json_to_sheet(dataExport)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Reporte_Traspasos")
    XLSX.writeFile(wb, `Reporte_Traspasos_${filtros.value.inicio}_${filtros.value.fin}.xlsx`)
  }

  const exportarPDFMasivo = async () => {
    try {
      $q.loading.show({ message: 'Generando Reporte PDF...' })
      const params = {
        fecha_inicio: filtros.value.inicio,
        fecha_fin: filtros.value.fin,
        sucursal_id: filtros.value.sucursal?.id
      }
      const response = await api.get('/api/reportes/traspasos/pdf', {
        params,
        responseType: 'blob'
      })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `Reporte_Traspasos_${filtros.value.inicio}.pdf`)
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
    if (auth.isAdmin) {
      api.get('/api/sucursales').then(r => sucursales.value = r.data)
    } else {
      sucursales.value = auth.sucursales
    }
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
  .border-orange-left { border-left: 5px solid #ea580c; }
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
