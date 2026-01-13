<template>
  <div class="col q-pa-lg bg-white q-ml-md">
    <div class="row q-col-gutter-md q-mb-lg">
      <div class="col-12 row items-center q-mb-sm">
        <q-icon name="analytics" color="primary" size="md" class="q-mr-sm" />
        <div class="text-h5 text-bold text-primary">Historial de turnos</div>
        <q-space />
        <q-input
          dense
          filled
          v-model="filter"
          placeholder="Buscar cajero o fecha..."
          class="bg-white shadow-1 border-radius-10"
          style="width: 300px"
        >
          <template v-slot:append><q-icon name="search" /></template>
        </q-input>
      </div>
    </div>

    <q-card flat class="shadow-12 border-radius-15 overflow-hidden">
      <q-table
        :rows="rows"
        :columns="columns"
        :filter="filter"
        row-key="id"
        flat
        :loading="loading"
        class="tabla-gerencial"
      >
        <template v-slot:header="props">
          <q-tr :props="props" class="bg-blue-grey-10 text-white">
            <q-th v-for="col in props.cols" :key="col.name" :props="props" class="text-bold">
              {{ col.label }}
            </q-th>
          </q-tr>
        </template>

        <template v-slot:body-cell-user="props">
          <q-td :props="props">
            <div class="row items-center">
              <q-avatar size="32px" color="cyan-1 text-cyan-9" class="text-bold q-mr-sm">
                {{ props.row.user?.name.charAt(0).toUpperCase() }}
              </q-avatar>
              <div class="text-bold text-blue-grey-9">{{ props.row.user?.name }}</div>
            </div>
          </q-td>
        </template>

        <template v-slot:body-cell-apertura="props">
          <q-td :props="props" class="text-grey-8">
            <div class="text-weight-medium">{{ formatearFecha(props.value) }}</div>
            <div class="text-caption text-grey-6">{{ formatearHora(props.value) }}</div>
          </q-td>
        </template>

        <template v-slot:body-cell-cierre="props">
          <q-td :props="props" class="text-grey-8">
            <div v-if="props.value">
              <div class="text-weight-medium">{{ formatearFecha(props.value) }}</div>
              <div class="text-caption text-grey-6">{{ formatearHora(props.value) }}</div>
            </div>
            <q-badge v-else outline color="orange" label="En proceso" />
          </q-td>
        </template>

        <template v-slot:body-cell-contado="props">
          <q-td :props="props" class="text-right">
            <div class="text-subtitle2 text-bold text-blue-grey-10">
              $ {{ props.value }}
            </div>
          </q-td>
        </template>

        <template v-slot:body-cell-diferencia="props">
          <q-td :props="props" class="text-right">
            <q-chip
              dense
              :color="Number(props.value) < 0 ? 'red-1' : (Number(props.value) > 0 ? 'green-1' : 'grey-2')"
              :text-color="Number(props.value) < 0 ? 'red-9' : (Number(props.value) > 0 ? 'green-9' : 'grey-8')"
              class="text-bold q-px-md"
              :icon="Number(props.value) < 0 ? 'trending_down' : (Number(props.value) > 0 ? 'trending_up' : 'check_circle')"
            >
              $ {{ Math.abs(props.value).toFixed(2) }}
            </q-chip>
          </q-td>
        </template>

        <template v-slot:body-cell-status="props">
          <q-td :props="props" align="center">
            <q-badge
              rounded
              :color="props.row.status === 'Abierto' ? 'cyan-6' : 'blue-grey-4'"
              class="q-px-md q-py-xs text-bold"
            >
              {{ props.row.status.toUpperCase() }}
            </q-badge>
          </q-td>
        </template>

        <template v-slot:body-cell-acciones="props">
          <q-td :props="props" class="text-right">
            <q-btn
              unelevated
              round
              color="primary"
              icon="picture_as_pdf"
              size="sm"
              @click="imprimirReporte(props.row.id)"
            >
              <q-tooltip class="bg-black">Descargar Reporte de Cierre</q-tooltip>
            </q-btn>
          </q-td>
        </template>
      </q-table>
    </q-card>
  </div>
</template>

<script setup>
  import { ref, onMounted, watch } from 'vue'
  import { api } from 'boot/axios'
  import { useQuasar, date } from 'quasar'
  import { useAuthStore } from 'stores/auth'


  const $q = useQuasar()
  const rows = ref([])
  const loading = ref(false)
  const filter = ref('')
  const auth = useAuthStore()
  const props = defineProps(['sucursalId'])


  // Formateadores de fecha Quasar
  const formatearFecha = (f) => date.formatDate(f, 'DD MMM, YYYY')
  const formatearHora = (f) => date.formatDate(f, 'hh:mm A')

  const columns = [
    { name: 'user', label: 'CAJERO / RESPONSABLE', field: row => row.user?.name, align: 'left', sortable: true },
    { name: 'apertura', label: 'FECHA APERTURA', field: 'created_at', align: 'left', sortable: true },
    { name: 'cierre', label: 'FECHA CIERRE', field: 'cerrado_at', align: 'left', sortable: true },
    { name: 'fondo', label: 'FONDO INICIAL', field: 'saldo_inicial', align: 'right', format: v => `$ ${v}` },
    { name: 'contado', label: 'SALDO CIERRE', field: 'saldo_cierre', align: 'right' },
    { name: 'diferencia', label: 'DIFERENCIA', field: 'diferencia', align: 'right', sortable: true },
    { name: 'status', label: 'ESTADO', align: 'center', field: 'status' },
    { name: 'acciones', label: '', align: 'right' }
  ]

  const cargarTurnos = async () => {
    loading.value = true
    try {

      const params = {}

      if(auth.roles[0] === 'Cajero') {
        params.user_id = auth.user.id
      }
      else {
        if(props.sucursalId) {
          params.sucursal_id = props.sucursalId
        }
      }

      const { data } = await api.get('/api/turnos', { params })
      rows.value = data.data ? data.data : (Array.isArray(data) ? data : [])
    } catch (error) {
      $q.notify({ color: 'negative', message: 'Error de conexión', icon: 'report_problem' })
    } finally {
      loading.value = false
    }
  }

  watch(() => props.sucursalId, () =>{
    cargarTurnos()
  })

  const imprimirReporte = async (id) => {
    $q.loading.show({ message: 'Generando Reporte PDF...' })
    try {
      const response = await api.get(`/api/turnos/pdf/${id}`, { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `Cierre_Caja_${id}.pdf`)
      document.body.appendChild(link)
      link.click()
    } catch (e) {
      $q.notify({ color: 'negative', message: 'No se pudo generar el reporte' })
    } finally {
       $q.loading.hide()
    }
  }

  onMounted(() => cargarTurnos())
</script>

<style lang="scss" scoped>
.border-radius-10 { border-radius: 10px; }
.border-radius-15 { border-radius: 15px; }

  .tabla-gerencial {
    /* Estilo para las filas al pasar el mouse */


    /* Quitar bordes innecesarios */
    :deep(.q-table__card) {
      box-shadow: none;
    }

    :deep(.q-th) {
      font-size: 0.85rem;
      letter-spacing: 0.5px;
    }

    :deep(.q-td) {
      font-size: 0.9rem;
      padding: 12px 16px;
    }
  }

  .min-height-screen {
    min-height: 100vh;
  }
</style>
