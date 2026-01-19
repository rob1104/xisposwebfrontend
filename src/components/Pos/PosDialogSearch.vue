<template>
  <q-dialog
    v-model="internalValue"
    position="top"
    @show="enfocarInput"
    @hide="limpiarYEnfocar"
    transition-show="slide-down"
    transition-hide="slide-up"
    backdrop-filter="blur(4px) brightness(60%)"
  >
    <q-card style="width: 900px; max-width: 95vw; border-radius: 20px;" class="bg-blue-grey-10 text-white shadow-24 border-primary-top">

      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6 text-bold text-white uppercase tracking-tight">
          <q-icon name="search" class="q-mr-sm text-yellow" size="sm" />
          Buscador de productos
        </div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup color="grey-5" />
      </q-card-section>

      <q-card-section>
        <q-input
          ref="inputBusquedaRef"
          v-model="terminoBusqueda"
          placeholder="Escriba nombre del producto..."
          outlined
          dark
          color="cyan"
          @update:model-value="buscarEnBackend"
          @keydown="manejarTeclas"
          debounce="300"
          class="text-h6 bg-blue-grey-9 rounded-borders"
          autofocus
        >
          <template v-slot:append>
            <q-icon v-if="terminoBusqueda === ''" name="keyboard" color="grey-5" />
            <q-icon v-else name="clear" class="cursor-pointer" color="cyan" @click="terminoBusqueda = ''" />
          </template>
        </q-input>
      </q-card-section>

      <q-card-section class="q-pa-none">
        <q-table
          :rows="resultadosBusqueda"
          :columns="colsBuscador"
          row-key="id"
          flat
          dark
          class="bg-blue-grey-9 pos-search-table"
          :loading="buscando"
          @row-dblclick="seleccionarYLimpiar"
          no-data-label="No se encontraron coincidencias."
          :pagination="{ rowsPerPage: 8 }"
        >
          <template v-slot:body-cell-stock="props">
            <q-td :props="props" class="text-center">
              <q-badge
                :color="props.row.stock_actual > 0 ? 'light-green-12' : 'orange-10'"
                :text-color="props.row.stock_actual > 0 ? 'light-green-4' : 'orange-10'"
                class="text-bold q-pa-sm shadow-1"
                outline
              >
                {{ parseFloat(props.row.stock_actual || 0) }}
              </q-badge>
            </q-td>
          </template>

          <template v-slot:body-cell-precio="props">
            <q-td :props="props" class="text-h6 text-bold text-yellow-8">
              $ {{ (Number(props.value) || 0).toFixed(2) }}
            </q-td>
          </template>

          <template v-slot:body-cell="props">
            <q-td :props="props" :class="{ 'cell-selected': filaSeleccionada === props.rowIndex }">
              {{ props.value }}
            </q-td>
          </template>
        </q-table>
      </q-card-section>

      <q-card-actions align="right" class="bg-blue-grey-10 q-pa-md border-top-dark">
        <div class="text-caption text-grey-5 q-mr-md">
          <q-icon name="info" color="pink" class="q-mr-xs" />
          <span class="text-bold">FLECHAS ↑↓</span> para navegar | <span class="text-bold">ENTER</span> para añadir
        </div>
        <q-btn flat label="Cerrar (ESC)" color="grey-5" v-close-popup class="text-bold" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
  import { ref, computed, nextTick, watch } from 'vue'
  import { api } from 'src/boot/axios'

  const props = defineProps(['modelValue'])
  const emit = defineEmits(['update:modelValue', 'selected'])

  const terminoBusqueda = ref('')
  const buscando = ref(false)
  const resultadosBusqueda = ref([])
  const inputBusquedaRef = ref(null)
  const filaSeleccionada = ref(-1)

  const internalValue = computed({
    get: () => props.modelValue,
    set: (val) => emit('update:modelValue', val)
  })

  const colsBuscador = [
    { name: 'codigo_barras', label: 'CÓDIGO', field: 'codigo_barras', align: 'left' },
    { name: 'nombre', label: 'PRODUCTO', field: 'nombre', align: 'left', sortable: true },
    { name: 'categoria', label: 'CATEGORÍA', field: row => row.categoria?.nombre || 'S/C', align: 'left' },
    { name: 'stock', label: 'EXISTENCIA', field: 'stock_actual', align: 'center' },
    { name: 'precio', label: 'PRECIO VENTA', field: row => row.precios?.[0]?.precio || 0, align: 'right' }
  ]

  // Resetear selección cuando cambien los resultados
  watch(resultadosBusqueda, () => {
    filaSeleccionada.value = resultadosBusqueda.value.length > 0 ? 0 : -1
  })

  const manejarTeclas = (evt) => {
    const totalFilas = resultadosBusqueda.value.length

    if (totalFilas === 0) return

    switch (evt.key) {
      case 'ArrowDown':
        evt.preventDefault()
        filaSeleccionada.value = (filaSeleccionada.value + 1) % totalFilas
        break

      case 'ArrowUp':
        evt.preventDefault()
        filaSeleccionada.value = filaSeleccionada.value <= 0
          ? totalFilas - 1
          : filaSeleccionada.value - 1
        break

      case 'Enter':
        evt.preventDefault()
        if (filaSeleccionada.value >= 0 && filaSeleccionada.value < totalFilas) {
          const productoSeleccionado = resultadosBusqueda.value[filaSeleccionada.value]
          seleccionarYLimpiar(evt, productoSeleccionado)
        }
        break

      case 'Escape':
        internalValue.value = false
        break
    }
  }

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

  const limpiarYEnfocar = () => {
    terminoBusqueda.value = ''
    resultadosBusqueda.value = []
    filaSeleccionada.value = -1
  }

  const seleccionarYLimpiar = (evt, row) => {
    const productoFormateado = {
      ...row,
      precio: row.precios?.[0]?.precio || 0
    }
    emit('selected', productoFormateado)
    limpiarYEnfocar()
    internalValue.value = false
  }

  const enfocarInput = () => {
    nextTick(() => {
      inputBusquedaRef.value?.focus()
    })
  }
</script>

<style lang="scss" scoped>
  .border-primary-top {
    border-top: 4px solid var(--q-primary) !important;
  }

  .border-top-dark {
    border-top: 1px solid rgba(255, 255, 255, 0.05);
  }

  .pos-search-table :deep(thead tr th) {
    background-color: #263238;
    color: #eceff1;
    font-weight: bold;
    font-size: 0.9rem;
    letter-spacing: 1px;
  }

  .pos-search-table :deep(tbody tr:hover) {
    background-color: rgba(var(--q-primary), 0.15) !important;
    cursor: pointer;
  }

  .pos-search-table :deep(tbody tr:has(.cell-selected)) {
    background-color: rgba(0, 188, 212, 0.25) !important;
    border-left: 4px solid var(--q-cyan);
  }

  .pos-search-table :deep(tbody td.cell-selected) {
    background-color: rgba(0, 188, 212, 0.15);
  }

  .uppercase { text-transform: uppercase; }
  .tracking-tight { letter-spacing: -0.5px; }
</style>
