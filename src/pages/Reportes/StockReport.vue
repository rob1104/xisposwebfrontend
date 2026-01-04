<template>
  <q-page padding class="bg-grey-2">
    <div class="row q-col-gutter-md items-center q-mb-lg">
      <div class="col-12 col-md-6">
        <div class="text-h5 text-bold text-primary">
          <q-icon name="inventory" class="q-mr-sm" /> Reporte de Inventario Actual
        </div>
        <div class="text-caption text-grey-7">Visualización en tiempo real de existencias por almacén.</div>
      </div>

      <div class="col-12 col-md-6">
        <q-card flat bordered class="shadow-1 rounded-borders bg-white">
          <q-card-section class="q-pa-sm row items-center no-wrap">
            <q-icon name="storefront" size="md" color="primary" class="q-mx-md" />
            <div class="full-width">
              <div class="text-caption text-grey-8 text-bold">SUCURSAL CONSULTADA</div>
              <q-select
                v-if="esAdmin"
                v-model="sucursalSeleccionada"
                :options="listaSucursales"
                option-label="nombre"
                outlined dense borderless
                @update:model-value="cargarStock"
                class="text-h6 text-primary no-shadow custom-select"
              />
              <div v-else class="text-h6 text-primary">
                {{ auth.sucursalSeleccionada?.nombre || 'No asignada' }}
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <div class="row q-col-gutter-md q-mb-lg">
      <div class="col-12 col-sm-4">
        <q-card flat bordered class="shadow-1 menu-radius border-left-blue">
          <q-card-section class="row items-center no-wrap">
            <q-item-section avatar>
              <q-avatar color="blue-1" text-color="blue-9" icon="inventory_2" />
            </q-item-section>
            <q-item-section>
              <q-item-label class="text-caption text-grey-7">Total de Artículos</q-item-label>
              <q-item-label class="text-h6 text-bold">{{ kpis.totalProductos }}</q-item-label>
            </q-item-section>
          </q-card-section>
        </q-card>
      </div>

      <div class="col-12 col-sm-4">
        <q-card flat bordered class="shadow-1 menu-radius border-left-green">
          <q-card-section class="row items-center no-wrap">
            <q-item-section avatar>
              <q-avatar color="green-1" text-color="green-9" icon="reorder" />
            </q-item-section>
            <q-item-section>
              <q-item-label class="text-caption text-grey-7">Suma Total Unidades</q-item-label>
              <q-item-label class="text-h6 text-bold">{{ formatCant(kpis.sumaTotal) }}</q-item-label>
            </q-item-section>
          </q-card-section>
        </q-card>
      </div>

      <div class="col-12 col-sm-4">
        <q-card flat bordered class="shadow-1 menu-radius border-left-red">
          <q-card-section class="row items-center no-wrap">
            <q-item-section avatar>
              <q-avatar color="red-1" text-color="red-9" icon="warning" />
            </q-item-section>
            <q-item-section>
              <q-item-label class="text-caption text-grey-7">Sin Stock (Agotados)</q-item-label>
              <q-item-label class="text-h6 text-bold text-negative">{{ kpis.sinStock }}</q-item-label>
            </q-item-section>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <q-card flat bordered class="shadow-1 menu-radius bg-white">
      <q-table
        :rows="productos"
        :columns="columnas"
        row-key="id"
        :loading="loading"
        :filter="filtro"
        flat
        class="no-shadow"
      >
        <template v-slot:top-left>
          <q-input
            v-model="filtro"
            placeholder="Buscar producto por nombre o código..."
            outlined dense
            style="width: 350px"
            class="bg-grey-1"
          >
            <template v-slot:append><q-icon name="search" /></template>
          </q-input>
        </template>

        <template v-slot:body-cell-stock="props">
          <q-td :props="props" class="text-center">
            <q-chip
              :color="getStockColor(props.value)"
              text-color="white"
              class="text-weight-bolder shadow-1"
              size="13px"
            >
              {{ formatCant(props.value) }}
            </q-chip>
          </q-td>
        </template>

        <template v-slot:body-cell-categoria="props">
          <q-td :props="props">
            <q-badge outline color="blue-grey-6" class="q-pa-xs">
              {{ props.value || 'Sin Categoría' }}
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

  const auth = useAuthStore()
  const loading = ref(false)
  const productos = ref([])
  const listaSucursales = ref([])
  const filtro = ref('')

  // Detección de rol unificada
  const esAdmin = computed(() => auth.user.role === 'Administrador')

  const sucursalSeleccionada = computed({
    get: () => auth.sucursalSeleccionada,
    set: (val) => { auth.setSucursal(val) } // Usamos la acción del store
  })

  /**
   * Función que oculta decimales si el número es entero.
   * Ejemplo: 10.00 -> 10 | 10.50 -> 10.5 | 10.5123 -> 10.51
   */
  const formatCant = (val) => {
    if (val === null || val === undefined) return '0'
    const num = parseFloat(val)
    return Number.isInteger(num) ? num.toString() : num.toFixed(2).replace(/\.?0+$/, '')
  }

  /**
   * Lógica de color semántico para el stock
   */
  const getStockColor = (val) => {
    const stock = parseFloat(val)
    if (stock <= 0) return 'negative' // Rojo
    if (stock < 10) return 'orange'   // Naranja (Stock bajo)
    return 'positive'                 // Verde
  }

  // Cálculo dinámico de KPIs
  const kpis = computed(() => {
    return {
      totalProductos: productos.value.length,
      sumaTotal: productos.value.reduce((acc, p) => acc + parseFloat(p.stock_actual), 0),
      sinStock: productos.value.filter(p => parseFloat(p.stock_actual) <= 0).length
    }
  })

  const columnas = [
    { name: 'codigo_barras', label: 'CÓDIGO', field: 'codigo_barras', align: 'left', sortable: true },
    { name: 'nombre', label: 'PRODUCTO', field: 'nombre', align: 'left', sortable: true },
    { name: 'categoria', label: 'CATEGORÍA', field: row => row.categoria || 'S/C', align: 'left' },
    { name: 'stock', label: 'CANTIDAD DISPONIBLE', field: 'stock_actual', align: 'center', sortable: true }
  ]

  const cargarStock = async () => {
    if (!auth.sucursalSeleccionada?.id) return
    loading.value = true
    try {
      const response = await api.get('/api/reportes/stock')
      productos.value = response.data
    } catch (error) {
      console.error('Error:', error)
    } finally {
      loading.value = false
    }
  }

  const cargarSucursales = async () => {
    if (esAdmin.value) {
      try {
        const response = await api.get('/api/sucursales')
        listaSucursales.value = response.data
      } catch (e) { console.error(e) }
    }
  }

  onMounted(() => {
    cargarSucursales()
    if (auth.sucursalSeleccionada?.id) cargarStock()
  })
</script>

<style lang="scss" scoped>
  .menu-radius { border-radius: 12px; }
  .border-left-blue { border-left: 5px solid #1976D2; }
  .border-left-green { border-left: 5px solid #2E7D32; }
  .border-left-red { border-left: 5px solid #C62828; }
  .custom-select :deep(.q-field__control) { background: transparent !important; }
</style>
