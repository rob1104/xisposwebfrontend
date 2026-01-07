<template>
  <q-dialog v-model="visible" full-width transition-show="slide-up" transition-hide="slide-down">
    <q-card class="bg-grey-1" style="border-radius: 20px;">

      <q-card-section class="row items-center bg-white q-pa-md border-bottom">
        <q-avatar icon="inventory_2" color="primary" text-color="white" />
        <div class="q-ml-md">
          <div class="text-h6 text-bold">{{ producto?.nombre }}</div>
          <div class="text-caption text-grey-7">Código: {{ producto?.codigo_barras }}</div>
        </div>
        <q-space />
        <q-badge color="primary" text-color="white" class="q-pa-sm text-bold text-uppercase">
          {{ sucursalNombre }}
        </q-badge>
        <q-btn icon="close" flat round dense v-close-popup class="q-ml-md" />
      </q-card-section>

      <q-card-section class="row q-col-gutter-md q-pa-lg">
        <div class="col-12 col-md-4" v-for="stat in stats" :key="stat.label">
          <q-card flat bordered class="stats-card">
            <q-card-section class="row items-center no-wrap">
              <q-avatar :icon="stat.icon" :color="stat.color" text-color="white" />
              <div class="q-ml-md">
                <div class="text-h6 text-bold">{{ stat.value }}</div>
                <div class="text-caption text-grey-7">{{ stat.label }}</div>
              </div>
            </q-card-section>
          </q-card>
        </div>
      </q-card-section>

      <q-card-section class="q-px-lg q-pb-lg">
        <q-table
          title="KARDEX"
          :rows="movimientos"
          :columns="columns"
          row-key="id"
          flat bordered
          :loading="loading"
          class="kardex-table shadow-2"
        >
          <template v-slot:body-cell-tipo_movimiento="props">
            <q-td :props="props">
              <q-chip
                :color="getMovementColor(props.value)"
                text-color="white"
                dense
                class="text-bold shadow-1"
                :icon="getMovementIcon(props.value)"
              >
                {{ props.value.toUpperCase() }}
              </q-chip>
            </q-td>
          </template>

          <template v-slot:body-cell-cantidad="props">
            <q-td :props="props" class="text-bold">
              <span :class="props.row.stock_nuevo > props.row.stock_anterior ? 'text-positive' : 'text-negative'">
                {{ props.row.stock_nuevo > props.row.stock_anterior ? '+' : '-' }}{{ props.value }}
              </span>
            </q-td>
          </template>

           <template v-slot:body-cell-stock_nuevo="props">
            <q-td :props="props">
            <q-chip dense size="lg" class="text-weight-bold" color="blue-9" text-color="white">
              {{ Number(props.value) }}
          </q-chip>
          </q-td>
          </template>
        </q-table>
      </q-card-section>

    </q-card>
  </q-dialog>
</template>

<script setup>
  import { ref, watch, computed } from 'vue'
  import { api } from 'boot/axios'
  import { useAuthStore } from 'stores/auth' // Supone que guardas la sucursal activa aquí

  const props = defineProps(['modelValue', 'producto'])
  const emit = defineEmits(['update:modelValue'])
  const auth = useAuthStore()

  const visible = computed({
    get: () => props.modelValue,
    set: (v) => emit('update:modelValue', v)
  })

  const loading = ref(false)
  const movimientos = ref([])
  const resumen = ref({ stock_actual: 0, stock_minimo: 0, costo_promedio: 0 })
  const sucursalNombre = ref('')

  const stats = computed(() => [
    { label: 'Existencia Actual', value: Number(resumen.value.stock_actual), icon: 'inventory', color: 'cyan' },
    { label: 'Costo Promedio', value: `$${Number(resumen.value.costo_promedio)}`, icon: 'payments', color: 'positive' },
    { label: 'Stock Mínimo', value: Number(resumen.value.stock_minimo), icon: 'warning', color: 'warning' }
  ])

  const columns = [
    { name: 'created_at', label: 'FECHA / HORA', field: 'created_at', align: 'left', format: val => new Date(val).toLocaleString() },
    { name: 'tipo_movimiento', label: 'TIPO', field: 'tipo_movimiento', align: 'center' }, //
    { name: 'cantidad', label: 'CANTIDAD', field: 'cantidad', align: 'right', format: val => Number(val) }, //
    { name: 'stock_anterior', label: 'ANTERIOR', field: 'stock_anterior', align: 'right', format: val => Number(val) },
    { name: 'stock_nuevo', label: 'NUEVO STOCK', field: 'stock_nuevo', align: 'right', classes: 'bg-blue-1 text-bold', format: val => Number(val) },
    { name: 'observaciones', label: 'OBSERVACIONES', field: 'observaciones', align: 'left' }
  ]

  const loadKardex = async () => {
    if (!props.producto) return
    loading.value = true
    try {
      const res = await api.get(`/api/productos/${props.producto.id}/kardex`, {
        params: { sucursal_id: auth.sucursalSeleccionada }
      })
      movimientos.value = res.data.movimientos
      resumen.value = res.data.resumen
      sucursalNombre.value = res.data.resumen.sucursal[0].nombre
    } catch (e) { console.error(e) }
    finally { loading.value = false }
  }

  watch(() => props.modelValue, (val) => { if(val) loadKardex() })

  const getMovementColor = (tipo) => {
    const t = tipo.toUpperCase()

    if (t.includes('ENTRADA POR COMPRA')) return 'green-7'          // Compra a proveedor
    if (t.includes('SALIDA POR VENTA')) return 'negative'           // Venta directa
    if (t.includes('CANCELACION DE VENTA')) return 'teal-6'         // Regreso de mercancía por cliente
    if (t.includes('CANCELACION DE COMPRA')) return 'orange-10'     // Devolución a proveedor
    if (t === 'ENTRADA') return 'positive'                          // Entrada manual / Carga inicial
    if (t === 'SALIDA') return 'red-10'                             // Salida manual / Merma
    if (t.includes('AJUSTE')) return 'warning'                      // Ajuste de inventario por auditoría
    if (t.includes('TRASPASO')) return 'indigo-7'                   // Movimiento entre sucursales

    return 'blue-grey-6' // Color por defecto para tipos no mapeados
  }

  // Función para determinar el icono descriptivo
  const getMovementIcon = (tipo) => {
    const t = tipo.toUpperCase()

    if (t.includes('COMPRA')) return 'local_shipping'               // Icono de logística
    if (t.includes('VENTA')) return 'point_of_sale'                 // Icono de caja
    if (t.includes('CANCELACION')) return 'history'                 // Icono de reversión
    if (t === 'ENTRADA') return 'add_circle_outline'
    if (t === 'SALIDA') return 'remove_circle_outline'
    if (t.includes('AJUSTE')) return 'tune'
    if (t.includes('TRASPASO')) return 'swap_horiz'

    return 'inventory_2'
  }

</script>

<style scoped>
  .stats-card {
    border-radius: 15px;
    background: white;
    transition: transform 0.2s;
    &:hover { transform: translateY(-3px); }
  }
  .kardex-table {
    border-radius: 12px;
    overflow: hidden;
    :deep(thead th) {
      background-color: #f8fafc;
      font-weight: bold;
      color: #475569;
    }
  }
</style>
