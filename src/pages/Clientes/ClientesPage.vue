<template>
  <q-page class="q-pa-lg bg-grey-2">
    <div class="row q-col-gutter-md q-mb-lg">
      <div class="col-12 col-md-4">
        <q-card class="stats-card bg-white shadow-2">
          <q-card-section class="row items-center no-wrap">
            <q-avatar icon="group" color="primary" text-color="white" shadow-5 />
            <div class="q-ml-md">
              <div class="text-h6 text-bold">{{ rows.length }}</div>
              <div class="text-caption text-grey-7">Clientes Registrados</div>
            </div>
          </q-card-section>
        </q-card>
      </div>

      <div class="col-12 col-md-4">
        <q-card class="stats-card bg-white shadow-2 border-left-red">
          <q-card-section class="row items-center no-wrap">
            <q-avatar icon="request_quote" color="negative" text-color="white" shadow-5 />
            <div class="q-ml-md">
              <div class="text-h6 text-bold text-negative">$ {{ formatCurrency(totalDeuda) }}</div>
              <div class="text-caption text-grey-7">Deuda Total de Clientes</div>
            </div>
          </q-card-section>
        </q-card>
      </div>

      <div class="col-12 col-md-4 text-right self-center">
        <q-btn
          color="primary"
          icon="person_add"
          label="Nuevo Cliente"
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
          <div class="text-h6 text-bold text-primary">Listado de Clientes</div>
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
                #{{ props.row.numero_global }}
              </q-badge>
               <div class="text-bold">{{ props.row.nombre_comercial || 'Sin Nombre Comercial' }}</div>
            </q-td>

            <q-td key="razon_social" :props="props">
              <div class="text-bold">{{ props.row.razon_social }}</div>
              <div class="text-caption text-grey-6 text-mono">{{ props.row.rfc || 'Sin RFC' }}</div>
            </q-td>

            <q-td key="email" :props="props">
              <div class="row items-center no-wrap">
                <q-icon name="mail_outline" size="xs" color="grey-7" class="q-mr-xs" />
                <span class="text-caption">{{ props.row.email }}</span>
              </div>
              <div class="row items-center no-wrap text-caption text-grey-6">
                <q-icon name="phone" size="xs" color="grey-7" class="q-mr-xs" />
                {{ props.row.telefono || 'N/A' }}
              </div>
            </q-td>

            <q-td key="tipo_pago" :props="props" class="text-center">
              <q-badge
                :color="getTipoPagoColor(props.row.tipo_pago)"
                class="text-bold q-px-sm q-py-xs shadow-1"
                style="font-size: 0.7rem; border-radius: 4px;"
              >
                <q-icon :name="getTipoPagoIcon(props.row.tipo_pago)" size="12px" class="q-mr-xs" />
                {{ getTipoPagoLabel(props.row.tipo_pago) }}
              </q-badge>
            </q-td>

            <q-td key="saldo_actual" :props="props" class="text-right">
              <div :class="props.row.saldo_actual > 0 ? 'text-negative text-bold' : 'text-positive text-bold'">
                $ {{ formatCurrency(props.row.saldo_actual) }}
              </div>
              <q-linear-progress
                v-if="props.row.limite_credito > 0"
                :value="getProgresoCredito(props.row)"
                :color="props.row.saldo_actual > props.row.limite_credito ? 'red-9' : 'primary'"
                class="q-mt-xs"
                size="4px"
                rounded
              />
            </q-td>

            <q-td key="actions" :props="props" class="text-center">
              <q-btn flat round color="indigo" icon="edit" @click="openEdit(props.row)">
                <q-tooltip>Editar Cliente</q-tooltip>
              </q-btn>
              <q-btn flat round color="negative" icon="delete" @click="confirmDelete(props.row)">
                <q-tooltip>Eliminar Cliente</q-tooltip>
              </q-btn>
            </q-td>
          </q-tr>
        </template>
      </q-table>
    </q-card>

    <ClientesForm
      v-model="showDialog"
      :editData="selectedCustomer"
      :taxRegimes="taxRegimes"
      @saved="loadCustomers"
    />
  </q-page>
