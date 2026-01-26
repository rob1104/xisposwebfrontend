<template>
  <q-dialog v-model="show" persistent backdrop-filter="blur(4px)">
    <q-card style="width: 500px; max-width: 90vw;" class="shadow-24 border-radius-15">
      <q-card-section class="bg-negative text-white row items-center q-pa-md">
        <q-icon name="warning" size="md" class="q-mr-sm" />
        <div class="text-h6 text-weight-bold">Cancelar Factura ante el SAT</div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>

      <q-card-section class="q-pa-lg">
        <div class="text-subtitle1 text-grey-8 q-mb-md">
          Estás a punto de cancelar el folio <strong>{{ cfdi?.serie }}-{{ cfdi?.folio }}</strong>.
          <br>
          <span class="text-caption text-grey-6">UUID: {{ cfdi?.uuid }}</span>
        </div>

        <q-form @submit="confirmarCancelacion" class="q-gutter-y-md">

          <q-select
            v-model="motivo"
            :options="motivosSat"
            label="Motivo de Cancelación *"
            option-value="clave"
            option-label="descripcion"
            outlined
            dense
            emit-value
            map-options
            :rules="[val => !!val || 'El motivo es obligatorio']"
          >
            <template v-slot:option="scope">
              <q-item v-bind="scope.itemProps">
                <q-item-section>
                  <q-item-label><strong>{{ scope.opt.clave }}</strong> - {{ scope.opt.descripcion }}</q-item-label>
                </q-item-section>
              </q-item>
            </template>
          </q-select>

          <div v-if="motivo === '01'" class="bg-orange-1 q-pa-sm rounded-borders">
            <div class="text-caption text-orange-9 q-mb-xs">
              * Para el motivo 01, primero debes haber emitido la nueva factura y colocar aquí su UUID.
            </div>
            <q-input
              v-model="uuidSustitucion"
              label="UUID que sustituye *"
              outlined
              dense
              placeholder="XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX"
              :rules="[val => (motivo !== '01' || (!!val && val.length === 36)) || 'UUID inválido']"
            />
          </div>

          <div class="row justify-end q-mt-xl">
            <q-btn label="Salir" flat color="grey" v-close-popup class="q-mr-sm" />
            <q-btn
              label="Proceder a Cancelar"
              color="negative"
              type="submit"
              :loading="loading"
              unelevated
              icon="delete_forever"
            />
          </div>
        </q-form>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup>
  import { ref, computed } from 'vue'
  import { api } from 'boot/axios'
  import { useQuasar } from 'quasar'

  const props = defineProps(['modelValue', 'cfdi'])
  const emit = defineEmits(['update:modelValue', 'success'])
  const $q = useQuasar()

  const loading = ref(false)
  const motivo = ref('02') // Por defecto '02' es el más común
  const uuidSustitucion = ref('')

  // Catálogo oficial del SAT
  const motivosSat = [
    { clave: '01', descripcion: 'Comprobante emitido con errores con relación' },
    { clave: '02', descripcion: 'Comprobante emitido con errores sin relación' },
    { clave: '03', descripcion: 'No se llevó a cabo la operación' },
    { clave: '04', descripcion: 'Operación nominativa relacionada en una factura global' }
  ]

  const show = computed({
    get: () => props.modelValue,
    set: (val) => emit('update:modelValue', val)
  })

  const confirmarCancelacion = async () => {
    loading.value = true
    try {
      const payload = {
        motivo: motivo.value,
        uuid_sustitucion: motivo.value === '01' ? uuidSustitucion.value : null
      }

      const { data } = await api.post(`/api/cfdis/${props.cfdi.id}/cancelar`, payload)

      $q.notify({
        type: 'positive',
        message: 'Solicitud enviada al SAT',
        caption: `Estado: ${data.status_sat} - ${data.mensaje}`,
        timeout: 5000
      })

      emit('success')
      show.value = false
    } catch (e) {
      $q.notify({
        type: 'negative',
        message: e.response?.data?.message || 'Error al cancelar',
        caption: e.response?.data?.error_sat || ''
      })
    } finally {
      loading.value = false
    }
  }
</script>
