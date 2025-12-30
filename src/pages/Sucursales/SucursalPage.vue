<template>
  <q-page class="q-pa-md bg-grey-3">
    <q-card class="shadow-15">
      <q-table :rows="rows" :columns="columns" row-key="id" :loading="loading" flat bordered>
        <template v-slot:top>
          <div class="col-12 row items-center q-gutter-md">
            <div class="text-h5 text-primary text-bold text-uppercase">
              <q-icon name="storefront" size="md" class="q-mr-sm" /> Sucursales
            </div>
            <q-space />
            <q-btn color="primary" icon="add" label="Nueva Sucursal" @click="openCreate" />
          </div>
        </template>

        <template v-slot:body-cell-status="props">
          <q-td :props="props" class="text-center">
            <q-badge :color="props.value === 1 ? 'positive' : 'negative'" class="text-bold">
              {{ props.value === 1 ? 'ACTIVA' : 'INACTIVA' }}
            </q-badge>
          </q-td>
        </template>

        <template v-slot:body-cell-actions="props">
          <q-td :props="props" class="text-center">
            <q-btn flat round color="blue-8" icon="edit" size="sm" @click="openEdit(props.row)" />
            <q-btn flat round color="negative" icon="delete" size="sm" @click="confirmDelete(props.row)" />
          </q-td>
        </template>
      </q-table>
    </q-card>

    <SucursalForm v-model="showDialog" :editData="selectedItem" @saved="loadData" />
  </q-page>
</template>

<script setup>
  import { ref, onMounted } from 'vue'
  import { api } from 'boot/axios'
  import { useQuasar } from 'quasar'
  import SucursalForm from 'components/Sucursales/SucursalesForm.vue'

  const $q = useQuasar()
  const rows = ref([])
  const loading = ref(false)
  const showDialog = ref(false)
  const selectedItem = ref(null)

  const columns = [
    { name: 'nombre', label: 'NOMBRE', field: 'nombre', align: 'left', sortable: true },
    { name: 'direccion', label: 'DIRECCIÓN', field: 'direccion', align: 'left' },
    { name: 'telefono', label: 'TELÉFONO', field: 'telefono', align: 'left' },
    { name: 'actions', label: 'ACCIONES', align: 'center' }
  ]

  const loadData = async () => {
    loading.value = true
    try {
      const res = await api.get('/api/sucursales')
      rows.value = res.data
    } finally { loading.value = false }
  }

  const confirmDelete = (row) => {
    $q.dialog({
      title: 'Eliminar Sucursal',
      message: `¿Borrar permanentemente "${row.nombre}"?`,
      ok: { label: 'Eliminar', color: 'negative', flat: true },
      cancel: { label: 'Cancelar', flat: true },
      persistent: true
    }).onOk(async () => {
      try {
        const res = await api.delete(`/api/sucursales/${row.id}`)
        $q.notify({ color: 'positive', message: res.data.message, icon: 'check' })
        loadData()
      } catch (e) {
        $q.notify({ color: 'negative', message: e.response?.data?.message || 'Error', icon: 'report_problem' })
      }
    })
  }

  const openCreate = () => { selectedItem.value = null; showDialog.value = true }
  const openEdit = (row) => { selectedItem.value = { ...row }; showDialog.value = true }

  onMounted(loadData)
</script>
