<template>
  <q-dialog
    v-model="internalModel"
    persistent
    backdrop-filter="blur(8px)"
  >
    <q-card class="admin-dialog-card shadow-24">

      <q-card-section class="bg-gradient-header text-white q-pa-md">
        <div class="row items-center justify-between">
          <div class="row items-center">
            <div class="bg-white q-pa-sm rounded-borders q-mr-md shadow-2">
              <q-icon name="analytics" color="primary" size="md" />
            </div>
            <div>
              <div class="text-h5 text-bold tracking-tight">Análisis de Auditoría</div>
              <div class="text-caption opacity-80 uppercase text-bold letter-spacing-1">
                Folio {{ data?.id }} — {{ data?.sucursal?.nombre }}
              </div>
            </div>
          </div>
          <q-btn flat round icon="close" v-close-popup color="white" />
        </div>
      </q-card-section>

      <q-card-section class="q-pa-md bg-grey-1">
        <div class="row q-col-gutter-md">
          <div class="col-12 col-md-4" v-for="kpi in kpis" :key="kpi.label">
            <q-card class="kpi-card shadow-1 no-border" :class="kpi.bg">
              <q-card-section class="row items-center no-wrap">
                <div class="q-mr-md q-pa-sm rounded-borders shadow-1" :class="kpi.iconBg">
                  <q-icon :name="kpi.icon" :color="kpi.iconColor" size="md" />
                </div>
                <div>
                  <div class="text-overline text-grey-8 line-height-1">{{ kpi.label }}</div>
                  <div class="text-h4 text-bold" :class="kpi.color">{{ kpi.value }}</div>
                </div>
              </q-card-section>
            </q-card>
          </div>
        </div>
      </q-card-section>

      <q-card-section class="q-pa-lg">
        <div class="row items-center justify-between q-mb-md">
          <div class="text-subtitle1 text-bold text-grey-9 row items-center">
            <q-icon name="list_alt" color="grey-7" class="q-mr-sm" />
            Desglose de Productos
          </div>
          <q-input
            v-model="filtro"
            placeholder="Filtrar por nombre o código..."
            outlined
            dense
            bg-color="white"
            class="search-input"
          >
            <template v-slot:append><q-icon name="search" color="primary" /></template>
          </q-input>
        </div>

        <q-table
          :rows="data?.detalles || []"
          :columns="columns"
          row-key="id"
          flat
          bordered
          :pagination="{ rowsPerPage: 0 }"
          class="premium-table sticky-header"
          :filter="filtro"
          style="max-height: 400px"
        >
          <template v-slot:body-cell-sistema="props">
            <q-td :props="props" class="text-grey-7">{{ Number(props.value).toFixed(2) }}</q-td>
          </template>

          <template v-slot:body-cell-fisico="props">
            <q-td :props="props" class="text-bold text-blue-9">{{ Number(props.value).toFixed(2) }}</q-td>
          </template>

          <template v-slot:body-cell-diferencia="props">
            <q-td :props="props">
              <q-chip
                :color="props.value < 0 ? 'red-1' : (props.value > 0 ? 'green-1' : 'grey-2')"
                :text-color="props.value < 0 ? 'red-9' : (props.value > 0 ? 'green-9' : 'grey-7')"
                class="text-bold font-size-12 q-px-md"
                square
              >
                <q-icon :name="props.value < 0 ? 'trending_down' : (props.value > 0 ? 'trending_up' : 'check')" class="q-mr-xs" />
                {{ props.value > 0 ? '+' : '' }}{{ Number(props.value).toFixed(2) }}
              </q-chip>
            </q-td>
          </template>
        </q-table>
      </q-card-section>

      <q-separator />
      <q-card-actions align="right" class="q-pa-md bg-grey-2">
        <div class="text-caption text-grey-7 q-mr-md italic">
          Auditoría realizada por: {{ data?.user?.name }}
        </div>
        <q-btn
          unelevated
          color="primary"
          label="Exportar PDF"
          icon="picture_as_pdf"
          class="q-px-lg shadow-2 text-bold"
          @click="$emit('descargar', data)"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
  import { computed, ref } from 'vue'

  const props = defineProps(['modelValue', 'data'])
  const emit = defineEmits(['update:modelValue', 'descargar'])
  const filtro = ref('')

  const internalModel = computed({
    get: () => props.modelValue,
    set: (val) => emit('update:modelValue', val)
  })

  // KPIs con diseño colorido para Gerencia
  const kpis = computed(() => [
    {
      label: 'Artículos Faltantes',
      value: props.data?.detalles?.filter(d => Number(d.diferencia) < 0).length || 0,
      color: 'text-red-9',
      icon: 'trending_down',
      iconColor: 'red-9',
      bg: 'bg-red-0',
      iconBg: 'bg-red-2'
    },
    {
      label: 'Artículos Sobrantes',
      value: props.data?.detalles?.filter(d => Number(d.diferencia) > 0).length || 0,
      color: 'text-green-9',
      icon: 'trending_up',
      iconColor: 'green-9',
      bg: 'bg-green-0',
      iconBg: 'bg-green-2'
    },
    {
      label: 'Sin Diferencias',
      value: props.data?.detalles?.filter(d => Number(d.diferencia) === 0).length || 0,
      color: 'text-blue-9',
      icon: 'inventory_2',
      iconColor: 'blue-9',
      bg: 'bg-blue-0',
      iconBg: 'bg-blue-2'
    }
  ])

  const columns = [
    { name: 'sku', label: 'CÓDIGO', field: row => row.producto?.codigo_barras, align: 'left', sortable: true },
    { name: 'producto', label: 'PRODUCTO', field: row => row.producto?.nombre, align: 'left', sortable: true },
    { name: 'sistema', label: 'SISTEMA', field: 'stock_sistema', align: 'center' },
    { name: 'fisico', label: 'FÍSICO', field: 'stock_fisico', align: 'center' },
    { name: 'diferencia', label: 'AJUSTE', field: 'diferencia', align: 'center' }
  ]
</script>

<style lang="scss" scoped>
  .admin-dialog-card {
    width: 1000px;
    max-width: 95vw;
    border-radius: 20px;
    overflow: hidden;
  }

  .bg-gradient-header {
    background: linear-gradient(135deg, #a80707 0%, #e46008 100%);
  }

  .kpi-card {
    border-radius: 12px;
    transition: transform 0.2s ease;
    &:hover { transform: translateY(-3px); }
  }

  // Colores suaves para los fondos de KPI
  .bg-red-0 { background-color: #fff5f5; border: 1px solid #fed7d7; }
  .bg-green-0 { background-color: #f0fff4; border: 1px solid #c6f6d5; }
  .bg-blue-0 { background-color: #ebf8ff; border: 1px solid #bee3f8; }

  .search-input { width: 350px; }

  .premium-table {
    :deep(thead tr th) {
      background-color: #f1f5f9;
      color: #475569;
      font-weight: 800;
      text-transform: uppercase;
      font-size: 11px;
      letter-spacing: 0.05em;
    }
    :deep(tbody tr:hover) { background-color: #f8fafc; }
  }

  .tracking-tight { letter-spacing: -0.5px; }
  .letter-spacing-1 { letter-spacing: 1px; }
  .line-height-1 { line-height: 1.2; }
  .font-size-12 { font-size: 12px; }
</style>
