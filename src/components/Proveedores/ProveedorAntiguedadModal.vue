<template>
  <q-dialog v-model="internalValue" full-width transition-show="slide-up" transition-hide="slide-down">
    <q-card class="bg-grey-1" style="border-radius: 20px;">

      <q-card-section class="row items-center bg-white q-pa-md border-bottom">
        <q-avatar icon="account_balance_wallet" color="orange-1" text-color="orange-10" />
        <div class="q-ml-md">
          <div class="text-h6 text-bold">Antigüedad de Saldos</div>
          <div class="text-caption text-grey-7">Proveedor: {{ proveedor?.nombre }}</div>
        </div>
        <q-space />
        <q-btn icon="print" flat round color="grey-7" @click="imprimirReporte" />
        <q-btn icon="close" flat round v-close-popup />
      </q-card-section>

      <q-card-section class="q-pa-lg">
        <div class="row q-col-gutter-md">
          <div v-for="(val, key) in summaryCards" :key="key" class="col-12 col-sm-6 col-md-2">
            <q-card flat bordered class="text-center q-pa-sm" :class="val.bg">
              <div class="text-caption text-uppercase text-bold text-grey-7">{{ val.label }}</div>
              <div class="text-h6 text-bold" :class="val.color">${{ formatMoney(val.amount) }}</div>
            </q-card>
          </div>
        </div>

        <q-table
          :rows="detalles"
          :columns="columns"
          flat bordered
          class="q-mt-lg shadow-1"
          hide-bottom
          :pagination="{ rowsPerPage: 0 }"
        >
          <template v-slot:body-cell-status="props">
            <q-td :props="props">
              <q-badge :color="getStatusColor(props.row.dias_vencidos)">
                {{ props.row.dias_vencidos }} días
              </q-badge>
            </q-td>
          </template>
        </q-table>
      </q-card-section>

      <q-card-actions align="right" class="bg-white q-pa-md">
        <q-btn label="Cerrar" flat color="primary" v-close-popup />
        <q-btn label="Liquidar Saldo" color="primary" unelevated icon="payments" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
  import { ref, watch, computed } from 'vue'
  import { api } from 'boot/axios'

  const props = defineProps(['modelValue', 'proveedor'])
  const emit = defineEmits(['update:modelValue'])

  const internalValue = computed({
    get: () => props.modelValue,
    set: (val) => emit('update:modelValue', val)
  })

  const loading = ref(false)
  const buckets = ref({})
  const detalles = ref([])

  const summaryCards = computed(() => [
    { label: 'Total', amount: buckets.value.total || 0, bg: 'bg-white', color: 'text-black' },
    { label: 'Corriente', amount: buckets.value.corriente || 0, bg: 'bg-green-1', color: 'text-green-9' },
    { label: '1-30 Días', amount: buckets.value['1_30'] || 0, bg: 'bg-blue-1', color: 'text-blue-9' },
    { label: '31-60 Días', amount: buckets.value['31_60'] || 0, bg: 'bg-orange-1', color: 'text-orange-9' },
    { label: '61-90 Días', amount: buckets.value['61_90'] || 0, bg: 'bg-amber-1', color: 'text-amber-10' },
    { label: '+90 Días', amount: buckets.value.mas_90 || 0, bg: 'bg-red-1', color: 'text-red-9' },
  ])

  const columns = [
    { name: 'folio', label: 'Folio Factura', field: 'folio', align: 'left' },
    { name: 'fecha', label: 'Fecha Emisión', field: 'fecha_emision', align: 'left' },
    { name: 'monto', label: 'Monto Original', field: 'total', format: val => `$${val}` },
    { name: 'saldo', label: 'Saldo Pendiente', field: 'saldo_pendiente', format: val => `$${val}` },
    { name: 'status', label: 'Antigüedad', field: 'dias_vencidos', align: 'center' },
  ]

  watch(() => props.proveedor, async (newVal) => {
    if (newVal) {
      loading.value = true
      const res = await api.get(`/api/proveedores/${newVal.id}/antiguedad-saldos`)
      buckets.value = res.data.buckets
      detalles.value = res.data.detalles
      loading.value = false
    }
  })

  const getStatusColor = (dias) => {
    if (dias <= 0) return 'green'
    if (dias <= 30) return 'blue'
    if (dias <= 60) return 'orange'
    return 'red'
  }
  const formatMoney = (n) => parseFloat(n).toLocaleString('en-US', { minimumFractionDigits: 2 })
</script>
