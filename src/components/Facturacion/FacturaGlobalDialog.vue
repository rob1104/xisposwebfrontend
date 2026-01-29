<template>
  <q-dialog v-model="isOpen" full-width full-height @before-show="resetForm">
    <q-card class="column full-height">
      <q-card-section class="bg-indigo-10 text-white row items-center q-py-sm">
        <q-icon name="public" size="md" class="q-mr-md" />
        <div class="text-h6">Generación de Factura Global (Público en General)</div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>

      <q-card-section class="col q-pa-lg scroll">
        <div class="row q-col-gutter-md">

          <div class="col-12 col-md-3">
            <q-card class="bg-grey-1 shadow-1">
              <q-card-section>
                <div class="text-subtitle2 text-indigo-9 q-mb-sm">1. Filtrar Ventas</div>

                <q-input v-model="filtros.fechaInicio" type="date" label="Fecha Inicio" dense outlined bg-color="white" />
                <q-input v-model="filtros.fechaFin" type="date" label="Fecha Fin" dense outlined bg-color="white" class="q-mt-sm" />

                <q-select
                  v-model="filtros.metodoPago"
                  :options="['Todos', 'Efectivo', 'Tarjeta']"
                  label="Método de Pago"
                  dense outlined bg-color="white" class="q-mt-sm"
                />

                <q-btn
                  label="Buscar Tickets"
                  color="primary"
                  icon="search"
                  class="full-width q-mt-md"
                  :loading="loadingTickets"
                  @click="buscarTickets"
                />
              </q-card-section>
            </q-card>

            <q-card class="bg-indigo-1 shadow-1 q-mt-md">
              <q-card-section>
                <div class="text-subtitle2 text-indigo-9 q-mb-sm">2. Datos Información Global</div>

                <q-select
                  v-model="configGlobal.periodicidad"
                  :options="opcionesPeriodicidad"
                  label="Periodicidad"
                  dense outlined bg-color="white"
                  emit-value map-options
                />

                <q-select
                  v-model="configGlobal.meses"
                  :options="opcionesMeses"
                  label="Meses"
                  dense outlined bg-color="white" class="q-mt-sm"
                  emit-value map-options
                />

                <q-input
                  v-model="configGlobal.ano"
                  type="number"
                  label="Año"
                  dense outlined bg-color="white" class="q-mt-sm"
                />
              </q-card-section>
            </q-card>
          </div>

          <div class="col-12 col-md-9">
            <q-table
              :rows="tickets"
              :columns="columns"
              row-key="id"
              selection="multiple"
              v-model:selected="seleccionados"
              class="premium-table shadow-2 border-radius-12"
              :loading="loadingTickets"
              :pagination="{ rowsPerPage: 0 }"
              virtual-scroll
              style="height: 600px"
            >
              <template v-slot:top>
                <div class="row full-width items-center q-pb-xs">
                  <div class="col">
                    <div class="text-subtitle1 text-weight-bolder text-slate-800">
                      Tickets Disponibles
                    </div>
                    <div class="text-caption text-grey-6">
                      Selecciona los tickets para agrupar
                    </div>
                  </div>
                  <div class="col-auto">
                    <q-badge color="indigo-1" text-color="indigo-9" class="q-pa-sm text-weight-bold">
                      {{ seleccionados.length }} seleccionados
                    </q-badge>
                  </div>
                </div>
              </template>

              <template v-slot:body-cell-folio="props">
                <q-td :props="props">
                  <div class="row items-center no-wrap">
                    <q-avatar icon="receipt_long" color="grey-2" text-color="grey-7" size="sm" class="q-mr-sm" />
                    <span class="text-weight-bold text-grey-9 font-mono">{{ props.value }}</span>
                  </div>
                </q-td>
              </template>

              <template v-slot:body-cell-fecha="props">
                <q-td :props="props">
                  <div class="column">
                    <span class="text-weight-bold text-slate-800" style="line-height: 1.2">
                      {{ formatFecha(props.value) }}
                    </span>
                    <span class="text-caption text-grey-5" style="font-size: 0.7rem">
                      {{ formatHora(props.value) }}
                    </span>
                  </div>
                </q-td>
              </template>

              <template v-slot:body-cell-metodo="props">
                <q-td :props="props" class="text-center">
                  <q-chip
                    :color="getMetodoColor(props.value)"
                    text-color="white"
                    size="sm"
                    class="text-weight-bold shadow-1"
                    icon="payments"
                  >
                    {{ props.value }}
                  </q-chip>
                </q-td>
              </template>

              <template v-slot:body-cell-total="props">
                <q-td :props="props" class="text-right">
                  <div class="text-indigo-10 text-weight-bolder" style="font-size: 1rem">
                    {{ props.value }}
                  </div>
                </q-td>
              </template>

              <template v-slot:bottom-row>
                <q-tr class="bg-indigo-50">
                  <q-td colspan="1" class="text-left">
                    <span class="text-caption text-indigo-4">Resumen</span>
                  </q-td>
                  <q-td colspan="2" class="text-right text-indigo-9 text-weight-medium">
                    TOTAL SELECCIONADO:
                  </q-td>
                  <q-td class="text-right">
                    <div class="text-h6 text-weight-bolder text-indigo-10">
                      {{ formatCurrency(totalSeleccionado) }}
                    </div>
                  </q-td>
                </q-tr>
              </template>
            </q-table>
          </div>

        </div>
      </q-card-section>

      <q-card-actions align="right" class="bg-grey-2 q-pa-md">
        <div class="text-caption text-grey-7 q-mr-md">
          Se generará una factura con {{ seleccionados.length }} tickets.
        </div>
        <q-btn label="Cancelar" flat color="grey" v-close-popup />
        <q-btn
          label="Timbrar Factura Global"
          color="positive"
          icon="verified"
          :disable="seleccionados.length === 0"
          :loading="timbrando"
          @click="timbrarGlobal"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
  import { ref, computed } from 'vue'
  import { api } from 'boot/axios'
  import { useQuasar } from 'quasar'
  import { useAuthStore } from 'stores/auth'

  const $q = useQuasar()
  const authStore = useAuthStore()
  const loadingTickets = ref(false)
  const timbrando = ref(false)
  const tickets = ref([])
  const seleccionados = ref([])

  const emit = defineEmits(['success'])

  const isOpen = defineModel({ default: false })

  const filtros = ref({
    fechaInicio: new Date().toISOString().split('T')[0],
    fechaFin: new Date().toISOString().split('T')[0],
    metodoPago: 'Todos'
  })

  const configGlobal = ref({
    periodicidad: '01',
    meses: '01',
    ano: new Date().getFullYear()
  })

  const opcionesPeriodicidad = [
    { label: '01 - Diario', value: '01' },
    { label: '02 - Semanal', value: '02' },
    { label: '03 - Quincenal', value: '03' },
    { label: '04 - Mensual', value: '04' }
  ]

  const opcionesMeses = [
    { label: '01 - Enero', value: '01' },
    { label: '02 - Febrero', value: '02' },
    { label: '03 - Marzo', value: '03' },
    { label: '04 - Abril', value: '04' },
    { label: '05 - Mayo', value: '05' },
    { label: '06 - Junio', value: '06' },
    { label: '07 - Julio', value: '07' },
    { label: '08 - Agosto', value: '08' },
    { label: '09 - Septiembre', value: '09' },
    { label: '10 - Octubre', value: '10' },
    { label: '11 - Noviembre', value: '11' },
    { label: '12 - Diciembre', value: '12' }
  ]

  const columns = [
    { name: 'folio', label: 'Folio Ticket', field: 'folio', align: 'left', sortable: true },
    { name: 'fecha', label: 'Fecha/Hora', field: 'fecha', align: 'left', sortable: true },
    { name: 'metodo', label: 'Método Pago', field: 'metodo_pago', align: 'center' },
    { name: 'total', label: 'Monto', field: 'total', format: val => formatCurrency(val), align: 'right', sortable: true }
  ]

  const formatFecha = (fechaIso) => {
    if (!fechaIso) return ''
    // Crea formato "26 Ene, 2026"
    const fecha = new Date(fechaIso)
    return new Intl.DateTimeFormat('es-MX', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).format(fecha)
  }

  const formatHora = (fechaIso) => {
    if (!fechaIso) return ''
    // Crea formato "03:45 PM"
    const fecha = new Date(fechaIso)
    return new Intl.DateTimeFormat('es-MX', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).format(fecha)
  }

  const getMetodoColor = (metodo) => {
    const m = (metodo || '').toLowerCase()
    if (m.includes('efectivo')) return 'emerald-500' // O 'green-6' si usas paleta Quasar
    if (m.includes('tarjeta')) return 'blue-7'
    if (m.includes('transferencia')) return 'purple-6'
    return 'grey-6'
  }

  const totalSeleccionado = computed(() => {
    return seleccionados.value.reduce((acc, row) => acc + parseFloat(row.total), 0)
  })

  const buscarTickets = async () => {
    loadingTickets.value = true
    try {
      const params  = { ...filtros.value, sucursalSeleccionada: authStore.sucursalSeleccionada.id }
      const { data } = await api.get('/api/factura-global/tickets', { params })
      tickets.value = data
      seleccionados.value = data // Auto-seleccionar todos al inicio
    } catch (e) {
      $q.notify({ type: 'negative', message: 'Error al buscar tickets' })
    } finally {
      loadingTickets.value = false
    }
  }

  const timbrarGlobal = async () => {
    $q.dialog({
      title: 'Confirmar Factura Global',
      message: `Vas a timbrar ${seleccionados.value.length} tickets por un total de ${formatCurrency(totalSeleccionado.value)}. ¿Continuar?`,
      cancel: true,
      persistent: true
    }).onOk(async () => {
      timbrando.value = true
      try {
        const payload = {
          tickets_ids: seleccionados.value.map(t => t.id),
          sucursal_id: authStore.sucursalSeleccionada.id,
          ...configGlobal.value
        }

        const { data } = await api.post('/api/factura-global', payload)

        $q.notify({ type: 'positive', message: 'Factura Global Timbrada Exitosamente', icon: 'check_circle' })
        emit('success')
        isOpen.value = false
        // Aquí podrías emitir un evento para recargar la tabla principal
      } catch (e) {
          const mensajePrincipal = e.response?.data?.message || 'Error de conexión';
          const detalleTecnico = e.response?.data?.error_pac || ''; // Leemos el campo nuevo
          $q.notify({
            type: 'negative',
            icon: 'error',
            message: mensajePrincipal,
            caption: detalleTecnico, // El error del PAC aparecerá aquí abajo en pequeño
            html: true, // Por si el error trae saltos de línea
            actions: [{ label: 'Cerrar', color: 'white', handler: () => { /* ... */ } }]
          })
      } finally {
        timbrando.value = false
      }
    })
  }

  const resetForm = () => {
    const hoy = new Date().toISOString().split('T')[0]
    filtros.value = {
      fechaInicio: hoy,
      fechaFin: hoy,
      metodoPago: 'Todos'
    }
    tickets.value = []
    seleccionados.value = []
    configGlobal.value = {
      periodicidad: '01',
      meses: '01',
      ano: new Date().getFullYear()
    }
  }

  const formatCurrency = (val) => {
    const numericVal = parseFloat(val)
    if (isNaN(numericVal)) return '$0.00'
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(numericVal)
  }
