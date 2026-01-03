<template>
  <q-card style="width: 1100px; max-width: 95vw;" class="bg-grey-1">
    <q-card-section class="bg-primary text-white row items-center">
      <div class="text-h6">Registro de Compra a Proveedor</div>
      <q-space />
      <q-btn icon="close" flat round dense v-close-popup />
    </q-card-section>

    <q-card-section class="q-pa-md">
      <q-form @submit.prevent="confirmarGuardado" ref="formCompra">
        <div class="row q-col-gutter-md q-mb-lg">
          <q-select
            v-model="proveedorSeleccionado"
            use-input
            outlined
            dense
            map-options
            label="Proveedor *"
            :options="opcionesProveedores"
            @filter="filtrarProveedores"
            option-label="nombre"
            option-value="id"
            class="col-12 col-md-4 custom-focus"
            :rules="[val => !!val || 'El proveedor es obligatorio']"
            :loading="buscandoProv"
            @update:model-value="alSeleccionarProveedor"
          >
            <template v-slot:option="scope">
              <q-item v-bind="scope.itemProps">
                <q-item-section avatar>
                  <q-icon name="business" color="primary" />
                </q-item-section>
                <q-item-section>
                  <q-item-label>{{ scope.opt.razon_social }}</q-item-label>
                  <q-item-label caption v-if="scope.opt.rfc">
                    ID: {{ scope.opt.rfc }}
                  </q-item-label>
                </q-item-section>
              </q-item>
            </template>

            <template v-slot:selected-item="scope">
              <div v-if="scope.opt" class="text-weight-bold text-dark">
                {{ scope.opt.razon_social }}
              </div>
            </template>
          </q-select>

          <q-select
            v-model="compra.metodo_pago"
            :options="['CONTADO', 'CREDITO']"
            label="Método de Pago *"
            outlined dense
            class="col-12 col-md-2 custom-focus"
          />
          <q-input v-model="compra.fecha" type="date" label="Fecha *" outlined dense class="col-12 col-md-2 custom-focus" />
          <q-input v-model="compra.referencia" label="Factura/Referencia" outlined dense class="col-12 col-md-4 custom-focus" />
        </div>

        <q-card flat bordered class="q-mb-md bg-white shadow-1">
          <q-card-section class="q-py-sm bg-blue-grey-1 row items-center">
            <q-icon name="shopping_cart" class="q-mr-sm" />
            <div class="text-subtitle2">Partidas de la Compra</div>
          </q-card-section>
          <q-card-section>
            <div class="row q-col-gutter-sm items-center">
              <div class="col-12 col-md-7">
                <q-select
                  v-model="busquedaProducto"
                  use-input outlined dense
                  label="Buscar Producto (Nombre o SKU)"
                  :options="opcionesProductos"
                  @filter="filtrarProductos"
                  option-label="nombre"
                  @update:model-value="prepararPartida"
                  :loading="buscando"
                />
              </div>
              <div class="col-6 col-md-2">
                <q-input v-model.number="tempPartida.cantidad" label="Cant." type="number" outlined dense />
              </div>
              <div class="col-6 col-md-2">
                <q-input v-model.number="tempPartida.costo_unitario" label="Costo U." type="number" outlined dense prefix="$" />
              </div>
              <div class="col-12 col-md-1">
                <q-btn color="secondary" icon="add" class="full-width" @click="agregarAlDetalle" :disabled="!tempPartida.producto_id" />
              </div>
            </div>
          </q-card-section>
        </q-card>

        <q-table
          :rows="compra.detalles"
          :columns="columnasPartidas"
          flat bordered dense
          row-key="producto_id"
          class="q-mb-lg shadow-1 rounded-borders"
        >
          <template v-slot:body-cell-acciones="props">
            <q-td :props="props">
              <q-btn icon="delete" color="negative" flat round dense @click="eliminarPartida(props.row)" />
            </q-td>
          </template>
        </q-table>

        <div class="row justify-end">
          <div class="col-12 col-md-4">
            <q-list dense bordered class="bg-white rounded-borders shadow-1">
              <q-item>
                <q-item-section>Subtotal:</q-item-section>
                <q-item-section side class="text-black text-weight-bold">${{ formatMoney(totales.subtotal) }}</q-item-section>
              </q-item>
              <q-item>
                <q-item-section>IVA (16%):</q-item-section>
                <q-item-section side class="text-black text-weight-bold">${{ formatMoney(totales.iva) }}</q-item-section>
              </q-item>
              <q-separator />
              <q-item class="bg-primary text-white">
                <q-item-section class="text-h6">TOTAL COMPRA:</q-item-section>
                <q-item-section side class="text-h6 text-white text-weight-bolder">${{ formatMoney(totales.total) }}</q-item-section>
              </q-item>
            </q-list>
          </div>
        </div>
      </q-form>
    </q-card-section>

    <q-card-actions align="right" class="q-pa-md bg-grey-2">
      <q-btn flat label="Cancelar" color="grey-7" v-close-popup />
      <q-btn color="primary" label="Finalizar Compra" icon="check_circle" @click="confirmarGuardado" :loading="guardando" />
    </q-card-actions>
  </q-card>
</template>

