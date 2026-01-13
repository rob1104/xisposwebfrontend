<template>
  <q-page class="q-pa-lg bg-grey-2">
    <div class="row q-col-gutter-md q-mb-lg">
      <div class="col-12 col-md-4">
        <q-card class="stats-card bg-white shadow-2">
          <q-card-section class="row items-center no-wrap">
            <q-avatar icon="manage_accounts" color="primary" text-color="white" shadow-5 />
            <div class="q-ml-md">
              <div class="text-h6 text-bold">{{ totalUsuarios }}</div>
              <div class="text-caption text-grey-7">Usuarios en el Sistema</div>
            </div>
          </q-card-section>
        </q-card>
      </div>

      <div class="col-12 col-md-4">
        <q-card class="stats-card bg-white shadow-2 border-left-green">
          <q-card-section class="row items-center no-wrap">
            <q-avatar icon="verified" color="positive" text-color="white" shadow-5 />
            <div class="q-ml-md">
              <div class="text-h6 text-bold text-positive">{{ usuariosActivos }}</div>
              <div class="text-caption text-grey-7">Usuarios Activos</div>
            </div>
          </q-card-section>
        </q-card>
      </div>

      <div class="col-12 col-md-4 text-right self-center">
        <q-btn
          color="primary"
          icon="add"
          label="Nuevo Usuario"
          size="lg"
          class="shadow-5 custom-btn-radius"
          unelevated
          @click="openCreate"
        />
      </div>
    </div>

    <q-card class="shadow-10 overflow-hidden border-radius-15">
      <q-table
        :rows="rows"
        :columns="columns"
        row-key="id"
        :loading="loading"
        :filter="filter"
        flat
        class="main-table"
      >
        <template v-slot:top-left>
          <div class="text-h6 text-bold text-primary">Control de Usuarios</div>
        </template>

        <template v-slot:top-right>
          <q-input
            v-model="filter"
            placeholder="Buscar por nombre, email o rol..."
            outlined
            dense
            class="search-input"
            bg-color="white"
          >
            <template v-slot:append><q-icon name="search" /></template>
          </q-input>
        </template>

        <template v-slot:body="props">
          <q-tr :props="props" class="hover-row">

            <q-td key="name" :props="props">
              <div class="row items-center no-wrap">
                <q-avatar size="42px" color="primary" text-color="white" class="shadow-2 q-mr-md text-bold">
                  {{ props.row.name.charAt(0).toUpperCase() }}
                </q-avatar>
                <div>
                  <div class="text-bold text-subtitle2">{{ props.row.name }}</div>
                  <div class="text-caption text-grey-7 row items-center">
                    <q-icon name="mail" size="12px" class="q-mr-xs" />
                    {{ props.row.email }}
                  </div>
                </div>
              </div>
            </q-td>

            <q-td key="role" :props="props" class="text-center">
              <q-chip
                :color="props.row.role === 'Administrador' ? 'purple-9' : 'indigo-7'"
                text-color="white"
                class="text-bold q-px-md"
                size="sm"
              >
                <q-icon name="shield" size="xs" class="q-mr-xs" />
                {{ props.row.role }}
              </q-chip>
            </q-td>

            <q-td key="sucursales" :props="props" class="text-center">
              <div v-if="props.row.sucursales?.length > 0">
                <q-badge color="grey-3" text-color="primary" class="q-pa-xs text-bold">
                  <q-icon name="storefront" size="xs" class="q-mr-xs" />
                  {{ props.row.sucursales.length }}
                </q-badge>
                <q-tooltip class="bg-primary">
                  {{ props.row.sucursales.map(s => s.nombre).join(', ') }}
                </q-tooltip>
              </div>
              <span v-else class="text-caption text-grey-5 italic">Sin asignar</span>
            </q-td>

            <q-td key="status" :props="props" class="text-center">
              <q-badge
                :color="props.row.status ? 'positive' : 'negative'"
                class="text-bold q-px-md q-py-xs shadow-1"
                rounded
              >
                <q-icon :name="props.row.status ? 'check_circle' : 'cancel'" size="xs" class="q-mr-xs" />
                {{ props.row.status ? 'ACTIVO' : 'INACTIVO' }}
              </q-badge>
            </q-td>

            <q-td key="actions" :props="props" class="text-center">
              <q-btn flat round color="indigo" icon="edit" @click="openEdit(props.row)">
                <q-tooltip>Editar Perfil</q-tooltip>
              </q-btn>
              <q-btn flat round color="negative" icon="delete" @click="confirmDelete(props.row)">
                <q-tooltip>Eliminar Usuario</q-tooltip>
              </q-btn>
            </q-td>
          </q-tr>
        </template>
      </q-table>
    </q-card>

    <UsuariosForm
      v-model="showDialog"
      :editData="selectedUser"
      :roles="rolesOptions"
      @saved="loadUsers"
    />
  </q-page>
