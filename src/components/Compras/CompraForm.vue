<template>
  <q-card style="width: 1150px; max-width: 95vw;" class="bg-grey-1 border-radius-20 overflow-hidden">
    <q-card-section class="bg-primary text-white row items-center q-py-md">
      <q-icon name="shopping_bag" size="md" class="q-mr-sm" />
      <div>
        <div class="text-h6 text-bold">Nueva Orden de Compra</div>
        <div class="text-caption opacity-70">Registro de entrada de mercancía y pasivos</div>
      </div>
      <q-space />
      <q-btn icon="close" flat round dense v-close-popup />
    </q-card-section>

    <q-card-section class="q-pa-lg">
      <q-form @submit.prevent="confirmarGuardado" ref="formCompra">

        <div class="row q-col-gutter-lg q-mb-sm">
          <div class="col-12 col-md-4">
            <q-select
              v-model="proveedorSeleccionado"
              use-input outlined dense map-options
              label="Seleccionar Proveedor *"
              :options="opcionesProveedores"
              @filter="filtrarProveedores"
              option-label="razon_social"
              class="shadow-1"
              bg-color="white"
              :rules="[val => !!val || 'Requerido']"
              @update:model-value="alSeleccionarProveedor"
            >
              <template v-slot:prepend><q-icon name="business" color="primary" /></template>
              <template v-slot:option="scope">
                <q-item v-bind="scope.itemProps">
                  <q-item-section>
                    <q-item-label>{{ scope.opt.razon_social }}</q-item-label>
                    <q-item-label caption>{{ scope.opt.rfc }}</q-item-label>
                  </q-item-section>
                </q-item>
              </template>
            </q-select>
          </div>

          <div class="col-12 col-md-2">
            <q-select
              v-model="compra.metodo_pago"
              :options="['CONTADO', 'CREDITO']"
              label="Método *"
              outlined dense bg-color="white"
              class="shadow-1"
            >
              <template v-slot:prepend><q-icon name="payments" color="primary" /></template>
            </q-select>
          </div>

          <div class="col-12 col-md-2">
            <q-input
              v-model="compra.fecha"
              type="date"
              label="Fecha Emisión *"
              outlined dense bg-color="white"
              class="shadow-1"
            />
          </div>

          <transition name="fade">
            <div class="col-12 col-md-2" v-if="compra.metodo_pago === 'CREDITO'">
              <q-input
                v-model="compra.fecha_vencimiento"
                type="date"
                label="Vencimiento *"
                outlined dense bg-color="orange-1"
                class="shadow-1"
                :rules="[val => !!val || 'Defina el vencimiento']"
              >
                <template v-slot:prepend><q-icon name="event_busy" color="orange-9" /></template>
              </q-input>
            </div>
          </transition>

          <div class="col-12 col-md-2">
            <q-input
              v-model="compra.referencia"
              label="Referencia"
              outlined dense bg-color="white"
              class="shadow-1"
            >
              <template v-slot:prepend><q-icon name="description" color="primary" /></template>
            </q-input>
          </div>
        </div>

        <div class="row q-col-gutter-lg q-mb-sm">
         <div class="col-12 col-md-4" v-if="auth.roles[0] === 'Administrador'">
          <q-select
            v-model="compra.sucursale_id"
            :options="auth.sucursales"
            option-label="nombre"
            option-value="id"
            emit-value
            map-options
            outlined dense
            label="Sucursal *"
            bg-color="orange-1"
            class="shadow-1"
            :rules="[val => !!val || 'Seleccione sucursal']"
          >
            <template v-slot:prepend><q-icon name="storefront" color="orange-9" /></template>
          </q-select>
        </div>
      </div>

        <q-card flat bordered class="q-mb-lg border-radius-10 bg-white">
          <q-card-section class="q-py-md bg-red-3 row items-center">
            <q-icon name="add_shopping_cart" color="black" size="sm" class="q-mr-sm" />
            <div class="text-subtitle1 text-bold text-primary">Agregar Partidas</div>
          </q-card-section>

          <q-card-section>
            <div class="row q-col-gutter-md items-start">
              <div class="col-12 col-md-6">
                <q-select
                  v-model="busquedaProducto"
                  use-input outlined dense
                  label="Escriba nombre o código del producto..."
                  :options="opcionesProductos"
                  @filter="filtrarProductos"
                  option-label="nombre"
                  @update:model-value="prepararPartida"
                  :loading="buscando"
                >
                   <template v-slot:no-option>
                    <q-item><q-item-section class="text-grey">No se encontraron productos</q-item-section></q-item>
                  </template>
                </q-select>
              </div>
              <div class="col-6 col-md-2">
                <q-input v-model.number="tempPartida.cantidad" label="Cantidad" type="number" outlined dense />
              </div>
              <div class="col-6 col-md-2">
                <q-input v-model.number="tempPartida.costo_unitario" label="Costo Unitario" type="number" outlined dense prefix="$" />
              </div>
              <div class="col-12 col-md-2">
                <q-btn
                  color="primary"
                  icon="add"
                  label="Añadir"
                  class="full-width"
                  unelevated
                  @click="agregarAlDetalle"
                  :disabled="!tempPartida.producto_id"
                />
              </div>
            </div>
          </q-card-section>
        </q-card>

        <q-table
          :rows="compra.detalles"
          :columns="columnasPartidas"
          flat bordered dense
          row-key="producto_id"
          class="q-mb-xl shadow-2 border-radius-10"
          :pagination="{ rowsPerPage: 0 }"
          hide-bottom
        >
          <template v-slot:body-cell-acciones="props">
            <q-td :props="props" class="text-center">
              <q-btn icon="delete_outline" color="red" flat round dense @click="eliminarPartida(props.row)">
                <q-tooltip>Quitar partida</q-tooltip>
              </q-btn>
            </q-td>
          </template>
        </q-table>

        <div class="row justify-between items-end">
          <div class="col-12 col-md-6">
             <q-input v-model="compra.observaciones" type="textarea" label="Observaciones internas..." outlined dense rows="3" bg-color="white" />
          </div>
          <div class="col-12 col-md-4">
            <q-card flat class="bg-red-8 text-white q-pa-md border-radius-10 shadow-5">
              <div class="row justify-between q-mb-xs opacity-70">
                <span>Subtotal:</span>
                <span>$ {{ formatMoney(totales.subtotal) }}</span>
              </div>
              <div class="row justify-between q-mb-md opacity-70">
                <span>IVA (16%):</span>
                <span>$ {{ formatMoney(totales.iva) }}</span>
              </div>
              <q-separator dark class="q-my-sm" />
              <div class="row justify-between items-center">
                <span class="text-h6">TOTAL:</span>
                <span class="text-h4 text-bold text-yellow">$ {{ formatMoney(totales.total) }}</span>
              </div>
            </q-card>
          </div>
        </div>
      </q-form>
    </q-card-section>

    <q-separator />

    <q-card-actions align="right" class="q-pa-lg bg-white">
      <q-btn flat label="Descartar" color="grey-7" v-close-popup class="q-px-md" />
      <q-btn
        color="primary"
        label="Registrar Compra"
        icon="check_circle"
        unelevated
        size="lg"
        class="q-px-xl border-radius-10"
        @click="confirmarGuardado"
        :loading="guardando"
      />
    </q-card-actions>
  </q-card>
