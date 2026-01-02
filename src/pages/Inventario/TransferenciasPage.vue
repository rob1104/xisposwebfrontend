<template>
  <q-page class="q-pa-lg bg-grey-2">
    <div class="row q-col-gutter-md">
      <div class="col-12">
        <q-card class="shadow-10 border-radius-15">
          <q-card-section class="bg-primary text-white row items-center">
            <q-icon name="local_shipping" size="md" class="q-mr-md" />
            <div class="text-h6">Nueva Transferencia de Inventario</div>
          </q-card-section>

          <q-stepper
            v-model="step"
            ref="stepper"
            color="primary"
            animated
            header-nav
            class="no-shadow"
          >
            <q-step :name="1" title="Ruta de Envío" icon="map" :done="step > 1">
              <div class="row q-col-gutter-lg q-mt-md">
                <div class="col-12 col-md-6">
                  <q-select
                    v-model="transfer.sucursal_origen_id"
                    :options="sucursales"
                    option-label="nombre"
                    option-value="id"
                    emit-value
                    map-options
                    label="Sucursal Origen (De donde sale)"
                    outlined
                    bg-color="white"
                  />
                </div>
                <div class="col-12 col-md-6">
                  <q-select
                    v-model="transfer.sucursal_destino_id"
                    :options="sucursales"
                    option-label="nombre"
                    option-value="id"
                    emit-value
                    map-options
                    label="Sucursal Destino (A donde llega)"
                    outlined
                    bg-color="white"
                  />
                </div>
              </div>
            </q-step>

            <q-step :name="2" title="Detalle de Carga" icon="inventory_2" :done="step > 2">
              <div class="row q-col-gutter-sm items-center q-mb-md">
                <div class="col-grow">
                  <q-select
                    ref="productSearch"
                    v-model="selectedProduct"
                    use-input
                    outlined
                    label="Buscar producto por nombre o código..."
                    :options="productOptions"
                    @filter="filterProducts"
                    @update:model-value="addProductToList"
                  >
                    <template v-slot:no-option>
                      <q-item><q-item-section class="text-grey">Sin resultados</q-item-section></q-item>
                    </template>
                  </q-select>
                </div>
              </div>

              <q-markup-table flat bordered class="q-mt-md shadow-2 border-radius-15">
                <thead class="bg-blue-grey-1">
                  <tr>
                    <th class="text-left">CÓDIGO / PRODUCTO</th>
                    <th class="text-right">STOCK EN ORIGEN</th> <th class="text-right" style="width: 180px">CANTIDAD A ENVIAR</th>
                    <th class="text-center" style="width: 50px"></th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(item, index) in transfer.productos" :key="index">
                    <td>
                      <div class="text-bold text-primary">{{ item.nombre }}</div>
                      <div class="text-caption text-grey-7">{{ item.codigo_barras }}</div>
                    </td>

                    <td class="text-right">
                      <q-badge
                        :color="item.cantidad > item.stock_disponible ? 'red-2' : 'green-1'"
                        :text-color="item.cantidad > item.stock_disponible ? 'red-9' : 'green-9'"
                        class="text-bold q-pa-sm"
                      >
                        <q-icon :name="item.cantidad > item.stock_disponible ? 'warning' : 'inventory_2'" class="q-mr-xs" />
                        {{ item.stock_disponible }}
                      </q-badge>
                    </td>

                    <td>
                      <q-input
                        v-model.number="item.cantidad"
                        type="number"
                        step="0.000001"
                        dense
                        outlined
                        input-class="text-right text-bold"
                        :error="item.cantidad > item.stock_disponible"
                        hide-bottom-space
                      />
                    </td>
                    <td class="text-center">
                      <q-btn icon="delete" color="negative" flat round dense @click="removeItem(index)" />
                    </td>
                  </tr>
                </tbody>
              </q-markup-table>
            </q-step>

            <q-step :name="3" title="Confirmar Envío" icon="check_circle">
              <div class="bg-blue-1 q-pa-md rounded-borders shadow-1 q-mb-lg">
                <div class="text-subtitle1 text-bold row items-center">
                  <q-icon name="info" class="q-mr-sm" /> Resumen de Transferencia
                </div>
                <div class="q-mt-sm">
                  De: <strong>{{ getSucursalName(transfer.sucursal_origen_id) }}</strong><br>
                  Hacia: <strong>{{ getSucursalName(transfer.sucursal_destino_id) }}</strong><br>
                  Items totales: <strong>{{ transfer.productos.length }}</strong>
                </div>
              </div>
              <q-input
                v-model="transfer.notas"
                type="textarea"
                label="Notas u observaciones del envío..."
                outlined
                rows="3"
              />
            </q-step>

            <template v-slot:navigation>
              <q-stepper-navigation class="row justify-end q-gutter-sm">
                <q-btn v-if="step > 1" flat color="primary" @click="$refs.stepper.previous()" label="Regresar" />
                <q-btn
                  color="primary"
                  @click="step === 3 ? sendTransfer() : handleNextStep()"
                  :label="step === 3 ? 'Confirmar y Enviar' : 'Siguiente'"
                  :loading="loading"
                />
              </q-stepper-navigation>
            </template>
          </q-stepper>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script setup>
  import { ref, reactive, onMounted } from 'vue'
  import { api } from 'boot/axios'
  import { useQuasar } from 'quasar'

  const $q = useQuasar()
  const step = ref(1)
  const loading = ref(false)
  const sucursales = ref([])
  const productOptions = ref([])
  const selectedProduct = ref(null)

  const transfer = reactive({
    sucursal_origen_id: null,
    sucursal_destino_id: null,
    productos: [],
    notas: ''
  })

  // AGREGAR PRODUCTO A LA LISTA
  const addProductToList = async (prod) => {
    if (!prod) return

    if (!transfer.sucursal_origen_id) {
      $q.notify({ color: 'warning', message: 'Seleccione primero la sucursal de origen' })
      selectedProduct.value = null
      return
    }

    const exists = transfer.productos.find(p => p.id === prod.value)
    if (exists) {
      $q.notify({ message: 'El producto ya está en la lista', color: 'info' })
      selectedProduct.value = null
      return
    }

    try {
      // Consultamos el stock global del producto
      const res = await api.get(`/api/inventarios/stock-global/${prod.value}`)

      // Filtramos el stock específico de la sucursal de origen seleccionada
      const infoSucursal = res.data.find(s => s.sucursal_id === transfer.sucursal_origen_id)
      const stockDisponible = infoSucursal ? parseFloat(infoSucursal.stock_actual) : 0

      transfer.productos.unshift({
        id: prod.value,
        nombre: prod.label,
        codigo_barras: prod.codigo,
        cantidad: 1.000000,
        stock_disponible: stockDisponible // Guardamos el límite para validar
      })
    } catch (e) {
      $q.notify({ color: 'negative', message: 'Error al consultar existencias' })
    } finally {
      selectedProduct.value = null
    }
  }

  // ENVIAR AL BACKEND
  const sendTransfer = async () => {
    if (transfer.productos.length === 0) {
      return $q.notify({ color: 'negative', message: 'Debe agregar al menos un producto' })
    }

    loading.value = true
    try {
      // Usamos el endpoint que creamos en el controlador
      await api.post('/api/transferencias/enviar', transfer)
      $q.notify({ color: 'positive', message: '¡Transferencia enviada con éxito!', icon: 'local_shipping' })
      resetForm()
    } catch (e) {
      $q.notify({ color: 'negative', message: e.response?.data?.message || 'Error al procesar el envío' })
    } finally {
      loading.value = false
    }
  }

  const resetForm = () => {
    step.value = 1
    transfer.productos = []
    transfer.notas = ''
  }

  // Agrega estas funciones dentro de <script setup> en TransferenciasPage.vue

