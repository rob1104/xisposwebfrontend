<template>
  <q-dialog v-model="show" @show="onDialogOpen" persistent backdrop-filter="blur(8px)">
    <q-card style="width: 1000px; max-width: 95vw;" class="premium-card overflow-hidden">
      <!-- Header más compacto -->
      <q-card-section class="bg-gradient-primary text-white row items-center q-py-md q-px-md">
        <q-avatar icon="security" color="white" text-color="primary" size="38px" class="shadow-5 q-mr-sm" />
        <div class="ellipsis" style="flex: 1; min-width: 0;">
          <div class="text-subtitle1 text-bold text-uppercase ls-1">
            {{ isEdit ? 'Gestión de Permisos' : 'Nuevo Rol' }}
          </div>
          <div class="text-caption text-blue-1 ellipsis">
            {{ isEdit ? 'Editando: ' + form.name : 'Configure los permisos del rol' }}
          </div>
        </div>
        <q-btn icon="close" flat round dense size="sm" v-close-popup class="text-white" />
      </q-card-section>

      <q-form @submit="handleSubmit">
        <q-card-section class="q-pa-md">
          <div class="row q-col-gutter-md">
            <!-- Columna izquierda: Información básica -->
            <div class="col-12 col-md-4">
              <div class="q-gutter-y-md">
                <div class="text-subtitle2 text-bold text-blue-grey-10">
                  <q-icon name="info" color="primary" size="xs" class="q-mr-xs" /> Información
                </div>

                <q-input
                  ref="inputName"
                  v-model="form.name"
                  label="Nombre del Rol"
                  placeholder="Ej: Gerente de Operaciones"
                  outlined
                  dense
                  stack-label
                  bg-color="white"
                  class="shadow-1"
                  :rules="[val => !!val || 'El nombre es obligatorio']"
                />

                <q-card flat bordered class="bg-blue-grey-1 rounded-borders q-pa-sm">
                  <div class="text-caption text-grey-7 text-uppercase text-bold q-mb-sm">Resumen</div>
                  <div class="row q-gutter-xs">
                    <q-chip
                      v-for="(count, cat) in selectedCounts"
                      :key="cat"
                      size="sm"
                      dense
                      color="primary"
                      text-color="white"
                      icon="check_circle"
                    >
                      {{ cat }}: {{ count }}
                    </q-chip>
                    <div v-if="form.permissions.length === 0" class="text-caption text-grey-6 italic q-pa-xs">
                      Sin permisos seleccionados
                    </div>
                  </div>
                </q-card>
              </div>
            </div>

            <!-- Columna derecha: Permisos -->
            <div class="col-12 col-md-8">
              <div class="row items-center justify-between q-mb-sm">
                <div class="text-subtitle2 text-bold text-blue-grey-10">Asignación de Permisos</div>
                <q-input
                  v-model="search"
                  dense
                  outlined
                  placeholder="Buscar..."
                  class="search-mini"
                  bg-color="white"
                >
                  <template v-slot:append><q-icon name="search" size="xs" /></template>
                </q-input>
              </div>

              <q-scroll-area
                :style="{ height: $q.screen.gt.sm ? '420px' : '350px' }"
                class="bg-grey-1 rounded-borders q-pa-sm inner-shadow"
              >
                <div class="row q-col-gutter-sm">
                  <div
                    v-for="(group, category) in filteredPermissions"
                    :key="category"
                    class="col-12"
                  >
                    <q-card flat bordered class="module-card-premium">
                      <q-item dense class="bg-white q-py-xs">
                        <q-item-section avatar>
                          <q-avatar :icon="getModuleIcon(category)" color="primary" text-color="white" size="sm" />
                        </q-item-section>
                        <q-item-section>
                          <q-item-label class="text-bold text-uppercase text-caption ls-1">{{ category }}</q-item-label>
                          <q-item-label caption class="text-caption">{{ group.length }} acciones</q-item-label>
                        </q-item-section>
                        <q-item-section side>
                          <q-btn
                            flat round dense size="sm" icon="done_all" color="primary"
                            @click="selectAll(category)"
                          >
                            <q-tooltip>Seleccionar todo</q-tooltip>
                          </q-btn>
                        </q-item-section>
                      </q-item>

                      <q-separator />

                      <q-card-section class="q-pa-xs bg-white">
                        <div class="row">
                          <div v-for="perm in group" :key="perm.id" class="col-12 col-sm-6">
                            <q-checkbox
                              v-model="form.permissions"
                              :val="perm.name"
                              dense
                              color="primary"
                              class="perm-checkbox text-caption"
                            >
                              <span class="text-grey-9 text-caption">{{ perm.name.split('.')[1].replace('_', ' ') }}</span>
                            </q-checkbox>
                          </div>
                        </div>
                      </q-card-section>
                    </q-card>
                  </div>
                </div>
              </q-scroll-area>
            </div>
          </div>
        </q-card-section>

        <!-- Footer con botones responsivos -->
        <q-card-actions align="right" class="q-pa-sm bg-grey-2 border-top">
          <div class="row q-gutter-xs full-width justify-end">
            <q-btn
              label="Cancelar"
              flat
              color="grey-7"
              v-close-popup
              dense
              class="text-bold"
              :size="$q.screen.gt.xs ? 'md' : 'sm'"
            />
            <q-btn
              :label="isEdit ? 'Actualizar' : 'Guardar'"
              color="primary"
              type="submit"
              unelevated
              dense
              class="custom-btn-radius text-bold shadow-2"
              icon="save"
              :loading="loading"
              :size="$q.screen.gt.xs ? 'md' : 'sm'"
            />
          </div>
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

  const show = computed({
    get: () => props.modelValue,
    set: (val) => emit('update:modelValue', val)
  })

  const $q = useQuasar()
  const inputName = ref(null)
  const loading = ref(false)
  const allPermissions = ref([])
  const search = ref('')
  const form = reactive({ name: '', permissions: [] })
  const isEdit = computed(() => !!props.editData)

  const getModuleIcon = (cat) => {
    const icons = {
      usuarios: 'people',
      roles: 'security',
      ventas: 'shopping_cart',
      productos: 'inventory_2',
      clientes: 'contact_page',
      configuracion: 'settings',
      sucursales: 'storefront',
      reportes: 'bar_chart'
    }
    return icons[cat.toLowerCase()] || 'extension'
  }

  const groupedPermissions = computed(() => {
    return allPermissions.value.reduce((acc, perm) => {
      const category = perm.name.split('.')[0]
      if (!acc[category]) acc[category] = []
      acc[category].push(perm)
      return acc
    }, {})
  })

  const filteredPermissions = computed(() => {
    if (!search.value) return groupedPermissions.value
    const filtered = {}
    Object.keys(groupedPermissions.value).forEach(cat => {
      const matched = groupedPermissions.value[cat].filter(p =>
        p.name.toLowerCase().includes(search.value.toLowerCase())
      )
      if (matched.length > 0) filtered[cat] = matched
    })
    return filtered
  })

  const selectedCounts = computed(() => {
    const counts = {}
    form.permissions.forEach(p => {
      const cat = p.split('.')[0]
      counts[cat] = (counts[cat] || 0) + 1
    })
    return counts
  })

  const selectAll = (category) => {
    const modulePerms = groupedPermissions.value[category].map(p => p.name)
    const allSelected = modulePerms.every(p => form.permissions.includes(p))

    if (allSelected) {
      form.permissions = form.permissions.filter(p => !modulePerms.includes(p))
    } else {
      const toAdd = modulePerms.filter(p => !form.permissions.includes(p))
      form.permissions.push(...toAdd)
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
      form.name = ''; form.permissions = []
    }
    nextTick(() => inputName.value?.focus())
  }

  const handleSubmit = async () => {
    loading.value = true
    try {
      const url = isEdit.value ? `/api/roles/${props.editData.id}` : '/api/roles'
      const method = isEdit.value ? 'put' : 'post'
      const response = await api[method](url, form)
      $q.notify({ color: 'positive', message: response.data.message || 'Operación exitosa', icon: 'verified' })
      emit('saved'); show.value = false
    } catch (e) {
      $q.notify({ color: 'negative', message: 'Error en el servidor', icon: 'warning' })
    } finally { loading.value = false }
  }
