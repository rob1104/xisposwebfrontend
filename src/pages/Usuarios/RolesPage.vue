<template>
  <q-page class="q-pa-lg bg-grey-2">
    <div class="row q-col-gutter-md q-mb-lg">
      <div class="col-12 col-md-4">
        <q-card class="stats-card bg-white shadow-2">
          <q-card-section class="row items-center no-wrap">
            <q-avatar icon="admin_panel_settings" color="primary" text-color="white" shadow-5 />
            <div class="q-ml-md">
              <div class="text-h6 text-bold">{{ rows.length }}</div>
              <div class="text-caption text-grey-7">Roles Definidos</div>
            </div>
          </q-card-section>
        </q-card>
      </div>

      <div class="col-12 col-md-4">
        <q-card class="stats-card bg-white shadow-2 border-left-purple">
          <q-card-section class="row items-center no-wrap">
            <q-avatar icon="verified_user" color="purple-9" text-color="white" shadow-5 />
            <div class="q-ml-md">
              <div class="text-h6 text-bold text-purple-9">{{ totalPermisos }}</div>
              <div class="text-caption text-grey-7">Permisos Totales Asignados</div>
            </div>
          </q-card-section>
        </q-card>
      </div>

      <div class="col-12 col-md-4 text-right self-center">
        <q-btn
          color="primary"
          icon="add"
          label="Nuevo Rol"
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
          <div class="text-h6 text-bold text-primary">Configuración de Niveles de Acceso</div>
        </template>

        <template v-slot:top-right>
          <q-input
            v-model="filter"
            placeholder="Buscar por nombre de rol..."
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
              <q-chip
                color="purple-1"
                text-color="purple-9"
                class="text-bold q-px-md"
                icon="shield"
              >
                {{ props.row.name }}
              </q-chip>
            </q-td>

            <q-td key="permissions_count" :props="props" class="text-center">
              <q-badge color="grey-3" text-color="grey-9" class="q-px-md q-py-xs text-bold shadow-1">
                <q-icon name="list_alt" size="xs" class="q-mr-xs" />
                {{ props.row.permissions_count }} Permisos asignados
              </q-badge>
            </q-td>

            <q-td key="actions" :props="props" class="text-center">
              <q-btn flat round color="purple" icon="visibility" @click="openView(props.row)">
                <q-tooltip>Ver Detalles</q-tooltip>
              </q-btn>
              <q-btn flat round color="indigo" icon="edit" @click="openEdit(props.row)">
                <q-tooltip>Editar Permisos</q-tooltip>
              </q-btn>
              <q-btn flat round color="negative" icon="delete" @click="confirmDelete(props.row)">
                <q-tooltip>Eliminar Rol</q-tooltip>
              </q-btn>
            </q-td>
          </q-tr>
        </template>
      </q-table>
    </q-card>

    <RolesForm
      v-model="showDialog"
      :editData="selectedRole"
      @saved="loadRoles"
    />

    <RolesViewDialog v-model="showView" :role="selectedRole" />
  </q-page>
</template>

<script setup>
  import { ref, computed, onMounted } from 'vue'
  import { api } from 'boot/axios'
  import { useQuasar } from 'quasar'
  import RolesForm from 'components/Usuarios/RolesForm.vue'
  import RolesViewDialog from 'components/Usuarios/RolesViewDialog.vue'

  const $q = useQuasar()
  const rows = ref([])
  const loading = ref(true)
  const filter = ref('')
  const showDialog = ref(false)
  const selectedRole = ref(null)

  const showView = ref(false)
  const openView = (role) => {
    selectedRole.value = role
    showView.value = true
  }

  const columns = [
    { name: 'name', label: 'NOMBRE DEL ROL', field: 'name', align: 'left', sortable: true },
    { name: 'permissions_count', label: 'CANTIDAD DE PERMISOS', field: 'permissions_count', align: 'center', sortable: true },
    { name: 'actions', label: 'ACCIONES', align: 'center' }
  ]

  // Cálculo de estadísticas
  const totalPermisos = computed(() => rows.value.reduce((acc, curr) => acc + (curr.permissions_count || 0), 0))

  const loadRoles = async () => {
    loading.value = true
    try {
      const res = await api.get('/api/roles')
      rows.value = res.data
    } finally { loading.value = false }
  }

  const confirmDelete = (role) => {
    $q.dialog({
      title: '<div class="text-negative"><q-icon name="warning" /> Eliminar Perfil</div>',
      message: `¿Estás seguro de eliminar el rol <b>"${role.name}"</b>? Esta acción no se puede deshacer.`,
      html: true,
      ok: { label: 'Eliminar', color: 'negative', unelevated: true },
      cancel: { label: 'Cancelar', flat: true, color: 'grey-8' },
      persistent: true
    }).onOk(async () => {
      try {
        const response = await api.delete(`/api/roles/${role.id}`);
        $q.notify({ color: 'positive', message: response.data.message, icon: 'check' });
        loadRoles();
      } catch (e) {
        const errorMsg = e.response?.data?.message || 'Error al intentar eliminar el rol';
        $q.notify({ color: 'negative', message: errorMsg, icon: 'report_problem', position: 'bottom' });
      }
    });
  };

  const openCreate = () => { selectedRole.value = null; showDialog.value = true }
  const openEdit = (role) => { selectedRole.value = { ...role }; showDialog.value = true }

  onMounted(loadRoles)
</script>

<style lang="scss" scoped>
  .stats-card {
    border-radius: 12px;
    border-bottom: 4px solid #eee;
    transition: transform 0.3s;
    &:hover { transform: translateY(-5px); }
  }

  .border-left-purple { border-left: 5px solid $purple-9; }
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
    &:hover { background: #f3e5f5 !important; }
  }

  .custom-btn-radius {
    border-radius: 10px;
    font-weight: bold;
  }
</style>
