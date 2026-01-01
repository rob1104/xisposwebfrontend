<template>
  <q-page class="q-pa-lg bg-grey-2">
    <div class="row q-col-gutter-md q-mb-lg">
      <div class="col-12 col-md-4">
        <q-card class="stats-card bg-white shadow-2 border-left-blue">
          <q-card-section class="row items-center no-wrap">
            <q-avatar icon="history" color="blue-9" text-color="white" shadow-5 />
            <div class="q-ml-md">
              <div class="text-h6 text-bold">{{ rows.length }}</div>
              <div class="text-caption text-grey-7">Eventos Recientes</div>
            </div>
          </q-card-section>
        </q-card>
      </div>

      <div class="col-12 col-md-4 text-right self-center">
        <q-btn
          outline
          color="primary"
          icon="refresh"
          label="Actualizar Logs"
          @click="loadLogs"
          class="custom-btn-radius q-px-lg"
        />
      </div>
    </div>

    <q-card class="shadow-10 overflow-hidden border-radius-15">
      <q-table
        :rows="rows"
        :columns="columns"
        row-key="id"
        :loading="loading"
        :filter="filter"
        flat
        class="main-table"
      >
        <template v-slot:top-right>
          <q-input v-model="filter" placeholder="Filtrar por usuario o módulo..." outlined dense class="search-input" bg-color="white">
            <template v-slot:append><q-icon name="search" /></template>
          </q-input>
        </template>

        <template v-slot:body="props">
          <q-tr :props="props" class="hover-row">
            <q-td key="fecha" :props="props" class="text-grey-9 text-bold">
              {{ props.row.fecha }}
            </q-td>

            <q-td key="usuario" :props="props">
              <div class="row items-center">
                <q-avatar size="24px" color="blue-2" text-color="blue-9" class="q-mr-sm text-bold">
                  {{ props.row.usuario.charAt(0) }}
                </q-avatar>
                {{ props.row.usuario }}
              </div>
            </q-td>

            <q-td key="modulo" :props="props" class="text-center">
              <q-badge outline color="primary" class="text-bold q-pa-xs">
                {{ props.row.modulo }}
              </q-badge>
            </q-td>

            <q-td key="descripcion" :props="props">
              <q-chip dense :color="getEventColor(props.row.descripcion)" text-color="white" size="md">
                {{ props.row.descripcion.toUpperCase() }}
              </q-chip>
            </q-td>

            <q-td key="actions" :props="props" class="text-center">
              <q-btn flat round color="primary" icon="visibility" @click="viewDetails(props.row)">
                <q-tooltip>Ver cambios realizados</q-tooltip>
              </q-btn>
            </q-td>
          </q-tr>
        </template>
      </q-table>
    </q-card>

    <q-dialog v-model="showDetails">
      <q-card style="width: 700px; max-width: 95vw;" class="menu-radius shadow-24">
        <q-card-section class="bg-primary text-white row items-center q-py-md">
          <q-icon name="manage_search" size="sm" class="q-mr-md" />
          <div class="text-h6 text-bold">Auditoría de Cambios</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section class="q-pa-none">
          <div class="q-pa-md bg-grey-1 row q-col-gutter-sm border-bottom">
            <div class="col-6"><span class="text-caption text-grey-7">RESPONSABLE:</span><br><b>{{ selectedLog.usuario }}</b></div>
            <div class="col-6"><span class="text-caption text-grey-7">FECHA:</span><br><b>{{ selectedLog.fecha }}</b></div>
          </div>

          <q-markup-table flat dense class="audit-table">
            <thead class="bg-grey-3">
              <tr>
                <th class="text-left">CAMPO</th>
                <th class="text-left">VALOR ANTERIOR</th>
                <th class="text-left">VALOR NUEVO</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="!getChanges.length">
                <td colspan="3" class="text-center q-pa-lg text-grey-6 italic">
                  No hay cambios detallados de columnas para esta acción.
                </td>
              </tr>
              <tr v-for="change in getChanges" :key="change.key">
                <td class="text-bold text-blue-9">{{ formatKey(change.key) }}</td>
                <td class="bg-red-1 text-negative">
                  <strike v-if="change.old">{{ change.old }}</strike>
                  <span v-else class="text-caption italic opacity-50">Nulo</span>
                </td>
                <td class="bg-green-1 text-positive text-bold">
                  {{ change.new }}
                </td>
              </tr>
            </tbody>
          </q-markup-table>
        </q-card-section>

        <q-card-actions align="right" class="q-pa-md bg-grey-2">
          <q-btn flat label="Cerrar Reporte" color="primary" v-close-popup class="text-bold" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
  import { ref, onMounted, computed } from 'vue'
  import { api } from 'boot/axios'

  const rows = ref([])
  const loading = ref(false)
  const filter = ref('')
  const showDetails = ref(false)
  const selectedLog = ref({})

  const columns = [
    { name: 'fecha', label: 'FECHA / HORA', field: 'fecha', align: 'left', sortable: true },
    { name: 'usuario', label: 'RESPONSABLE', field: 'usuario', align: 'left', sortable: true },
    { name: 'modulo', label: 'MÓDULO', field: 'modulo', align: 'center' },
    { name: 'descripcion', label: 'ACCIÓN', field: 'descripcion', align: 'center' },
    { name: 'actions', label: 'DETALLES', align: 'center' }
  ]

  const getEventColor = (desc) => {
    if (desc.includes('created')) return 'positive'
    if (desc.includes('updated')) return 'orange'
    if (desc.includes('deleted')) return 'negative'
    return 'blue-12'
  }

  const loadLogs = async () => {
    loading.value = true
    try {
      const res = await api.get('/api/logs')
      rows.value = res.data
    } finally { loading.value = false }
  }

  const viewDetails = (log) => {
    selectedLog.value = log
    showDetails.value = true
  }

  const getChanges = computed(() => {
    const props = selectedLog.value.propiedades || {}
    const changes = []

    // Spatie guarda los nuevos valores en 'attributes' y los anteriores en 'old'
    const newVals = props.attributes || {}
    const oldVals = props.old || {}

    // Iteramos sobre los campos que cambiaron
    Object.keys(newVals).forEach(key => {
      // Saltamos campos técnicos que no interesan al gerente
      if (['updated_at', 'created_at', 'id'].includes(key)) return

      changes.push({
        key: key,
        old: oldVals[key],
        new: newVals[key]
      })
    })

    return changes
  })

  // Embellecedor de nombres de columnas (ej: 'razon_social' -> 'Razón Social')
  const formatKey = (key) => {
    return key.replace(/_/g, ' ').toUpperCase()
  }

  onMounted(loadLogs)
</script>

<style lang="scss" scoped>
  .stats-card { border-radius: 12px; transition: transform 0.3s; &:hover { transform: translateY(-5px); } }
  .border-left-blue { border-left: 5px solid $primary; }
  .border-radius-15 { border-radius: 15px; }
  .main-table { ::v-deep thead th { font-weight: bold; background: #f9f9f9; border-bottom: 2px solid $primary; } }
  .hover-row:hover { background: #f1f5f9 !important; }
  .custom-btn-radius { border-radius: 10px; font-weight: bold; }
</style>
