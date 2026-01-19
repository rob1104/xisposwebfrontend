<template>
  <q-dialog v-model="show" @show="onDialogOpen" persistent>
    <q-card style="width: 500px; max-width: 90vw;">
      <q-card-section class="bg-primary text-white row items-center">
        <div class="text-h6">{{ isEdit ? 'Editar Sucursal: ' + form.nombre : 'Nueva Sucursal' }}</div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>

      <q-form @submit="handleSubmit">
        <q-card-section class="q-col-gutter-md row">

            <div class="col-12">
              <q-input
                ref="inputNombre"
                v-model="form.nombre"
                label="Nombre de la Sucursal *"
                outlined dense
                :rules="[val => !!val || 'Requerido']"
              />
            </div>
            <div class="col-6">
                <q-input v-model="form.prefijo" label="Prefijo para documentos"
                         maxlength="3" outlined dense type="text" />
            </div>
            <div class="col-6">
                <q-input v-model="form.bascula" label="Identificador de bascula"
                         maxlength="3" outlined dense type="text" />
            </div>
            <div class="col-12">
                <q-input v-model="form.direccion" label="Dirección" outlined dense type="textarea" />
            </div>
            <div class="col-12">
              <q-input v-model="form.telefono" label="Teléfono" outlined dense mask="(###) ### - ####" />
            </div>



        </q-card-section>

        <q-card-actions align="right" class="bg-grey-2 q-pa-md">
          <q-btn label="Cancelar" flat v-close-popup />
          <q-btn :label="isEdit ? 'Actualizar' : 'Guardar'" color="primary" type="submit" :loading="loading" />
        </q-card-actions>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script setup>
  import { ref, reactive, computed, nextTick } from 'vue'
  import { api } from 'boot/axios'
  import { useQuasar } from 'quasar'

  const props = defineProps({ modelValue: Boolean, editData: Object })
  const emit = defineEmits(['update:modelValue', 'saved'])
  const $q = useQuasar()

  const show = computed({
    get: () => props.modelValue,
    set: (val) => emit('update:modelValue', val)
  })

  const inputNombre = ref(null)
  const loading = ref(false)
  const isEdit = computed(() => !!props.editData)
  const form = reactive({ nombre: '', direccion: '', telefono: '', prefijo: '', bascula: '' })

  const onDialogOpen = () => {
    if (isEdit.value) {
      Object.assign(form, { ...props.editData, status: parseInt(props.editData.status) })
    } else {
      Object.assign(form, { nombre: '', direccion: '', telefono: '', prefijo: '', bascula: '' })
    }
    nextTick(() => inputNombre.value?.focus())
  }

  const handleSubmit = async () => {
    loading.value = true
    try {
      const url = isEdit.value ? `/api/sucursales/${props.editData.id}` : '/api/sucursales'
      const res = await api[isEdit.value ? 'put' : 'post'](url, form)

      $q.notify({ color: 'positive', message: res.data.message || 'Operación exitosa', icon: 'check' })
      emit('saved')
      show.value = false
    } catch (e) {
      // 1. Extraer el mensaje principal si existe (ej. e.response.data.message)
      // 2. Si hay errores de validación (e.response.data.errors), los unimos en una sola cadena
      let errorMsg = 'Ocurrió un error inesperado';

      if (e.response?.data) {
        if (e.response.data.errors) {
          // Convierte el objeto de errores en una lista legible
          errorMsg = Object.values(e.response.data.errors).flat().join(' | ');
        } else if (e.response.data.message) {
          // Mensaje general del servidor (ej. "No autorizado", "Registro no encontrado")
          errorMsg = e.response.data.message;
        }
      } else if (e.message) {
        // Error de red o error de Axios
        errorMsg = e.message;
      }

      $q.notify({
        color: 'negative',
        message: errorMsg,
        icon: 'warning',
        // Opcional: permite que el usuario cierre el mensaje si es muy largo
        actions: [{ icon: 'close', color: 'white' }],
        multiLine: true
      })
    } finally {
      loading.value = false
    }
  }
</script>


