<template>
  <q-page class="q-pa-md bg-grey-2">

    <div class="row items-center q-mb-md">
      <div class="col">
        <div class="text-h5 text-primary text-bold">Administración Restaurante</div>
        <div class="text-caption text-grey-7">Configuración de mesas y menú digital</div>
      </div>
    </div>

    <q-card class="shadow-3 rounded-borders bg-white">
      <q-tabs
        v-model="tab"
        dense
        class="text-grey"
        active-color="primary"
        indicator-color="primary"
        align="justify"
        narrow-indicator
      >
        <q-tab name="mesas" icon="table_restaurant" label="Gestión de Mesas" />
        <q-tab name="menu" icon="menu_book" label="Configuración Menú" />
      </q-tabs>

      <q-separator />

      <q-tab-panels v-model="tab" animated>

        <q-tab-panel name="mesas" class="q-pa-md">

          <div class="row justify-between items-center q-mb-md">
            <div class="text-h6 text-primary">Listado de Mesas</div>
            <q-btn
              color="primary"
              icon="add"
              label="Nueva Mesa"
              unelevated
              class="rounded-borders"
              @click="abrirModalMesa()"
            />
          </div>

          <q-table
            :rows="mesas"
            :columns="columnasMesas"
            row-key="id"
            flat
            bordered
            :loading="loadingMesas"
            no-data-label="No hay mesas registradas"
          >
            <template v-slot:body-cell-acciones="props">
              <q-td :props="props" align="right">
                <q-btn flat round color="primary" icon="edit" size="sm" @click="abrirModalMesa(props.row)" />
                <q-btn flat round color="negative" icon="delete" size="sm" @click="borrarMesa(props.row)" />
              </q-td>
            </template>

            <template v-slot:body-cell-ocupada="props">
              <q-td :props="props">
                <q-chip
                  dense
                  :color="props.row.ocupada ? 'red-1' : 'green-1'"
                  :text-color="props.row.ocupada ? 'red' : 'green'"
                  icon="circle"
                >
                  {{ props.row.ocupada ? 'Ocupada' : 'Libre' }}
                </q-chip>
              </q-td>
            </template>
          </q-table>
        </q-tab-panel>

        <q-tab-panel name="menu" class="q-pa-md">
          <div class="text-h6 text-primary q-mb-sm">Visibilidad de Categorías</div>
          <p class="text-caption text-grey">Activa las categorías que deseas mostrar en el módulo de meseros.</p>

          <div v-if="loadingCats" class="row justify-center q-pa-lg">
             <q-spinner color="primary" size="2em" />
          </div>

          <div v-else class="row q-col-gutter-md">
            <div class="col-12 col-sm-6 col-md-4" v-for="cat in categorias" :key="cat.id">
              <q-item tag="label" class="bg-grey-1 rounded-borders border-light q-pa-md">
                <q-item-section avatar>
                  <q-avatar color="primary" text-color="white" icon="category" font-size="20px" size="md" />
                </q-item-section>
                <q-item-section>
                  <q-item-label class="text-bold text-grey-9">{{ cat.nombre }}</q-item-label>
                  <q-item-label caption>{{ cat.en_restaurante ? 'Visible en Restaurante' : 'Oculto' }}</q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-toggle
                    v-model="cat.en_restaurante"
                    color="primary"
                    :true-value="1"
                    :false-value="0"
                    @update:model-value="toggleCat(cat)"
                  />
                </q-item-section>
              </q-item>
            </div>
          </div>
        </q-tab-panel>

      </q-tab-panels>
    </q-card>

    <q-dialog v-model="showDialogMesa">
      <q-card style="min-width: 350px" class="rounded-borders">
        <q-card-section class="bg-primary text-white row items-center">
          <div class="text-h6">{{ formMesa.id ? 'Editar Mesa' : 'Nueva Mesa' }}</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section class="q-pt-lg q-gutter-y-md">
          <q-input
            filled
            v-model="formMesa.nombre"
            label="Nombre de la Mesa *"
            hint="Ej: Mesa 1, Barra 2"
            :rules="[val => !!val || 'Requerido']"
          />
          <q-input
            filled
            v-model="formMesa.zona"
            label="Zona (Opcional)"
            hint="Ej: Terraza, Salón Principal"
          />
        </q-card-section>

        <q-card-actions align="right" class="q-pa-md bg-grey-1">
          <q-btn flat label="Cancelar" color="grey" v-close-popup />
          <q-btn label="Guardar" color="primary" unelevated @click="guardarMesa" />
        </q-card-actions>
      </q-card>
    </q-dialog>

  </q-page>
