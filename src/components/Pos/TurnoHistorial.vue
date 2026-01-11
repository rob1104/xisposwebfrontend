<template>
  <div class="q-pa-md bg-grey-1 min-height-screen">
    <q-card flat bordered class="rounded-borders shadow-2">
      <q-card-section class="row items-center q-pb-none">
        <q-icon name="history" color="primary" size="md" class="q-mr-sm" />
        <div class="text-h5 text-bold text-primary">Historial de Turnos</div>
        <q-space />
        <q-input dense outlined v-model="filter" placeholder="Buscar cajero o fecha..." class="bg-white">
          <template v-slot:append><q-icon name="search" /></template>
        </q-input>
      </q-card-section>

      <q-card-section>
        <q-table
          :rows="rows"
          :columns="columns"
          :filter="filter"
          row-key="id"
          flat
          :loading="loading"
          class="no-shadow"
        >
          <template v-slot:body-cell-status="props">
            <q-td :props="props">
              <q-badge :color="props.row.fecha_cierre ? 'grey-7' : 'green'" class="q-pa-xs">
                {{ props.row.fecha_cierre ? 'CERRADO' : 'ABIERTO' }}
              </q-badge>
            </q-td>
          </template>

          <template v-slot:body-cell-diferencia="props">
          <q-td :props="props" :class="Number(props.value) < 0 ? 'text-red text-bold' : 'text-green text-bold'">
            $ {{ props.value !== null ? Number(props.value).toFixed(2) : '0.00' }}
          </q-td>
        </template>

          <template v-slot:body-cell-acciones="props">
            <q-td :props="props" class="q-gutter-sm">
              <q-btn flat round color="primary" icon="description" @click="imprimirReporte(props.row.id)">
                <q-tooltip>Descargar Reporte PDF</q-tooltip>
              </q-btn>
            </q-td>
          </template>
        </q-table>
      </q-card-section>
    </q-card>
  </div>
</template>

<script setup>
  import { ref, onMounted } from 'vue'
  import { api } from 'boot/axios'
  import { useQuasar } from 'quasar'

  const $q = useQuasar()
  const rows = ref([])
  const loading = ref(false)
  const filter = ref('')

  const columns = [
    { name: 'id', label: 'ID', field: 'id', align: 'left', sortable: true },
    { name: 'user', label: 'CAJERO', field: row => row.user?.name, align: 'left' },
    { name: 'apertura', label: 'APERTURA', field: 'created_at', align: 'left' },
    { name: 'cierre', label: 'CIERRE', field: 'fecha_cierre', align: 'left' },
    { name: 'fondo', label: 'FONDO', field: 'fondo_apertura', format: v => `$${v}` },
    { name: 'contado', label: 'CONTADO', field: 'efectivo_contado', format: v => `$${v || 0}` },
    { name: 'diferencia', label: 'DIFERENCIA', field: 'diferencia' },
    { name: 'status', label: 'ESTADO', align: 'center' },
    { name: 'acciones', label: 'ACCIONES', align: 'right' }
  ]

  const imprimirReporte = async (id) => {
    try {
      const response = await api.get(`/api/turnos/pdf/${id}`, { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `Reporte_Turno_${id}.pdf`)
      document.body.appendChild(link)
      link.click()
    } catch (e) {
      $q.notify({ color: 'negative', message: 'Error al generar el PDF' })
    }
  }

  const cargarTurnos = async () => {
    loading.value = true
    try {
      const { data } = await api.get('/api/turnos')

      // 2. Laravel Paginate devuelve un objeto. Los registros están en data.data
      // Si usaste ->get() en el backend, los datos están en data directamente.
      // Este "blindaje" detecta ambos casos:
      rows.value = data.data ? data.data : (Array.isArray(data) ? data : [])

    } catch (error) {
      console.error("Error al cargar turnos:", error)
      $q.notify({ color: 'negative', message: 'No se pudo conectar con el servidor' })
    } finally {
      loading.value = false
    }
  }

  onMounted(async () => {
    cargarTurnos()
  })
</script>
