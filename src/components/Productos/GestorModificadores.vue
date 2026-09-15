<template>
  <q-dialog v-model="isOpen" persistent maximized transition-show="slide-up" transition-hide="slide-down">
    <q-card class="bg-grey-2 column no-wrap">
      <q-toolbar class="bg-primary text-white shadow-2">
        <q-icon name="tune" size="sm" class="q-mr-sm" />
        <q-toolbar-title>
          Gestionar Modificadores
          <span class="text-caption q-ml-sm text-yellow-3" v-if="producto">
            ({{ producto.nombre }})
          </span>
        </q-toolbar-title>
        <q-btn flat round dense icon="close" v-close-popup />
      </q-toolbar>

      <q-card-section class="col row q-col-gutter-md q-pa-md overflow-hidden">
        
        <!-- Columna Izquierda: Grupos Globales (CRUD) -->
        <div class="col-12 col-md-5 column full-height">
          <q-card class="col column shadow-2">
            <q-card-section class="row items-center q-pb-none">
              <div class="text-h6 text-primary">Grupos Globales</div>
              <q-space />
              <q-btn color="positive" icon="add" label="Nuevo Grupo" size="sm" @click="abrirFormGrupo(null)" />
            </q-card-section>
            
            <q-card-section class="col scroll q-pt-sm">
              <q-list separator>
                <q-item v-for="grupo in grupos" :key="grupo.id" class="q-py-sm">
                  <q-item-section>
                    <q-item-label class="text-bold">{{ grupo.nombre }}</q-item-label>
                    <q-item-label caption>
                      Tipo: {{ grupo.tipo }} | Opciones: {{ grupo.opciones?.length || 0 }}
                    </q-item-label>
                  </q-item-section>
                  <q-item-section side class="row no-wrap q-gutter-xs">
                    <q-btn flat round dense color="primary" icon="edit" size="sm" @click="abrirFormGrupo(grupo)" />
                    <q-btn flat round dense color="negative" icon="delete" size="sm" @click="eliminarGrupo(grupo.id)" />
                    <q-btn flat round dense color="teal" icon="chevron_right" size="sm" @click="verOpciones(grupo)">
                      <q-tooltip>Gestionar Opciones</q-tooltip>
                    </q-btn>
                  </q-item-section>
                </q-item>
              </q-list>
              <div v-if="grupos.length === 0" class="text-center q-pa-lg text-grey-6">
                No hay grupos configurados.
              </div>
            </q-card-section>
          </q-card>
        </div>

        <!-- Columna Derecha: Opciones del Grupo / Asignación al Producto -->
        <div class="col-12 col-md-7 column full-height q-gutter-y-md">
          
          <!-- Asignación al producto actual -->
          <q-card class="shadow-2" v-if="producto">
            <q-card-section class="bg-blue-grey-1 text-bold text-blue-grey-9 row items-center">
              Asignar grupos a este producto
              <q-space />
              <q-btn color="primary" icon="save" label="Guardar Asignaciones" size="sm" @click="guardarAsignaciones" :loading="saving" />
            </q-card-section>
            <q-card-section>
              <div class="row q-gutter-sm">
                <q-checkbox
                  v-for="g in grupos"
                  :key="'chk-'+g.id"
                  v-model="gruposAsignados"
                  :val="g.id"
                  :label="g.nombre"
                  color="teal"
                />
              </div>
            </q-card-section>
          </q-card>

          <!-- Opciones del Grupo Seleccionado -->
          <q-card class="col column shadow-2" v-if="grupoSeleccionado">
            <q-card-section class="row items-center bg-teal-1 q-pb-sm">
              <div class="text-subtitle1 text-teal-9 text-bold">Opciones de: {{ grupoSeleccionado.nombre }}</div>
              <q-space />
              <q-btn color="teal" icon="add" label="Nueva Opción" size="sm" @click="abrirFormOpcion(null)" />
            </q-card-section>
            
            <q-card-section class="col scroll">
               <q-table
                :rows="grupoSeleccionado.opciones"
                :columns="columnasOpciones"
                row-key="id"
                flat bordered dense
                :pagination="{ rowsPerPage: 10 }"
              >
                <template v-slot:body-cell-actions="props">
                  <q-td :props="props">
                    <q-btn flat round dense color="primary" icon="edit" size="sm" @click="abrirFormOpcion(props.row)" />
                    <q-btn flat round dense color="negative" icon="delete" size="sm" @click="eliminarOpcion(props.row.id)" />
                  </q-td>
                </template>
              </q-table>
            </q-card-section>
          </q-card>

          <div v-else class="col flex flex-center text-grey-5 border-dashed q-ma-sm" style="border: 2px dashed #ccc; border-radius: 10px;">
            Selecciona un grupo para ver o editar sus opciones.
          </div>

        </div>

      </q-card-section>
    </q-card>

    <!-- Modal Form Grupo -->
    <q-dialog v-model="dlgGrupo" persistent>
      <q-card style="min-width: 350px;">
        <q-card-section>
          <div class="text-h6">{{ formGrupo.id ? 'Editar Grupo' : 'Nuevo Grupo' }}</div>
        </q-card-section>
        <q-card-section class="q-gutter-y-md">
          <q-input v-model="formGrupo.nombre" label="Nombre (Ej: Elige tu Sabor)" outlined dense autofocus />
          <q-select 
            v-model="formGrupo.tipo" 
            :options="[{label:'Opción Única', value:'opcion_unica'}, {label:'Opción Múltiple', value:'opcion_multiple'}, {label:'Mitad y Mitad', value:'mitad_y_mitad'}]" 
            label="Tipo de Selección" outlined dense emit-value map-options 
          />
          <div class="row q-gutter-sm">
            <q-input v-model.number="formGrupo.min_selecciones" type="number" label="Mín." outlined dense class="col" />
            <q-input v-model.number="formGrupo.max_selecciones" type="number" label="Máx." outlined dense class="col" />
          </div>
        </q-card-section>
        <q-card-actions align="right" class="text-primary">
          <q-btn flat label="Cancelar" v-close-popup />
          <q-btn flat label="Guardar" @click="guardarGrupo" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Modal Form Opcion -->
    <q-dialog v-model="dlgOpcion" persistent>
      <q-card style="min-width: 450px;">
        <q-card-section>
          <div class="text-h6">{{ formOpcion.id ? 'Editar Opción' : 'Nueva Opción' }}</div>
        </q-card-section>
        <q-card-section class="q-gutter-y-md">
          <q-input v-model="formOpcion.nombre" label="Nombre (Ej: Extra Queso)" outlined dense autofocus />
          <q-input v-model.number="formOpcion.precio_adicional" type="number" step="0.01" label="Precio Adicional ($)" outlined dense />
          
          <q-select 
            v-model="formOpcion.producto_receta_id" 
            :options="productosCatalogo" 
            option-value="id" option-label="nombre"
            label="(Opcional) Heredar Receta de:" outlined dense emit-value map-options clearable
            hint="Ideal para opciones Mitad y Mitad (Ej: Receta Pizza Pepperoni)"
          />

          <q-select 
            v-model="formOpcion.ingrediente_id" 
            :options="productosCatalogo" 
            option-value="id" option-label="nombre"
            label="(Opcional) Descontar Ingrediente Específico:" outlined dense emit-value map-options clearable
          />
          
          <q-input v-if="formOpcion.ingrediente_id" v-model.number="formOpcion.cantidad_descuento" type="number" step="0.001" label="Cantidad a Descontar" outlined dense />

        </q-card-section>
        <q-card-actions align="right" class="text-primary">
          <q-btn flat label="Cancelar" v-close-popup />
          <q-btn flat label="Guardar" @click="guardarOpcion" />
        </q-card-actions>
      </q-card>
    </q-dialog>

  </q-dialog>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { api } from 'boot/axios'
