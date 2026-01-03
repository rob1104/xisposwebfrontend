<template>
  <q-page class="q-pa-lg bg-grey-2">
    <div class="row q-col-gutter-md q-mb-lg items-center">
      <div class="col-12 col-md-4">
        <div class="text-h5 text-bold text-primary">Inventario Global</div>
        <div class="text-caption text-grey-7">Stock consolidado de todas las sucursales.</div>
      </div>
      <q-space />
      <div class="col-12 col-md-5">
        <q-input
          v-model="filter"
          placeholder="Buscar producto, código o categoría..."
          outlined
          dense
          class="search-input bg-white shadow-1"
        >
          <template v-slot:append><q-icon name="search" /></template>
        </q-input>
      </div>
    </div>

    <q-card class="shadow-10 border-radius-15 overflow-hidden">
      <q-table
        :rows="rows"
        :columns="columns"
        :filter="filter"
        row-key="id"
        flat
        class="main-table"
        :loading="loading"
        :pagination="{ rowsPerPage: 15 }"
      >
        <template v-slot:body-cell-nombre="props">
          <q-td :props="props">
            <div class="text-bold text-primary">{{ props.row.nombre }}</div>
            <div class="text-caption text-grey-6">{{ props.row.codigo_barras }}</div>
          </q-td>
        </template>

        <template v-slot:body-cell-categoria="props">
          <q-td :props="props" class="text-center">
            <q-chip
              dense
              color="red-10"
              text-color="white"
              class="text-bold"
            >
              {{ props.row.categoria || 'General' }}
            </q-chip>
          </q-td>
        </template>

        <template v-for="suc in sucursales" :key="suc.id" v-slot:[`body-cell-sucursal_${suc.id}`]="props">
          <q-td :props="props" class="text-right">
            <div :class="getStockClass(props.row[`sucursal_${suc.id}`])">
              {{ formatNumber(props.row[`sucursal_${suc.id}`]) }}
            </div>
          </q-td>
        </template>

        <template v-slot:body-cell-total="props">
          <q-td :props="props" class="text-right text-bold bg-blue-1">
            {{ formatNumber(props.row.total) }}
          </q-td>
        </template>
      </q-table>
    </q-card>
  </q-page>
</template>

<script setup>
  import { ref, onMounted } from 'vue'
  import { api } from 'boot/axios'

  const rows = ref([])
  const columns = ref([])
  const sucursales = ref([])
  const loading = ref(false)
  const filter = ref('')

  const loadData = async () => {
    loading.value = true
    try {
      // 1. Cargamos catálogo de sucursales para armar columnas
      const resSuc = await api.get('/api/sucursales')
      sucursales.value = resSuc.data

      // 2. Definimos columnas base
      const baseCols = [
        { name: 'nombre', label: 'PRODUCTO', align: 'left', field: 'nombre', sortable: true },
        { name: 'categoria', label: 'CATEGORÍA', align: 'center', field: 'categoria', sortable: true }
      ]

      // 3. Añadimos columnas dinámicas por sucursal
      const sucCols = sucursales.value.map(s => ({
        name: `sucursal_${s.id}`,
        label: s.nombre.toUpperCase(),
        align: 'right',
        field: `sucursal_${s.id}`,
        sortable: true
      }))

      columns.value = [...baseCols, ...sucCols, { name: 'total', label: 'STOCK TOTAL', align: 'right', field: 'total', sortable: true }]

      // 4. Cargamos el reporte consolidado del backend
      const resStock = await api.get('/api/inventario/reporte-consolidado')
      rows.value = resStock.data
    } finally {
      loading.value = false
    }
  }

  const getStockClass = (val) => {
    if (val <= 0) return 'text-negative text-bold'
    if (val < 10) return 'text-warning text-bold'
    return 'text-grey-9'
  }

  const formatNumber = (val) => Number(val).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 })

  onMounted(loadData)
</script>
