<template>
  <q-dialog v-model="show" @show="onDialogOpen" persistent>
    <q-card style="width: 850px; max-width: 95vw;" class="shadow-10">
      <q-card-section class="bg-primary text-white row items-center">
        <div class="text-h6 text-uppercase ls-1">
          <q-icon name="security" class="q-mr-sm" />
          {{ isEdit ? 'Editar Privilegios del Rol: ' + form.name : 'Nuevo Rol de Seguridad' }}
        </div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>

      <q-form @submit="handleSubmit">
        <q-card-section class="q-pa-md">
          <div class="row q-mb-lg">
            <div class="col-12">
              <q-input
                ref="inputName"
                v-model="form.name"
                label="Nombre del Rol *"
                outlined dense
                placeholder="Ej: Cajero Principal, Supervisor..."
                :rules="[val => !!val || 'El nombre es requerido']"
              />
            </div>
          </div>

          <div class="text-subtitle2 text-grey-7 q-mb-sm">PERMISOS POR MÓDULO</div>

          <q-scroll-area style="height: 450px;" class="bg-grey-1 rounded-borders bordered shadow-1">
            <div class="q-pa-md">
              <div v-for="(group, category) in groupedPermissions" :key="category" class="module-card q-mb-md">
                <div class="module-header row items-center justify-between">
                  <div class="text-bold text-primary text-uppercase">{{ category }}</div>
                  <q-btn
                    flat round dense icon="done_all" color="grey-7" size="xs"
                    @click="selectAll(category)"
                  >
                    <q-tooltip>Seleccionar todo el módulo</q-tooltip>
                  </q-btn>
                </div>

                <div class="row q-col-gutter-sm q-pa-sm">
                  <div v-for="perm in group" :key="perm.id" class="col-12 col-sm-6 col-md-3">
                    <q-checkbox
                      v-model="form.permissions"
                      :val="perm.name"
                      color="primary"
                      class="full-width text-capitalize"
                    >
                      <span class="text-grey-9 text-caption">{{ perm.name.split('.')[1] }}</span>
                    </q-checkbox>
                  </div>
                </div>
              </div>
            </div>
          </q-scroll-area>
        </q-card-section>

        <q-card-actions align="right" class="q-pa-md bg-grey-2">
          <q-btn label="Cancelar" flat v-close-popup />
          <q-btn
            :label="isEdit ? 'Actualizar Seguridad' : 'Guardar Nuevo Rol'"
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
  import { ref, reactive, computed, nextTick } from 'vue'
  import { api } from 'boot/axios'
  import { useQuasar } from 'quasar'

  // Propiedades y Emits se mantienen igual que en Clientes/Usuarios
  const props = defineProps({ modelValue: Boolean, editData: Object })
  const emit = defineEmits(['update:modelValue', 'saved'])

  const show = computed({
    get: () => props.modelValue,
    set: (val) => emit('update:modelValue', val)
  })

  const $q = useQuasar()
  const inputName = ref(null)
  const loading = ref(false)
  const allPermissions = ref([])
  const form = reactive({ name: '', permissions: [] })
  const isEdit = computed(() => !!props.editData)

  // Lógica de agrupación de permisos por prefijo
  const groupedPermissions = computed(() => {
    return allPermissions.value.reduce((acc, perm) => {
      const category = perm.name.split('.')[0]
      if (!acc[category]) acc[category] = []
      acc[category].push(perm)
      return acc
    }, {})
  })

  // Función para seleccionar todos los permisos de una categoría rápidamente
  const selectAll = (category) => {
    const modulePerms = groupedPermissions.value[category].map(p => p.name)
    const missingPerms = modulePerms.filter(p => !form.permissions.includes(p))

    if (missingPerms.length > 0) {
      form.permissions.push(...missingPerms)
    } else {
      form.permissions = form.permissions.filter(p => !modulePerms.includes(p))
    }
  }

  const onDialogOpen = async () => {
    const res = await api.get('/api/permissions-all')
    allPermissions.value = res.data

    if (isEdit.value) {
      const roleDetails = await api.get(`/api/roles/${props.editData.id}`)
      Object.assign(form, {
        name: props.editData.name,
        permissions: roleDetails.data.permissions.map(p => p.name)
      })
    } else {
      form.name = ''
      form.permissions = []
    }

    nextTick(() => inputName.value?.focus())
  }

  const handleSubmit = async () => {
    loading.value = true;
    try {
      const url = isEdit.value ? `/api/roles/${props.editData.id}` : '/api/roles';
      const method = isEdit.value ? 'put' : 'post';

      const response = await api[method](url, form);

      // Notificación de Éxito basada en el mensaje del controlador
      $q.notify({
        color: 'positive',
        message: response.data.message || 'Rol guardado exitosamente',
        icon: 'verified',
        position: 'bottom-right'
      });

      emit('saved');
      show.value = false;

    } catch (e) {
      if (e.response && e.response.status === 422) {
        // Manejo de errores de validación de Laravel (ej: nombre duplicado)
        const serverErrors = e.response.data.errors;
        const firstError = serverErrors ? Object.values(serverErrors).flat()[0] : e.response.data.message;

        $q.notify({
          color: 'negative',
          message: firstError || 'Error de validación',
          icon: 'warning',
          position: 'bottom'
        });
      } else {
        $q.notify({
          color: 'red-10',
          message: 'Ocurrió un error crítico en el servidor',
          icon: 'error'
        });
      }
    } finally {
      loading.value = false;
    }
  };
</script>

<style lang="scss" scoped>
  .module-card {
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    background: white;
    overflow: hidden;

    .module-header {
      background: #f8f9fa;
      padding: 8px 12px;
      border-bottom: 1px solid #e0e0e0;
      font-size: 0.75rem;
      letter-spacing: 0.5px;
    }
  }

  .ls-1 { letter-spacing: 1px; }

  .bordered {
    border: 1px solid #d6d6d6;
  }
</style>