</template>

<script setup>
  import { ref, onMounted } from 'vue'
  import { api } from 'src/boot/axios'
  import { useQuasar } from 'quasar'

  const $q = useQuasar()
  const tab = ref('mesas')

  // --- LÓGICA MESAS ---
  const mesas = ref([])
  const loadingMesas = ref(false)
  const showDialogMesa = ref(false)
  const formMesa = ref({ id: null, nombre: '', zona: '' })

  const columnasMesas = [
    { name: 'id', label: 'ID', field: 'id', sortable: true, align: 'left', style: 'width: 50px' },
    { name: 'nombre', label: 'NOMBRE', field: 'nombre', sortable: true, align: 'left' },
    { name: 'zona', label: 'ZONA', field: 'zona', sortable: true, align: 'left' },
    { name: 'ocupada', label: 'ESTADO', field: 'ocupada', align: 'center' },
    { name: 'acciones', label: 'ACCIONES', align: 'right' }
  ]

  const cargarMesas = async () => {
    loadingMesas.value = true
    try {
      const { data } = await api.get('/api/restaurante/admin/mesas')
      mesas.value = data
    } catch (e) {
      console.error(e)
    } finally {
      loadingMesas.value = false
    }
  }

  const abrirModalMesa = (mesa = null) => {
    if (mesa) {
      formMesa.value = { ...mesa }
    } else {
      formMesa.value = { id: null, nombre: '', zona: '' }
    }
    showDialogMesa.value = true
  }

  const guardarMesa = async () => {
    if(!formMesa.value.nombre) return

    try {
      if (formMesa.value.id) {
        await api.put(`/api/restaurante/admin/mesas/${formMesa.value.id}`, formMesa.value)
        $q.notify({ message: 'Mesa actualizada', color: 'positive', icon: 'check' })
      } else {
        await api.post('/api/restaurante/admin/mesas', formMesa.value)
        $q.notify({ message: 'Mesa creada', color: 'positive', icon: 'check' })
      }
      showDialogMesa.value = false
      cargarMesas()
    } catch (e) {
      $q.notify({ message: 'Error al guardar', color: 'negative' })
    }
  }

  const borrarMesa = (mesa) => {
    $q.dialog({
      title: 'Eliminar Mesa',
      message: `¿Estás seguro de eliminar "${mesa.nombre}"?`,
      cancel: true,
      persistent: true
    }).onOk(async () => {
      try {
        await api.delete(`/api/restaurante/admin/mesas/${mesa.id}`)
        $q.notify({ message: 'Eliminada correctamente', color: 'positive' })
        cargarMesas()
      } catch (e) {
        $q.notify({ message: 'No se puede eliminar (posiblemente ocupada)', color: 'negative' })
      }
    })
  }

  // --- LÓGICA CATEGORÍAS ---
  const categorias = ref([])
  const loadingCats = ref(false)

  const cargarCategorias = async () => {
    loadingCats.value = true
    try {
      const { data } = await api.get('/api/restaurante/admin/categorias')
      categorias.value = data
    } finally {
      loadingCats.value = false
    }
  }

  const toggleCat = async (cat) => {
    try {
      await api.put(`/api/restaurante/admin/categorias/${cat.id}`, { en_restaurante: cat.en_restaurante })
      // No notificamos para que sea fluido, solo si hay error
    } catch (e) {
      cat.en_restaurante = !cat.en_restaurante // Revertir visualmente
      $q.notify({ message: 'Error actualizando categoría', color: 'negative' })
    }
  }

  onMounted(() => {
    cargarMesas()
    cargarCategorias()
  })
</script>

<style scoped>
  .border-light {
    border: 1px solid #e0e0e0;
  }
</style>
