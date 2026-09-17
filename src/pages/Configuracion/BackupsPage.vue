<template>
  <q-page padding class="q-pb-xl">
    <div class="row items-center q-mb-md">
      <div class="col">
        <h4 class="text-h5 text-bold q-my-none">
          <q-icon name="backup" class="q-mr-sm text-primary" />
          Respaldos de Base de Datos
        </h4>
        <div class="text-subtitle2 text-grey-7">Gestiona y descarga los volcados de seguridad del sistema</div>
      </div>
      <div class="col-auto">
        <q-btn
          color="primary"
          icon="add"
          label="Crear Respaldo"
          unelevated
          class="border-radius-10 shadow-2"
          @click="crearRespaldo"
          :loading="creando"
        />
        <q-btn
          flat round dense
          icon="refresh"
          color="grey-7"
          class="q-ml-sm"
          @click="cargarRespaldos"
          :loading="loading"
        />
      </div>
    </div>

    <q-card class="shadow-2 border-radius-10">
      <q-table
        :rows="respaldos"
        :columns="columns"
        row-key="id"
        :loading="loading"
        flat
        separator="cell"
      >
        <template v-slot:body-cell-status="props">
          <q-td :props="props">
            <q-chip
              v-if="props.row.status === 'completed'"
              color="positive" text-color="white" dense size="sm" class="text-bold"
            >Completado</q-chip>
            <q-chip
              v-else-if="props.row.status === 'running'"
              color="info" text-color="white" dense size="sm" class="text-bold"
            >En progreso
              <q-spinner-dots size="xs" class="q-ml-xs" />
            </q-chip>
            <q-chip
              v-else-if="props.row.status === 'pending'"
              color="warning" text-color="white" dense size="sm" class="text-bold"
            >Pendiente</q-chip>
            <q-chip
              v-else-if="props.row.status === 'failed'"
              color="negative" text-color="white" dense size="sm" class="text-bold"
            >Falló
              <q-tooltip class="bg-negative">{{ props.row.error_message }}</q-tooltip>
            </q-chip>
          </q-td>
        </template>

        <template v-slot:body-cell-size="props">
          <q-td :props="props">
            {{ formatBytes(props.row.size) }}
          </q-td>
        </template>
        
        <template v-slot:body-cell-fecha="props">
          <q-td :props="props">
            {{ formatFecha(props.row.created_at) }}
          </q-td>
        </template>

        <template v-slot:body-cell-acciones="props">
          <q-td :props="props" class="text-center">
            <q-btn
              flat round dense color="primary" icon="download"
              :disable="props.row.status !== 'completed'"
              @click="descargar(props.row)"
            >
              <q-tooltip>Descargar</q-tooltip>
            </q-btn>
            <q-btn
              flat round dense color="negative" icon="delete"
              :disable="props.row.status === 'running'"
              @click="eliminar(props.row)"
            >
              <q-tooltip>Eliminar</q-tooltip>
            </q-btn>
          </q-td>
        </template>
      </q-table>
    </q-card>
  </q-page>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { api } from 'src/boot/axios'
import { useQuasar, date } from 'quasar'

const $q = useQuasar()
const respaldos = ref([])
const loading = ref(false)
const creando = ref(false)
let pollingInterval = null

const columns = [
  { name: 'id', label: 'ID', field: 'id', align: 'left', sortable: true },
  { name: 'fecha', label: 'Fecha', field: 'created_at', align: 'left', sortable: true },
  { name: 'database_name', label: 'Base de Datos', field: 'database_name', align: 'left', sortable: true },
  { name: 'motor', label: 'Motor', field: row => `${row.driver} ${row.database_version || ''}`, align: 'left', sortable: true },
  { name: 'user', label: 'Usuario', field: row => row.user ? row.user.name : 'Sistema', align: 'left', sortable: true },
  { name: 'size', label: 'Tamaño', field: 'size', align: 'right', sortable: true },
  { name: 'status', label: 'Estado', field: 'status', align: 'center', sortable: true },
  { name: 'acciones', label: 'Acciones', field: 'acciones', align: 'center' }
]

const cargarRespaldos = async (silent = false) => {
  if (!silent) loading.value = true
  try {
    const { data } = await api.get('/api/backups')
    respaldos.value = data
  } catch (e) {
    console.error(e)
    if (!silent) $q.notify({ message: 'Error al cargar respaldos', color: 'negative' })
  } finally {
    if (!silent) loading.value = false
  }
}

const crearRespaldo = () => {
  $q.dialog({
    title: 'Confirmar Respaldo',
    message: '¿Estás seguro de que deseas iniciar un respaldo completo de la base de datos? Este proceso puede tardar unos minutos. Por favor no cierres esta pestaña.',
    cancel: true,
    persistent: true
  }).onOk(async () => {
    creando.value = true
    try {
      await api.post('/api/backups')
      $q.notify({ message: 'El respaldo se ha completado con éxito.', color: 'positive', position: 'top' })
      await cargarRespaldos()
    } catch (e) {
      if (e.response?.status === 422) {
        $q.notify({ message: e.response.data.message || 'Ya hay un respaldo en proceso.', color: 'warning' })
      } else {
        $q.notify({ message: 'Error al iniciar respaldo', color: 'negative' })
      }
    } finally {
      creando.value = false
    }
  })
}

const descargar = async (row) => {
  try {
    $q.loading.show({ message: 'Preparando descarga...' })
    const response = await api.get(`/api/backups/${row.id}/download`, { responseType: 'blob' })
    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', row.filename)
    document.body.appendChild(link)
    link.click()
    link.parentNode.removeChild(link)
  } catch (e) {
    $q.notify({ message: 'Error al descargar el respaldo', color: 'negative' })
  } finally {
    $q.loading.hide()
  }
}

const eliminar = (row) => {
  $q.dialog({
    title: 'Eliminar',
    message: '¿Estás seguro de que deseas eliminar este respaldo? Esta acción no se puede deshacer.',
    cancel: true,
    persistent: true
  }).onOk(async () => {
    try {
      await api.delete(`/api/backups/${row.id}`)
      $q.notify({ message: 'Respaldo eliminado', color: 'positive' })
      cargarRespaldos()
    } catch (e) {
      $q.notify({ message: 'Error al eliminar', color: 'negative' })
    }
  })
}

const formatBytes = (bytes, decimals = 2) => {
  if (!+bytes) return '0 Bytes'
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
}

const formatFecha = (str) => {
  if (!str) return ''
  return date.formatDate(str, 'DD/MM/YYYY HH:mm:ss')
}

onMounted(() => {
  cargarRespaldos()
})
</script>
