<template>
  <q-page class="q-pa-lg bg-grey-2">
    <div class="row q-col-gutter-md q-mb-lg">
      <div class="col-12 col-md-4">
        <q-card class="stats-card bg-white shadow-2">
          <q-card-section class="row items-center no-wrap">
            <q-avatar icon="inventory_2" color="primary" text-color="white" shadow-5 />
            <div class="q-ml-md">
              <div class="text-h6 text-bold">{{ rows.length }}</div>
              <div class="text-caption text-grey-7">Productos en Catálogo</div>
            </div>
          </q-card-section>
        </q-card>
      </div>

      <div class="col-12 col-md-4">
        <q-card class="stats-card bg-white shadow-2 border-left-blue">
          <q-card-section class="row items-center no-wrap">
            <q-avatar icon="layers" color="indigo-7" text-color="white" shadow-5 />
            <div class="q-ml-md">
              <div class="text-h6 text-bold text-indigo-9">
                {{ rows.filter(p => p.tipo_producto === 'Compuesto').length }}
              </div>
              <div class="text-caption text-grey-7">Kits / Compuestos</div>
            </div>
          </q-card-section>
        </q-card>
      </div>

      <div class="col-12 col-md-4 text-right self-center">
        <q-btn
          :disabled="!auth.can('productos.crear')"
          color="primary" icon="add" label="Nuevo Producto" size="lg"
          class="shadow-5 custom-btn-radius" unelevated @click="openCreate"
        />
      </div>
    </div>

    <q-card class="shadow-10 overflow-hidden border-radius-15">
      <q-table
        :rows="rows" :columns="columns" row-key="id"
        :loading="loading" :filter="filter" flat class="main-table"
      >

        <template v-slot:top-left>
          <div class="text-h6 text-bold text-primary">Listado de Productos</div>
        </template>

        <template v-slot:top-right>
          <q-input
            v-model="filter" placeholder="Buscar por nombre o código..."
            outlined dense class="search-input" bg-color="white"
          >
            <template v-slot:append><q-icon name="search" /></template>
          </q-input>
        </template>

        <template v-slot:body="props">
          <q-tr :props="props" class="hover-row">
            <q-td key="nombre" :props="props" style="font-size: 14px;">
              <div class="text-bold text-blue-grey-7">{{ props.row.nombre }}</div>
              <div class="row items-center text-caption text-grey-7">
                <q-badge color="grey-3" text-color="grey-9" class="q-mr-xs text-bold">
                  {{ props.row.codigo_barras }}
                </q-badge>
                <span class="text-mono">SAT: {{ props.row.clave_prod_serv }}</span>
              </div>
            </q-td>

             <q-td key="status" :props="props" class="text-center">
              <q-icon
                v-if="props.row.status"
                name="check_circle"
                color="positive"
                size="sm"
              >
                <q-tooltip>Producto Activo</q-tooltip>
              </q-icon>

              <q-icon
                v-else
                name="block"
                color="negative"
                size="sm"
              >
                <q-tooltip>Producto Inactivo / Bloqueado</q-tooltip>
              </q-icon>
            </q-td>

            <q-td key="categoria" :props="props" class="text-center" style="font-size: 14px;">
                <span class="text-blue-10 text-bold">
                {{ props.row.categoria?.nombre || 'General' }}
                </span>
            </q-td>

            <q-td key="tipo_producto" :props="props" class="text-center">
              <q-badge :color="getTipoColor(props.row.tipo_producto)" class="q-pa-xs">
                <q-icon :name="getTipoIcon(props.row.tipo_producto)" size="xs" class="q-mr-xs" />
                {{ props.row.tipo_producto }}
              </q-badge>
            </q-td>

            <q-td key="impuestos" :props="props">
              <div class="row q-gutter-xs" v-if="props.row.impuestos && props.row.impuestos.length > 0">
                <q-badge
                  v-for="imp in props.row.impuestos"
                  :key="imp.id"
                  :color="getTaxColor(imp.nombre)"
                  class="text-bold shadow-1"
                  style="padding: 4px 8px; border-radius: 6px;"
                >
                  {{ imp.nombre }}
                </q-badge>
              </div>
              <div v-else class="text-caption text-grey-5 italic">Sin impuestos</div>
            </q-td>

            <q-td key="precio" :props="props" class="text-right text-bold text-green-9" style="font-size: 20px;">
              $ {{ formatNumber(props.row.precios?.[0]?.precio) }}
            </q-td>


              <q-td key="actions" :props="props">
                <q-btn :disabled="!auth.can('productos.kardex')"
                  flat round
                  color="deep-orange"
                  icon="analytics"
                  @click="verKardex(props.row)"
                >
                  <q-tooltip>Historial de Movimientos (Kardex)</q-tooltip>
                </q-btn>

              <q-btn :disabled="!auth.can('productos.editar')" flat round color="indigo" icon="edit" @click="openEdit(props.row)" />
              <q-btn :disabled="!auth.can('productos.borrar')" flat round color="negative" icon="delete" @click="confirmDelete(props.row)" />
            </q-td>
          </q-tr>
        </template>
      </q-table>
    </q-card>
    <KardexDialog
      v-model="showKardex"
      :producto="productoSeleccionado"
    />
    <ProductForm v-model="showDialog" :editData="selectedItem" @saved="loadData" />
  </q-page>