</template>

<script setup>
  import { ref, computed, watch } from 'vue'
  import { api } from 'src/boot/axios'
  import { useQuasar, date } from 'quasar'
  import { useAuthStore } from 'src/stores/auth'

  const $q = useQuasar()
  const emit = defineEmits(['actualizar'])
  const auth = useAuthStore()

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
    fecha: date.formatDate(Date.now(), 'YYYY-MM-DD'),
    fecha_vencimiento: null,
    referencia: '',
    observaciones: '',
    detalles: []
  })

  // Watcher para sugerir fecha de vencimiento (hoy + 30 días) cuando sea crédito
  watch(() => compra.value.metodo_pago, (newVal) => {
    if (newVal === 'CREDITO') {
      const fechaBase = new Date();
      compra.value.fecha_vencimiento = date.formatDate(date.addToDate(fechaBase, { days: 30 }), 'YYYY-MM-DD');
    } else {
      compra.value.fecha_vencimiento = null;
    }
  })

  const alSeleccionarProveedor = (val) => {
    if (val) {
      compra.value.provider_id = val.id
      proveedorSeleccionado.value = val
    }
  }

  const tempPartida = ref({ producto_id: null, nombre: '', cantidad: 1, costo_unitario: 0 })

  const columnasPartidas = [
    { name: 'nombre', label: 'Producto / Descripción', field: 'nombre', align: 'left', classes: 'text-bold' },
    { name: 'cantidad', label: 'Cant.', field: 'cantidad', align: 'center' },
    { name: 'costo', label: 'Costo Unit.', field: 'costo_unitario', format: v => `$ ${v.toFixed(2)}`, align: 'right' },
    { name: 'importe', label: 'Importe Total', field: row => row.cantidad * row.costo_unitario, format: v => `$ ${v.toFixed(2)}`, align: 'right', classes: 'text-bold' },
    { name: 'acciones', label: '', field: 'acciones', align: 'center' }
  ]

  const totales = computed(() => {
    const subtotal = compra.value.detalles.reduce((sum, item) => sum + (item.cantidad * item.costo_unitario), 0)
    const iva = subtotal * 0.16
    return { subtotal, iva, total: subtotal + iva }
  })

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
    tempPartida.value = { producto_id: val.id, nombre: val.nombre, cantidad: 1, costo_unitario: val.ultimo_costo || 0 }
  }

  const agregarAlDetalle = () => {
    if (compra.value.detalles.some(d => d.producto_id === tempPartida.value.producto_id)) {
      $q.notify({ message: 'El producto ya está en la lista', color: 'orange', position: 'bottom' })
      return
    }
    compra.value.detalles.push({ ...tempPartida.value })
    busquedaProducto.value = null
    tempPartida.value = { producto_id: null, nombre: '', cantidad: 1, costo_unitario: 0 }
  }

  const eliminarPartida = (row) => {
    compra.value.detalles = compra.value.detalles.filter(d => d.producto_id !== row.producto_id)
  }

  const confirmarGuardado = () => {
    if (compra.value.detalles.length === 0) {
      $q.notify({ message: 'Agregue al menos un producto para continuar', color: 'negative' });
      return;
    }

    $q.dialog({
      title: 'Confirmar Registro',
      message: `Se registrará una compra por un total de <b>$ ${formatMoney(totales.value.total)}</b>. ¿Desea continuar?`,
      html: true,
      ok: { label: 'Finalizar', color: 'primary', unelevated: true },
      cancel: { label: 'Revisar', flat: true, color: 'grey-7' },
      persistent: true
    }).onOk(() => {
      ejecutarGuardado()
    })
  }

  const ejecutarGuardado = async () => {
    if (!compra.value.provider_id) {
      $q.notify({ message: 'Debe seleccionar un proveedor válido', color: 'negative' })
      return
    }

    guardando.value = true
    try {
      const payload = {
        ...compra.value,
        ...totales.value
      }
      await api.post('/api/compras', payload)
      $q.notify({ message: 'Compra registrada y existencias actualizadas', color: 'positive', icon: 'done_all' })
      resetForm()
      emit('actualizar')
    } catch (error) {
      $q.notify({ message: 'Error de servidor al guardar la compra', color: 'negative' })
    } finally {
      guardando.value = false
    }
  }

  const resetForm = () => {
    compra.value = {
      provider_id: null,
      metodo_pago: 'CONTADO',
      fecha: date.formatDate(Date.now(), 'YYYY-MM-DD'),
      fecha_vencimiento: null,
      referencia: '',
      observaciones: '',
      detalles: []
    }
    proveedorSeleccionado.value = null
    busquedaProducto.value = null
  }

  const formatMoney = (val) => {
    return Number(val || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }
</script>

<style scoped>
  .border-radius-20 { border-radius: 20px; }
  .border-radius-10 { border-radius: 10px; }
  .opacity-70 { opacity: 0.7; }
  .fade-enter-active, .fade-leave-active { transition: opacity 0.3s; }
  .fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
