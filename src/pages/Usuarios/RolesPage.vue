<template>
  <q-page class="q-pa-md bg-grey-2">
    <q-card class="shadow-15 no-border-radius">
      <q-table
        :rows="rows"
        :columns="columns"
        row-key="id"
        :loading="loading"
        flat bordered
        class="my-sticky-header-table"
      >
        <template v-slot:top>
          <div class="col-12 row items-center q-gutter-md">
            <div class="text-h5 text-primary text-bold">
              <q-icon name="admin_panel_settings" size="md" class="q-mr-sm" />
              Roles y Perfiles
            </div>
            <q-space />
            <q-btn color="primary" icon="add" label="Nuevo Rol" @click="openCreate" />
          </div>
        </template>

        <template v-slot:body-cell-name="props">
          <q-td :props="props">
            <q-chip color="purple-6" text-color="white" class="text-bold" icon="verified">
              {{ props.value }}
            </q-chip>
          </q-td>
        </template>

        <template v-slot:body-cell-permissions_count="props">
          <q-td :props="props" class="text-center">
            <q-badge color="grey-8" class="q-px-md text-bold">
              {{ props.value }} Permisos asignados
            </q-badge>
          </q-td>
        </template>

        <template v-slot:body-cell-actions="props">
          <q-td :props="props" class="text-center">
            <q-btn flat round color="indigo" icon="edit" size="sm" @click="openEdit(props.row)" />
            <q-btn flat round color="negative" icon="delete" size="sm" @click="confirmDelete(props.row)" />
          </q-td>
        </template>
      </q-table>
    </q-card>

    <RolesForm
      v-model="showDialog"
      :editData="selectedRole"
      @saved="loadRoles"
    />
  </q-page>
</template>

<script setup>
  import { ref, onMounted } from 'vue'
  import { api } from 'boot/axios'
  import { useQuasar } from 'quasar'
  import RolesForm from 'components/Usuarios/RolesForm.vue'

  const $q = useQuasar()
  const rows = ref([])
  const loading = ref(true)
  const showDialog = ref(false)
  const selectedRole = ref(null)

  const columns = [
    { name: 'name', label: 'NOMBRE DEL ROL', field: 'name', align: 'left', sortable: true },
    { name: 'permissions_count', label: 'CANTIDAD DE PERMISOS', field: 'permissions_count', align: 'center' },
    { name: 'actions', label: 'ACCIONES', align: 'center' }
  ]

  const loadRoles = async () => {
    loading.value = true
    try {
      const res = await api.get('/api/roles')
      rows.value = res.data
    } finally { loading.value = false }
  }

  const confirmDelete = (role) => {
    $q.dialog({
      title: 'Confirmar Eliminación',
      message: `¿Estás seguro de eliminar el rol "${role.name}"? Esta acción no se puede deshacer.`,
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
        const response = await api.delete(`/api/roles/${role.id}`);

        $q.notify({
          color: 'positive',
          message: response.data.message,
          icon: 'check',
          position: 'bottom-right'
        });

        loadRoles(); // Recargar la tabla
      } catch (e) {
        // Capturamos el error 422 (usuarios asignados) o 403 (Rol Admin)
        const errorMsg = e.response?.data?.message || 'Error al intentar eliminar el rol';

        $q.notify({
          color: 'negative',
          message: errorMsg,
          icon: 'report_problem',
          position: 'bottom',
          timeout: 5000 // Damos más tiempo para leer el motivo del bloqueo
        });
      }
    });
  };

  const openCreate = () => { selectedRole.value = null; showDialog.value = true }
  const openEdit = (role) => { selectedRole.value = { ...role }; showDialog.value = true }

  onMounted(loadRoles)
</script>
