<template>
  <q-page class="bg-grey-1 q-pa-lg">

    <div class="row items-center justify-between q-mb-xl">
      <div class="row items-center">
        <div class="header-icon-box q-mr-md shadow-2">
          <q-icon name="history" color="white" size="md" />
        </div>
        <div>
          <div class="text-h5 text-bold text-grey-9 tracking-tight">Historial de Conteo Fisico</div>
          <div class="text-caption text-primary text-bold text-uppercase letter-spacing-1">
            Gestión de Existencias y Control de Mermas
          </div>
        </div>
      </div>

      <q-btn
        v-if="auth.can('inventario.crearconteofisico')"
        color="primary"
        icon="add_circle"
        label="Nuevo Conteo Físico"
        unelevated
        class="new-audit-btn q-px-lg shadow-3"
        @click="irANuevoConteo"
      />
    </div>

    <q-card class="admin-main-card no-border shadow-2">
      <q-table
        :rows="historial"
        :columns="columns"
        row-key="id"
        flat
        :loading="cargando"
        @request="cargarHistorial"
        class="premium-history-table"
        :filter="filtro"
      >
        <template v-slot:top-right>
          <q-input
            v-model="filtro"
            placeholder="Buscar por folio o sucursal..."
            outlined
            dense
            bg-color="white"
            class="search-input-modern"
          >
            <template v-slot:append>
              <q-icon name="search" color="primary" />
            </template>
          </q-input>
        </template>

        <template v-slot:body-cell-id="props">
          <q-td :props="props">
            <div class="text-bold text-primary">{{ String(props.value).padStart(6, '0') }}</div>
          </q-td>
        </template>

        <template v-slot:body-cell-fecha="props">
          <q-td :props="props">
            <div class="column">
              <div class="text-bold text-grey-9">{{ formatOnlyDate(props.value) }}</div>
              <div class="text-caption text-grey-6">{{ formatOnlyTime(props.value) }}</div>
            </div>
          </q-td>
        </template>

        <template v-slot:body-cell-status="props">
          <q-td :props="props">
            <q-chip
              :color="props.value === 'Finalizado' ? 'green-1' : 'red-1'"
              :text-color="props.value === 'Finalizado' ? 'green-9' : 'red-9'"
              class="status-chip text-bold"
              size="sm"
            >
              <q-icon :name="props.value === 'Finalizado' ? 'check_circle' : 'cancel'" class="q-mr-xs" />
              {{ props.value.toUpperCase() }}
            </q-chip>
          </q-td>
        </template>

        <template v-slot:body-cell-acciones="props">
          <q-td :props="props" class="q-gutter-x-sm">
            <q-btn
              flat round
              color="indigo-7"
              icon="visibility"
              class="action-btn-view"
              @click="verDetalle(props.row)"
            >
              <q-tooltip>Ver Análisis Detallado</q-tooltip>
            </q-btn>
            <q-btn
              flat round
              color="red-7"
              icon="picture_as_pdf"
              class="action-btn-pdf"
              @click="descargarPDF(props.row)"
            >
              <q-tooltip>Descargar Reporte Comercial</q-tooltip>
            </q-btn>
          </q-td>
        </template>
      </q-table>
    </q-card>

    <AuditoriaDetalleDialog
      v-model="showDetalle"
      :data="detalleSeleccionado"
      @descargar="descargarPDF"
    />
  </q-page>
</template>

<script setup>
  import { ref, onMounted } from 'vue'
  import { api } from 'src/boot/axios'
  import { useQuasar, date } from 'quasar' // Importamos utilería de fecha de Quasar
  import { useRouter } from 'vue-router'
  import { useAuthStore } from 'src/stores/auth'
  import AuditoriaDetalleDialog from 'src/components/Inventario/AuditoriaDetalleDialog.vue'

  const $q = useQuasar()
  const auth = useAuthStore()
  const router = useRouter()
  const historial = ref([])
  const cargando = ref(false)
  const showDetalle = ref(false)
  const detalleSeleccionado = ref(null)
  const filtro = ref('')

  const formatOnlyDate = (val) => date.formatDate(val, 'DD [de] MMMM, YYYY')
  const formatOnlyTime = (val) => date.formatDate(val, 'hh:mm A')

  const columns = [
    { name: 'id', label: 'FOLIO', field: 'id', align: 'left', sortable: true },
    { name: 'fecha', label: 'FECHA Y HORA', field: 'fecha', align: 'left', sortable: true },
    { name: 'sucursal', label: 'SUCURSAL', field: row => row.sucursal?.nombre, align: 'left' },
    { name: 'usuario', label: 'RESPONSABLE', field: row => row.user?.name, align: 'left' },
    { name: 'status', label: 'ESTADO', field: 'status', align: 'center' },
    { name: 'acciones', label: 'OPERACIONES', align: 'right' }
  ]

  const cargarHistorial = async () => {
    cargando.value = true
    try {
      const { data } = await api.get('/api/auditoriainventario')
      historial.value = data.data
    } catch (e) {
      $q.notify({ type: 'negative', message: 'No se pudo cargar el historial' })
    } finally { cargando.value = false }
  }

  const verDetalle = async (row) => {
    try {
      $q.loading.show({ message: 'Consultando análisis de diferencias...' })
      const { data } = await api.get(`/api/auditoriainventario/${row.id}`)
      detalleSeleccionado.value = data
      showDetalle.value = true
    } finally { $q.loading.hide() }
  }

  const descargarPDF = async (row) => {
    try {
      $q.loading.show({ message: 'Generando PDF comercial...' })
      const response = await api.get(`/api/auditoria/reporte/pdf/${row.id}`, { responseType: 'blob' })
      const blob = new Blob([response.data], { type: 'application/pdf' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `Auditoria_F${row.id}_${date.formatDate(Date.now(), 'DDMMYY')}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
      $q.notify({ type: 'positive', message: 'Descarga completada' })
    } catch (e) {
      $q.notify({ type: 'negative', message: 'Error al procesar el archivo' })
    } finally { $q.loading.hide() }
  }

  const irANuevoConteo = () => router.push('/conteofisico')

  onMounted(cargarHistorial)
</script>

<style lang="scss" scoped>
  .header-icon-box {
    background: linear-gradient(135deg, var(--q-primary) 0%, #00838f 100%);
    padding: 12px;
    border-radius: 12px;
  }

  .new-audit-btn {
    border-radius: 10px;
    font-weight: 800;
    transition: all 0.3s;
    &:hover { transform: translateY(-2px); }
  }

  .admin-main-card {
    border-radius: 16px;
    background: white;
  }

  .premium-history-table {
    :deep(thead tr th) {
      background-color: #f8fafc;
      color: #64748b;
      font-weight: 800;
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      border-bottom: 1px solid #f1f5f9;
    }
    :deep(tbody tr:nth-child(even)) { background-color: #f9fafb; }
    :deep(tbody tr:hover) { background-color: rgba(var(--q-primary), 0.04); transition: 0.2s; }
  }

  .search-input-modern {
    width: 320px;
    :deep(.q-field__control) { border-radius: 8px; }
  }

  .status-chip {
    padding: 14px 10px;
    border-radius: 6px;
  }

  .action-btn-view { background-color: #e0e7ff; &:hover { background-color: #c7d2fe; } }
  .action-btn-pdf { background-color: #fee2e2; &:hover { background-color: #fecaca; } }

  .tracking-tight { letter-spacing: -0.5px; }
  .letter-spacing-1 { letter-spacing: 1px; }
</style>
