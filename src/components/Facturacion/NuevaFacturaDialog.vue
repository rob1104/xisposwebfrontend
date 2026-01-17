<template>
  <q-dialog v-model="show" persistent maximized transition-show="slide-up" transition-hide="slide-down">
    <q-card class="bg-grey-2">
      <q-card-section class="bg-primary text-white row items-center q-pa-md shadow-5">
        <div class="text-h6 text-bold text-uppercase flex items-center">
          <q-icon name="add_chart" class="q-mr-sm" size="md" />
          Generar Nuevo Comprobante Fiscal (CFDI 4.0)
        </div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>

      <q-card-section class="q-pa-none">
        <q-stepper
          v-model="step"
          ref="stepper"
          color="primary"
          animated
          flat
          class="bg-transparent"
          header-class="text-bold bg-white shadow-1"
        >
          <q-step :name="1" title="Seleccionar Venta" icon="shopping_bag" :done="step > 1">
            <q-card flat bordered class="border-radius-15 overflow-hidden shadow-2">
              <q-table
                :rows="ventasPendientes"
                :columns="colVentas"
                row-key="id"
                selection="single"
                v-model:selected="ventaSeleccionada"
                :loading="loadingVentas"
                flat
                class="premium-table"
                no-data-label="No hay ventas pendientes por facturar en esta sucursal"
              >
                <template v-slot:top-left>
                  <div class="text-subtitle1 text-bold text-blue-grey-8">Ventas listas para facturar en {{ auth.sucursalSeleccionada?.nombre }}</div>
                </template>
                <template v-slot:body-cell-total="props">
                  <q-td :props="props" class="text-bold text-primary">{{ formatCurrency(props.value) }}</q-td>
                </template>
              </q-table>
            </q-card>
          </q-step>

          <q-step :name="2" title="Datos del Cliente" icon="account_box" :done="step > 2">
            <div class="row q-col-gutter-lg justify-center">
              <div class="col-12 col-md-8">
                <q-banner dense class="bg-indigo-1 text-indigo-9 rounded-borders q-mb-md shadow-1">
                    <template v-slot:avatar><q-icon name="shopping_cart" /></template>
                    Facturando Venta: <b>{{ ventaSeleccionada[0]?.folio }}</b> por un total de
                    <b class="text-h6">{{ formatCurrency(ventaSeleccionada[0]?.total) }}</b>
                  </q-banner>
                <q-card flat bordered class="q-pa-lg border-radius-15 shadow-2">
                  <div class="text-h6 q-mb-md text-primary flex items-center">
                    <q-icon name="verified_user" class="q-mr-xs" /> Información Fiscal Requerida
                  </div>
                  <div class="row q-col-gutter-md">
                    <q-input v-model="form.rfc" label="RFC *" outlined dense class="col-12 col-md-4" mask="AAAA######XXX" counter uppercase />
                    <q-input v-model="form.nombre" label="Nombre o Razón Social (Mayúsculas) *" outlined dense class="col-12 col-md-8" uppercase />
                    <q-input v-model="form.cp" label="Código Postal Fiscal *" outlined dense class="col-12 col-md-4" mask="#####" />
                    <q-select v-model="form.regimen" :options="regimenes" option-label="name" option-value="code" label="Régimen Fiscal *" outlined dense class="col-12 col-md-8" emit-value map-options />
                    <q-select v-model="form.uso_cfdi" :options="usosCfdi" label="Uso de CFDI *" option-value="c_UsoCFDI" option-label="descripcion" outlined dense class="col-12" emit-value map-options />
                  </div>
                </q-card>
              </div>
            </div>
          </q-step>

          <q-step :name="3" title="Timbrar Factura" icon="send">
            <div class="row q-col-gutter-md justify-center">
              <div class="col-12 col-md-6 text-center q-pa-xl">
                <q-icon name="task_alt" color="positive" size="100px" class="animate__animated animate__bounceIn" />
                <div class="text-h4 text-bold q-mt-md">¡Todo listo!</div>
                <p class="text-grey-7 text-subtitle1">
                  Se generará el CFDI 4.0 por un total de
                  <span class="text-bold text-primary">{{ formatCurrency(ventaSeleccionada[0]?.total) }}</span>.
                </p>
                <q-banner dense class="bg-blue-1 text-blue-9 rounded-borders q-mb-lg">
                  El XML será sellado y timbrado automaticamente.
                </q-banner>
                <q-btn
                  color="primary"
                  label="Confirmar y Timbrar"
                  size="lg"
                  icon="flash_on"
                  unelevated
                  class="full-width custom-btn-radius shadow-8"
                  :loading="loadingTimbrando"
                  @click="procederTimbrado"
                />
              </div>
            </div>
          </q-step>
        </q-stepper>
      </q-card-section>

      <q-card-actions align="between" class="bg-white q-pa-md shadow-up-5">
        <q-btn v-if="step > 1" flat color="grey-7" icon="arrow_back" label="Anterior" @click="$refs.stepper.previous()" />
        <q-btn v-else flat color="negative" label="Cerrar" v-close-popup />

        <q-btn
          v-if="step < 3"
          color="primary"
          icon-right="arrow_forward"
          label="Siguiente"
          unelevated
          :disable="!canGoNext"
          @click="$refs.stepper.next()"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
  import { ref, computed, onMounted, watch } from 'vue'
  import { api } from 'boot/axios'
  import { useQuasar } from 'quasar'
  import { useAuthStore } from 'src/stores/auth'

  const $q = useQuasar()
  const auth = useAuthStore()
  const step = ref(1)

  const loadingVentas = ref(false)
  const loadingTimbrando = ref(false)
  const cargandoCatalogos = ref(false)
  const regimenes = ref([])
  const usosCfdi = ref([])
  const ventasPendientes = ref([])
  const ventaSeleccionada = ref([])

  const props = defineProps({ modelValue: Boolean })
  const emit = defineEmits(['update:modelValue', 'saved'])

  const form = ref({
    rfc: '', nombre: '', cp: '', regimen: '', uso_cfdi: 'G03'
  })

  const show = computed({
    get: () => props.modelValue,
    set: (val) => emit('update:modelValue', val)
  })

  const canGoNext = computed(() => {
    if (step.value === 1) return ventaSeleccionada.value.length > 0
    if (step.value === 2) return form.value.rfc && form.value.nombre && form.value.cp && form.value.regimen
    return true
  })

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
      cargarCatalogos()
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
        sucursal_id: auth.sucursalSeleccionada.id
      }

      const { data } = await api.post('/api/cfdis/timbrar', payload)

      $q.notify({
        type: 'positive',
        message: `¡Factura Timbrada! UUID: ${data.uuid}`,
        icon: 'verified',
        timeout: 10000
      })

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
  .premium-table {
    :deep(thead th) {
      background-color: #263238;
      color: white;
      font-weight: bold;
    }
  }
  .border-radius-15 { border-radius: 15px; }
  .custom-btn-radius { border-radius: 12px; font-weight: bold; }
</style>