<script setup>
  import { ref, computed } from 'vue'
  import { api } from 'src/boot/axios'
  import { useQuasar } from 'quasar'

  const $q = useQuasar()
  const emit = defineEmits(['actualizar'])

  const guardando = ref(false)
  const buscando = ref(false)
  const buscandoProv = ref(false)
  const opcionesProductos = ref([])
  const opcionesProveedores = ref([])
  const busquedaProducto = ref(null)
  const proveedorSeleccionado = ref(null)
  const formCompra = ref(null)

  const compra = ref({
    provider_id: null,
    metodo_pago: 'CONTADO',
    fecha: new Date().toISOString().substr(0, 10),
    referencia: '',
    detalles: []
  })

  const alSeleccionarProveedor = (val) => {
    if (val) {
      // Guardamos el ID en el objeto que se enviará al backend
      compra.value.provider_id = val.id
      proveedorSeleccionado.value = val
    } else {
      compra.value.provider_id = null
      proveedorSeleccionado.value = null
    }
  }

  const tempPartida = ref({ producto_id: null, nombre: '', cantidad: 1, costo_unitario: 0 })

  // DEFINICIÓN DE COLUMNAS
  const columnasPartidas = [
    { name: 'nombre', label: 'Producto', field: 'nombre', align: 'left' },
    { name: 'cantidad', label: 'Cant.', field: 'cantidad', align: 'center' },
    { name: 'costo', label: 'Costo Unit.', field: 'costo_unitario', format: v => `$${v}`, align: 'right' },
    { name: 'importe', label: 'Importe', field: row => row.cantidad * row.costo_unitario, format: v => `$${v.toFixed(2)}`, align: 'right' },
    { name: 'acciones', label: '', field: 'acciones', align: 'center' }
  ]

  const totales = computed(() => {
    const subtotal = compra.value.detalles.reduce((sum, item) => sum + (item.cantidad * item.costo_unitario), 0)
    const iva = subtotal * 0.16
    return { subtotal, iva, total: subtotal + iva }
  })

  // BUSCADOR DE PROVEEDORES DINÁMICO
  const filtrarProveedores = (val, update, abort) => {
    if (val.length < 2) { abort(); return }
    update(async () => {
      buscandoProv.value = true
      try {
        const { data } = await api.get('/api/proveedores/buscar', { params: { q: val } })
        opcionesProveedores.value = data
      } finally { buscandoProv.value = false }
    })
  }

  // BUSCADOR DE PRODUCTOS (Reutilizado)
  const filtrarProductos = (val, update, abort) => {
    if (val.length < 2) { abort(); return }
    update(async () => {
      buscando.value = true
      try {
        const { data } = await api.get('/api/inventario/buscar-filtro', { params: { q: val } })
        opcionesProductos.value = data
      } finally { buscando.value = false }
    })
  }

  const prepararPartida = (val) => {
    if (!val) return
    tempPartida.value = { producto_id: val.id, nombre: val.nombre, cantidad: 1, costo_unitario: val.precio }
  }

  const agregarAlDetalle = () => {
    if (compra.value.detalles.some(d => d.producto_id === tempPartida.value.producto_id)) {
      $q.notify({ message: 'El producto ya está en la lista', color: 'orange' })
      return
    }
    compra.value.detalles.push({ ...tempPartida.value })
    busquedaProducto.value = null
    tempPartida.value = { producto_id: null, nombre: '', cantidad: 1, costo_unitario: 0 }
  }

  const eliminarPartida = (row) => {
    compra.value.detalles = compra.value.detalles.filter(d => d.producto_id !== row.producto_id)
  }

  // FUNCIÓN CORREGIDA PARA CONFIRMAR GUARDADO
  const confirmarGuardado = () => {
    if (compra.value.detalles.length === 0) {
      $q.notify({ message: 'No hay productos en la compra', color: 'negative' });
      return;
    }

    $q.dialog({
      title: 'Confirmar Compra',
      message: `¿Deseas registrar esta compra por un total de $${totales.value.total.toFixed(2)}?`,
      cancel: true,
      persistent: true
    }).onOk(() => {
      ejecutarGuardado()
    })
  }

  const resetForm = () => {
    compra.value = {
      provider_id: null,
      metodo_pago: 'CONTADO',
      fecha: new Date().toISOString().substr(0, 10),
      referencia: '',
      observaciones: '',
      detalles: []
    }
    proveedorSeleccionado.value = null
    busquedaProducto.value = null
    tempPartida.value = { producto_id: null, nombre: '', cantidad: 1, costo_unitario: 0 }
    if (formCompra.value) {
      formCompra.value.resetValidation()
    }
  }

  const ejecutarGuardado = async () => {
    if (!compra.value.provider_id) {
      $q.notify({ message: 'Selecciona un proveedor válido', color: 'negative' })
      return
    }

    guardando.value = true
    try {
      const payload = {
        ...compra.value,
        ...totales.value,
        // Nos aseguramos de enviar el ID
        provider_id: proveedorSeleccionado.value?.id
      }
      await api.post('/api/compras', payload)
      $q.notify({ message: 'Compra registrada con éxito', color: 'positive' })
      resetForm()
      emit('actualizar')
    } catch (error) {
      console.error('Error al guardar:', error)
      $q.notify({
        message: 'Hubo un error al procesar la compra',
        color: 'negative'
      })
    } finally {
      guardando.value = false
    }
  }


  const formatMoney = (val) => {
    if (val === null || val === undefined) return '0.00'
    return Number(val).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })
  }
</script>