import { useQuasar } from 'quasar'

const props = defineProps({ modelValue: Boolean, producto: Object })
const emit = defineEmits(['update:modelValue', 'saved'])
const $q = useQuasar()

const isOpen = ref(false)
const grupos = ref([])
const productosCatalogo = ref([])
const gruposAsignados = ref([])
const grupoSeleccionado = ref(null)
const saving = ref(false)

const dlgGrupo = ref(false)
const formGrupo = ref({ id: null, nombre: '', tipo: 'opcion_multiple', min_selecciones: 0, max_selecciones: 1 })

const dlgOpcion = ref(false)
const formOpcion = ref({ id: null, nombre: '', precio_adicional: 0, producto_receta_id: null, ingrediente_id: null, cantidad_descuento: 0 })

const columnasOpciones = [
  { name: 'nombre', label: 'Opción', field: 'nombre', align: 'left' },
  { name: 'precio', label: 'Precio Extra', field: row => `$${Number(row.precio_adicional).toFixed(2)}`, align: 'right' },
  { name: 'actions', label: '', align: 'right' }
]

watch(() => props.modelValue, (val) => {
  isOpen.value = val
  if (val) {
    cargarDatos()
  }
})

watch(isOpen, (val) => { emit('update:modelValue', val) })

const cargarDatos = async () => {
  try {
    const res = await api.get('/api/modificadores')
    grupos.value = res.data

    const resProd = await api.get('/api/productos')
    productosCatalogo.value = resProd.data

    if (props.producto) {
      gruposAsignados.value = props.producto.modificadores?.map(g => g.id) || []
    }
  } catch (error) {
    $q.notify({ color: 'negative', message: 'Error cargando datos' })
  }
}