</script>

<style lang="scss" scoped>
  .premium-card {
    border-radius: 16px;
    background: white;
  }

  .bg-gradient-primary {
    background: var(--q-primary);
  }

  .module-card-premium {
    border-radius: 10px;
    overflow: hidden;
    border: 1px solid rgba(0, 0, 0, 0.08);
    transition: all 0.25s;

    &:hover {
      transform: translateY(-1px);
      box-shadow: 0 3px 12px rgba(0,0,0,0.08);
      border-color: var(--q-primary);
    }
  }

  .perm-checkbox {
    padding: 2px 4px;
    border-radius: 6px;
    transition: background 0.2s;
    width: 100%;

    &:hover {
      background: #f0f7ff;
    }
  }

  .inner-shadow {
    box-shadow: inset 0 2px 8px rgba(0,0,0,0.04);
  }

  .ls-1 {
    letter-spacing: 0.5px;
  }

  .custom-btn-radius {
    border-radius: 10px;
    min-width: 100px;
  }

  .search-mini {
    width: 180px;

    @media (max-width: 599px) {
      width: 140px;
    }
  }

  .border-top {
    border-top: 1px solid rgba(0, 0, 0, 0.08);
  }

  // Mejoras responsivas adicionales
  @media (max-width: 599px) {
    .premium-card {
      border-radius: 12px;
    }

    .text-subtitle1 {
      font-size: 0.9rem;
    }

    .text-subtitle2 {
      font-size: 0.85rem;
    }
  }
</style>
