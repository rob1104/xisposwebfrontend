<template>
  <q-dialog v-model="show" persistent backdrop-filter="blur(4px)" @show="onDialogOpen">
    <q-card style="width: 1000px; max-width: 95vw;" class="border-radius-20 overflow-hidden shadow-24">
      <q-card-section class="bg-indigo-10 text-white row items-center q-pa-lg">
        <div>
          <div class="text-h5 text-weight-bolder letter-spacing-1 flex items-center">
            <q-icon name="auto_awesome" class="q-mr-sm" color="amber-4" />
            NUEVA FACTURA
          </div>
          <div class="text-caption text-indigo-2 text-weight-medium">Emisión de comprobante fiscal digital (CFDI 4.0)</div>
        </div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup class="hover-scale" />
      </q-card-section>

      <q-card-section class="q-pa-none bg-slate-50">
        <q-stepper
          v-model="step"
          ref="stepper"
          color="indigo-10"
          animated
          flat
          class="bg-transparent"
          header-class="text-weight-bold bg-white shadow-subtle q-py-sm"
        >
          <q-step :name="1" title="Venta" icon="shopping_cart" :done="step > 1">
            <div class="q-pa-md">
              <q-table
                :rows="ventasPendientes"
                :columns="colVentas"
                row-key="id"
                selection="single"
                v-model:selected="ventaSeleccionada"
                :loading="loadingVentas"
                :filter="filtroVenta"
                flat
                bordered
                class="premium-selection-table"
                card-class="bg-white"
                style="max-height: 400px"
              >
                <template v-slot:top>
                  <div class="row full-width items-center q-gutter-md">
                    <div class="text-subtitle1 text-weight-bold text-slate-800">Selecciona la venta a facturar</div>
                    <q-space />
                    <q-input
                      v-model="filtroVenta"
                      placeholder="Buscar por folio o cliente..."
                      outlined dense
                      autofocus
                      class="bg-white search-box"
                    >
                      <template v-slot:prepend><q-icon name="search" /></template>
                    </q-input>
                  </div>
                </template>

                <template v-slot:body-cell-total="props">
                  <q-td :props="props">
                    <q-badge color="indigo-1" text-color="indigo-10" class="text-weight-bold q-px-sm">
                      {{ formatCurrency(props.value) }}
                    </q-badge>
                  </q-td>
                </template>
              </q-table>
            </div>
          </q-step>

          <q-step :name="2" title="Receptor" icon="person" :done="step > 2">
            <div class="q-pa-md row q-col-gutter-lg">
              <div class="col-12 col-md-5">
                <div class="text-subtitle2 text-weight-bold text-slate-700 q-mb-sm">Identificación del Cliente</div>
                <q-select
                  v-model="clienteSeleccionado"
                  use-input
                  input-debounce="300"
                  label="Buscar en catálogo..."
                  :options="clientesFiltrados"
                  @filter="filterFn"
                  outlined
                  option-label="razon_social"
                  clearable
                  class="bg-white shadow-sm"
                >
                  <template v-slot:no-option>
                    <q-item>
                      <q-item-section class="text-grey">Sin resultados</q-item-section>
                    </q-item>
                  </template>
                  <template v-slot:after>
                    <q-btn round color="indigo-10" icon="person_add" @click="showRegistroCliente = true">
                      <q-tooltip>Registrar cliente nuevo</q-tooltip>
                    </q-btn>
                  </template>
                </q-select>

                <q-banner dense class="bg-indigo-1 text-indigo-10 border-radius-10 q-mt-md">
                  <template v-slot:avatar><q-icon name="info" /></template>
                  Los datos deben coincidir exactamente con la CSF del receptor.
                </q-banner>
              </div>

              <div class="col-12 col-md-7 border-left q-pl-lg">
                <div class="text-subtitle2 text-weight-bold text-slate-700 q-mb-sm">Datos Fiscales Requeridos</div>
                <div class="row q-col-gutter-sm">
                  <q-input v-model="form.rfc" label="RFC *" outlined dense class="col-12 col-md-4" uppercase />
                  <q-input v-model="form.nombre" label="Razón Social *" outlined dense class="col-12 col-md-8" uppercase />
                  <q-input v-model="form.cp" label="C.P. Fiscal *" outlined dense class="col-12 col-md-4" />
                  <q-select v-model="form.regimen" :options="regimenes" option-label="name" option-value="id" label="Régimen Fiscal *" outlined dense class="col-12 col-md-8" emit-value map-options />
                  <q-select
                      v-model="form.forma_pago"
                      :options="formasPago"
                      option-value="c_FormaPago"
                      option-label="descripcion"
                      label="Forma de Pago *"
                      outlined dense
                      class="col-12 col-md-6"
                      emit-value
                      map-options
                    />
                  <q-select v-model="form.uso_cfdi" :options="usosCfdi" label="Uso de CFDI *" option-value="c_UsoCFDI" option-label="descripcion" outlined dense class="col-12" emit-value map-options />

                  <div class="col-12 q-mt-sm">
                    <q-toggle v-model="actualizarCatalogo" color="indigo-10" label="Actualizar estos datos en el catalogo de clientes" class="text-caption text-weight-bold text-indigo-9" />
                  </div>
                </div>
              </div>
            </div>
          </q-step>

          <q-step :name="3" title="Confirmación" icon="fact_check">
            <div class="row justify-center q-pa-xl text-center">
              <div class="col-12 col-md-8">
                <div class="confirmation-circle q-mx-auto q-mb-lg">
                  <q-icon name="description" color="indigo-10" size="4rem" />
                </div>
                <div class="text-h5 text-weight-bold text-slate-900">¿Confirmar emisión?</div>
                <div class="text-subtitle1 text-grey-7 q-mb-xl">Se timbrará la venta {{ ventaSeleccionada[0]?.folio }} por {{ formatCurrency(ventaSeleccionada[0]?.total) }}</div>

                <q-btn
                  color="indigo-10"
                  label="Timbrar Comprobante Ahora"
                  size="xl"
                  unelevated
                  class="full-width border-radius-15 shadow-10"
                  :loading="loadingTimbrando"
                  @click="procederTimbrado"
                />
              </div>
            </div>
          </q-step>
        </q-stepper>
      </q-card-section>

      <q-card-actions align="between" class="bg-white q-pa-lg">
        <q-btn v-if="step > 1" flat color="slate-600" icon="chevron_left" label="Regresar" @click="$refs.stepper.previous()" />
        <q-btn v-else flat color="negative" label="Cancelar" v-close-popup />

        <q-btn
          v-if="step < 3"
          color="indigo-10"
          icon-right="chevron_right"
          label="Continuar"
          unelevated
          class="q-px-lg border-radius-10"
          :disable="!canGoNext"
          @click="$refs.stepper.next()"
        />
      </q-card-actions>
    </q-card>

    <ClientesForm
      v-model="showRegistroCliente"
      :taxRegimes="regimenes"
      @saved="onClienteRegistrado"
    />
  </q-dialog>
