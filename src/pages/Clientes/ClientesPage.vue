<template>
  <q-page class="q-pa-md bg-grey-2">
    <q-card class="shadow-15 no-border-radius">

      <q-table
        :rows="rows"
        :columns="columns"
        row-key="id"
        :loading="loading"
        flat
        bordered
        class="my-sticky-header-table"
        :filter="filter"
      >
        <template v-slot:top>
          <div class="col-12 row items-center q-gutter-md">
            <div class="text-h5 text-primary text-bold q-pr-md">
              <q-icon name="group" size="md" class="q-mr-sm" />
              Gestión de Clientes
            </div>

            <q-input
              v-model="filter"
              placeholder="Buscar por razón social, RFC..."
              outlined
              dense
              debounce="300"
              class="col-grow"
              bg-color="white"
            >
              <template v-slot:append>
                <q-icon name="search" />
              </template>
            </q-input>

            <q-btn
              color="primary"
              icon="person_add"
              label="Nuevo Cliente"
              class="q-px-lg shadow-2"
              @click="openCreate"
            />
          </div>
        </template>

        <template v-slot:body-cell-numero_global="props">
          <q-td :props="props">
            <q-chip
              color="grey-8"
              text-color="white"
              icon="tag"
              size="sm"
              class="text-bold"
            >
              {{ props.value }}
            </q-chip>
          </q-td>
        </template>

        <template v-slot:body-cell-rfc="props">
          <q-td :props="props">
            <div class="text-weight-medium text-mono">{{ props.value || 'N/A' }}</div>
          </q-td>
        </template>

        <template v-slot:body-cell-telefono="props">
          <q-td :props="props">
            <div v-if="props.value" class="row items-center">
              <q-icon name="phone" color="grey-6" size="xs" class="q-mr-xs" />
              {{ props.value }}
            </div>
            <span v-else class="text-grey-5">Sin teléfono</span>
          </q-td>
        </template>

        <template v-slot:body-cell-tipo_pago="props">
          <q-td :props="props">
            <q-badge
              :color="getTipoPagoColor(props.value)"
              class="text-bold q-px-md q-py-xs shadow-1"
              style="font-size: 0.75rem; border-radius: 4px;"
            >
              <q-icon :name="getTipoPagoIcon(props.value)" size="14px" class="q-mr-xs" />
              {{ getTipoPagoLabel(props.value) }}
            </q-badge>
          </q-td>
        </template>

        <template v-slot:body-cell-limite_credito="props">
          <q-td :props="props" class="text-bold text-blue-9">
            $ {{ formatCurrency(props.value) }}
          </q-td>
        </template>

        <template v-slot:body-cell-saldo_actual="props">
          <q-td :props="props">
            <q-badge
              :color="props.value > 0 ? 'red-2' : 'green-2'"
              :text-color="props.value > 0 ? 'red-9' : 'green-9'"
              class="q-px-md q-py-xs text-bold"
              style="font-size: 0.9rem"
            >
              $ {{ formatCurrency(props.value) }}
            </q-badge>
          </q-td>
        </template>

        <template v-slot:body-cell-actions="props">
          <q-td :props="props" class="q-gutter-sm">
            <q-btn
              flat round
              color="indigo"
              icon="edit"
              size="sm"
              @click="openEdit(props.row)"
            >
              <q-tooltip>Editar Cliente</q-tooltip>
            </q-btn>
            <q-btn
              flat round
              color="negative"
              icon="delete"
              size="sm"
              @click="confirmDelete(props.row)"
            >
              <q-tooltip>Eliminar Cliente</q-tooltip>
            </q-btn>
          </q-td>
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
  import { ref, onMounted } from 'vue'
  import { api } from 'boot/axios'
  import { useQuasar } from 'quasar'
  import ClientesForm from 'components/Clientes/ClientesForm.vue'

  const $q = useQuasar()
  const rows = ref([])
  const taxRegimes = ref([])
  const loading = ref(true)
  const showDialog = ref(false)
  const selectedCustomer = ref(null)
  const filter = ref('')

  // Definición de columnas profesional
  const columns = [
    { name: 'numero_global', label: 'No. CLIENTE', field: 'numero_global', align: 'left', sortable: true },
    { name: 'razon_social', label: 'RAZÓN SOCIAL', field: 'razon_social', align: 'left', sortable: true },
    { name: 'rfc', label: 'RFC', field: 'rfc', align: 'left' },
    { name: 'telefono', label: 'TELÉFONO', field: 'telefono', align: 'left' },
    { name: 'tipo_pago', label: 'MODO PAGO', field: 'tipo_pago', align: 'center', sortable: true },
    { name: 'limite_credito', label: 'LÍMITE CRÉDITO', field: 'limite_credito', align: 'right', sortable: true },
    { name: 'saldo_actual', label: 'SALDO ACTUAL', field: 'saldo_actual', align: 'right', sortable: true },
    { name: 'actions', label: 'ACCIONES', align: 'center' }
  ]

  const openCreate = () => {
    selectedCustomer.value = null
    showDialog.value = true
  }

  const openEdit = (customer) => {
    selectedCustomer.value = { ...customer }
    showDialog.value = true
  }

  const confirmDelete = (customer) => {
    $q.dialog({
      title: 'Eliminar Cliente',
      message: `¿Estás seguro de eliminar a "${customer.razon_social}"? Esta acción no se puede deshacer.`,
      ok: { label: 'Eliminar', color: 'negative', flat: true },
      cancel: { label: 'Cancelar', color: 'grey-8', flat: true },
      persistent: true
    }).onOk(async () => {
      try {
        await api.delete(`/api/clientes/${customer.id}`)
        $q.notify({ color: 'positive', message: 'Cliente eliminado', icon: 'check', position: 'bottom-right' })
        loadCustomers()
      } catch (e) {
        $q.notify({ color: 'negative', message: 'Error al eliminar', icon: 'error' })
      }
    })
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

  // Retorna el texto legible según el valor numérico
  const getTipoPagoLabel = (val) => {
    const labels = {
      0: 'DESHABILITADO',
      1: 'SOLO CONTADO',
      2: 'SOLO CRÉDITO',
      3: 'CONTADO / CRÉDITO'
    }
    return labels[val] || 'DESCONOCIDO'
  }

  // Retorna el color semántico (Estilo robusto de La Nacional)
  const getTipoPagoColor = (val) => {
    const colors = {
      0: 'pink-6',     // Peligro / Bloqueado
      1: 'green-8',   // Seguro / Efectivo
      2: 'cyan-9',  // Advertencia / Cuentas por cobrar
      3: 'indigo-9'   // Preferencial / Flexible
    }
    return colors[val] || 'grey-7'
  }

  // Retorna un icono representativo
  const getTipoPagoIcon = (val) => {
    const icons = {
      0: 'block',
      1: 'payments',
      2: 'credit_card',
      3: 'dynamic_feed'
    }
    return icons[val] || 'help'
  }

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-MX', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value || 0)
  }

  onMounted(async () => {
    loadCustomers()
    const resTax = await api.get('/api/tax-regimes')
    taxRegimes.value = resTax.data.map(r => ({ label: `${r.code} - ${r.name}`, value: r.id }))
  })
</script>

<style lang="sass">
.my-sticky-header-table
  /* Estilo para que el encabezado sea de color */
  thead tr th
    background-color: #f5f5f5 // Un gris muy claro profesional
    color: #1d1d1d
    font-weight: bold
    font-size: 0.85rem
    border-bottom: 2px solid $primary !important

  .text-mono
    font-family: 'Courier New', Courier, monospace
    letter-spacing: 1px
</style>
