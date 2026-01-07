<template>
  <q-page class="q-pa-lg bg-grey-2">
    <div class="row items-center q-mb-xl">
      <q-avatar icon="local_shipping" color="primary" text-color="white" shadow-5 size="lg" />
      <div class="q-ml-md">
        <div class="text-h4 text-bold text-grey-9">Transferencia entre sucursales</div>
        <div class="text-subtitle1 text-grey-7">Gestione traslados de mercancía.</div>
      </div>
    </div>

    <div class="row q-col-gutter-xl">
      <div class="col-12 col-lg-8">
        <q-card class="shadow-15 border-radius-20 overflow-hidden border-none">
          <q-stepper
            v-model="step"
            ref="stepper"
            color="primary"
            animated
            header-nav
            class="no-shadow"
            active-color="primary"
            done-color="positive"
          >
            <q-step :name="1" title="Ruta de Envío" icon="map" :done="step > 1">
              <div class="row q-col-gutter-xl q-py-lg">
                <div class="col-12 col-md-6">
                  <div class="text-subtitle2 q-mb-sm text-grey-8">Sucursal de Salida</div>
                  <q-select
                    v-model="transfer.sucursal_origen_id"
                    :options="sucursales"
                    option-label="nombre"
                    option-value="id"
                    emit-value
                    map-options
                    outlined
                    bg-color="white"
                    @update:model-value="clearProducts"
                  >
                    <template v-slot:prepend><q-icon name="outbox" color="primary" /></template>
                  </q-select>
                </div>
                <div class="col-12 col-md-6">
                  <div class="text-subtitle2 q-mb-sm text-grey-8">Sucursal de Destino</div>
                  <q-select
                    v-model="transfer.sucursal_destino_id"
                    :options="sucursales"
                    option-label="nombre"
                    option-value="id"
                    emit-value
                    map-options
                    outlined
                    bg-color="white"
                    :rules="[val => val !== transfer.sucursal_origen_id || 'La sucursal destino debe ser distinta']"
                  >
                    <template v-slot:prepend><q-icon name="move_to_inbox" color="indigo" /></template>
                  </q-select>
                </div>
              </div>
            </q-step>

            <q-step :name="2" title="Detalle de Carga" icon="inventory_2" :done="step > 2">
              <div class="q-mb-lg">
                <q-select
                  v-model="selectedProduct"
                  use-input
                  outlined
                  label="Escriba nombre o código de barras..."
                  :options="productOptions"
                  @filter="filterProducts"
                  @update:model-value="addProductToList"
                  bg-color="white"
                >
                  <template v-slot:prepend><q-icon name="search" color="primary" /></template>
                  <template v-slot:no-option>
                    <q-item><q-item-section class="text-grey">No se encontraron productos</q-item-section></q-item>
                  </template>
                </q-select>
              </div>

              <q-markup-table flat bordered class="shadow-1 border-radius-15 custom-table">
                <thead class="bg-blue-grey-1">
                  <tr>
                    <th class="text-left">IDENTIFICACIÓN</th>
                    <th class="text-right">DISPONIBLE</th>
                    <th class="text-right" style="width: 150px">CANTIDAD</th>
                    <th class="text-center"></th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(item, index) in transfer.productos" :key="index" class="hover-row">
                    <td>
                      <div class="text-bold text-primary">{{ item.nombre }}</div>
                      <div class="text-caption text-grey-6">{{ item.codigo_barras }}</div>
                    </td>
                    <td class="text-right">
                      <q-badge
                        :color="item.cantidad > item.stock_disponible ? 'red-2' : 'green-1'"
                        :text-color="item.cantidad > item.stock_disponible ? 'red-9' : 'green-9'"
                        class="text-bold q-pa-sm"
                      >
                        {{ formatNumber(item.stock_disponible) }}
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
                      <q-btn icon="delete" color="red-4" flat round dense @click="removeItem(index)" />
                    </td>
                  </tr>
                </tbody>
              </q-markup-table>
            </q-step>

            <q-step :name="3" title="Confirmación" icon="fact_check">
              <div class="q-gutter-y-md">
                <q-banner dense class="bg-primary text-white border-radius-10 shadow-3">
                  <template v-slot:avatar><q-icon name="info" /></template>
                  Se generará una <strong>SALIDA POR TRASPASO</strong> en el inventario de origen de forma inmediata.
                </q-banner>

                <div class="row q-col-gutter-md">
                  <div class="col-12 col-md-4">
                    <q-item class="bg-white border-radius-10 shadow-1">
                      <q-item-section avatar><q-icon name="outbox" color="primary" /></q-item-section>
                      <q-item-section>
                        <q-item-label caption>Desde</q-item-label>
                        <q-item-label class="text-bold">{{ getSucursalName(transfer.sucursal_origen_id) }}</q-item-label>
                      </q-item-section>
                    </q-item>
                  </div>
                  <div class="col-12 col-md-4">
                    <q-item class="bg-white border-radius-10 shadow-1">
                      <q-item-section avatar><q-icon name="move_to_inbox" color="indigo" /></q-item-section>
                      <q-item-section>
                        <q-item-label caption>Hacia</q-item-label>
                        <q-item-label class="text-bold">{{ getSucursalName(transfer.sucursal_destino_id) }}</q-item-label>
                      </q-item-section>
                    </q-item>
                  </div>
                  <div class="col-12 col-md-4">
                    <q-item class="bg-white border-radius-10 shadow-1">
                      <q-item-section avatar><q-icon name="list_alt" color="grey-8" /></q-item-section>
                      <q-item-section>
                        <q-item-label caption>Productos</q-item-label>
                        <q-item-label class="text-bold">{{ transfer.productos.length }}</q-item-label>
                      </q-item-section>
                    </q-item>
                  </div>
                </div>

                <q-input
                  v-model="transfer.notas"
                  type="textarea"
                  label="Comentarios adicionales..."
                  outlined
                  bg-color="white"
                  rows="3"
                />
              </div>
            </q-step>

            <template v-slot:navigation>
              <q-stepper-navigation class="row justify-between q-mt-lg">
                <q-btn v-if="step > 1" flat color="grey-7" @click="$refs.stepper.previous()" label="Volver" />
                <q-space v-if="step === 1" />
                <q-btn
                  :color="step === 3 ? 'positive' : 'primary'"
                  @click="handleStepAction"
                  :label="step === 3 ? 'Confirmar Salida de Inventario' : 'Siguiente'"
                  :loading="loading"
                  unelevated
                  class="q-px-xl text-bold"
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

  /**
   * Agrega un producto seleccionado validando su existencia y stock en origen
   */
  const addProductToList = async (prod) => {
    if (!prod) return
    if (!transfer.sucursal_origen_id) {
      $q.notify({ color: 'warning', message: 'Defina la sucursal de origen primero' })
      selectedProduct.value = null
      return
    }

    if (transfer.productos.find(p => p.id === prod.value)) {
      $q.notify({ message: 'Producto ya listado', color: 'info' })
      selectedProduct.value = null
      return
    }

    try {
      const res = await api.get(`/api/inventario/stock-global/${prod.value}`)
      const info = res.data.find(s => s.sucursal_id === transfer.sucursal_origen_id)
      const stock = info ? parseFloat(info.stock_actual) : 0

      transfer.productos.unshift({
        id: prod.value,
        nombre: prod.label,
        codigo_barras: prod.codigo,
        cantidad: 1.0,
        stock_disponible: stock // Precisión 14,6
      })
    } catch (e) {
      $q.notify({ color: 'negative', message: 'Fallo al consultar existencias' })
    } finally {
      selectedProduct.value = null
    }
  }

  /**
   * Control del flujo del Stepper con validaciones por paso
   */
  const handleStepAction = () => {
    if (step.value === 1) {
      if (!transfer.sucursal_origen_id || !transfer.sucursal_destino_id) {
        return $q.notify({ color: 'warning', message: 'Seleccione las sucursales de ruta' })
      }
      if (transfer.sucursal_origen_id === transfer.sucursal_destino_id) {
        return $q.notify({ color: 'negative', message: 'Las sucursales deben ser diferentes' })
      }
    }

    if (step.value === 2) {
      if (transfer.productos.length === 0) {
        return $q.notify({ color: 'warning', message: 'Debe cargar al menos un producto' })
      }
      const errores = transfer.productos.filter(p => p.cantidad > p.stock_disponible)
      if (errores.length > 0) {
        return $q.notify({ color: 'negative', message: 'Corrija cantidades: exceden stock disponible' })
      }
    }

    if (step.value === 3) {
      sendTransfer()
      return
    }

    step.value++
  }

  /**
   * Envío definitivo al backend para registro en BD y KARDEX
   */
  const sendTransfer = async () => {
    loading.value = true
    try {
      // El backend espera 'id' y 'cantidad' por producto
      await api.post('/api/transferencias/enviar', transfer)
      $q.notify({
        color: 'positive',
        message: 'Operación exitosa: Salida registrada en inventario',
        icon: 'local_shipping'
      })
      resetForm()
    } catch (e) {
      $q.notify({
        color: 'negative',
        message: e.response?.data?.message || 'Error en el proceso'
      })
    } finally {
      loading.value = false
    }
  }

  const clearProducts = () => { transfer.productos = [] }

  const resetForm = () => {
    step.value = 1
    transfer.sucursal_origen_id = null
    transfer.sucursal_destino_id = null
    transfer.productos = []
    transfer.notas = ''
  }

  const loadSucursales = async () => {
    const res = await api.get('/api/sucursales')
    sucursales.value = res.data
  }

  const filterProducts = async (val, update, abort) => {
    if (val.length < 2) return abort()
    try {
      const res = await api.get(`/api/productos/search?query=${val}`)
      update(() => {
        productOptions.value = res.data.map(p => ({
          label: p.nombre, value: p.id, codigo: p.codigo_barras
        }))
      })
    } catch (e) { abort() }
  }

  const getSucursalName = (id) => sucursales.value.find(s => s.id === id)?.nombre || '---'
  const removeItem = (idx) => transfer.productos.splice(idx, 1)
  const formatNumber = (n) => Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 })

  onMounted(loadSucursales)
</script>

<style lang="scss" scoped>
  .border-radius-20 { border-radius: 20px; }
  .border-radius-10 { border-radius: 10px; }
  .custom-table {
    background: white;
    :deep(thead th) {
      font-weight: bold;
      color: #475569;
      background: #f1f5f9;
    }
  }
  .hover-row:hover { background: #f8fafc !important; }
  .shadow-15 { box-shadow: 0 10px 40px rgba(0,0,0,0.1); }
</style>
