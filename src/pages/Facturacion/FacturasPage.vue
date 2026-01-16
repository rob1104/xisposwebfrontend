<template>
  <q-page class="q-pa-lg bg-grey-2">
    <div class="row q-col-gutter-md q-mb-lg">
      <div class="col-12 col-md-3" v-for="kpi in kpis" :key="kpi.label">
        <q-card class="kpi-card shadow-2 border-radius-10" :class="`border-left-${kpi.color}`">
          <q-card-section class="row items-center no-wrap">
            <q-avatar :icon="kpi.icon" :color="kpi.color" text-color="white" shadow-3 />
            <div class="q-ml-md">
              <div class="text-h6 text-bold">{{ kpi.value }}</div>
              <div class="text-caption text-grey-7">{{ kpi.label }}</div>
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <q-card class="shadow-10 border-radius-15 overflow-hidden">
      <q-table
        :rows="facturas"
        :columns="columns"
        row-key="id"
        :loading="loading"
        :filter="filter"
        flat
        class="facturas-table"
      >
        <template v-slot:top>
          <div class="text-h6 text-bold text-primary flex items-center">
            <q-icon name="description" class="q-mr-sm" />
            Historial de Facturación
          </div>
          <q-space />

          <q-select
            v-if="auth.isAdmin"
            v-model="sucursalFiltro"
            :options="sucursales"
            label="Sucursal"
            option-value="id"
            option-label="nombre"
            outlined dense
            class="q-mr-md"
            style="min-width: 200px"
            map-options
            emit-value
            @update:model-value="loadFacturas"
          />

          <q-input
            v-model="filter"
            placeholder="Buscar por Folio, RFC o UUID..."
            outlined dense
            class="search-input q-mr-sm"
          >
            <template v-slot:append><q-icon name="search" /></template>
          </q-input>

          <q-btn
            color="primary"
            icon="add_circle"
            label="Nueva Factura"
            class="custom-btn-radius shadow-5"
            unelevated
            @click="nuevaFactura"
          />
        </template>

        <template v-slot:body-cell-fecha="props">
          <q-td :props="props">
            <div class="text-bold">{{ props.row.fecha_only }}</div>
            <div class="text-caption text-grey-6">{{ props.row.hora_only }}</div>
          </q-td>
        </template>

        <template v-slot:body-cell-cliente="props">
          <q-td :props="props">
            <div class="text-bold text-uppercase">{{ props.row.receptor_nombre }}</div>
            <div class="text-caption text-primary">{{ props.row.receptor_rfc }}</div>
          </q-td>
        </template>

        <template v-slot:body-cell-uuid="props">
          <q-td :props="props" class="text-center">
            <template v-if="props.row.uuid">
              <q-badge color="blue-grey-2" text-color="blue-grey-10" class="q-pa-xs cursor-pointer" @click="copyToClipboard(props.row.uuid)">
                {{ props.row.uuid.substring(0, 8) }}...
                <q-tooltip class="bg-dark">Click para copiar UUID completo</q-tooltip>
              </q-badge>
            </template>
            <span v-else class="text-caption text-grey-5 italic">Sin timbrar</span>
          </q-td>
        </template>

        <template v-slot:body-cell-status="props">
          <q-td :props="props" class="text-center">
            <q-chip
              :color="getStatusColor(props.row.status)"
              text-color="white"
              size="sm"
              class="text-bold shadow-1"
            >
              {{ props.row.status }}
            </q-chip>
          </q-td>
        </template>

        <template v-slot:body-cell-actions="props">
          <q-td :props="props" class="text-center q-gutter-xs">
            <q-btn flat round color="primary" icon="picture_as_pdf" size="sm" @click="downloadPdf(props.row)">
              <q-tooltip>Descargar PDF</q-tooltip>
            </q-btn>
            <q-btn flat round color="green-8" icon="code" size="sm" @click="downloadXml(props.row)">
              <q-tooltip>Descargar XML</q-tooltip>
            </q-btn>
            <q-btn flat round color="orange-9" icon="mail" size="sm" @click="resendEmail(props.row)">
              <q-tooltip>Reenviar al Cliente</q-tooltip>
            </q-btn>
            <q-btn flat round color="negative" icon="block" size="sm" @click="cancelFactura(props.row)">
              <q-tooltip>Cancelar Factura</q-tooltip>
            </q-btn>
          </q-td>
        </template>
      </q-table>
    </q-card>
  </q-page>
