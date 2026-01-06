<template>
  <q-dialog v-model="show" backdrop-filter="blur(4px)">
    <q-card style="width: 900px; max-width: 95vw;" class="premium-card">
      <q-card-section class="bg-primary text-white row items-center q-pa-md">
        <q-avatar icon="history" color="white" text-color="primary" />
        <div class="q-ml-md">
          <div class="text-h6 text-bold ls-1 text-uppercase">Antigüedad de Saldos</div>
          <div class="text-caption text-blue-1">{{ data.cliente?.nombre_comercial }}</div>
        </div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>

      <q-card-section class="q-pa-lg">
        <div class="row q-col-gutter-md q-mb-xl">
          <div v-for="(val, label) in bucketLabels" :key="label" class="col-12 col-sm-6 col-md-2-4">
            <q-card flat bordered :class="getBucketClass(label)">
              <q-card-section class="text-center q-pa-sm">
                <div class="text-caption text-uppercase text-bold">{{ val.title }}</div>
                <div class="text-h6 text-bold">${{ formatMoney(data.resumen[label]) }}</div>
              </q-card-section>
            </q-card>
          </div>
        </div>

        <q-table
          :rows="data.detalles"
          :columns="columns"
          row-key="id"
          flat
          bordered
          dense
          :loading="loading"
          class="aging-table"
        >
          <template v-slot:body-cell-dias_atraso="props">
            <q-td :props="props" class="text-center">
              <q-badge :color="props.value > 0 ? 'negative' : 'positive'" outline>
                {{ props.value > 0 ? props.value + ' días' : 'Al corriente' }}
              </q-badge>
            </q-td>
          </template>
        </q-table>
      </q-card-section>

      <q-card-actions align="right" class="q-pa-md bg-grey-2">
        <div class="text-h6 q-mr-md text-primary text-bold">Total Pendiente: ${{ formatMoney(data.resumen?.total_deuda) }}</div>
        <q-btn label="Cerrar" flat color="grey-8" v-close-popup />
        <q-btn icon="print" label="Imprimir Reporte" color="primary" unelevated />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
  import { ref, watch, computed } from 'vue'
  import { api } from 'boot/axios'

  const props = defineProps({ modelValue: Boolean, clienteId: Number })
  const emit = defineEmits(['update:modelValue'])

  const show = computed({ get: () => props.modelValue, set: (v) => emit('update:modelValue', v) })
  const loading = ref(false)
  const data = ref({ cliente: {}, resumen: {}, detalles: [] })

  const bucketLabels = {
    al_corriente: { title: 'Corriente', color: 'bg-green-1 text-green-9 border-green' },
    de_1_30:      { title: '1-30 Días', color: 'bg-yellow-1 text-yellow-9 border-yellow' },
    de_31_60:     { title: '31-60 Días', color: 'bg-orange-1 text-orange-9 border-orange' },
    de_61_90:     { title: '61-90 Días', color: 'bg-red-1 text-red-9 border-red' },
    mas_de_90:    { title: '+90 Días', color: 'bg-red-10 text-white border-red-10' }
  }

  const columns = [
  { name: 'folio', label: 'FOLIO', field: 'folio', align: 'left', sortable: true },
  { name: 'created_at', label: 'FECHA VENTA', field: row => row.created_at ? row.created_at.split('T')[0] : 'N/A', align: 'left' },
  { name: 'vencimiento', label: 'VENCIMIENTO', field: 'fecha_vencimiento', align: 'left' },
  // Corrección: Convertimos a número y validamos existencia antes de usar toFixed
  {
    name: 'total',
    label: 'TOTAL',
    field: 'total',
    format: v => v ? `$${Number(v).toFixed(2)}` : '$0.00'
  },
  {
    name: 'saldo',
    label: 'SALDO',
    field: 'saldo',
    format: v => v ? `$${Number(v).toFixed(2)}` : '$0.00',
    classes: 'text-bold text-negative'
  },
  { name: 'dias_atraso', label: 'ATRASO', field: 'dias_atraso', align: 'center' },
]

  const loadData = async () => {
    if (!props.clienteId) return
    loading.value = true
    try {
      const res = await api.get(`/api/clientes/${props.clienteId}/antiguedad`)
      data.value = res.data
    } finally { loading.value = false }
  }

  watch(() => props.modelValue, (val) => { if(val) loadData() })
  const formatMoney = (v) => v ? v.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '0.00'
  const getBucketClass = (label) => bucketLabels[label].color
  </script>

<style scoped>
  .premium-card { border-radius: 16px; overflow: hidden; }
  .col-md-2-4 { width: 20%; }
  @media (max-width: 900px) { .col-md-2-4 { width: 50%; } }
  .aging-table { background: white; }
</style>
