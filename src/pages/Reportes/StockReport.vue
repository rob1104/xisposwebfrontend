<template>
  <q-page padding>
    <div class="row q-col-gutter-md items-center q-mb-lg">
      <div class="col-12 col-md-4">
        <div class="text-h6">Reporte de Stock</div>
      </div>

      <div v-if="esAdmin" class="col-12 col-md-4">
        <q-select
          v-model="sucursalSeleccionada"
          :options="listaSucursales"
          option-label="nombre"
          option-value="id"
          label="Seleccionar Sucursal"
          outlined
          dense
          @update:model-value="cargarStock"
          :loading="loadingSucursales"
        >
          <template v-slot:prepend>
            <q-icon name="storefront" color="primary" />
          </template>
        </q-select>
      </div>

      <div v-else class="col-12 col-md-4 text-center">
        <q-chip
          :color="auth.sucursalSeleccionada ? 'primary' : 'negative'"
          text-color="white"
          icon="store"
        >
          Sucursal: {{ auth.sucursalSeleccionada?.nombre || 'No asignada' }}
        </q-chip>
      </div>
    </div>

    <q-table
      :rows="productos"
      :columns="columnas"
      row-key="id"
      :loading="loading"
      no-data-label="No hay datos. Por favor, selecciona una sucursal."
    >
      <template v-slot:loading>
        <q-inner-loading showing color="primary" />
      </template>
    </q-table>
  </q-page>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { api } from 'src/boot/axios'
import { useAuthStore } from 'src/stores/auth'

const auth = useAuthStore()
const loading = ref(false)
const loadingSucursales = ref(false)
const productos = ref([])
const listaSucursales = ref([])

// MEJORA: Detección de rol más robusta (ignora mayúsculas/minúsculas)
const esAdmin = computed(() => {
  const rol = auth.user.roles[0]
  return rol === 'Administrador'
})

const sucursalSeleccionada = computed({
  get: () => auth.sucursalSeleccionada,
  set: (val) => { auth.sucursalSeleccionada = val }
})

const columnas = [
  { name: 'codigo_barras', label: 'Código de Barras', field: 'codigo_barras', align: 'left', sortable: true },
  { name: 'nombre', label: 'Producto', field: 'nombre', align: 'left', sortable: true },
  { name: 'stock', label: 'Cantidad', field: 'stock_actual', align: 'center', sortable: true },
  { name: 'categoria', label: 'Categoría', field: 'categoria' || 'S/C', align: 'left' }
]

const cargarStock = async () => {
  if (!auth.sucursalSeleccionada?.id) return

  loading.value = true
  try {
    // El header X-Sucursal-Id se envía solo gracias a axios.js
    const response = await api.get('/api/reportes/stock')
    productos.value = response.data
  } catch (error) {
    console.error('Error al obtener stock:', error)
  } finally {
    loading.value = false
  }
}

const cargarSucursales = async () => {
  if (esAdmin.value) {
    loadingSucursales.value = true
    try {
      const response = await api.get('/api/sucursales')
      listaSucursales.value = response.data
    } catch (error) {
      console.error('Error:', error)
    } finally {
      loadingSucursales.value = false
    }
  }
}

onMounted(() => {
  cargarSucursales()
  if (auth.sucursalSeleccionada?.id) {
    cargarStock()
  }
})
</script>