</template>

<script setup>
  import { ref, computed, onMounted } from 'vue'
  import { api } from 'boot/axios'
  import { useQuasar, copyToClipboard } from 'quasar'
  import { useAuthStore } from 'src/stores/auth'

  const $q = useQuasar()
  const auth = useAuthStore()
  const loading = ref(false)
  const filter = ref('')
  const facturas = ref([])
  const sucursales = ref([])
  const sucursalFiltro = ref(auth.sucursalSeleccionada?.id)

  const nuevaFactura = () => {
    $q.notify({
      message: 'Abriendo selector de ventas para facturar...',
      color: 'positive',
      icon: 'add_shopping_cart'
    })
  }

  const columns = [
    { name: 'fecha', label: 'Fecha / Hora', align: 'left', sortable: true },
    { name: 'folio', label: 'Serie-Folio', field: row => `${row.serie}-${row.folio}`, align: 'left', sortable: true },
    { name: 'cliente', label: 'Cliente (RFC)', align: 'left', sortable: true },
    { name: 'total', label: 'Total', field: row => formatCurrency(row.total), align: 'right', sortable: true },
    { name: 'uuid', label: 'UUID (Timbre)', align: 'center' },
    { name: 'status', label: 'Estado', align: 'center' },
    { name: 'actions', label: 'Gestión', align: 'center' }
  ]

  const kpis = computed(() => [
    { label: 'Facturado Mes', value: formatCurrency(0), color: 'primary', icon: 'payments' },
    { label: 'Timbradas', value: '0', color: 'positive', icon: 'verified' },
    { label: 'Canceladas', value: '0', color: 'negative', icon: 'dangerous' },
    { label: 'Por Timbrar', value: '0', color: 'orange', icon: 'history' }
  ])

  const formatCurrency = (val) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(val)

  const getStatusColor = (status) => {
    const map = { 'TIMBRADA': 'positive', 'CANCELADA': 'negative', 'PENDIENTE': 'orange', 'ERROR': 'black' }
    return map[status] || 'grey'
  }

  const loadSucursales = async () => {
    try {
      const { data } = await api.get('/api/sucursales')
      sucursales.value = data
    } catch (e) {
      console.error("Error al cargar sucursales para el filtro")
    }
  }

  const loadFacturas = async () => {
    if (!sucursalFiltro.value) return // Evita peticiones vacías

    loading.value = true
    try {
      // Esto resuelve el error 404 si ya definiste la ruta en api.php
      const { data } = await api.get('/api/cfdis', {
        params: { sucursal_id: sucursalFiltro.value }
      })
      facturas.value = data
    } catch (e) {
      $q.notify({
        color: 'negative',
        message: 'No se pudo conectar con el servidor de facturación',
        icon: 'report_problem'
      })
    } finally {
      loading.value = false
    }
  }

  const downloadPdf = (row) => { $q.notify({ message: `Generando PDF de folio ${row.folio}...`, color: 'info' }) }
  const downloadXml = (row) => { $q.notify({ message: `Descargando XML de folio ${row.folio}...`, color: 'positive' }) }
  const resendEmail = (row) => { $q.notify({ message: `Reenviando factura a cliente...`, color: 'orange' }) }
  const cancelFactura = (row) => {
    $q.dialog({
      title: 'Confirmar Cancelación',
      message: `¿Estás seguro de cancelar el folio ${row.folio}?`,
      cancel: true,
      persistent: true
    }).onOk(() => { /* Lógica de cancelación */ })
  }

  onMounted(async() => {
    if (auth.isAdmin) {
      await loadSucursales()
    }
    await loadFacturas()
  })

  const copyUuid = (uuid) => {
    copyToClipboard(uuid).then(() => {
      $q.notify({ message: 'UUID copiado al portapapeles', color: 'dark' })
    })
  }
</script>

<style lang="scss" scoped>
  .kpi-card {
    transition: transform 0.3s;
    &:hover { transform: translateY(-5px); }
  }
  .border-left-primary { border-left: 5px solid $primary; }
  .border-left-positive { border-left: 5px solid $positive; }
  .border-left-negative { border-left: 5px solid $negative; }
  .border-left-orange { border-left: 5px solid orange; }

  .facturas-table {
    :deep(thead th) {
      background-color: #263238;
      color: white;
      font-weight: bold;
      text-transform: uppercase;
    }
  }
  .custom-btn-radius { border-radius: 8px; font-weight: bold; }
</style>
