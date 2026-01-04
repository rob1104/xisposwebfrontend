<template>
  <q-dialog
    v-model="internalValue"
    position="top"
    transition-show="slide-down"
    transition-hide="slide-up"
  >
    <q-card style="width: 900px; max-width: 95vw;" class="bg-white text-blue-grey-9 rounded-borders shadow-24 border-primary-top">

      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6 text-bold text-primary uppercase">
          <q-icon name="search" class="q-mr-sm" /> Buscador Avanzado de Artículos
        </div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>

      <q-card-section>
        <q-input
          ref="inputBusquedaRef"
          v-model="terminoBusqueda"
          placeholder="Escriba nombre, marca o categoría..."
          outlined
          color="primary"
          @update:model-value="buscarEnBackend"
          debounce="300"
          class="text-h6 bg-grey-1"
          autofocus
        >
          <template v-slot:append>
            <q-icon v-if="terminoBusqueda === ''" name="keyboard" />
            <q-icon v-else name="clear" class="cursor-pointer" @click="terminoBusqueda = ''" />
          </template>
        </q-input>
      </q-card-section>

      <q-card-section class="q-pa-none">
        <q-table
          :rows="resultadosBusqueda"
          :columns="colsBuscador"
          row-key="id"
          flat
          class="bg-white pos-search-table"
          :loading="buscando"
          @row-dblclick="seleccionar"
          no-data-label="No se encontraron coincidencias. Intente con otro término."
          :pagination="{ rowsPerPage: 8 }"
        >
          <template v-slot:body-cell-stock="props">
            <q-td :props="props" class="text-center">
              <q-badge
                :color="props.value > 0 ? 'green-1' : 'red-1'"
                :text-color="props.value > 0 ? 'positive' : 'negative'"
                class="text-bold q-pa-sm"
              >
                {{ props.value }} disp.
              </q-badge>
            </q-td>
          </template>

          <template v-slot:body-cell-precio_venta="props">
            <q-td :props="props" class="text-h6 text-bold text-primary">
              $ {{ (Number(props.value) || 0).toFixed(2) }}
            </q-td>
          </template>
        </q-table>
      </q-card-section>

      <q-card-actions align="right" class="bg-grey-1 q-pa-md">
        <div class="text-caption text-grey-7 q-mr-md">
          <q-icon name="info" color="primary" /> <b>Doble clic</b> en la fila para añadir al carrito
        </div>
        <q-btn flat label="Cerrar (ESC)" color="grey-7" v-close-popup />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
  import { ref, computed, nextTick } from 'vue'
  import { api } from 'src/boot/axios'
  import { useQuasar } from 'quasar'

  // Propiedades y Emisiones para v-model
  const props = defineProps(['modelValue'])
  const emit = defineEmits(['update:modelValue', 'selected'])

  const $q = useQuasar()
  const terminoBusqueda = ref('')
  const buscando = ref(false)
  const resultadosBusqueda = ref([])
  const inputBusquedaRef = ref(null)

  /**
   * Sincronización del v-model con el padre
   */
  const internalValue = computed({
    get: () => props.modelValue,
    set: (val) => emit('update:modelValue', val)
  })

  const colsBuscador = [
    { name: 'codigo_barras', label: 'CÓDIGO', field: 'codigo_barras', align: 'left' },
    { name: 'nombre', label: 'PRODUCTO', field: 'nombre', align: 'left', sortable: true },
    { name: 'categoria', label: 'CATEGORÍA', field: row => row.categoria.nombre || 'S/C', align: 'left' },
    { name: 'stock', label: 'EXISTENCIA', field: 'stock_actual', align: 'center' },
    { name: 'precio_venta', label: 'PRECIO VENTA', field: row => row.precios[0].precio, align: 'right' }
  ]

  /**
   * Consulta asíncrona al servidor con debounce
   */
  const buscarEnBackend = async (val) => {
    if (val.length < 2) {
      resultadosBusqueda.value = []
      return
    }

    buscando.value = true
    try {
      const { data } = await api.get('/api/pos/buscar-filtro', { params: { q: val } })
      resultadosBusqueda.value = data
    } catch (e) {
      console.error("Error en búsqueda:", e)
    } finally {
      buscando.value = false
    }
  }

  /**
   * Maneja el doble clic sobre una fila de la tabla
   */
  const seleccionar = (evt, row) => {

    const productoFormateado = {
    ...row,
      precio_venda: row.precios?.[0]?.precio || 0
    }

    // Emitimos el producto al padre para que lo agregue al carrito
    emit('selected', productoFormateado)

    // Cerramos el diálogo para agilizar el proceso de cobro
    internalValue.value = false
  }
</script>

<style lang="scss" scoped>
  /* Línea de acento superior */
  .border-primary-top {
    border-top: 6px solid var(--q-primary) !important;
  }

  /* Diseño de tabla clara con bordes suaves */
  .pos-search-table :deep(thead tr th) {
    background-color: #f5f5f5;
    color: #455a64;
    font-weight: bold;
  }

  .pos-search-table :deep(tbody tr:hover) {
    background-color: #e3f2fd; /* Color azul muy claro al pasar el mouse */
    cursor: pointer;
  }

  .uppercase {
    text-transform: uppercase;
  }
</style>
