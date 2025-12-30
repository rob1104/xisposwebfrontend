<template>
  <q-dialog v-model="show" persistent max-width="850px" @show="onDialogOpen">
    <q-card style="width: 750px; max-width: 95vw;">
      <q-card-section class="bg-primary text-white row items-center">
        <div class="text-h6 text-uppercase">
          <q-icon :name="isEdit ? 'edit' : 'person_add'" class="q-mr-sm" />
          {{ isEdit ? 'Editar Cliente' : 'Registrar Cliente' }}
        </div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>

      <q-tabs
        v-model="activeTab"
        class="text-primary bg-grey-1"
        active-color="primary"
        indicator-color="primary"
        align="justify"
        narrow-indicator
      >
        <q-tab name="general" icon="account_box" label="Generales" />
        <q-tab name="billing" icon="receipt_long" label="Facturación" />
        <q-tab name="address" icon="map" label="Dirección" />
        <q-tab name="finance" icon="savings" label="Finanzas" />
      </q-tabs>

      <q-separator />

      <q-form @submit="handleSubmit">
        <q-tab-panels v-model="activeTab" animated class="q-pa-sm">

          <q-tab-panel name="general">
            <div class="row q-col-gutter-md">
              <div class="col-12">
                <q-input
                  v-bind="inputProps"
                  v-model="form.nombre_comercial"
                  label="Nombre Comercial *"
                  ref="refGeneral"
                  :rules="[val => !!val || 'El nombre es obligatorio']"
                  @blur="handleNombreComercialBlur"
                >
                  <template v-slot:prepend><q-icon name="storefront" color="primary" /></template>
                </q-input>
              </div>
              <div class="col-12">
                <q-input
                  v-bind="inputProps"
                  v-model="form.email"
                  label="Correo Electrónico *"
                  :rules="[val => /.+@.+\..+/.test(val) || 'Email inválido']"
                >
                  <template v-slot:prepend><q-icon name="email" color="primary" /></template>
                </q-input>
              </div>
              <div class="col-12 col-md-6">
                <q-input v-bind="inputProps" v-model="form.telefono" label="Teléfono" mask="(###) ### - ####" unmasked-value />
              </div>
              <div class="col-12 col-md-6">
                <q-input v-bind="inputProps" v-model="form.contacto" label="Contacto / Atención" />
              </div>
            </div>
          </q-tab-panel>

          <q-tab-panel name="billing">
            <div class="row q-col-gutter-md">
              <div class="col-12">
                <q-input
                  v-bind="inputProps"
                  v-model="form.razon_social"
                  label="Razón Social (Fiscal) *"
                  ref="refBilling"
                  :rules="[val => !!val || 'Requerido para facturación']"
                />
              </div>
              <div class="col-12 col-md-6">
                <q-input v-bind="inputProps" v-model="form.rfc" label="RFC *" mask="AAAA######XXX" unmasked-value />
              </div>
              <div class="col-12 col-md-6">
                <q-input v-bind="inputProps" v-model="form.codigo_postal" label="C.P. Fiscal *" mask="#####" />
              </div>
              <div class="col-12">
                <q-select
                  v-bind="inputProps"
                  v-model="form.tax_regime_id"
                  :options="taxRegimes"
                  label="Régimen Fiscal *"
                  emit-value
                  map-options
                />
              </div>
            </div>
          </q-tab-panel>

          <q-tab-panel name="address">
            <div class="row q-col-gutter-md">
              <div class="col-12 col-md-8">
                <q-input v-bind="inputProps" v-model="form.calle" label="Calle" ref="refAddress" />
              </div>
              <div class="col-6 col-md-2">
                <q-input v-bind="inputProps" v-model="form.no_exterior" label="Ext." />
              </div>
              <div class="col-6 col-md-2">
                <q-input v-bind="inputProps" v-model="form.no_interior" label="Int." />
              </div>
              <div class="col-12 col-md-6">
                <q-input v-bind="inputProps" v-model="form.colonia" label="Colonia" />
              </div>
              <div class="col-12 col-md-6">
                <q-input v-bind="inputProps" v-model="form.ciudad" label="Ciudad" />
              </div>
              <div class="col-6">
                <q-input v-bind="inputProps" v-model="form.estado" label="Estado" />
              </div>
              <div class="col-6">
                <q-input v-bind="inputProps" v-model="form.pais" label="País" />
              </div>
            </div>
          </q-tab-panel>

          <q-tab-panel name="finance">
            <div class="row q-col-gutter-md">
              <div class="col-12">
                <q-select
                  v-bind="inputProps"
                  v-model="form.tipo_pago"
                  :options="tipoPagoOptions"
                  label="Permisos de Compra / Crédito *"
                  emit-value
                  map-options
                >
                  <template v-slot:prepend>
                    <q-icon name="credit_score" color="primary" />
                  </template>
                  <template v-slot:option="scope">
                    <q-item v-bind="scope.itemProps">
                      <q-item-section avatar>
                        <q-icon
                          :name="getTipoPagoIcon(scope.opt.value)"
                          :color="getTipoPagoColor(scope.opt.value)"
                        />
                      </q-item-section>
                      <q-item-section>
                        <q-item-label>{{ scope.opt.label }}</q-item-label>
                      </q-item-section>
                    </q-item>
                  </template>
                </q-select>
              </div>
              <div class="col-12 col-md-6">
                <q-input :disable="!isCreditEnabled" v-bind="inputProps" v-model.number="form.limite_credito" type="number" label="Límite de Crédito" prefix="$" />
              </div>
              <div class="col-12 col-md-6">
                <q-input :disable="!isCreditEnabled" v-bind="inputProps" v-model.number="form.saldo_actual" type="number" label="Saldo Inicial" prefix="$" />
              </div>

              <div class="col-12 col-md-6">
                <q-input
                  :disable="!isCreditEnabled"
                  v-bind="inputProps"
                  v-model.number="form.dias_credito"
                  type="number"
                  label="Días de Crédito"
                  suffix="Días"
                >
                  <template v-slot:prepend><q-icon name="event_available" color="primary" /></template>
                </q-input>
              </div>

              <div class="col-12 col-md-6 flex flex-center">
                <q-toggle
                  :disable="!isCreditEnabled"
                  v-model="form.vender_vencido"
                  label="Permitir venta con facturas vencidas"
                  color="negative"
                  keep-color
                  icon="warning"
                />
              </div>

              <div class="col-12">
                <q-input v-bind="inputProps" v-model="form.obs" type="textarea" label="Observaciones del Cliente" rows="3" />
              </div>
            </div>
          </q-tab-panel>

        </q-tab-panels>

        <q-separator />

        <q-card-actions align="right" class="q-pa-md bg-grey-2">
          <q-btn label="Cancelar" flat color="grey-8" v-close-popup />
          <q-btn
            :label="isEdit ? 'Guardar Cambios' : 'Registrar Cliente'"
            color="primary"
            type="submit"
            :loading="loading"
            icon="save"
          />
        </q-card-actions>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script setup>
  import { ref, reactive, computed, watch, nextTick } from 'vue'
  import { api } from 'boot/axios'
  import { useQuasar } from 'quasar'

  const props = defineProps({
    modelValue: Boolean, // Controla si el diálogo se ve
    editData: Object,    // Datos del cliente a editar (null si es nuevo)
    taxRegimes: Array    // Catálogo de regímenes
  })

  const emit = defineEmits(['update:modelValue', 'saved'])

  const $q = useQuasar()
  const loading = ref(false)
  const activeTab = ref('general')

  const isCreditEnabled = computed(() => {
    return form.tipo_pago === 2 || form.tipo_pago === 3
  })

  // Opciones para el combo
  const tipoPagoOptions = [
    { label: '0 - DESHABILITADO', value: 0 },
    { label: '1 - CONTADO', value: 1 },
    { label: '2 - CRÉDITO', value: 2 },
    { label: '3 - CONTADO Y CRÉDITO', value: 3 }
  ]

  // Ayudantes visuales para el combo
  const getTipoPagoIcon = (val) => {
    if (val === 0) return 'block'
    if (val === 1) return 'payments'
    if (val === 2) return 'credit_card'
    return 'add_card'
  }

  const getTipoPagoColor = (val) => {
    if (val === 0) return 'negative'
    if (val === 1) return 'positive'
    if (val === 2) return 'warning'
    return 'primary'
  }

  // Referencias para el foco
  const refGeneral = ref(null)
  const refBilling = ref(null)
  const refAddress = ref(null)

  const show = computed({
    get: () => props.modelValue,
    set: (val) => emit('update:modelValue', val)
  })

  const isEdit = computed(() => !!props.editData)

  const inputProps = {
    outlined: true,
    dense: true,
    'stack-label': true,
    standout: 'bg-yellow-1',
    class: 'q-mb-sm'
  }

  const form = reactive({
    nombre_comercial: '', razon_social: '', rfc: '', email: '',
    telefono: '', contacto: '', calle: '', no_exterior: '',
    colonia: '', codigo_postal: '', tax_regime_id: null, tipo_pago: 1,
    limite_credito: 0, saldo_actual: 0, dias_credito: 30, vender_vencido: false
  })

  // Al abrir, cargamos datos si es edición
  const onDialogOpen = () => {
    activeTab.value = 'general'
    if (isEdit.value) {
      Object.assign(form, props.editData)
    } else {
      resetForm()
    }
    setFocus()
  }

  const resetForm = () => {
    Object.keys(form).forEach(key => form[key] = key === 'tax_regime_id' ? null : '')
    form.tipo_pago = 1
    form.vender_vencido = false
    form.dias_credito = 30
    form.limite_credito = 0
    form.saldo_actual = 0
  }

  const setFocus = () => {
    nextTick(() => {
      if (activeTab.value === 'general') refGeneral.value?.focus()
      if (activeTab.value === 'billing') refBilling.value?.focus()
      if (activeTab.value === 'address') refAddress.value?.focus()
    })
  }

  watch(activeTab, () => setFocus())

  watch(() => form.tipo_pago, (newVal) => {
    if (newVal !== 2 && newVal !== 3) {
      form.limite_credito = 0
      form.dias_credito = 0
      form.saldo_actual = 0
      form.vender_vencido = false

      // Opcional: Notificación silenciosa
      console.log('Valores de crédito reseteados por cambio de modo de pago')
    }
  })

  const handleSubmit = async () => {
    loading.value = true
    form.limite_credito = form.limite_credito || 0
    form.saldo_actual = form.saldo_actual || 0
    try {
      if (isEdit.value) {
        await api.put(`/api/clientes/${props.editData.id}`, form)
      } else {
        await api.post('/api/clientes', form)
      }

      $q.notify({
        color: 'positive',
        message: '¡Datos guardados correctamente!',
        icon: 'check'
      })
      emit('saved')
      show.value = false

    } catch (e) {
      // --- Lógica para Errores de Validación (422) ---
      if (e.response && e.response.status === 422) {
        const serverErrors = e.response.data.errors

        // Extraemos el primer mensaje de error de cualquier campo que haya fallado
        // Object.values(serverErrors) nos da los arreglos de mensajes, .flat() los aplana
        const firstErrorMessage = Object.values(serverErrors).flat()[0]

        $q.notify({
          color: 'negative',
          message: firstErrorMessage || 'Error de validación en los datos',
          icon: 'report_problem',
          position: 'bottom'
        })
      } else {
        // Error genérico para otros casos (500, etc)
        const errorMsg = e.response?.data?.message || 'Error al procesar la solicitud'
        $q.notify({ color: 'negative', message: errorMsg, icon: 'error' })
      }
    } finally {
      loading.value = false
    }
  }

  const handleNombreComercialBlur = () => {
    if (!isEdit.value && form.nombre_comercial) {
      if (form.razon_social === '')
        form.razon_social = form.nombre_comercial
    }
  }
</script>
