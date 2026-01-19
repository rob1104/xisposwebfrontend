<template>
  <q-page class="q-pa-lg bg-grey-2">
    <div class="row q-col-gutter-md q-mb-lg">
      <div class="col-12 col-md-4">
        <q-card class="stats-card bg-white shadow-2">
          <q-card-section class="row items-center no-wrap">
            <q-avatar icon="storefront" color="primary" text-color="white" shadow-5 />
            <div class="q-ml-md">
              <div class="text-h6 text-bold">{{ rows.length }}</div>
              <div class="text-caption text-grey-7">Sucursales Totales</div>
            </div>
          </q-card-section>
        </q-card>
      </div>

      <div class="col-12 col-md-4">
        <q-card class="stats-card bg-white shadow-2 border-left-green">
          <q-card-section class="row items-center no-wrap">
            <q-avatar icon="check_circle" color="positive" text-color="white" shadow-5 />
            <div class="q-ml-md">
              <div class="text-h6 text-bold text-positive">{{ sucursalesActivas }}</div>
              <div class="text-caption text-grey-7">Sedes Operativas</div>
            </div>
          </q-card-section>
        </q-card>
      </div>

      <div class="col-12 col-md-4 text-right self-center">
        <q-btn
          color="primary"
          icon="add"
          label="Nueva Sucursal"
          size="lg"
          class="shadow-5 custom-btn-radius"
          unelevated
          @click="openCreate"
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
        <template v-slot:top-left>
          <div class="text-h6 text-bold text-primary">Control de Puntos de Venta</div>
        </template>

        <template v-slot:top-right>
          <q-input
            v-model="filter"
            placeholder="Buscar sucursal..."
            outlined
            dense
            class="search-input"
            bg-color="white"
          >
            <template v-slot:append><q-icon name="search" /></template>
          </q-input>
        </template>

        <template v-slot:body="props">
          <q-tr :props="props" class="hover-row">

            <q-td key="nombre" :props="props">
              <div class="row items-center no-wrap">
                <q-icon name="location_on" color="primary" size="sm" class="q-mr-sm" />
                <div>
                  <div class="text-bold text-subtitle2">{{ props.row.nombre }}</div>
                  <div class="text-caption text-grey-7">{{ props.row.direccion || 'Dirección no especificada' }}</div>
                </div>
              </div>
            </q-td>

            <q-td key="telefono" :props="props" class="text-center">
              <div v-if="props.row.telefono" class="row items-center justify-center no-wrap">
                <q-icon name="phone" size="xs" color="grey-7" class="q-mr-xs" />
                <span class="text-weight-medium">{{ props.row.telefono }}</span>
              </div>
              <span v-else class="text-caption text-grey-5">Sin teléfono</span>
            </q-td>

            <q-td key="prefijo" :props="props">
              <div class="row items-center justify-center no-wrap">
                <q-chip icon="star" class="glossy" color="purple" text-color="white">{{ props.row.prefijo }}</q-chip>

              </div>
            </q-td>

            <q-td key="bascula" :props="props">
              <div class="row items-center justify-center no-wrap">
                <span style="color: blue; font-size: 18px; font-weight: bold;">{{ props.row.bascula }}</span>

              </div>
            </q-td>




            <q-td key="status" :props="props" class="text-center">
              <q-badge
                :color="props.row.status === 1 ? 'positive' : 'negative'"
                class="text-bold q-px-md q-py-xs shadow-1"
                rounded
              >
                <q-icon :name="1 === 1 ? 'check' : 'close'" size="xs" class="q-mr-xs" />
                {{ 1 === 1 ? 'ACTIVA' : 'INACTIVA' }}
              </q-badge>
            </q-td>

            <q-td key="actions" :props="props" class="text-center">
              <q-btn
                flat round
                color="deep-orange"
                icon="account_balance"
                @click="configurarEmisor(props.row)"
              >
                <q-tooltip>Configurar Datos Fiscales (SAT)</q-tooltip>
              </q-btn>
              <q-btn flat round color="purple" icon="receipt_long" @click="openTicketConfig(props.row)">
                <q-tooltip>Diseñar Ticket</q-tooltip>
             </q-btn>
              <q-btn flat round color="indigo" icon="edit" @click="openEdit(props.row)">
                <q-tooltip>Editar Sucursal</q-tooltip>
              </q-btn>
              <q-btn flat round color="negative" icon="delete" @click="confirmDelete(props.row)">
                <q-tooltip>Eliminar Sucursal</q-tooltip>
              </q-btn>
            </q-td>
          </q-tr>
        </template>
      </q-table>
    </q-card>
    <TicketConfigModal v-model="showTicketConfig" :sucursal="selectedSucursalConfig" />
    <SucursalForm v-model="showDialog" :editData="selectedItem" @saved="loadData" />
    <DialogEmisorSucursal
        v-model="modalEmisor"
        :sucursal="sucursalSeleccionada"
        @actualizado="obtenerSucursales"
      />
  </q-page>
