<template>
  <q-page class="q-pa-lg bg-grey-2">
    <div class="row q-col-gutter-md items-center q-mb-xl">
      <div class="col-12 col-md-5">
        <div class="row items-center no-wrap">
          <q-avatar icon="inventory" color="primary" text-color="white" shadow-5 size="lg" />
          <div class="q-ml-md">
            <div class="text-h4 text-bold text-grey-9">Control de Existencias</div>
            <div class="text-subtitle1 text-grey-7">Análisis de inventario y disponibilidad por sede.</div>
          </div>
        </div>
      </div>

      <div class="col-12 col-md-7">
        <q-card flat class="bg-white shadow-1 border-radius-15 overflow-hidden">
          <q-card-section class="q-pa-none row items-center">
            <div class="bg-primary q-pa-lg text-white row items-center">
              <q-icon name="storefront" size="md" />
            </div>
            <div class="col q-px-lg">
              <div class="text-caption text-bold text-primary text-uppercase">Sucursal a Consultar</div>
              <q-select
                v-if="esAdmin"
                v-model="sucursalSeleccionada"
                :options="listaSucursales"
                option-label="nombre"
                option-value="id"
                outlined dense borderless
                emit-value
                map-options
                @update:model-value="cargarStock"
                class="text-h6 text-bold no-shadow custom-select"
              >
                <template v-slot:no-option>
                  <q-item><q-item-section class="text-grey">Cargando sedes...</q-item-section></q-item>
                </template>
              </q-select>
              <div v-else class="text-h6 text-bold text-grey-9 q-py-xs">
                {{ auth.sucursalSeleccionada?.nombre || 'Sede Asignada' }}
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <div class="row q-col-gutter-lg q-mb-xl">
      <div v-for="kpi in kpiConfigs" :key="kpi.label" class="col-12 col-sm-4">
        <q-card flat class="kpi-card shadow-5 border-radius-15" :class="kpi.border">
          <q-card-section class="row items-center no-wrap q-pa-lg">
            <q-avatar :color="kpi.bg" :text-color="kpi.color" :icon="kpi.icon" size="56px" />
            <div class="q-ml-lg">
              <div class="text-caption text-grey-7 text-uppercase text-bold">{{ kpi.label }}</div>
              <div class="text-h4 text-bold" :class="'text-' + kpi.color">{{ kpi.value }}</div>
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <q-card flat class="shadow-15 border-radius-20 bg-white">
      <q-table
        :rows="productos"
        :columns="columnas"
        row-key="id"
        :loading="loading"
        :filter="filtro"
        flat
        class="no-shadow kardex-table"
      >
        <template v-slot:top-left>
          <q-input
            v-model="filtro"
            placeholder="Filtrar por nombre o código..."
            outlined dense
            style="width: 400px"
            bg-color="grey-1"
            class="border-radius-10"
          >
            <template v-slot:append><q-icon name="search" color="primary" /></template>
          </q-input>
        </template>

        <template v-slot:body-cell-stock="props">
          <q-td :props="props" class="text-center">
            <q-chip
              :color="getStockColor(props.value, props.row.stock_minimo)"
              text-color="white"
              class="text-bold shadow-1 q-px-md"
              size="13px"
            >
              <q-icon :name="getStockIcon(props.value, props.row.stock_minimo)" size="xs" class="q-mr-xs" />
              {{ formatCant(props.value) }}
            </q-chip>
          </q-td>
        </template>

        <template v-slot:body-cell-categoria="props">
          <q-td :props="props">
            <q-badge outline color="blue-grey-4" class="q-pa-xs text-bold">
              {{ props.value || 'GENERAL' }}
            </q-badge>
          </q-td>
        </template>
      </q-table>
    </q-card>
  </q-page>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { api } from 'src/boot/axios'
import { useAuthStore } from 'src/stores/auth'
import { useQuasar } from 'quasar'

const auth = useAuthStore()
const $q = useQuasar()
const loading = ref(false)
const productos = ref([])
const listaSucursales = ref([])
const filtro = ref('')

