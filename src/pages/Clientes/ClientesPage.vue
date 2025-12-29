<template>
  <q-page class="q-pa-md bg-grey-3">
    <div class="row q-col-gutter-md">
      <div class="col-12">
        <q-table
          title="Catálogo de Clientes - La Nacional"
          :rows="rows"
          :columns="columns"
          row-key="id"
          :loading="loading"
          class="shadow-5"
          :filter="filter"
        >
          <template v-slot:top-right>
            <q-input borderless dense debounce="300" v-model="filter" placeholder="Buscar cliente...">
              <template v-slot:append>
                <q-icon name="search" />
              </template>
            </q-input>
            <q-btn
              color="primary"
              icon="add"
              label="Nuevo Cliente"
              class="q-ml-md"
              @click="openAddDialog"
            />
          </template>

          <template v-slot:body-cell-numero_global="props">
            <q-td :props="props">
              <q-badge color="secondary" class="text-bold">
                {{ props.value }}
              </q-badge>
            </q-td>
          </template>

          <template v-slot:body-cell-saldo_actual="props">
            <q-td :props="props" :class="props.value > 0 ? 'text-negative text-bold' : 'text-positive'">
              $ {{ props.value.toLocaleString() }}
            </q-td>
          </template>
        </q-table>
      </div>
    </div>

    <q-dialog v-model="showDialog" persistent max-width="850px" @show="setFocus">
      <q-card style="width: 750px; max-width: 95vw;">
        <q-card-section class="bg-primary text-white row items-center">
          <div class="text-h6 text-uppercase">
            <q-icon name="person_add" class="q-mr-sm" />
            Registrar Cliente
          </div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-tabs
          v-model="activeTab"
          class="text-primary"
          active-color="primary"
          indicator-color="primary"
          align="justify"
          narrow-indicator
        >
          <q-tab name="general" icon="account_circle" label="Generales" />
          <q-tab name="billing" icon="description" label="Facturación" />
          <q-tab name="address" icon="place" label="Dirección" />
          <q-tab name="finance" icon="account_balance_wallet" label="Finanzas" />
        </q-tabs>

        <q-separator />

        <q-form @submit="onSubmit">
          <q-tab-panels v-model="activeTab" animated class="q-pa-none">

            <q-tab-panel name="general" class="q-gutter-sm">
              <div class="row q-col-gutter-sm">
                <q-input v-bind="inputProps" ref="refGeneral" v-model="form.nombre_comercial" label="Nombre *" class="col-12" filled :rules="[val => !!val || 'El nombre es obligatorio']" />
                <q-input v-bind="inputProps" v-model="form.email" label="Correo Electrónico *" class="col-md-6 col-xs-12" filled :rules="[val => /.+@.+\..+/.test(val) || 'Email inválido']" />
                <q-input v-bind="inputProps" v-model="form.contacto" label="Persona de Contacto" class="col-md-6 col-xs-12" filled />
                <q-input v-bind="inputProps" v-model="form.telefono" label="Teléfono 1" class="col-md-6 col-xs-12" filled mask="(###) ### - ####" unmasked-value />
                <q-input v-bind="inputProps" v-model="form.telefono2" label="Teléfono 2 (Opcional)" class="col-md-6 col-xs-12" filled mask="(###) ### - ####" unmasked-value />
              </div>
            </q-tab-panel>

            <q-tab-panel name="billing" class="q-gutter-sm">
              <div class="row q-col-gutter-sm">
                <div class="col-12 text-caption text-grey-8 q-mb-xs">
                  Asegúrate de que los datos coincidan exactamente con la Constancia de Situación Fiscal.
                </div>
                <q-input ref="refBilling" v-model="form.razon_social" label="Razón Social *" class="col-12" filled :rules="[val => !!val || 'Requerido para facturación']" />
                <q-input v-model="form.rfc" label="RFC *" class="col-md-6 col-xs-12" filled mask="AAAA######XXX" unmasked-value :rules="[val => !!val || 'RFC Requerido']" />
                <q-input v-model="form.codigo_postal" label="C.P. Fiscal *" class="col-md-6 col-xs-12" filled mask="#####" :rules="[val => !!val || 'C.P. Requerido']" />

                <q-select
                  v-model="form.tax_regime_id"
                  :options="taxRegimeOptions"
                  option-value="id"
                  option-label="label"
                  emit-value
                  map-options
                  label="Régimen Fiscal *"
                  class="col-12"
                  filled
                  :rules="[val => !!val || 'Selecciona un régimen']"
                >
                  <template v-slot:option="scope">
                    <q-item v-bind="scope.itemProps">
                      <q-item-section>
                        <q-item-label>{{ scope.opt.label }}</q-item-label>
                      </q-item-section>
                    </q-item>
                  </template>
                </q-select>
              </div>
            </q-tab-panel>

            <q-tab-panel name="address" class="q-gutter-sm">
              <div class="row q-col-gutter-sm">
                <q-input ref="refAddress" v-model="form.calle" label="Calle" class="col-md-8 col-xs-12" filled />
                <q-input v-model="form.no_exterior" label="No. Ext" class="col-md-2 col-xs-6" filled />
                <q-input v-model="form.no_interior" label="No. Int" class="col-md-2 col-xs-6" filled />
                <q-input v-model="form.colonia" label="Colonia" class="col-md-6 col-xs-12" filled />
                <q-input v-model="form.ciudad" label="Ciudad / Municipio" class="col-md-6 col-xs-12" filled />
                <q-input v-model="form.estado" label="Estado" class="col-md-6 col-xs-12" filled />
                <q-input v-model="form.pais" label="País" class="col-md-6 col-xs-12" filled />
              </div>
            </q-tab-panel>

            <q-tab-panel name="finance" class="q-gutter-sm">
              <div class="row q-col-gutter-sm">
                <q-input ref="refFinance" v-model.number="form.limite_credito" type="number" label="Límite de Crédito" class="col-md-6 col-xs-12" filled prefix="$" />
                <q-input v-model.number="form.saldo_actual" type="number" label="Saldo Inicial" class="col-md-6 col-xs-12" filled prefix="$" />
                <q-input v-model="form.obs" type="textarea" label="Observaciones internas" class="col-12" filled rows="4" />
              </div>
            </q-tab-panel>

          </q-tab-panels>

          <q-separator />

          <q-card-actions align="right" class="q-pa-md bg-grey-2">
            <q-btn label="Cancelar" color="grey-7" v-close-popup flat />
            <q-btn label="Guardar Cliente" color="primary" type="submit" :loading="saving" icon="save" />
          </q-card-actions>
        </q-form>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
  import { ref, onMounted, reactive, nextTick, watch } from 'vue'
  import { api } from 'boot/axios'
  import { useQuasar } from 'quasar'

  const $q = useQuasar()

  // --- REFS PARA LOS INPUTS ---
  const refGeneral = ref(null)
  const refBilling = ref(null)
  const refAddress = ref(null)
  const refFinance = ref(null)

  // --- ESTADO ---
  const rows = ref([])
  const taxRegimeOptions = ref([])
  const loading = ref(true)
  const saving = ref(false)
  const showDialog = ref(false)
  const activeTab = ref('general')
  const filter = ref('')

  const inputProps = {
    outlined: true,       // Marco definido
    dense: true,          // Altura optimizada
    'stack-label': true,  // La etiqueta siempre arriba para que no "brinque"
    'standout': 'bg-red-1', // Al enfocar, resalta en rojo con letras blancas
    class: 'q-mb-none'    // Quitamos márgenes de abajo para controlarlos nosotros
  }

  // Formulario Inicial
  const initialForm = {
    nombre_comercial: '',
    razon_social: '',
    rfc: '',
    email: '',
    telefono: '',
    telefono2: '',
    contacto: '',
    calle: '',
    no_exterior: '',
    no_interior: '',
    colonia: '',
    codigo_postal: '',
    ciudad: '',
    estado: '',
    pais: 'México',
    tax_regime_id: null,
    limite_credito: 0,
    saldo_actual: 0,
    obs: ''
  }

  const form = reactive({ ...initialForm })

  // --- COLUMNAS DE LA TABLA ---
  const columns = [
    { name: 'numero_global', label: 'No. Global', field: 'numero_global', align: 'left', sortable: true },
    { name: 'nombre_comercial', label: 'Cliente', field: 'nombre_comercial', align: 'left', sortable: true },
    { name: 'rfc', label: 'RFC', field: 'rfc', align: 'left' },
    { name: 'telefono', label: 'Teléfono', field: 'telefono', align: 'left' },
    { name: 'saldo_actual', label: 'Saldo Deudor', field: 'saldo_actual', align: 'right', sortable: true }
  ]

  // --- MÉTODOS ---

  // Cargar Clientes
  const loadCustomers = async () => {
    loading.value = true
    try {
      const response = await api.get('/api/clientes')
      rows.value = response.data
    } catch (error) {
      $q.notify({ color: 'negative', message: 'Error al cargar los clientes', icon: 'error' })
    } finally {
      loading.value = false
    }
  }

  // Cargar Regímenes Fiscales para el select
  const loadTaxRegimes = async () => {
    try {
      const response = await api.get('/api/tax-regimes')
      taxRegimeOptions.value = response.data.map(r => ({
        id: r.id,
        label: `${r.code} - ${r.name}`
      }))
    } catch (error) {
      console.error('Error cargando catálogos fiscales', error)
    }
  }

  // Abrir diálogo y resetear form
  const openAddDialog = () => {
    Object.assign(form, initialForm)
    activeTab.value = 'general'
    showDialog.value = true
  }

  // Guardar Cliente
  const onSubmit = async () => {
    saving.value = true
    try {
      await api.post('/api/clientes', form)
      $q.notify({
        color: 'positive',
        message: '¡Cliente registrado con éxito!',
        icon: 'check_circle'
      })
      showDialog.value = false
      loadCustomers()
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Error al procesar la solicitud'
      $q.notify({ color: 'negative', message: errorMsg, icon: 'report_problem' })
    } finally {
      saving.value = false
    }
  }

  // --- CICLO DE VIDA ---
  onMounted(() => {
    loadCustomers()
    loadTaxRegimes()
  })

  // Función para poner el foco
  const setFocus = () => {
    // Esperamos a que Quasar termine de renderizar el panel de la pestaña
    nextTick(() => {
      if (activeTab.value === 'general') refGeneral.value?.focus()
      if (activeTab.value === 'billing') refBilling.value?.focus()
      if (activeTab.value === 'address') refAddress.value?.focus()
      if (activeTab.value === 'finance') refFinance.value?.focus()
    })
  }

  // Observar cuando cambia la pestaña activa
  watch(activeTab, () => {
    setFocus()
  })


</script>

  <style scoped>
  .q-table__card {
    border-radius: 8px;
  }
</style>