</template>

<script setup>
  import { ref, onMounted } from 'vue'
  import { api } from 'boot/axios'
  import ProductForm from 'components/Productos/ProductosForm.vue'
  import { useQuasar } from 'quasar'
  import KardexDialog from 'src/components/Productos/KardexDialog.vue'
  import { useAuthStore } from 'src/stores/auth'


  const $q = useQuasar()
  const auth = useAuthStore()
  const rows = ref([])
  const loading = ref(false)
  const filter = ref('')
  const showDialog = ref(false)
  const selectedItem = ref(null)
  const showKardex = ref(false)
  const productoSeleccionado = ref(null)

  const verKardex = (producto) => {
    productoSeleccionado.value = { ...producto }
    showKardex.value = true
  }


  const columns = [
    { name:
      'nombre',
      label: 'PRODUCTO / IDENTIFICACIÓN',
      align: 'left',
      field: row => `${row.nombre} ${row.codigo_barras} ${row.clave_prod_serv} ${row.categoria?.nombre || ''}`,
      sort: (a, b) => a.localeCompare(b),
      sortable: true
    },
    { name: 'status', label: 'ACTIVO', field: 'status', align: 'center' },
    { name: 'categoria', label: 'CATEGORÍA', align: 'center' },
    { name: 'tipo_producto', label: 'TIPO', field: 'tipo_producto', align: 'center' },
    { name: 'impuestos', label: 'IMPUESTOS', align: 'left' },
    { name: 'precio', label: 'PRECIO BASE', align: 'right' },
    { name: 'actions', label: 'ACCIONES', align: 'center' }
  ]

  const formatNumber = (val) => Number(val || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })

  const getTipoIcon = (tipo) => tipo === 'Compuesto' ? 'inventory' : (tipo === 'Servicio' ? 'dry_cleaning' : 'reorder')
  const getTipoColor = (tipo) => tipo === 'Compuesto' ? 'cyan-7' : (tipo === 'Servicio' ? 'pink-7' : 'green-7')

  const loadData = async () => {
    loading.value = true
    try {
      const res = await api.get('/api/productos')
      rows.value = res.data
    } finally { loading.value = false }
  }

  const openCreate = () => { selectedItem.value = null; showDialog.value = true }
  const openEdit = (row) => { selectedItem.value = { ...row }; showDialog.value = true }

  const getTaxColor = (name) => {
  if (!name) return 'grey-7'

  const upperName = name.toUpperCase()

    // Mapeo de colores Premium
    if (upperName.includes('IVA')) return 'purple-8'    // Azul para IVA
    if (upperName.includes('IEPS')) return 'cyan-9' // Naranja para IEPS
    if (upperName.includes('RET')) return 'red-9'    // Rojo para Retenciones
    if (upperName.includes('ISAN')) return 'pink-8' // Púrpura para otros

    return 'blue-grey-6' // Color por defecto
  }

   const confirmDelete = (producto) => {
    $q.dialog({
      title: '<span class="text-negative text-bold">Eliminar Producto</span>',
      message: `¿Estás seguro de que deseas eliminar <b>${producto.nombre}</b>? Esta acción no se puede deshacer.`,
      html: true,
      persistent: true,
      ok: {
        label: 'Sí, Eliminar',
        color: 'negative',
        unelevated: true
      },
      cancel: {
        label: 'Cancelar',
        flat: true,
        color: 'grey-7'
      }
    }).onOk(async () => {
      try {
        $q.loading.show({ message: 'Eliminando...' })

        // Petición al backend
        await api.delete(`/api/productos/${producto.id}`)

        $q.notify({
          color: 'positive',
          message: 'Producto eliminado correctamente',
          icon: 'delete'
        })

        // Recargar la lista de productos
        loadData()

      } catch (e) {
        $q.notify({ color: 'negative', message: e.response?.data?.message })
      } finally {
        $q.loading.hide()
      }
    })
  }

  onMounted(loadData)
</script>

<style lang="scss" scoped>
  /* TARJETAS DE INDICADORES */
  .stats-card {
    border-radius: 12px;
    border-bottom: 4px solid #eee;
    transition: transform 0.3s;
    &:hover { transform: translateY(-5px); }
  }

  .border-left-blue { border-left: 5px solid $indigo-7; }
  .border-radius-15 { border-radius: 15px; }

  /* ESTILO DE LA TABLA (Sintaxis corregida para evitar warnings) */
  .main-table {
    background: white;
    :deep(thead th) {
      font-weight: bold;
      text-transform: uppercase;
      color: white;
      background: #263238;
      border-bottom: 2px solid $primary;
    }
  }

  /* BUSCADOR DINÁMICO */
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