</script>

<style lang="scss" scoped>
  // Colores personalizados si no usas Tailwind
  .text-slate-800 { color: #1e293b; }
  .bg-emerald-500 { background-color: #10b981 !important; } // Verde elegante para efectivo

  .border-radius-12 {
    border-radius: 12px;
    overflow: hidden; // Para que las esquinas de la tabla se recorten
  }

  .premium-table {
    /* Encabezados sutiles */
    :deep(thead tr:first-child th) {
      background-color: #f8fafc; // Gris muy claro
      color: #64748b; // Texto gris medio
      font-size: 0.75rem;
      font-weight: 800;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      padding: 12px 16px;
    }

    /* Filas con hover suave */
    :deep(tbody tr) {
      transition: background-color 0.2s ease;
      &:hover {
        background-color: #f1f5f9; // Azul grisáceo muy tenue al pasar el mouse
      }
    }

    /* Celdas más compactas pero legibles */
    :deep(tbody td) {
      padding: 8px 16px;
      height: 55px; // Altura fija para consistencia visual
      border-bottom: 1px solid #f1f5f9;
    }

    /* Fuente monoespaciada para folios */
    .font-mono {
      font-family: 'Consolas', 'Monaco', monospace;
      letter-spacing: -0.5px;
    }
  }

  /* Scroll bonito para la tabla */
  :deep(.q-table__middle) {
    &::-webkit-scrollbar { width: 6px; height: 6px; }
    &::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
    &::-webkit-scrollbar-track { background: transparent; }
  }
</style>
