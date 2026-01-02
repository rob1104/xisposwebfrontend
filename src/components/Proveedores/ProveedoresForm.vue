<template>
  <q-dialog v-model="show" @show="onDialogOpen" persistent>
    <q-card style="width: 850px; max-width: 95vw;" class="menu-radius shadow-24">
      <q-card-section class="bg-primary text-white row items-center q-py-md">
        <q-icon name="local_shipping" size="sm" class="q-mr-md" />
        <div class="text-h6 text-bold">{{ isEdit ? 'Editar Proveedor: ' + form.nombre_comercial : 'Nuevo Proveedor' }}</div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>

      <q-tabs
        v-model="tab"
        class="text-primary bg-grey-1"
        active-color="primary"
        indicator-color="primary"
        align="justify"
        inline-label
      >
        <q-tab name="generales" icon="business" label="Datos Fiscales" />
        <q-tab name="direccion" icon="map" label="Ubicación" />
        <q-tab name="credito" icon="account_balance_wallet" label="Finanzas" />
      </q-tabs>

      <q-separator />

      <q-form @submit="handleSubmit">
        <q-tab-panels v-model="tab" animated class="q-pa-sm">

          <q-tab-panel name="generales" class="q-gutter-y-sm">
            <div class="row q-col-gutter-md">
              <div class="col-12">
                <q-input
                  @blur="handleNombreComercialBlur"
                  v-bind="inputProps"
                  v-model="form.nombre_comercial"
                  label="Nombre Comercial del Proveedor *"
                  ref="refGenerales"
                  :rules="[val => !!val || 'Campo requerido']"
                >
                  <template v-slot:prepend><q-icon name="storefront" color="primary" /></template>
                </q-input>
              </div>

              <div class="col-12 col-md-8">
                <q-input v-bind="inputProps" v-model="form.razon_social" label="Razón Social (Nombre Legal)" />
              </div>
              <div class="col-12 col-md-4">
                <q-input v-bind="inputProps" v-model="form.rfc" label="RFC / Identificación Fiscal" mask="AAAA######XXX" />
              </div>

              <div class="col-12 col-md-7">
                <q-input v-bind="inputProps" v-model="form.email" label="Correo Electrónico *" :rules="[val => !!val || 'Campo requerido']" />
              </div>
              <div class="col-12 col-md-5">
                <q-input v-bind="inputProps" v-model="form.telefono" label="Teléfono Principal" mask="(###) ### - ####" />
              </div>

              <div class="col-12 col-md-7">
                <q-input v-bind="inputProps" v-model="form.contacto" label="Persona de Contacto" />
              </div>
              <div class="col-12 col-md-5">
                <q-input v-bind="inputProps" v-model="form.telefono2" label="Teléfono Alternativo" mask="(###) ### - ####" />
              </div>
            </div>
          </q-tab-panel>

          <q-tab-panel name="direccion" class="q-gutter-y-sm">
            <div class="row q-col-gutter-md">
              <div class="col-12 col-md-8">
                <q-input v-bind="inputProps" v-model="form.calle" label="Calle o Avenida" ref="refDireccion" />
              </div>
              <div class="col-6 col-md-2">
                <q-input v-bind="inputProps" v-model="form.no_exterior" label="No. Ext" />
              </div>
              <div class="col-6 col-md-2">
                <q-input v-bind="inputProps" v-model="form.no_interior" label="No. Int" />
              </div>

              <div class="col-12 col-md-6">
                <q-input v-bind="inputProps" v-model="form.colonia" label="Colonia" />
              </div>
              <div class="col-12 col-md-2">
                <q-input v-bind="inputProps" v-model="form.codigo_postal" label="C.P." mask="#####" />
              </div>
              <div class="col-12 col-md-4">
                <q-input v-bind="inputProps" v-model="form.ciudad" label="Ciudad" />
              </div>

              <div class="col-12 col-md-6">
                <q-input v-bind="inputProps" v-model="form.estado" label="Estado" />
              </div>
              <div class="col-12 col-md-6">
                <q-input v-bind="inputProps" v-model="form.pais" label="País" />
              </div>
            </div>
          </q-tab-panel>

          <q-tab-panel name="credito" class="q-gutter-y-sm">
            <div class="row q-col-gutter-md items-center">
              <div class="col-12 col-md-4">
                <q-input v-bind="inputProps" v-model.number="form.limite_credito" label="Límite de Crédito" prefix="$" type="number" ref="refCredito" />
              </div>
              <div class="col-12 col-md-4">
                <q-input v-bind="inputProps" v-model.number="form.dias_credito" label="Días de Crédito" type="number" suffix="Días" />
              </div>
              <div class="col-12 col-md-4">
                <q-select v-bind="inputProps" v-model="form.tipo_pago" :options="[{label:'Efectivo', value:1}, {label:'Transferencia', value:2}, {label:'Crédito', value:3}]" label="Método de Pago" emit-value map-options />
              </div>

              <div class="col-12 bg-red-1 q-pa-md rounded-borders border-dashed-red">
                <q-toggle v-model="form.vender_vencido" :true-value="1" :false-value="0" label="Permitir compras con facturas vencidas" color="negative" class="text-bold text-negative" />
              </div>

              <div class="col-12">
                <q-input v-bind="inputProps" v-model="form.obs" label="Observaciones" type="textarea" rows="3" />
              </div>
            </div>
          </q-tab-panel>
        </q-tab-panels>

        <q-separator />

        <q-card-actions align="right" class="bg-grey-2 q-pa-md">
          <q-btn label="Cancelar" flat v-close-popup color="grey-7" class="q-px-lg" />
          <q-btn :label="isEdit ? 'Actualizar Proveedor' : 'Guardar Proveedor'" color="primary" type="submit" :loading="loading" class="q-px-xl shadow-3" unelevated icon="save" />
        </q-card-actions>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script setup>
  import { ref, reactive, computed, watch, nextTick } from 'vue'
  import { api } from 'boot/axios'
  import { useQuasar } from 'quasar'

  const props = defineProps({ modelValue: Boolean, editData: Object })
  const emit = defineEmits(['update:modelValue', 'saved'])
  const $q = useQuasar()

  // Configuración de Estilo Global (Copiada de Clientes)
  const inputProps = {
    outlined: true,
    dense: true,
    'stack-label': true,
    standout: 'bg-yellow-1',
    class: 'q-mb-sm'
  }

  // Referencias para el Foco Automático
  const refGenerales = ref(null)
  const refDireccion = ref(null)
  const refCredito = ref(null)

  const show = computed({
    get: () => props.modelValue,
    set: (val) => emit('update:modelValue', val)
  })

  const tab = ref('generales')
  const loading = ref(false)
  const isEdit = computed(() => !!props.editData)

  const form = reactive({
    numero_global: '', nombre_comercial: '', razon_social: '', rfc: '', email: '',
    telefono: '', telefono2: '', contacto: '', calle: '', no_exterior: '',
    no_interior: '', colonia: '', codigo_postal: '', ciudad: '', estado: '',
    pais: 'México', limite_credito: 0, dias_credito: 0, vender_vencido: 0,
    tipo_pago: 1, obs: '', tax_regime_id: null
  })

  // Función de Foco (Lógica de Clientes)
  const setFocus = () => {
    nextTick(() => {
      if (tab.value === 'generales') refGenerales.value?.focus()
      if (tab.value === 'direccion') refDireccion.value?.focus()
      if (tab.value === 'credito') refCredito.value?.focus()
    })
  }

  // Observar cambio de tab para disparar el foco
  watch(tab, () => setFocus())

  const onDialogOpen = () => {
    tab.value = 'generales'
    if (isEdit.value) {
      Object.assign(form, props.editData)
    } else {
      resetForm()
    }
    setFocus() // Foco inicial al abrir
  }

  const resetForm = () => {
    Object.keys(form).forEach(k => {
      form[k] = k === 'pais' ? 'México' : (k === 'tipo_pago' ? 1 : (k.includes('credito') || k === 'vender_vencido' ? 0 : ''))
    })
  }

  const handleSubmit = async () => {
    loading.value = true
    try {
      const isEditing = !!props.editData
      const url = isEditing ? `/api/providers/${props.editData.id}` : '/api/providers'
      const payload = { ...form }
      if (isEditing) delete payload.numero_global

      const res = await api[isEditing ? 'put' : 'post'](url, payload)
      $q.notify({ color: 'positive', message: res.data.message, icon: 'check' })
      emit('saved'); show.value = false
    } catch (e) {
      const msg = e.response?.data?.errors ? Object.values(e.response.data.errors).flat()[0] : 'Error'
      $q.notify({ color: 'negative', message: msg, icon: 'warning' })
    } finally { loading.value = false }
  }

  const handleNombreComercialBlur = () => {
    if (!isEdit.value && form.nombre_comercial) {
      if (form.razon_social === '') {
        form.razon_social = form.nombre_comercial
      }
    }
  }
</script>

<style lang="scss" scoped>
  .border-dashed-red { border: 1px dashed $negative; }
  .menu-radius { border-radius: 16px; }
</style>
