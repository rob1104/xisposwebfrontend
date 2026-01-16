<template>
  <q-dialog v-model="show" persistent backdrop-filter="blur(4px) brightness(90%)">
    <q-card style="width: 650px; border-radius: 16px;" class="bg-white text-grey-9 shadow-24">

      <q-card-section class="row items-center q-px-xl q-py-lg bg-grey-1">
        <div class="bg-primary q-pa-sm rounded-borders q-mr-md shadow-2">
          <q-icon name="vignette" color="white" size="sm" />
        </div>
        <div>
          <div class="text-h6 text-bold text-primary">Configuración Fiscal y CSD</div>
          <div class="text-caption text-grey-6 text-uppercase letter-spacing-1">Identidad de Emisor SAT 4.0</div>
        </div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup color="grey-5" />
      </q-card-section>

      <q-separator color="grey-2" />

      <q-card-section class="q-px-xl q-py-lg">
        <div class="row items-center q-mb-lg bg-blue-1 q-pa-sm border-radius-10">
          <q-icon name="storefront" color="primary" size="xs" class="q-mr-xs" />
          <span class="text-caption text-grey-7">Sucursal: </span>
          <span class="text-caption text-bold text-primary q-ml-xs">{{ sucursal?.nombre }}</span>
        </div>

        <q-form @submit="guardarDatos" class="q-gutter-y-md">

          <div class="text-overline text-primary text-bold">1. Identificación Fiscal</div>

          <div class="row q-col-gutter-md">
            <q-input
              autofocus
              v-model="form.rfc"
              label="RFC"
              outlined dense color="primary"
              class="col-12 col-sm-6"
              input-class="text-bold text-uppercase"
              @update:model-value="val => (form.rfc = val.toUpperCase())"
                  :rules="[
                    val => rfcValid(val) || 'Formato de RFC inválido'
                  ]"
            >
              <template v-slot:prepend><q-icon name="badge" color="primary" /></template>
            </q-input>

            <q-input
              v-model="form.codigo_postal"
              label="C.P. Expedición"
              outlined dense color="primary"
              class="col-12 col-sm-6"
              mask="#####"
              :rules="[val => !!val || 'Obligatorio']"
            >
              <template v-slot:prepend><q-icon name="location_on" color="primary" /></template>
            </q-input>
          </div>

          <q-input
            v-model="form.razon_social"
            label="Nombre o Razón Social"
            outlined dense color="primary"
            hint="Debe coincidir con la Constancia de Situación Fiscal"
            input-class="text-uppercase"
            :rules="[val => !!val || 'Campo obligatorio']"
          >
            <template v-slot:prepend><q-icon name="business" color="primary" /></template>
          </q-input>

          <q-select
            v-model="form.regimen_fiscal"
            :options="regimenes"
            option-label="label"
            option-value="value"
            emit-value map-options
            outlined dense color="primary"
            label="Régimen Fiscal"
            :rules="[val => !!val || 'Seleccione un régimen']"
          >
            <template v-slot:prepend><q-icon name="gavel" color="primary" /></template>
          </q-select>

          <q-separator class="q-my-md" />

          <div class="text-overline text-orange-9 text-bold">2. Certificado de Sello Digital (CSD)</div>

          <div class="row q-col-gutter-md">
            <q-file
              v-model="cerFile"
              label="Cargar archivo .CER"
              outlined dense color="orange-8"
              class="col-12 col-sm-6"
              accept=".cer"
            >
              <template v-slot:prepend><q-icon name="verified_user" color="orange-8" /></template>
              <template v-slot:append v-if="form.cer_path">
                <q-icon name="check_circle" color="positive" />
                <q-tooltip>Archivo cargado previamente</q-tooltip>
              </template>
            </q-file>

            <q-file
              v-model="keyFile"
              label="Cargar archivo .KEY"
              outlined dense color="orange-8"
              class="col-12 col-sm-6"
              accept=".key"
            >
              <template v-slot:prepend><q-icon name="vpn_key" color="orange-8" /></template>
              <template v-slot:append v-if="form.key_path">
                <q-icon name="check_circle" color="positive" />
                <q-tooltip>Archivo cargado previamente</q-tooltip>
              </template>
            </q-file>
          </div>

          <q-input
            v-model="form.password_csd"
            label="Contraseña de los Certificados"
            outlined dense color="orange-8"
            type="password"
            hint="Contraseña privada para el sellado del XML"
          >
            <template v-slot:prepend><q-icon name="password" color="orange-8" /></template>
          </q-input>

          <div class="row justify-end q-mt-xl q-gutter-x-sm">
            <q-btn label="Descartar" flat color="grey-7" v-close-popup class="text-bold" />
            <q-btn
              label="Guardar Configuración"
              color="primary"
              type="submit"
              :loading="loading"
              unelevated
              class="q-px-lg text-bold border-radius-10"
              icon="cloud_upload"
            />
          </div>
        </q-form>
      </q-card-section>

      <q-card-section class="bg-grey-1 q-pa-md text-center">
        <div class="text-caption text-grey-6">
          <q-icon name="info" size="xs" class="q-mr-xs" />
          Los archivos CSD son necesarios para que Finkok pueda timbrar sus facturas.
        </div>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup>
  import { ref, watch } from 'vue'
  import { api } from 'boot/axios'
  import { useQuasar } from 'quasar'
  import { rfcValid } from 'src/helpers/utils.js'

  const $q = useQuasar()
  const props = defineProps(['modelValue', 'sucursal'])
  const emit = defineEmits(['update:modelValue', 'actualizado'])

  const show = ref(false)
  const loading = ref(false)
  const loadingData = ref(false)

  // Manejo de archivos físicos
  const cerFile = ref(null)
  const keyFile = ref(null)

  const form = ref({
    rfc: '',
    razon_social: '',
    regimen_fiscal: '',
    codigo_postal: '',
    curp: '',
    registro_patronal: '',
    password_csd: '',
    cer_path: null,
    key_path: null
  })

  const regimenes = [
    { label: '601 - General de Ley Personas Morales', value: '601' },
    { label: '612 - Personas Físicas con Actividades Empresariales', value: '612' },
    { label: '621 - Incorporación Fiscal', value: '621' },
    { label: '626 - Régimen Simplificado de Confianza (RESICO)', value: '626' }
  ]



  const cargarDatosExistentes = async () => {
    // 1. Si el objeto ya trae el emisor, lo cargamos inmediatamente
    if (props.sucursal?.emisor) {
      form.value = { ...props.sucursal.emisor }
      return
    }

    // 2. Si no lo trae, consultamos al API para asegurar que no existan datos
    loadingData.value = true
    try {
      const { data } = await api.get(`/api/sucursales/${props.sucursal.id}/emisor`)
      if (data) {
        form.value = { ...data }
      } else {
        resetForm()
      }
    } catch (e) {
      console.error("No se encontraron datos previos o error en consulta")
      resetForm()
    } finally {
      loadingData.value = false
    }
  }

  // Sincronizar visibilidad y cargar datos
  watch(() => props.modelValue, (val) => {
    show.value = val
    if (val) {
      cerFile.value = null
      keyFile.value = null
      cargarDatosExistentes()
    } else if (val) {
      resetForm()
    }
  })

  watch(show, (val) => emit('update:modelValue', val))

  const resetForm = () => {
    form.value = {
      rfc: '', razon_social: '', regimen_fiscal: '',
      codigo_postal: props.sucursal?.codigo_postal || '',
      curp: '', registro_patronal: '', password_csd: '',
      cer_path: null, key_path: null
    }
    cerFile.value = null
    keyFile.value = null
  }

  const guardarDatos = async () => {
    loading.value = true

    // Usamos FormData para el envío de archivos y texto mezclado
    const formData = new FormData()

    // Agregar campos de texto al FormData
    Object.keys(form.value).forEach(key => {
      if (form.value[key] !== null && form.value[key] !== undefined) {
        formData.append(key, form.value[key])
      }
    })

    // Agregar archivos si se seleccionaron
    if (cerFile.value) formData.append('cer_file', cerFile.value)
    if (keyFile.value) formData.append('key_file', keyFile.value)

    try {
      await api.post(`/api/sucursales/${props.sucursal.id}/emisor`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      $q.notify({
        color: 'positive',
        icon: 'check_circle',
        message: 'Datos fiscales y certificados actualizados correctamente',
        position: 'top'
      })

      emit('actualizado')
      show.value = false
    } catch (e) {
      const msg = e.response?.data?.message || 'Error al guardar la configuración'
      $q.notify({ color: 'negative', icon: 'report_problem', message: msg })
    } finally {
      loading.value = false
    }
  }
</script>

<style lang="scss" scoped>
  .letter-spacing-1 { letter-spacing: 1.5px; }
  .border-radius-10 { border-radius: 10px; }

  :deep(.q-field--outlined .q-field__control) {
    background: white;
    &:hover:before {
      border-color: $primary;
    }
  }

  .bg-blue-1 {
    background: #e3f2fd;
  }
</style>