const verOpciones = (grupo) => {
  grupoSeleccionado.value = grupo
}

const guardarAsignaciones = async () => {
  if (!props.producto) return
  saving.value = true
  try {
    await api.post(`/api/productos/${props.producto.id}/sync-modificadores`, {
      modificador_grupos: gruposAsignados.value
    })
    $q.notify({ color: 'positive', message: 'Asignaciones guardadas' })
    emit('saved')
  } catch (error) {
    $q.notify({ color: 'negative', message: 'Error guardando asignaciones' })
  } finally {
    saving.value = false
  }
}

const abrirFormGrupo = (g) => {
  if (g) formGrupo.value = { ...g }
  else formGrupo.value = { id: null, nombre: '', tipo: 'opcion_multiple', min_selecciones: 0, max_selecciones: 1 }
  dlgGrupo.value = true
}

const guardarGrupo = async () => {
  try {
    if (formGrupo.value.id) {
      await api.put(`/api/modificadores/${formGrupo.value.id}`, formGrupo.value)
    } else {
      await api.post('/api/modificadores', formGrupo.value)
    }
    dlgGrupo.value = false
    cargarDatos()
    $q.notify({ color: 'positive', message: 'Grupo guardado' })
  } catch (e) {
    $q.notify({ color: 'negative', message: 'Error guardando grupo' })
  }
}

const eliminarGrupo = async (id) => {
  $q.dialog({ title: 'Confirmar', message: '¿Eliminar este grupo?', cancel: true }).onOk(async () => {
    try {
      await api.delete(`/api/modificadores/${id}`)
      cargarDatos()
      if (grupoSeleccionado.value?.id === id) grupoSeleccionado.value = null
    } catch (e) {}
  })
}

const abrirFormOpcion = (op) => {
  if (op) formOpcion.value = { ...op }
  else formOpcion.value = { id: null, nombre: '', precio_adicional: 0, producto_receta_id: null, ingrediente_id: null, cantidad_descuento: 0 }
  dlgOpcion.value = true
}

const guardarOpcion = async () => {
  try {
    if (formOpcion.value.id) {
      await api.put(`/api/modificadores/opciones/${formOpcion.value.id}`, formOpcion.value)
    } else {
      await api.post(`/api/modificadores/${grupoSeleccionado.value.id}/opciones`, formOpcion.value)
    }
    dlgOpcion.value = false
    await cargarDatos()
    // Actualizar el grupo seleccionado actual
    grupoSeleccionado.value = grupos.value.find(g => g.id === grupoSeleccionado.value.id)
    $q.notify({ color: 'positive', message: 'Opción guardada' })
  } catch (e) {}
}

const eliminarOpcion = async (id) => {
  $q.dialog({ title: 'Confirmar', message: '¿Eliminar opción?', cancel: true }).onOk(async () => {
    try {
      await api.delete(`/api/modificadores/opciones/${id}`)
      await cargarDatos()
      grupoSeleccionado.value = grupos.value.find(g => g.id === grupoSeleccionado.value.id)
    } catch (e) {}
  })
}
</script>