// Estado para el selector (Admin elige ID, el store guarda el objeto)
const sucursalSeleccionada = computed({
  get: () => auth.sucursalSeleccionada?.id,
  set: (id) => {
    const sucursal = listaSucursales.value.find(s => s.id === id)
    if (sucursal) auth.setSucursal(sucursal)
  }
})

const esAdmin = computed(() => auth.roles[0] === 'Administrador')

const formatCant = (val) => Number(val) // Smart Decimals

const getStockColor = (val, min) => {
  const stock = parseFloat(val)
  if (stock <= 0) return 'red-8'
  if (stock <= parseFloat(min)) return 'orange-8'
  return 'green-7'
}

const getStockIcon = (val, min) => {
  const stock = parseFloat(val)
  if (stock <= 0) return 'error_outline'
  if (stock <= parseFloat(min)) return 'warning'
  return 'check_circle'
}

const kpis = computed(() => {
  return {
    total: productos.value.length,
    unidades: productos.value.reduce((acc, p) => acc + parseFloat(p.stock_actual), 0),
    criticos: productos.value.filter(p => parseFloat(p.stock_actual) <= parseFloat(p.stock_minimo)).length
  }
})

const kpiConfigs = computed(() => [
  { label: 'Variedad de Productos', value: kpis.value.total, icon: 'category', bg: 'blue-1', color: 'blue-9', border: 'border-left-blue' },
  { label: 'Volumen Total', value: formatCant(kpis.value.unidades), icon: 'reorder', bg: 'green-1', color: 'green-9', border: 'border-left-green' },
  { label: 'Alertas de Stock', value: kpis.value.criticos, icon: 'notification_important', bg: 'red-1', color: 'red-9', border: 'border-left-red' }
])

const columnas = [
  { name: 'codigo_barras', label: 'CÓDIGO', field: 'codigo_barras', align: 'left', sortable: true },
  { name: 'nombre', label: 'PRODUCTO', field: 'nombre', align: 'left', sortable: true },
  { name: 'categoria', label: 'CATEGORÍA', field: 'categoria', align: 'left' },
  { name: 'stock', label: 'EXISTENCIA ACTUAL', field: 'stock_actual', align: 'center', sortable: true }
]

const cargarStock = async () => {
  if (!auth.sucursalSeleccionada?.id) return
  loading.value = true
  try {
    // El interceptor en axios.js mandará el X-Sucursal-Id actualizado
    const response = await api.get('/api/reportes/stock')
    productos.value = response.data
  } catch (error) {
    $q.notify({ color: 'negative', message: 'No se pudo conectar con el inventario' })
  } finally {
    loading.value = false
  }
}

const cargarSucursales = async () => {
  if (esAdmin.value) {
    try {
      const response = await api.get('/api/sucursales')
      listaSucursales.value = response.data

      // Si el administrador no tiene sucursal seleccionada en el store,
      // pre-seleccionamos la primera para evitar ver el reporte vacío
      if (!auth.sucursalSeleccionada && listaSucursales.value.length > 0) {
        auth.setSucursal(listaSucursales.value[0])
        cargarStock()
      }
    } catch (e) { console.error(e) }
  }
}

onMounted(() => {
  cargarSucursales()
  if (auth.sucursalSeleccionada?.id) cargarStock()
})
</script>

<style lang="scss" scoped>
  .border-radius-20 { border-radius: 20px; }
  .border-radius-15 { border-radius: 15px; }
  .border-radius-10 { border-radius: 10px; }
  .shadow-15 { box-shadow: 0 10px 40px rgba(0,0,0,0.1); }
  .border-left-blue { border-left: 6px solid #1976D2; }
  .border-left-green { border-left: 6px solid #2E7D32; }
  .border-left-red { border-left: 6px solid #C62828; }
  .kpi-card { transition: transform 0.3s; &:hover { transform: translateY(-5px); } }
  .custom-select :deep(.q-field__control) { background: transparent !important; }
  .kardex-table {
    :deep(thead th) { font-weight: bold; color: #475569; background: #f8fafc; }
  }
</style>
