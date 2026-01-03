<template>
  <q-page padding class="bg-grey-2">
    <div class="row q-col-gutter-lg">
      <div class="col-12 col-md-3">
        <q-card flat bordered class="rounded-borders shadow-1">
          <q-card-section class="bg-primary text-white text-bold">
            <q-icon name="settings" class="q-mr-sm" /> Conceptos de Catálogos
          </q-card-section>
          <q-tabs
            v-model="tab"
            vertical
            active-color="primary"
            active-bg-color="blue-1"
            class="text-grey-7"
            indicator-color="primary"
          >
            <q-tab name="categorias" icon="category" label="Categorías" class="q-py-md" />
            <q-tab name="impuestos" icon="percent" label="Impuestos" class="q-py-md" />
            <q-tab name="medidas" icon="straighten" label="Unidades" class="q-py-md" />
          </q-tabs>
        </q-card>
      </div>

      <div class="col-12 col-md-9">
        <q-tab-panels v-model="tab" animated transition-prev="fade" transition-next="fade" class="bg-transparent">

          <q-tab-panel name="categorias" class="q-pa-none">
            <div class="row q-col-gutter-md q-mb-md">
              <div class="col-12">
                <q-card flat bordered class="shadow-1">
                  <q-table
                    title="Categorías de Productos"
                    :rows="categorias"
                    :columns="colsCategorias"
                    flat
                    :loading="loading"
                    :filter="filtroCategoria"
                  >
                    <template v-slot:top-right>
                        <q-input
                          v-model="filtroCategoria"
                          placeholder="Buscar categoría..."
                          outlined dense clearable
                          class="q-mr-sm custom-focus"
                          style="width: 250px"
                        >
                          <template v-slot:append>
                            <q-icon name="search" />
                          </template>
                        </q-input>
                      <q-btn color="primary" icon="add" label="Nueva Categoría" rounded @click="abrirDialogo('categoria')" />
                    </template>
                    <template v-slot:body-cell-acciones="props">
                      <q-td :props="props" class="q-gutter-xs">
                        <q-btn flat round dense color="primary" icon="edit" @click="editarItem('categoria', props.row)" />
                        <q-btn flat round dense color="negative" icon="delete" @click="borrarItem('categoria', props.row)" />
                      </q-td>
                    </template>
                  </q-table>
                </q-card>
              </div>
            </div>
          </q-tab-panel>

          <q-tab-panel name="impuestos" class="q-pa-none">
             <q-card flat bordered class="shadow-1">
                  <q-table
                    title="Gestión de Impuestos"
                    :rows="impuestos"
                    :columns="colsImpuestos"
                    flat
                    :loading="loading"
                    :filter="filtroImpuesto"
                  >
                    <template v-slot:top-right>
                      <q-input
                          v-model="filtroImpuesto"
                          placeholder="Buscar impuesto..."
                          outlined dense clearable
                          class="q-mr-sm custom-focus"
                          style="width: 250px"
                        >
                          <template v-slot:append>
                            <q-icon name="search" />
                          </template>
                        </q-input>
                      <q-btn color="primary" icon="add" label="Nuevo Impuesto" rounded @click="abrirDialogo('impuesto')" />
                    </template>
                    <template v-slot:body-cell-porcentaje="props">
                      <q-td :props="props">
                        <q-chip outline color="secondary" text-color="secondary" class="text-bold">
                          {{ props.value }}%
                        </q-chip>
                      </q-td>
                    </template>
                    <template v-slot:body-cell-acciones="props">
                      <q-td :props="props" class="q-gutter-xs">
                        <q-btn flat round dense color="primary" icon="edit" @click="editarItem('impuesto', props.row)" />
                        <q-btn flat round dense color="negative" icon="delete" @click="borrarItem('impuesto', props.row)" />
                      </q-td>
                    </template>
                  </q-table>
                </q-card>
          </q-tab-panel>

          <q-tab-panel name="medidas" class="q-pa-none">
            <q-card flat bordered class="shadow-1">
              <q-table
                title="Catálogo de Unidades SAT"
                :rows="medidas"
                :columns="colsMedidas"
                flat
                :loading="loading"
                :filter="filtroMedida"
                row-key="id"
                class="rounded-borders"
              >
                <template v-slot:top-right>
                  <q-input
                    v-model="filtroMedida"
                    placeholder="Buscar clave o nombre..."
                    outlined dense clearable
                    class="q-mr-sm custom-focus"
                    style="width: 280px"
                  >
                    <template v-slot:append>
                      <q-icon name="search" />
                    </template>
                  </q-input>
                  <q-btn
                    color="primary"
                    icon="add"
                    label="Nueva Unidad"
                    rounded
                    unelevated
                    @click="abrirDialogo('medidas')"
                  />
                </template>

                <template v-slot:body-cell-c_ClaveUnidad="props">
                  <q-td :props="props">
                    <q-badge color="blue-grey-1" text-color="blue-grey-9" class="text-weight-bold q-pa-xs">
                      {{ props.value }}
                    </q-badge>
                  </q-td>
                </template>

                <template v-slot:body-cell-acciones="props">
                  <q-td :props="props" class="q-gutter-xs text-center">
                    <q-btn
                      flat round dense
                      color="primary"
                      icon="edit"
                      @click="editarItem('medidas', props.row)"
                    >
                      <q-tooltip>Editar Unidad</q-tooltip>
                    </q-btn>
                    <q-btn
                      flat round dense
                      color="negative"
                      icon="delete"
                      @click="borrarItem('medidas', props.row)"
                    >
                      <q-tooltip>Eliminar Unidad</q-tooltip>
                    </q-btn>
                  </q-td>
                </template>

                <template v-slot:no-data="{ icon, message }">
                  <div class="full-width row flex-center text-grey-7 q-gutter-sm q-pa-lg">
                    <q-icon size="2em" :name="icon" />
                    <span>{{ message }}</span>
                  </div>
                </template>
              </q-table>
            </q-card>
          </q-tab-panel>

        </q-tab-panels>
      </div>
    </div>

    <q-dialog v-model="dialogo" persistent>
      <q-card style="width: 450px" class="rounded-borders">
        <q-card-section :class="esEdicion ? 'bg-orange text-white' : 'bg-primary text-white'">
          <div class="text-h6">{{ esEdicion ? 'Editar' : 'Registrar' }} {{ tipoCatalogo }}</div>
        </q-card-section>

        <q-card-section class="q-pa-lg q-gutter-md">
          <q-input
            autofocus
            v-model="form.nombre"
            label="Nombre *"
            outlined dense
            class="custom-focus"
            :rules="[val => !!val || 'Requerido']"
          />

          <q-input
            v-if="tab === 'categorias'"
            v-model="form.descripcion"
            type="textarea"
            label="Descripción"
            outlined dense rows="3"
            class="custom-focus"
          />

          <div v-if="tab === 'impuestos'" class="row q-col-gutter-sm">
            <q-input
              v-model.number="form.porcentaje"
              type="number"
              label="Porcentaje % *"
              outlined dense class="col-6 custom-focus"
            />
            <q-select
              v-model="form.tipo"
              :options="['Traslado', 'Retención']"
              label="Tipo *"
              outlined dense class="col-6 custom-focus"
            />
          </div>

            <div v-if="tab === 'medidas'" class="row q-col-gutter-sm">
              <q-input
                v-model="form.c_ClaveUnidad"
                label="Clave SAT (ej. H87) *"
                maxlength="3"
                outlined dense
                class="col-4 custom-focus"
                hint="Código oficial del SAT"
                :rules="[val => !!val || 'Requerido']"
              />
              <q-input
                v-model="form.nombre"
                label="Nombre de la Unidad *"
                outlined dense
                class="col-8 custom-focus"
                :rules="[val => !!val || 'Requerido']"
              />
            </div>

        </q-card-section>

        <q-card-actions align="right" class="q-pb-md q-px-md">
          <q-btn flat label="Cancelar" color="grey" v-close-popup />
          <q-btn color="primary" :label="esEdicion ? 'Actualizar' : 'Guardar'" @click="guardar" :loading="guardando" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
  import { ref, onMounted, watch } from 'vue'
  import { api } from 'src/boot/axios'
  import { useQuasar } from 'quasar'

  const $q = useQuasar()
  const tab = ref('categorias')
  const loading = ref(false)
  const dialogo = ref(false)
  const esEdicion = ref(false)
  const guardando = ref(false)

  const categorias = ref([])
  const impuestos = ref([])
  const medidas = ref([])
  const form = ref({ id: null, nombre: '', descripcion: '', porcentaje: 0, tipo: 'Traslado' })

  const filtroCategoria = ref('')
  const filtroImpuesto = ref('')
  const filtroMedida = ref('')

  const tipoCatalogo = ref('')

  // Columnas
  const colsCategorias = [
    { name: 'nombre', label: 'Categoría', field: 'nombre', align: 'left', sortable: true },
    { name: 'descripcion', label: 'Descripción', field: 'descripcion', align: 'left' },
    { name: 'acciones', label: 'Acciones', align: 'center' }
  ]

  const colsImpuestos = [
    { name: 'nombre', label: 'Impuesto', field: 'nombre', align: 'left' },
    { name: 'porcentaje', label: '%', field: 'porcentaje', align: 'center' },
    { name: 'tipo', label: 'Tipo', field: 'tipo', align: 'center' },
    { name: 'acciones', label: 'Acciones', align: 'center' }
  ]

  const colsMedidas = [
    { name: 'c_ClaveUnidad', label: 'Clave SAT', field: 'c_ClaveUnidad', align: 'left', sortable: true },
    { name: 'nombre', label: 'Descripción', field: 'nombre', align: 'left', sortable: true },
    { name: 'acciones', label: 'Acciones', align: 'center' }
  ];

  // Lógica de carga
  const cargarDatos = async () => {
    loading.value = true
    try {
      const resCat = await api.get('/api/catalogos/categorias')
      const resImp = await api.get('/api/catalogos/impuestos')
      const resMed = await api.get('/api/catalogos/medidas')
      categorias.value = resCat.data
      impuestos.value = resImp.data
      medidas.value = resMed.data
    } finally { loading.value = false }
  }

  const borrarItem = (tipo, item) => {
    $q.dialog({
      title: 'Confirmar eliminación',
      message: `¿Deseas eliminar ${item.nombre}? Esta acción no se puede deshacer.`,
      cancel: true, color: 'negative'
    }).onOk(async () => {
      try {
        await api.delete(`/api/catalogos/${tipo}/${item.id}`)
        $q.notify({ color: 'positive', message: 'Eliminado correctamente' })
        cargarDatos()
      } catch (e) {
        $q.notify({ color: 'negative', message: e.response?.data?.error || 'Error al eliminar' })
      }
    })
  }

  const abrirDialogo = (tipo) => {
    esEdicion.value = false
    tipoCatalogo.value = tipo === 'categoria' ? 'Categoría' : 'Impuesto'

    // Reseteamos el formulario a valores limpios según las tablas
    form.value = {
      id: null,
      nombre: '',
      descripcion: '', // Para Categorías
      porcentaje: 0,   // Para Impuestos
      tipo: 'Traslado' // Para Impuestos
    }

    dialogo.value = true
  }

  const editarItem = (tipo, item) => {
    esEdicion.value = true
    tipoCatalogo.value = tipo === 'categoria' ? 'Categoría' : 'Impuesto'

    // Clonamos el objeto para no modificar la tabla directamente antes de guardar
    form.value = { ...item }
    dialogo.value = true
  }

  const guardar = async () => {
    // Validación básica manual antes de enviar
    if (!form.value.nombre) {
      $q.notify({ color: 'warning', message: 'El nombre es obligatorio' })
      return
    }

    guardando.value = true

    // Determinamos el endpoint basado en la pestaña activa
    // Si tab.value es 'categorias', el endpoint será /api/catalogos/categorias
    const endpointBase = `/api/catalogos/${tab.value}`

    try {
      if (esEdicion.value) {
        // Actualización (PUT)
        await api.put(`${endpointBase}/${form.value.id}`, form.value)
        $q.notify({ color: 'positive', message: `${tipoCatalogo.value} actualizada correctamente`, icon: 'edit' })
      } else {
        // Creación (POST)
        await api.post(endpointBase, form.value)
        $q.notify({ color: 'positive', message: `${tipoCatalogo.value} creada con éxito`, icon: 'check' })
      }

      dialogo.value = false // Cerramos el modal
      await cargarDatos()   // Recargamos la lista
    } catch (error) {
      console.error(error)
      const errorMsg = error.response?.data?.message || `Error al procesar la ${tipoCatalogo.value}`
      $q.notify({ color: 'negative', message: errorMsg, icon: 'report_problem' })
    } finally {
      guardando.value = false
    }
  }

  onMounted(cargarDatos)
</script>

<style lang="scss" scoped>
  .custom-focus.q-field--focused .q-field__control {
    background: rgba(142, 0, 0, 0.03) !important;
  }
</style>
