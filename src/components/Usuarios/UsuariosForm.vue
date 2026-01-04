<template>
  <q-dialog v-model="show" @show="onDialogOpen" persistent>
    <q-card style="width: 600px; max-width: 90vw;" class="shadow-10">
      <q-card-section class="bg-primary text-white row items-center">
        <div class="text-h6 text-uppercase">
          <q-icon :name="isEdit ? 'person_search' : 'person_add'" class="q-mr-sm" />
          {{ isEdit ? 'Editar Usuario: ' + form.name : 'Nuevo Usuario' }}
        </div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>

      <q-tabs v-model="activeTab" class="text-primary bg-grey-1" active-color="primary" align="justify">
        <q-tab name="general" icon="badge" label="Cuenta" />
        <q-tab name="security" icon="lock" label="Seguridad / Rol" />
      </q-tabs>

      <q-form @submit="handleSubmit">
        <q-tab-panels v-model="activeTab" animated>

          <q-tab-panel name="general">
            <div class="row q-col-gutter-md">
              <div class="col-12">
                <q-input ref="inputName" outlined dense v-model="form.name" label="Nombre Completo *" :rules="[val => !!val || 'Requerido']" />
              </div>
              <div class="col-12">
                <q-input outlined dense v-model="form.email" label="Email de Acceso *" :rules="[val => !!val || 'Requerido']" />
              </div>
              <div class="col-12">
                <div :class="isCurrentUser ? 'opacity-50' : ''">
                  <q-toggle
                    :true-value="1"
                    :false-value="0"
                    :disable="isCurrentUser"
                    v-model="form.status"
                    label="Usuario Activo"
                    :color="form.status === 1 ? 'positive' : 'negative'"
                    :icon="form.status === 1 ? 'check' : 'block'"
                   />
                </div>

              </div>
            </div>
          </q-tab-panel>

          <q-tab-panel name="security">
            <div class="row q-col-gutter-md">
              <div class="col-12">
                <q-select
                  ref="inputRole"
                  outlined
                  dense
                  v-model="form.role"
                  :options="roles"
                  placeholder="Seleccione un perfil"
                  :rules="[val => !!val || 'El rol es obligatorio']"
                  label="Asignar Rol *" />
              </div>
              <div class="col-12">

                <div class="text-subtitle2 text-grey-8 q-mb-none q-mt-md">
                    <q-icon name="apartment" color="primary" class="q-mr-xs" />
                    Acceso a Sucursales
                  </div>

                  <q-select
                    v-model="form.sucursales"
                    :options="listaSucursales"
                    label="Seleccionar tiendas permitidas"
                    multiple
                    use-chips
                    outlined
                    dense
                    emit-value
                    map-options
                    class="q-mb-md"
                    :rules="[val => (val && val.length > 0) || 'Debe asignar al menos una sucursal']"
                    >
                    <template v-slot:selected-item="scope">
                      <q-chip
                        removable
                        @remove="scope.removeAtIndex(scope.index)"
                        :tabindex="scope.tabindex"
                        color="primary"
                        text-color="white"
                        size="sm">
                           {{ scope.opt.label }}
                      </q-chip>
                    </template>
                  </q-select>

                  <div v-if="isEdit" class="q-pa-md bg-blue-grey-1 rounded-borders shadow-1 animate__animated animate__fadeIn">
                    <div class="text-subtitle2 text-bold text-blue-grey-9 q-mb-sm">
                      <q-icon name="stars" color="orange-8" class="q-mr-xs" />
                      Sucursal Predeterminada (Activa)
                    </div>

                    <q-select
                      v-model="form.sucursal_activa_id"
                      :options="opcionesSucursalActiva"
                      label="Sucursal de inicio de sesión"
                      outlined
                      dense
                      emit-value
                      map-options
                      bg-color="white"
                      :disable="opcionesSucursalActiva.length === 0"
                    >
                      <template v-slot:prepend>
                        <q-icon name="location_on" color="primary" />
                      </template>
                      <template v-slot:no-option>
                        <q-item>
                          <q-item-section class="text-grey italic">Asigne sucursales arriba primero</q-item-section>
                        </q-item>
                      </template>
                    </q-select>
                    <div class="text-caption text-grey-7 q-mt-xs italic">
                      * Esta será la sucursal que el usuario tendrá seleccionada al entrar al sistema.
                    </div>
                  </div>

              </div>
              <div class="col-12">
                <q-input
                  outlined dense v-model="form.password"
                  :label="isEdit ? 'Nueva Contraseña (Opcional)' : 'Contraseña *'"
                  type="password"
                />
              </div>
            </div>
          </q-tab-panel>

        </q-tab-panels>

        <q-card-actions align="right" class="q-pa-md bg-grey-2">
          <q-btn label="Cancelar" flat v-close-popup />
          <q-btn :label="isEdit ? 'Actualizar' : 'Crear Usuario'" color="primary" type="submit" :loading="loading" />
        </q-card-actions>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script setup>
  import { ref, reactive, computed, watch, nextTick } from 'vue'
  import { api } from 'boot/axios'
  import { useQuasar } from 'quasar'
  import { useAuthStore } from 'src/stores/auth'

  const auth = useAuthStore()
  const props = defineProps({ modelValue: Boolean, editData: Object, roles: Array })
  const emit = defineEmits(['update:modelValue', 'saved'])

  const inputName = ref(null)
  const inputRole = ref(null)

  const listaSucursales = ref([])

  const $q = useQuasar()
  const show = computed({
    get: () => props.modelValue,
    set: (val) => emit('update:modelValue', val)
  })

  const activeTab = ref('general')
  const loading = ref(false)
  const isEdit = computed(() => !!props.editData)

  // Ajustamos el estado inicial a 1 (Activo) como definimos anteriormente
  const form = reactive({ name: '', email: '', role: '', status: 1, password: '',sucursal_activa_id: null, sucursales: []})

  const isCurrentUser = computed(() => {
    return isEdit.value && props.editData.id === auth.user.id
  })

  const opcionesSucursalActiva = computed(() => {
    if (!form.sucursales || form.sucursales.length === 0) return []

    // Como form.sucursales puede tener objetos o IDs dependiendo del momento, normalizamos
    const idsSeleccionados = form.sucursales.map(s => typeof s === 'object' ? s.value : s)

    return listaSucursales.value.filter(opt => idsSeleccionados.includes(opt.value))
  })

  const onDialogOpen = async () => {
    activeTab.value = 'general'
    try {
      const response = await api.get('/api/sucursales')
      listaSucursales.value = response.data.map(s => ({
        label: s.nombre,
        value: s.id
      }))
    } catch (e) {
      console.error("Error al cargar sucursales")
    }

    if (isEdit.value) {
      const sucursalesUsuario = props.editData.sucursales || []
      const sucursalIds = sucursalesUsuario.map(s => s.id)
      const sucursalesFormateadas = listaSucursales.value.filter(opt =>
        sucursalIds.includes(opt.value)
      )
      const data = { ...props.editData, password: '', sucursales: sucursalesFormateadas, sucursal_activa_id: props.editData.sucursal_activa_id }
      data.status = parseInt(data.status)
      Object.assign(form, data)
    } else {
      Object.assign(form, { name: '', email: '', role: null, status: 1, password: '', sucursales: [], sucursal_activa_id: null } )
    }
    setFocus()
  }


  const handleSubmit = async () => {
    loading.value = true
    try {
      const url = isEdit.value ? `/api/users/${props.editData.id}` : '/api/users'

      const dataToSend = { ...form , sucursales: form.sucursales.map(s => typeof s === 'object' ? s.value : s), sucursal_activa_id: form.sucursal_activa_id }



      const method = isEdit.value ? 'put' : 'post'
      const response = await api[method](url, dataToSend)

      // Notificación de Éxito
      $q.notify({
        color: 'positive',
        message: response.data.message || 'Usuario guardado correctamente',
        icon: 'check',
        position: 'bottom-right'
      })

      emit('saved')
      show.value = false

    } catch (e) {
      // Manejo de Errores de Validación (422)
      if (e.response && e.response.status === 422) {
        const serverErrors = e.response.data.errors
        // Extraemos el primer mensaje de error que encontremos
        const firstErrorMessage = Object.values(serverErrors).flat()[0]

        $q.notify({
          color: 'negative',
          message: firstErrorMessage || 'Error de validación',
          icon: 'report_problem',
          position: 'bottom'
        })
      } else {
        // Error genérico para otros casos (500, 403, etc)
        const errorMsg = e.response?.data?.message || 'Hubo un error al procesar la solicitud'
        $q.notify({
          color: 'negative',
          message: errorMsg,
          icon: 'error'
        })
      }
    } finally {
      loading.value = false
    }
  }

  const setFocus = () => {
    nextTick(() => {
      if (activeTab.value === 'general' && inputName.value) {
        inputName.value.focus()
      } else if (activeTab.value === 'security' && inputRole.value) {
        inputRole.value.focus()
      }
    })
  }

  watch(activeTab, () => {
    setFocus()
  })

  watch(() => form.sucursales, (newVal) => {
    if (isEdit.value && form.sucursal_activa_id) {
      const ids = newVal.map(s => typeof s === 'object' ? s.value : s)
      if (!ids.includes(form.sucursal_activa_id)) {
        form.sucursal_activa_id = null // Reset si se quita el acceso a la sucursal activa
      }
    }
  }, { deep: true })

</script>
