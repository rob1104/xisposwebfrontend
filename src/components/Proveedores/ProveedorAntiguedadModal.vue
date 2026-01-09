<template>
  <q-dialog v-model="internalValue" full-width transition-show="slide-up" transition-hide="slide-down">
    <q-card class="bg-grey-1" style="border-radius: 20px;">
      <q-card-section class="row items-center bg-white q-pa-md border-bottom">
        <q-avatar icon="account_balance_wallet" color="orange-1" text-color="orange-10" />
        <div class="q-ml-md">
          <div class="text-h6 text-bold">Antigüedad de Saldos</div>
          <div class="text-subtitle2 text-primary">
            {{ proveedor?.numero_global }} - {{ proveedor?.nombre_comercial || 'Cargando...' }}
          </div>
        </div>
        <q-space />
        <q-btn icon="print" flat round color="grey-7" @click="imprimirReporte">
          <q-tooltip>Imprimir Reporte</q-tooltip>
        </q-btn>
        <q-btn icon="close" flat round v-close-popup />
      </q-card-section>

      <q-card-section class="q-pa-lg">
        <div class="row q-col-gutter-md">
          <div v-for="(val, key) in summaryCards" :key="key" class="col-12 col-sm-6 col-md-2">
            <q-card flat bordered class="text-center q-pa-sm shadow-1" :class="val.bg">
              <div class="text-caption text-uppercase text-bold text-grey-7">{{ val.label }}</div>
              <div class="text-h6 text-bold" :class="val.color">$ {{ formatMoney(val.amount) }}</div>
            </q-card>
          </div>
        </div>

        <q-table
          :rows="detalles"
          :columns="columns"
          :loading="loading"
          flat bordered
          class="q-mt-lg shadow-2 main-table"
          hide-bottom
          :pagination="{ rowsPerPage: 0 }"
        >
          <template v-slot:body-cell-status="props">
            <q-td :props="props">
              <q-badge :color="getStatusColor(props.row.dias_vencidos)" class="text-bold q-px-sm">
                {{ props.row.dias_vencidos || 0 }} días
              </q-badge>
            </q-td>
          </template>
        </q-table>
      </q-card-section>

      <q-card-actions align="right" class="bg-white q-pa-md">
        <q-btn label="Cerrar Reporte" flat color="grey-8" v-close-popup class="q-px-lg" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
  import { ref, watch, computed } from 'vue'
  import { api } from 'boot/axios'
  import { date } from 'quasar' // Importamos helper de fechas de Quasar

  const props = defineProps(['modelValue', 'proveedor'])
  const emit = defineEmits(['update:modelValue'])

  const internalValue = computed({
    get: () => props.modelValue,
    set: (val) => emit('update:modelValue', val)
  })

  const loading = ref(false)
  const buckets = ref({})
  const detalles = ref([])

  const imprimirReporte = () => { window.print() }

  const formatMoney = (n) => {
    // Manejo de valores nulos o undefined para evitar el error visual
    const val = parseFloat(n) || 0
    return val.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }

  const summaryCards = computed(() => [
    { label: 'Total', amount: buckets.value.total, bg: 'bg-white', color: 'text-black' },
    { label: 'Corriente', amount: buckets.value.corriente, bg: 'bg-green-1', color: 'text-green-9' },
    { label: '1-30 Días', amount: buckets.value['1_30'], bg: 'bg-blue-1', color: 'text-blue-9' },
    { label: '31-60 Días', amount: buckets.value['31_60'], bg: 'bg-orange-1', color: 'text-orange-9' },
    { label: '61-90 Días', amount: buckets.value['61_90'], bg: 'bg-amber-1', color: 'text-amber-10' },
    { label: '+90 Días', amount: buckets.value.mas_90, bg: 'bg-red-1', color: 'text-red-9' },
  ])

  const columns = [
    { name: 'folio', label: 'Folio Factura', field: 'folio', align: 'left', classes: 'text-bold' },
    {
      name: 'fecha',
      label: 'Fecha Emisión',
      field: 'created_at', // Asegurado con el campo correcto del backend
      align: 'left',
      // Formateo de fecha ISO a legible
      format: val => val ? date.formatDate(val, 'DD/MM/YYYY HH:mm') : 'N/A'
    },
    {
      name: 'fecha_vencimiento',
      label: 'Fecha Vencimiento',
      field: 'fecha_vencimiento', // Asegurado con el campo correcto del backend
      align: 'left',
      // Formateo de fecha ISO a legible
      format: val => val ? date.formatDate(val, 'DD/MM/YYYY HH:mm') : 'N/A'
    },
    {
      name: 'monto',
      label: 'Monto Original',
      field: 'total',
      align: 'right',
      format: val => `$ ${formatMoney(val)}`
    },
    {
      name: 'saldo',
      label: 'Saldo Pendiente',
      field: 'saldo', // Corregido el nombre del campo para evitar undefined
      align: 'right',
      classes: 'text-negative text-bold',
      format: val => `$ ${formatMoney(val)}`
    },
    { name: 'status', label: 'Antigüedad', field: 'dias_vencidos', align: 'center' },
  ]

  watch(() => props.proveedor, async (newVal) => {
    if (newVal) {
      loading.value = true
      try {
        const res = await api.get(`/api/proveedores/${newVal.id}/antiguedad`)
        buckets.value = res.data.buckets || {}
        detalles.value = res.data.detalles || []
      } catch (error) {
        console.error("Error al obtener antigüedad:", error)
      } finally {
        loading.value = false
      }
    }
  })

  const getStatusColor = (dias) => {
    if (dias <= 0) return 'green-7'
    if (dias <= 30) return 'blue-7'
    if (dias <= 60) return 'orange-7'
    return 'red-7'
  }
</script>

<style scoped>
  .main-table :deep(thead tr th) {
    font-weight: bold;
    background-color: #f8f9fa;
  }
  .border-bottom {
    border-bottom: 1px solid #e0e0e0;
  }
</style>