</template>

<script setup>
  import { ref, computed, onMounted } from 'vue'
  import { api } from 'boot/axios'
  import { useQuasar } from 'quasar'
  import SucursalForm from 'components/Sucursales/SucursalesForm.vue'
  import TicketConfigModal from 'components/Sucursales/TicketConfigModal.vue'
  import DialogEmisorSucursal from 'src/components/Sucursales/DialogEmisorSucursal.vue'

  const $q = useQuasar()
  const rows = ref([])
  const loading = ref(false)
  const filter = ref('')
  const showDialog = ref(false)
  const selectedItem = ref(null)

  const showTicketConfig = ref(false)
  const selectedSucursalConfig = ref(null)
  const modalEmisor = ref(false)
  const sucursalSeleccionada = ref(null)

  const openTicketConfig = (row) => {
    selectedSucursalConfig.value = { ...row }
    showTicketConfig.value = true
  }



  const configurarEmisor = (sucursal) => {
    sucursalSeleccionada.value = sucursal
    modalEmisor.value = true
  }

  const columns = [
    { name: 'nombre', label: 'SUCURSAL / UBICACIÓN', field: 'nombre', align: 'left', sortable: true },
    { name: 'telefono', label: 'TELÉFONO DE CONTACTO', field: 'telefono', align: 'center' },
    { name: 'prefijo', label: 'PREFIJO PARA DOCUMENTOS', field: 'telefono', align: 'center' },
    { name: 'bascula', label: 'IDENTIFICADOR BASCULA', field: 'telefono', align: 'center' },
    { name: 'status', label: 'ESTADO ACTUAL', field: 'status', align: 'center', sortable: true },
    { name: 'actions', label: 'ACCIONES', align: 'center' }
  ]

  // Estadísticas para los KPIs superiores
  const sucursalesActivas = computed(() => rows.value.length)

  const loadData = async () => {
    loading.value = true
    try {
      const res = await api.get('/api/sucursales')
      rows.value = res.data
    } catch (e) {
      console.error(e)
    } finally { loading.value = false }
  }

  const openCreate = () => { selectedItem.value = null; showDialog.value = true }
  const openEdit = (row) => { selectedItem.value = { ...row }; showDialog.value = true }

  const confirmDelete = (row) => {
    $q.dialog({
      title: '<div class="text-negative"><q-icon name="warning" /> Confirmar Cierre</div>',
      message: `¿Deseas eliminar permanentemente la sucursal <b>${row.nombre}</b>?`,
      html: true,
      ok: { label: 'Eliminar', color: 'negative', unelevated: true },
      cancel: { label: 'Cancelar', flat: true, color: 'grey-7' },
      persistent: true
    }).onOk(async () => {
      try {
        const res = await api.delete(`/api/sucursales/${row.id}`)
        $q.notify({ color: 'positive', message: res.data.message, icon: 'done' })
        loadData()
      } catch (e) {
        $q.notify({ color: 'negative', message: e.response?.data?.message || 'Error', icon: 'report_problem' })
      }
    })
  }

  const obtenerSucursales = () => {
    loadData()
  }

  onMounted(loadData)
</script>

<style lang="scss" scoped>
  .stats-card {
    border-radius: 12px;
    border-bottom: 4px solid #eee;
    transition: transform 0.3s;
    &:hover { transform: translateY(-5px); }
  }

  .border-left-green { border-left: 5px solid $positive; }
  .border-radius-15 { border-radius: 15px; }

  .main-table {
    background: white;
    :deep(thead th) {
      font-weight: bold;
      text-transform: uppercase;
      color: #555;
      background: #f9f9f9;
      border-bottom: 2px solid $primary;
    }
  }

  .search-input {
    width: 350px;
    transition: all 0.3s;
    &:focus-within { width: 450px; }
  }

  .hover-row {
    transition: background 0.2s;
    &:hover { background: #f1f5f9 !important; }
  }

  .custom-btn-radius {
    border-radius: 10px;
    font-weight: bold;
  }
</style>