</template>
<script setup>
  import { ref, computed, onMounted, watch } from 'vue'
  import { api } from 'boot/axios'
  import { useQuasar } from 'quasar'
  import { useAuthStore } from 'src/stores/auth'
  import ClientesForm from '../Clientes/ClientesForm.vue'

  const $q = useQuasar()
  const auth = useAuthStore()
  const step = ref(1)

  const filtroVenta = ref('')
  const loadingVentas = ref(false)
  const loadingTimbrando = ref(false)
  const cargandoCatalogos = ref(false)
  const regimenes = ref([])
  const usosCfdi = ref([])
  const ventasPendientes = ref([])
  const ventaSeleccionada = ref([])

  const clientes = ref([])
  const clientesFiltrados = ref([])
  const clienteSeleccionado = ref(null)
  const showRegistroCliente = ref(false)
  const actualizarCatalogo = ref(false)

  const formasPago = [
    { c_FormaPago: '01', descripcion: '01 - Efectivo' },
    { c_FormaPago: '03', descripcion: '03 - Transferencia electrónica de fondos' },
    { c_FormaPago: '04', descripcion: '04 - Tarjeta de crédito' },
    { c_FormaPago: '28', descripcion: '28 - Tarjeta de débito' },
    { c_FormaPago: '02', descripcion: '02 - Cheque nominativo' },
    { c_FormaPago: '99', descripcion: '99 - Por definir' }
  ]


  const props = defineProps({ modelValue: Boolean })
  const emit = defineEmits(['update:modelValue', 'saved'])

  const form = ref({
    rfc: '', nombre: '', cp: '', regimen: '', uso_cfdi: 'G03', 'cliente_id': null, 'forma_pago': '01'
  })

  const filterFn = (val, update) => {
    if (val === '') {
      update(() => {
        clientesFiltrados.value = clientes.value
      })
      return
    }

    update(() => {
      const needle = val.toLowerCase()
      clientesFiltrados.value = clientes.value.filter(v => {
        // Agregamos validaciones para evitar el error de 'null'
        // Si el campo es nulo, usamos un texto vacío para que no truene el sistema
        const nombre = (v.razon_social || '').toLowerCase()
        const rfc = (v.rfc || '').toLowerCase()

        return nombre.indexOf(needle) > -1 || rfc.indexOf(needle) > -1
      })
    })
  }

  const loadClientes = async () => {
    try {
      const { data } = await api.get('/api/clientes')
      clientes.value = data
    } catch (e) {
      console.error("Error al cargar clientes")
    }
  }

  watch(clienteSeleccionado, (val) => {
    if (val) {
      form.value.cliente_id = val.id
      form.value.rfc = val.rfc || ''
      form.value.nombre = val.razon_social || ''
      form.value.cp = val.codigo_postal || ''
      form.value.regimen = val.tax_regime_id || ''
    }
  })

  const onClienteRegistrado = async () => {
    await loadClientes()
    const nuevo = clientes.value[clientes.value.length - 1]
    clienteSeleccionado.value = nuevo
  }

  const show = computed({
    get: () => props.modelValue,
    set: (val) => emit('update:modelValue', val)
  })

  const canGoNext = computed(() => {
    if (step.value === 1) return ventaSeleccionada.value.length > 0
    if (step.value === 2) return form.value.rfc && form.value.nombre && form.value.cp && form.value.regimen
    return true
  })

  const resetForm = () => {
    // Regresamos al primer paso del asistente
    step.value = 1

    // Limpiamos selecciones de tablas y buscadores
    ventaSeleccionada.value = []
    clienteSeleccionado.value = null
    filtroVenta.value = ''

    // Reseteamos el formulario fiscal
    form.value = {
      cliente_id: null,
      rfc: '',
      nombre: '',
      cp: '',
      regimen: '',
      uso_cfdi: 'G03'
    }

    // Apagamos la bandera de actualización de catálogo
    actualizarCatalogo.value = false
  }

  const cargarCatalogos = async () => {
    cargandoCatalogos.value = true
    try {
      const [resRegimen, resUsos] = await Promise.all([
        api.get('/api/tax-regimes'),
        api.get('/api/usos-cfdi')
      ])
      regimenes.value = resRegimen.data
      usosCfdi.value = resUsos.data
    } catch (e) {
      console.error("Error al cargar catálogos del SAT")
    } finally {
      cargandoCatalogos.value = false
    }
  }


  watch(() => ventaSeleccionada.value, (newVal) => {
    if (newVal.length > 0) {
      const venta = newVal[0]
      if(venta.cliente) {
        form.value.rfc = venta.cliente.rfc || ''
        form.value.nombre = venta.cliente.razon_social || ''
        form.value.cp = venta.cliente.cp || ''
        form.value.regimen = venta.cliente.regimen || ''

      }
    }
  }, { deep: true })

  const colVentas = [
    { name: 'folio', label: 'Folio Venta', field: 'folio', align: 'left', sortable: true },
    { name: 'fecha', label: 'Fecha', field: row => row.created_at.substring(0,10), align: 'left' },
    { name: 'cliente', label: 'Cliente', field: row => row.cliente?.nombre || 'Público General', align: 'left' },
    { name: 'total', label: 'Total', field: 'total', align: 'right' }
  ]

  const onDialogOpen = async () => {
    step.value = 1
    ventaSeleccionada.value = []
    await Promise.all([
      loadVentasPendientes(),
      cargarCatalogos(),
      loadClientes()
    ])
  }

  const formatCurrency = (val) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(val)

  const loadVentasPendientes = async () => {
    loadingVentas.value = true
    try {
      const { data } = await api.get('/api/cfdis/ventas/pendientes',
                                      { params: { sucursal_id: auth.sucursalSeleccionada.id } })
      ventasPendientes.value = data
    } catch (e) {
      console.error("Error al cargar ventas pendientes")
    } finally {
      loadingVentas.value = false
    }
  }

  const procederTimbrado = async () => {
    loadingTimbrando.value = true
    try {
      const payload = {
        venta_id: ventaSeleccionada.value[0].id,
        receptor: form.value,
        sucursal_id: auth.sucursalSeleccionada.id,
        actualizar_catalogo: actualizarCatalogo.value
      }

      const { data } = await api.post('/api/cfdis/timbrar', payload)

      $q.notify({
        type: 'positive',
        message: `¡Factura Timbrada! UUID: ${data.uuid}`,
        icon: 'verified',
        timeout: 10000
      })
      emit('saved')
      resetForm()
      show.value = false

      // Emitir evento para recargar la tabla principal de facturas
    } catch (e) {
      $q.notify({
        type: 'negative',
        message: e.response?.data?.message || 'Error al timbrar factura',
        icon: 'report_problem'
      })
    } finally {
      loadingTimbrando.value = false
    }
  }


  onMounted(onDialogOpen)
</script>

<style lang="scss" scoped>
  .bg-slate-50 { background-color: #f8fafc; }
  .border-radius-20 { border-radius: 20px; }
  .border-radius-15 { border-radius: 15px; }
  .border-radius-10 { border-radius: 10px; }
  .letter-spacing-1 { letter-spacing: 1px; }

  .hover-scale {
    transition: transform 0.2s;
    &:hover { transform: scale(1.1); }
  }

  // Estilo para la tabla de selección de ventas
  .premium-selection-table {
    border: none;
    :deep(thead tr th) {
      background-color: #f1f5f9;
      color: #475569;
      font-weight: 800;
    }
    :deep(tbody tr.selected) {
      background-color: #eef2ff !important;
      color: $indigo-10;
      font-weight: bold;
    }
  }

  .search-box { width: 300px; }

  .confirmation-circle {
    width: 120px;
    height: 120px;
    background: #eef2ff;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 4px solid #c7d2fe;
  }

  .border-left { border-left: 1px solid #e2e8f0; }
</style>
