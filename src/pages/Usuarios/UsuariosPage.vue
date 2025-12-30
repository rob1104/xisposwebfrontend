<template>
  <q-page class="q-pa-md bg-grey-2">
    <q-card class="shadow-15 no-border-radius">
      <q-table
        :rows="rows"
        :columns="columns"
        row-key="id"
        :loading="loading"
        flat bordered
        :filter="filter"
        class="my-sticky-header-table"
      >
        <template v-slot:top>
          <div class="col-12 row items-center q-gutter-md">
            <div class="text-h5 text-primary text-bold">
              <q-icon name="manage_accounts" size="md" class="q-mr-sm" />
              Gestión de Usuarios
            </div>
            <q-input v-model="filter" placeholder="Buscar usuario..." outlined dense class="col-grow bg-white">
              <template v-slot:append><q-icon name="search" /></template>
            </q-input>
            <q-btn color="primary" icon="add" label="Nuevo Usuario" @click="openCreate" />
          </div>
        </template>

        <template v-slot:body-cell-name="props">
          <q-td :props="props">
            <div class="row items-center">
              <q-avatar size="28px" color="primary" text-color="white" class="q-mr-sm">
                {{ props.row.name.charAt(0).toUpperCase() }}
              </q-avatar>
              <div class="text-bold">{{ props.value }}</div>
            </div>
          </q-td>
        </template>

        <template v-slot:body-cell-role="props">
          <q-td :props="props" class="text-center">
            <q-chip
              :color="props.value === 'Admin' ? 'purple-9' : 'purple-8'"
              text-color="white" dense size="md" class="text-bold"
            >
              {{ props.value }}
            </q-chip>
          </q-td>
        </template>

        <template v-slot:body-cell-status="props">
          <q-td :props="props" class="text-center">
            <q-badge :color="props.value ? 'positive' : 'negative'" rounded class="q-px-sm">
              {{ props.value ? 'ACTIVO' : 'INACTIVO' }}
            </q-badge>
          </q-td>
        </template>

        <template v-slot:body-cell-actions="props">
          <q-td :props="props" class="q-gutter-xs text-center">
            <q-btn flat round color="indigo" icon="edit" size="sm" @click="openEdit(props.row)" />
            <q-btn flat round color="negative" icon="delete" size="sm" @click="confirmDelete(props.row)" />
          </q-td>
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
  import { ref, onMounted } from 'vue'
  import { api } from 'boot/axios'
  import { useQuasar } from 'quasar'
  import UsuariosForm from 'components/Usuarios/UsuariosForm.vue'

  const $q = useQuasar()
  const rows = ref([])
  const loading = ref(true)
  const showDialog = ref(false)
  const selectedUser = ref(null)
  const filter = ref('')
  const rolesOptions = ref([])

  const columns = [
    { name: 'name', label: 'NOMBRE', field: 'name', align: 'left', sortable: true },
    { name: 'email', label: 'EMAIL', field: 'email', align: 'left' },
    { name: 'role', label: 'ROL / PERFIL', field: 'role', align: 'center' },
    { name: 'status', label: 'ESTADO', field: 'status', align: 'center', sortable: true },
    { name: 'actions', label: 'ACCIONES', align: 'center' }
  ]

  const loadUsers = async () => {
    loading.value = true
    try {
      const res = await api.get('/api/users')
      rows.value = res.data
    } finally { loading.value = false }
  }

  const loadRoles = async () => {
    try {
      const res = await api.get('/api/roles-list') // Endpoint que creamos en el controlador
      rolesOptions.value = res.data // Guardamos la lista de strings (ej: ['Admin', 'Cajero'])
    } catch (e) {
      $q.notify({ color: 'negative', message: 'Error al cargar roles', icon: 'warning' })
    }
  }

  const confirmDelete = (user) => {
    $q.dialog({
      title: 'Eliminar Usuario',
      message: `¿Estás seguro de eliminar permanentemente a "${user.name}"? Esta acción no se puede deshacer.`,
      ok: {
        label: 'Eliminar',
        color: 'negative',
        flat: true
      },
      cancel: {
        label: 'Cancelar',
        color: 'grey-8',
        flat: true
      },
      persistent: true
    }).onOk(async () => {
      try {
        const response = await api.delete(`/api/users/${user.id}`)

        $q.notify({
          color: 'positive',
          message: response.data.message || 'Usuario eliminado correctamente',
          icon: 'check',
          position: 'bottom-right'
        })

        // Recargamos la lista para actualizar la tabla
        loadUsers()

      } catch (e) {
        // Manejamos el error 403 (Autodelete) o errores de servidor
        const errorMsg = e.response?.data?.message || 'No se pudo eliminar el usuario'

        $q.notify({
          color: 'negative',
          message: errorMsg,
          icon: 'report_problem',
          position: 'bottom'
        })
      }
    })
  }

  const openCreate = () => { selectedUser.value = null; showDialog.value = true }
  const openEdit = (user) => { selectedUser.value = { ...user }; showDialog.value = true }


  onMounted(async () => {
    await loadUsers()
    await loadRoles()
  })

</script>
