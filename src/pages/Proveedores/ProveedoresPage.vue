<template>
  <q-page class="q-pa-lg bg-grey-2">
    <div class="row q-col-gutter-md q-mb-lg">
      <div class="col-12 col-md-4">
        <q-card class="stats-card bg-white shadow-2">
          <q-card-section class="row items-center no-wrap">
            <q-avatar icon="local_shipping" color="primary" text-color="white" shadow-5 />
            <div class="q-ml-md">
              <div class="text-h6 text-bold">{{ rows.length }}</div>
              <div class="text-caption text-grey-7">Proveedores Registrados</div>
            </div>
          </q-card-section>
        </q-card>
      </div>

      <div class="col-12 col-md-4">
        <q-card class="stats-card bg-white shadow-2 border-left-red">
          <q-card-section class="row items-center no-wrap">
            <q-avatar icon="account_balance_wallet" color="negative" text-color="white" shadow-5 />
            <div class="q-ml-md">
              <div class="text-h6 text-bold text-negative">${{ totalDeuda.toLocaleString() }}</div>
              <div class="text-caption text-grey-7">Saldo Total Pendiente</div>
            </div>
          </q-card-section>
        </q-card>
      </div>

      <div class="col-12 col-md-4 text-right self-center">
        <q-btn
          color="primary"
          icon="add"
          label="Nuevo Proveedor"
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
          <div class="text-h6 text-bold text-primary">Listado de Proveedores</div>
        </template>

        <template v-slot:top-right>
          <q-input
            v-model="filter"
            placeholder="Buscar por nombre, RFC o ID..."
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
            <q-td key="numero_global" :props="props">
              <q-badge color="grey-3" text-color="primary" class="text-bold q-pa-xs">
                {{ props.row.numero_global }}
              </q-badge>
            </q-td>

            <q-td key="nombre_comercial" :props="props">
              <div class="text-bold">{{ props.row.nombre_comercial }}</div>
              <div class="text-caption text-grey-6">{{ props.row.rfc || 'Sin RFC' }}</div>
            </q-td>

            <q-td key="email" :props="props">
              <div class="row items-center no-wrap">
                <q-icon name="mail_outline" size="xs" color="grey-7" class="q-mr-xs" />
                {{ props.row.email }}
              </div>
              <div class="row items-center no-wrap text-caption text-grey-6">
                <q-icon name="phone" size="xs" color="grey-7" class="q-mr-xs" />
                {{ props.row.telefono || 'N/A' }}
              </div>
            </q-td>

            <q-td key="saldo_actual" :props="props" class="text-right">
              <div :class="props.row.saldo_actual > 0 ? 'text-negative text-bold' : 'text-positive'">
                ${{ props.row.saldo_actual.toLocaleString('en-US', { minimumFractionDigits: 2 }) }}
              </div>
              <q-linear-progress
                :value="getProgresoCredito(props.row)"
                :color="props.row.saldo_actual > 0 ? 'negative' : 'positive'"
                class="q-mt-xs"
              />
            </q-td>

            <q-td key="actions" :props="props" class="text-center">
              <q-btn flat round color="primary" icon="edit" @click="openEdit(props.row)">
                <q-tooltip>Editar Proveedor</q-tooltip>
              </q-btn>
              <q-btn flat round color="negative" icon="delete" @click="confirmDelete(props.row)">
                <q-tooltip>Eliminar Proveedor</q-tooltip>
              </q-btn>
            </q-td>
          </q-tr>
        </template>
      </q-table>
    </q-card>

    <ProveedorForm v-model="showDialog" :editData="selectedItem" @saved="loadData" />
  </q-page>
</template>

<script setup>
  import { ref, computed, onMounted } from 'vue'
  import { api } from 'boot/axios'
  import { useQuasar } from 'quasar'
  import ProveedorForm from 'components/Proveedores/ProveedoresForm.vue'

  const $q = useQuasar()
  const rows = ref([])
  const loading = ref(false)
  const filter = ref('')
  const showDialog = ref(false)
  const selectedItem = ref(null)

  const columns = [
    { name: 'numero_global', label: 'ID', field: row => `${row.numero_global} ${row.nombre_comercial || ''} ${row.razon_social} ${row.rfc || ''} ${row.email || ''}`, align: 'left', sortable: true, sort: (a, b) => parseInt(a) - parseInt(b) },
    { name: 'nombre_comercial', label: 'RAZON SOCIAL / RFC', field: 'nombre_comercial', align: 'left', sortable: true },
    { name: 'email', label: 'CONTACTO', align: 'left' },
    { name: 'saldo_actual', label: 'ESTADO DE CUENTA', field: 'saldo_actual', align: 'right', sortable: true },
    { name: 'actions', label: 'ACCIONES', align: 'center' }
  ]

  const totalDeuda = computed(() => rows.value.reduce((acc, curr) => acc + curr.saldo_actual, 0))

  const getProgresoCredito = (row) => {
    if (!row.limite_credito || row.limite_credito === 0) return 0
    return Math.min(row.saldo_actual / row.limite_credito, 1)
  }

  const loadData = async () => {
    loading.value = true
    try {
      const res = await api.get('/api/providers')
      rows.value = res.data
    } catch (e) {
      console.error(e)
    } finally { loading.value = false }
  }

  const openCreate = () => { selectedItem.value = null; showDialog.value = true }
  const openEdit = (row) => { selectedItem.value = { ...row }; showDialog.value = true }

  const confirmDelete = (row) => {
    $q.dialog({
      title: '<div class="text-negative"><q-icon name="warning" /> Confirmar Eliminación</div>',
      message: `¿Desea eliminar definitivamente a <b>${row.nombre_comercial}</b>?`,
      html: true,
      ok: { label: 'Eliminar', color: 'negative', unelevated: true },
      cancel: { label: 'Cancelar', flat: true, color: 'grey-7' },
      persistent: true
    }).onOk(async () => {
      try {
        await api.delete(`/api/proveedores/${row.id}`)
        $q.notify({ color: 'positive', message: 'Proveedor eliminado correctamente', icon: 'done' })
        loadData()
      } catch (e) {
        $q.notify({ color: 'negative', message: 'Error al eliminar', icon: 'error' })
      }
    })
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

  .border-left-red { border-left: 5px solid $negative; }
  .border-radius-15 { border-radius: 15px; }

  .main-table {
    background: white;
    :deep(thead th) {
      font-weight: bold;
      text-transform: uppercase;
      color: #555;
      background: #f9f9f9;
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
