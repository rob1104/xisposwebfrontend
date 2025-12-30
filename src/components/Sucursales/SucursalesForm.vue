<template>
  <q-dialog v-model="show" @show="onDialogOpen" persistent>
    <q-card style="width: 500px; max-width: 90vw;">
      <q-card-section class="bg-primary text-white row items-center">
        <div class="text-h6">{{ isEdit ? 'Editar Sucursal' : 'Nueva Sucursal' }}</div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>

      <q-form @submit="handleSubmit">
        <q-card-section class="q-gutter-md">
          <q-input
            ref="inputNombre"
            v-model="form.nombre"
            label="Nombre de la Sucursal *"
            outlined dense
            :rules="[val => !!val || 'Requerido']"
          />
          <q-input v-model="form.direccion" label="Dirección" outlined dense type="textarea" />
          <q-input v-model="form.telefono" label="Teléfono" outlined dense mask="(###) ### - ####" />


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
  const form = reactive({ nombre: '', direccion: '', telefono: '' })

  const onDialogOpen = () => {
    if (isEdit.value) {
      Object.assign(form, { ...props.editData, status: parseInt(props.editData.status) })
    } else {
      Object.assign(form, { nombre: '', direccion: '', telefono: '' })
    }
    nextTick(() => inputNombre.value?.focus()) // Auto-foco
  }

  const handleSubmit = async () => {
    loading.value = true
    try {
      const url = isEdit.value ? `/api/sucursales/${props.editData.id}` : '/api/sucursales'
      const res = await api[isEdit.value ? 'put' : 'post'](url, form)

      $q.notify({ color: 'positive', message: res.data.message, icon: 'check' })
      emit('saved'); show.value = false
    } catch (e) {
      const msg = e.response?.data?.errors ? Object.values(e.response.data.errors).flat()[0] : 'Error';
      $q.notify({ color: 'negative', message: msg, icon: 'warning' })
    } finally { loading.value = false }
  }
</script>