</template>

<script setup>
  import { ref, computed, onMounted } from 'vue'
  import { api } from 'boot/axios'
  import { useQuasar } from 'quasar'
  import UsuariosForm from 'components/Usuarios/UsuariosForm.vue'

  const $q = useQuasar()
  const rows = ref([])
  const loading = ref(true)
  const filter = ref('')
  const showDialog = ref(false)
  const selectedUser = ref(null)
  const rolesOptions = ref([])

  // Columnas refinadas para mejor jerarquía
  const columns = [
    { name: 'name', label: 'USUARIO / ACCESO', field: 'name', align: 'left', sortable: true },
    { name: 'role', label: 'PERFIL / ROL', field: 'role', align: 'center', sortable: true },
    { name: 'sucursales', label: 'SUCURSALES', align: 'center' },
    { name: 'status', label: 'ESTADO', field: 'status', align: 'center', sortable: true },
    { name: 'actions', label: 'ACCIONES', align: 'center' }
  ]

  // Estadísticas computadas
  const totalUsuarios = computed(() => rows.value.length)
  const usuariosActivos = computed(() => rows.value.filter(u => u.status === 1).length)

  const loadUsers = async () => {
    loading.value = true
    try {
      const res = await api.get('/api/users')
      rows.value = res.data
    } finally { loading.value = false }
  }

  const loadRoles = async () => {
    try {
      const res = await api.get('/api/roles-list')
      rolesOptions.value = res.data
    } catch (e) {
      console.error("Error al cargar roles")
    }
  }

  const openCreate = () => { selectedUser.value = null; showDialog.value = true }
  const openEdit = (user) => { selectedUser.value = { ...user }; showDialog.value = true }

  const confirmDelete = (user) => {
    $q.dialog({
      title: '<div class="text-negative"><q-icon name="warning" /> Confirmar Baja</div>',
      message: `¿Deseas revocar el acceso definitivamente a <b>${user.name}</b>?`,
      html: true,
      ok: { label: 'Eliminar', color: 'negative', unelevated: true },
      cancel: { label: 'Cancelar', flat: true, color: 'grey-7' },
      persistent: true
    }).onOk(async () => {
      try {
        const response = await api.delete(`/api/users/${user.id}`)
        $q.notify({ color: 'positive', message: response.data.message, icon: 'check' })
        loadUsers()
      } catch (e) {
        $q.notify({ color: 'negative', message: e.response?.data?.message || 'Error', icon: 'report_problem' })
      }
    })
  }

  onMounted(async () => {
    await loadUsers()
    await loadRoles()
  })
</script>

<style lang="scss" scoped>
  .stats-card {
    border-radius: 12px;
    border-bottom: 4px solid #eee;
    transition: transform 0.3s;
    &:hover { transform: translateY(-5px); }
  }

  .border-left-green { border-left: 5px solid $positive; }
  .border-radius-15 { border-radius: 15px; }

  .main-table {
    background: white;
    :deep(thead th) {
      font-weight: bold;
      text-transform: uppercase;
      color: white;
      background: #263238;
      border-bottom: 2px solid $primary;
    }
  }

  .search-input {
    width: 350px;
    transition: all 0.3s;
    &:focus-within { width: 450px; }
  }

  .hover-row {
    transition: background 0.2s;
    &:hover { background: #f1f5f9 !important; }
  }

  .custom-btn-radius {
    border-radius: 10px;
    font-weight: bold;
  }
</style>
