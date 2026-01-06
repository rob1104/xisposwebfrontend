<template>
  <q-dialog v-model="show" backdrop-filter="blur(4px)">
    <q-card style="width: 700px; max-width: 90vw;" class="premium-card shadow-24">
      <q-card-section class="bg-primary text-white q-pa-lg">
        <div class="row items-center no-wrap">
          <q-avatar icon="visibility" color="white" text-color="primary" class="shadow-2 q-mr-md" />
          <div>
            <div class="text-h6 text-bold ls-1 text-uppercase">{{ role?.name }}</div>
            <div class="text-caption text-blue-1">Resumen de permisos</div>
          </div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </div>
      </q-card-section>

      <q-card-section class="q-pa-md scroll" style="max-height: 60vh">
        <div v-if="loading" class="text-center q-pa-xl">
          <q-spinner-dots color="primary" size="40px" />
        </div>

        <div v-else class="row q-col-gutter-md">
          <div v-for="(group, category) in groupedPermissions" :key="category" class="col-12">
            <q-card flat bordered class="bg-blue-grey-1 border-radius-10">
              <q-item dense class="q-py-xs bg-white border-bottom-thin">
                <q-item-section avatar>
                  <q-icon :name="getModuleIcon(category)" color="primary" size="xs" />
                </q-item-section>
                <q-item-section class="text-bold text-primary text-uppercase text-caption ls-1">
                  Módulo {{ category }}
                </q-item-section>
                <q-item-section side>
                  <q-badge color="primary" outline>{{ group.length }}</q-badge>
                </q-item-section>
              </q-item>

              <q-card-section class="q-pa-sm row q-gutter-xs">
                <q-chip
                  v-for="perm in group"
                  :key="perm.id"
                  dense
                  class="bg-white text-grey-9 shadow-1"
                  icon="check"
                  color="white"
                >
                  {{ perm.name.split('.')[1].replace('_', ' ') }}
                </q-chip>
              </q-card-section>
            </q-card>
          </div>
        </div>
      </q-card-section>

      <q-separator />

      <q-card-actions align="center" class="q-pa-md">
        <q-btn label="Entendido" color="primary" unelevated v-close-popup class="q-px-xl custom-btn-radius text-bold" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
  import { ref, computed, watch } from 'vue'
  import { api } from 'boot/axios'

  const props = defineProps({ modelValue: Boolean, role: Object })
  const emit = defineEmits(['update:modelValue'])

  const show = computed({
    get: () => props.modelValue,
    set: (val) => emit('update:modelValue', val)
  })

  const loading = ref(false)
  const permissions = ref([])

  const groupedPermissions = computed(() => {
    return permissions.value.reduce((acc, perm) => {
      const category = perm.name.split('.')[0]
      if (!acc[category]) acc[category] = []
      acc[category].push(perm)
      return acc
    }, {})
  })

  const getModuleIcon = (cat) => {
    const icons = {
      usuarios: 'people', roles: 'security', ventas: 'shopping_cart',
      productos: 'inventory_2', clientes: 'contact_page', configuracion: 'settings'
    }
    return icons[cat.toLowerCase()] || 'extension'
  }

  watch(() => props.modelValue, async (val) => {
    if (val && props.role?.id) {
      loading.value = true
      try {
        const res = await api.get(`/api/roles/${props.role.id}`)
        permissions.value = res.data.permissions
      } finally { loading.value = false }
    }
  })
</script>

<style scoped>
  .premium-card { border-radius: 16px; }
  .border-radius-10 { border-radius: 10px; }
  .border-bottom-thin { border-bottom: 1px solid rgba(0,0,0,0.05); }
  .ls-1 { letter-spacing: 1px; }
  .custom-btn-radius { border-radius: 10px; }
</style>