</template>

<script setup>
  import { ref, computed, onMounted } from 'vue'
  import { api } from 'boot/axios'
  import { useQuasar } from 'quasar'
  import ClientesForm from 'components/Clientes/ClientesForm.vue'

  const $q = useQuasar()
  const rows = ref([])
  const taxRegimes = ref([])
  const loading = ref(true)
  const filter = ref('')
  const showDialog = ref(false)
  const selectedCustomer = ref(null)

  const columns = [
    { name: 'numero_global', label: 'GLOBAL / NOMBRE COMERCIAL', field: row => `${row.numero_global} ${row.nombre_comercial || ''} ${row.razon_social} ${row.rfc || ''} ${row.email || ''}`, align: 'left', sortable: true, sort: (a, b) => parseInt(a) - parseInt(b) },
    { name: 'razon_social', label: 'RAZON SOCIAL / RFC', field: 'razon_social', align: 'left', sortable: true },
    { name: 'email', label: 'CONTACTO', align: 'left' },
    { name: 'tipo_pago', label: 'MÉTODO PAGO', align: 'center', sortable: true },
    { name: 'saldo_actual', label: 'ESTADO DE CUENTA', field: 'saldo_actual', align: 'right', sortable: true },
    { name: 'actions', label: 'ACCIONES', align: 'center' }
  ]

  const totalDeuda = computed(() => rows.value.reduce((acc, curr) => acc + (curr.saldo_actual || 0), 0))

  const getProgresoCredito = (row) => {
    if (!row.limite_credito || row.limite_credito === 0) return 0
    return Math.min((row.saldo_actual || 0) / row.limite_credito, 1)
  }

  const loadCustomers = async () => {
    loading.value = true
    try {
      const res = await api.get('/api/clientes')
      rows.value = res.data
    } finally {
      loading.value = false
    }
  }

  const openCreate = () => { selectedCustomer.value = null; showDialog.value = true }
  const openEdit = (customer) => { selectedCustomer.value = { ...customer }; showDialog.value = true }

  const confirmDelete = (customer) => {
    $q.dialog({
      title: '<div class="text-negative"><q-icon name="warning" /> Eliminar Cliente</div>',
      message: `¿Estás seguro de eliminar a <b>${customer.razon_social}</b>?`,
      html: true,
      ok: { label: 'Eliminar', color: 'negative', unelevated: true },
      cancel: { label: 'Cancelar', flat: true, color: 'grey-8' },
      persistent: true
    }).onOk(async () => {
      try {
        await api.delete(`/api/clientes/${customer.id}`)
        $q.notify({ color: 'positive', message: 'Cliente eliminado', icon: 'check' })
        loadCustomers()
      } catch (e) {
        $q.notify({ color: 'negative', message: 'Error al eliminar', icon: 'error' })
      }
    })
  }

  // Helpers visuales (Tus lógicas originales conservadas)
  const getTipoPagoLabel = (val) => {
    const labels = { 0: 'DESHABILITADO', 1: 'CONTADO', 2: 'CRÉDITO', 3: 'MIXTO' }
    return labels[val] || 'N/A'
  }

  const getTipoPagoColor = (val) => {
    const colors = { 0: 'pink-6', 1: 'green-8', 2: 'cyan-9', 3: 'indigo-9' }
    return colors[val] || 'grey-7'
  }

  const getTipoPagoIcon = (val) => {
    const icons = { 0: 'block', 1: 'payments', 2: 'credit_card', 3: 'add_card' }
    return icons[val] || 'help'
  }

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value || 0)
  }

  onMounted(async () => {
    loadCustomers()
    const resTax = await api.get('/api/tax-regimes')
    taxRegimes.value = resTax.data.map(r => ({ label: `${r.code} - ${r.name}`, value: r.id }))
  })
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

  .text-mono {
    font-family: 'Courier New', Courier, monospace;
    letter-spacing: 0.5px;
  }
</style>