/** * Carga el catálogo de sucursales para los selectores Origen/Destino
 */
const loadSucursales = async () => {
  try {
    const res = await api.get('/api/sucursales')
    sucursales.value = res.data
  } catch (e) {
    $q.notify({ color: 'negative', message: 'No se pudieron cargar las sucursales' })
  }
}

  /**
   * Filtro dinámico para buscar productos por nombre o código
   */
  const filterProducts = async (val, update, abort) => {
    if (val.length < 2) {
      abort()
      return
    }

    try {
      const res = await api.get(`/api/productos/search?query=${val}`)
      update(() => {
        productOptions.value = res.data.map(p => ({
          label: p.nombre,
          value: p.id,
          codigo: p.codigo_barras
        }))
      })
    } catch (e) {
      abort()
    }
  }

  const getSucursalName = (id) => {
    const s = sucursales.value.find(s => s.id === id)
    return s ? s.nombre : 'No seleccionada'
  }

  const removeItem = (index) => {
    transfer.productos.splice(index, 1)
  }

  // Nueva función para manejar el flujo del Stepper
  const handleNextStep = () => {
    if (step.value === 2) {
      // Buscamos si hay algún producto con exceso
      const conExceso = transfer.productos.filter(p => p.cantidad > p.stock_disponible)

      if (conExceso.length > 0) {
        $q.notify({
          color: 'negative',
          icon: 'warning',
          message: `Hay ${conExceso.length} productos que exceden el stock disponible en origen.`
        })
        return // Bloqueamos el avance
      }

      if (transfer.productos.length === 0) {
        $q.notify({ color: 'warning', message: 'Agregue al menos un producto para continuar' })
        return
      }
    }

    // Si todo está bien, avanzamos
    if (step.value < 3) {
      step.value++
    }
  }

  onMounted(() => {
    loadSucursales()
  })
</script>
