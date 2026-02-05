<template>
  <q-dialog v-model="show" @show="onDialogOpen" persistent>
    <q-card style="width: 1000px; max-width: 95vw;" class="border-radius-20 bg-grey-1 overflow-hidden shadow-24">

      <q-card-section class="bg-primary text-white row items-center q-py-lg">
        <q-avatar icon="inventory_2" color="white" text-color="primary" shadow-5 />
        <div class="q-ml-md">
          <div class="text-h6 text-bold">{{ isEdit ? 'Editar Producto' : 'Nuevo Registro de Producto' }}</div>
          <div class="text-caption opacity-70">{{ isEdit ? 'Editando: ' + form.nombre : 'Complete los datos para integrar al catálogo' }}</div>
        </div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>

      <q-tabs
        v-model="tab"
        class="bg-white text-primary"
        active-color="primary"
        indicator-color="primary"
        align="left"
        inline-label
      >
        <q-tab name="general" icon="info" label="Información General" />
        <q-tab name="precios" icon="payments" label="Precios e Impuestos" />
        <q-tab name="kit" icon="account_tree" label="Configuración de Kit" v-if="form.tipo_producto === 'Compuesto'" />
      </q-tabs>

      <q-separator />

      <q-form @submit="handleSubmit">
        <q-tab-panels v-model="tab" animated class="bg-grey-1">

          <q-tab-panel name="general" class="q-pa-lg">
            <div class="row q-col-gutter-lg">
              <div class="col-12 text-subtitle2 text-bold text-grey-8 row items-center">
                <q-icon name="fingerprint" color="primary" class="q-mr-xs" /> Identidad del Producto
              </div>
              <div class="col-lg-8 col-md-12">
                <q-input
                  v-bind="inputProps"
                  v-model="form.nombre"
                  label="Nombre*"
                  ref="refGeneral"
                  uppercase
                  lazy-rules
                  @update:model-value="val => (form.nombre = val.toUpperCase())"
                  :rules="[val => !!val || 'El nombre es requerido']" />
              </div>
              <div class="col-lg-4 col-md-12">
                  <q-item tag="label" v-ripple class="border-radius-10 bg-blue-1">
                  <q-item-section>
                    <q-item-label class="text-bold text-primary">Estado del Producto</q-item-label>
                    <q-item-label caption>{{ form.status ? 'Activo' : 'Desactivado' }}</q-item-label>
                  </q-item-section>
                  <q-item-section side>
                    <q-toggle :disable="!auth.can('productos.desactivar')" v-model="form.status" :true-value="true" :false-value="false" color="primary" />
                  </q-item-section>
                </q-item>
              </div>
              <div class="col-12 col-md-6">
                <q-input v-bind="inputProps" v-model="form.codigo_barras" label="Código de Barras *" lazt-rules :rules="[val => !!val || 'El código de barras es requerido']">
                  <template v-slot:prepend><q-icon name="qr_code_scanner" /></template>
                </q-input>
              </div>
              <div class="col-12 col-md-6">
                <q-select
                  v-bind="inputProps"
                  v-model="form.categoria_id"
                  :options="filteredCategorias"
                  label="Categoría *"
                  emit-value map-options use-input
                  @filter="filterCategorias"
                  :rules="[val => !!val || 'Seleccione una categoría']"
                >
                  <template v-slot:after>
                    <q-btn round dense flat color="primary" icon="add_circle" @click="showCatDialog = true">
                      <q-tooltip>Nueva Categoría</q-tooltip>
                    </q-btn>
                  </template>
                </q-select>
              </div>

              <div class="col-12 text-subtitle2 text-bold text-grey-8 q-mt-md row items-center">
                <q-icon name="gavel" color="primary" class="q-mr-xs" /> Especificaciones Fiscales (SAT)
              </div>
              <div class="col-12 col-md-4">
                <q-input
                  v-bind="inputProps"
                  v-model="form.clave_prod_serv"
                  label="Clave SAT *"
                  mask="########"
                  :loading="buscandoSat"
                  debounce="500"
                  @update:model-value="buscarDescripcionSat"
                  :rules="[
                    val => val?.length === 8 || 'Debe tener 8 dígitos',
                    val => !!satDescripcion || 'Clave no encontrada en catálogo SAT'
                  ]"
                  >
                    <template v-slot:hint>
                      <span v-if="satDescripcion" class="text-positive text-bold text-caption">
                        <q-icon name="check_circle" /> {{ satDescripcion }}
                      </span>
                      <span v-else class="text-grey-6 text-caption">
                        Ingrese los 8 dígitos para validar
                      </span>
                    </template>
                  </q-input>
              </div>
              <div class="col-12 col-md-4">
                <q-select
                  v-bind="inputProps"
                  v-model="form.clave_unidad"
                  :options="filteredUnidades"
                  label="Unidad SAT *"
                  option-label="label_completo"
                  option-value="c_ClaveUnidad"
                  emit-value map-options use-input
                  @filter="filterUnidades"
                  :rules="[val => !!val || 'Requerido']"
                />
              </div>
              <div class="col-12 col-md-4">
                <q-select v-bind="inputProps" v-model="form.tipo_producto" :options="['Inventariable', 'Compuesto', 'Servicio']" label="Naturaleza del Producto" bg-color="blue-1" />
              </div>
            </div>
          </q-tab-panel>

          <q-tab-panel name="precios" class="q-pa-lg">
            <q-card flat bordered class="q-mb-xl border-radius-10 bg-white shadow-1">
              <q-card-section class="bg-blue-grey-1 q-py-sm row items-center">
                <q-icon name="receipt_long" color="primary" size="xs" class="q-mr-sm" />
                <div class="text-bold text-primary">Esquema Fiscal Aplicable</div>
              </q-card-section>
              <q-card-section>
                <q-select
                  v-bind="inputProps"
                  v-model="form.impuestos"
                  :options="impuestosOptions"
                  multiple use-chips stack-label emit-value map-options
                  label="Seleccione Impuestos (IVA, IEPS, Retenciones)"
                  :rules="[
                    val => (val && val.length > 0) || 'Debe asignar al menos un impuesto',
                    val => validarUnSoloIVA(val) || 'No se permiten dos tipos de IVA (ej. 16% y 0% simultáneos)'
                  ]"
                >
                  <template v-slot:selected-item="scope">
                    <q-chip removable dense color="primary" text-color="white" @remove="scope.removeAtIndex(scope.index)">
                      {{ scope.opt.label }}
                    </q-chip>
                  </template>
                </q-select>
              </q-card-section>
            </q-card>

            <div class="row items-center q-mb-md">
              <div class="text-subtitle1 text-bold text-grey-8 row items-center">
                <q-icon name="list_alt" color="primary" class="q-mr-xs" /> Estructura de Precios
              </div>
              <q-space />
              <q-btn outline dense color="primary" icon="add" label="Añadir Precio" class="q-px-md border-radius-10 bg-white" @click="addPriceList" />
            </div>

            <div v-for="(p, index) in form.precios" :key="index" class="row q-col-gutter-md q-mb-sm items-start">
              <div class="col-12 col-md-5">
                <q-select v-bind="inputProps" v-model="p.nombre_lista" :options="listasSugeridas" label="Nivel" :disable="p.nombre_lista === 'PRECIO PUBLICO' && isEdit" />
              </div>
              <div class="col-12 col-md-5">
                <q-input v-bind="inputProps" v-model.number="p.precio" label="Precio Final" type="number" step="0.01" prefix="$" @blur="p.precio = parseFloat(p.precio || 0).toFixed(2)">
                  <template v-slot:prepend><q-icon name="attach_money" color="green-8" /></template>
                </q-input>
              </div>
              <div class="col-12 col-md-2 text-center">
                <q-btn v-if="p.nombre_lista !== 'PRECIO PUBLICO'" icon="delete" color="negative" flat round @click="removePriceList(index)" />
              </div>
            </div>
          </q-tab-panel>

          <q-tab-panel name="kit" class="q-pa-lg">
            <q-select
              v-bind="inputProps"
              v-model="selectedHijo"
              use-input hide-selected fill-input
              input-debounce="300"
              label="Buscar componentes por nombre o c{odigo de barras}..."
              :options="searchOptions"
              option-label="nombre"
              @filter="filterProducts"
              @update:model-value="addComponent"
              ref="refKitSearch"
            >
              <template v-slot:option="scope">
                <q-item v-bind="scope.itemProps">
                  <q-item-section avatar><q-icon name="inventory_2" color="primary" /></q-item-section>
                  <q-item-section>
                    <q-item-label>{{ scope.opt.nombre }}</q-item-label>
                    <q-item-label caption>Código: {{ scope.opt.codigo_barras }}</q-item-label>
                  </q-item-section>
                </q-item>
              </template>
            </q-select>

            <q-markup-table flat bordered class="border-radius-10 q-mt-md overflow-hidden shadow-2">
              <thead class="bg-blue-grey-1">
                <tr>
                  <th class="text-left">CODIGO</th>
                  <th class="text-left">PRODUCTO HIJO</th>
                  <th class="text-center" style="width: 150px;">CANTIDAD</th>
                  <th class="text-center">ACCIONES</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(hijo, index) in form.componentes" :key="hijo.id">
                  <td class="text-bold">{{ hijo.codigo_barras }}</td>
                  <td>{{ hijo.nombre }}</td>
                  <td><q-input v-bind="inputProps" v-model.number="hijo.cantidad" type="number" input-class="text-center" class="q-mb-none" @blur="hijo.cantidad = Number(parseFloat(hijo.cantidad || 0).toFixed(6))" /></td>
                  <td class="text-center"><q-btn flat round color="negative" icon="delete" size="sm" @click="form.componentes.splice(index, 1)" /></td>
                </tr>
              </tbody>
            </q-markup-table>
          </q-tab-panel>
        </q-tab-panels>

        <q-separator />

        <q-card-actions align="right" class="q-pa-lg bg-white">
          <q-btn label="Cancelar" flat color="grey-7" v-close-popup class="q-px-md" />
          <q-btn :label="isEdit ? 'Actualizar Producto' : 'Registrar Producto'" color="primary" type="submit" :loading="loading" icon="save" size="lg" unelevated class="q-px-xl border-radius-10" />
        </q-card-actions>
      </q-form>
    </q-card>

    <q-dialog v-model="showCatDialog" persistent>
      <q-card style="min-width: 350px; border-radius: 15px;">
        <q-card-section class="bg-primary text-white"><div class="text-h6">Nueva Categoría</div></q-card-section>
        <q-card-section class="q-pt-md">
          <q-input v-model="quickCatName" label="Nombre de categoría" outlined dense autofocus @keyup.enter="saveQuickCategory" />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancelar" color="grey" v-close-popup />
          <q-btn label="Guardar" color="primary" @click="saveQuickCategory" :loading="catLoading" />
        </q-card-actions>
      </q-card>
    </q-dialog>

  </q-dialog>
</template>

<script setup>
  import { ref, reactive, computed, nextTick, onMounted } from 'vue'
  import { api } from 'boot/axios'
  import { useQuasar } from 'quasar'
  import { useAuthStore } from 'src/stores/auth'


  const props = defineProps({ modelValue: Boolean, editData: Object })
  const emit = defineEmits(['update:modelValue', 'saved'])
  const $q = useQuasar()
  const auth = useAuthStore()

  const tab = ref('general')
  const loading = ref(false)
  const catLoading = ref(false)
  const showCatDialog = ref(false)
  const quickCatName = ref('')

  const refGeneral = ref(null)
  const refKitSearch = ref(null)
  const selectedHijo = ref(null)
  const searchOptions = ref([])
  const categorias = ref([])
  const filteredCategorias = ref([])
  const impuestosOptions = ref([])
  const unidadesOptions = ref([])
  const filteredUnidades = ref([])
  const listasSugeridas = ['PRECIO PUBLICO', 'PRECIO MAYOREO', 'PRECIO VIP', 'PRECIO ESPECIAL']

  const inputProps = { outlined: true, dense: true, 'stack-label': true, standout: 'bg-blue-1', class: 'q-mb-sm' }
  const isEdit = computed(() => !!props.editData)
  const show = computed({ get: () => props.modelValue, set: (val) => emit('update:modelValue', val) })

  const satDescripcion = ref('')
  const buscandoSat = ref(false)

  const buscarDescripcionSat = async (val) => {
    // Solo buscamos si tiene 8 dígitos para no saturar
    if (!val || val.length !== 8) {
      satDescripcion.value = ''
      return
    }

    buscandoSat.value = true
    try {
      const { data } = await api.get(`/api/catalogos/claves-sat/producto/${val}`)
      satDescripcion.value = data.descripcion
    } catch (e) {
      satDescripcion.value = '' // No encontrado o error
    } finally {
      buscandoSat.value = false
    }
  }

  const form = reactive({
    nombre: '',
    status: true,
    codigo_barras: '',
    categoria_id: null,
    tipo_producto: 'Inventariable',
    clave_prod_serv: '',
    clave_unidad: '',
    objeto_imp: '02',
    ultimo_costo_compra: 0,
    precios: [{ nombre_lista: 'PRECIO PUBLICO', precio: 0, utilidad_porcentaje: 0 }],
    componentes: [],
    impuestos: []
  })

  // --- VALIDACIÓN FISCAL: SOLO UN IVA ---
  const validarUnSoloIVA = (seleccionados) => {
    if (!seleccionados || seleccionados.length === 0) return true
    const conteoIVA = impuestosOptions.value.filter(opt =>
      seleccionados.includes(opt.value) && opt.label.toUpperCase().includes('IVA')
    ).length
    return conteoIVA <= 1
  }

  // --- FILTROS Y BÚSQUEDAS ---
  const filterCategorias = (val, update) => {
    update(() => {
      const needle = val.toLowerCase()
      filteredCategorias.value = categorias.value.filter(v => v.label.toLowerCase().includes(needle))
    })
  }

  const filterUnidades = (val, update) => {
    update(() => {
      const needle = val.toLowerCase()
      filteredUnidades.value = unidadesOptions.value.filter(v =>
        v.label_completo.toLowerCase().includes(needle)
      ).slice(0, 50)
    })
  }

  const filterProducts = async (val, update, abort) => {
    if (val.length < 2) { abort(); return }
    const { data } = await api.get('/api/inventario/buscar-filtro', { params: { q: val } })
    update(() => { searchOptions.value = data })
  }

  const addComponent = (prod) => {
    if (!prod || form.componentes.some(c => c.id === prod.id)) return
    form.componentes.push({ id: prod.id, nombre: prod.nombre, codigo_barras: prod.codigo_barras, cantidad: 1 })
    selectedHijo.value = null
    nextTick(() => {
      refKitSearch.value?.updateInputValue('')
      refKitSearch.value?.focus()
    })
  }

  // --- CATEGORÍA RÁPIDA ---
  const saveQuickCategory = async () => {
    if (!quickCatName.value) return
    catLoading.value = true
    try {
      const res = await api.post('/api/catalogos/categorias', { nombre: quickCatName.value.toUpperCase() })
      await loadCategorias()
      form.categoria_id = res.data.id
      showCatDialog.value = false
      quickCatName.value = ''
    } finally { catLoading.value = false }
  }

  // --- GESTIÓN DE PRECIOS ---
  const addPriceList = () => form.precios.push({ nombre_lista: '', precio: 0, utilidad_porcentaje: 0 })
  const removePriceList = (i) => form.precios.splice(i, 1)

  // --- CARGA DE DATOS ---
  const loadCategorias = async () => {
    const res = await api.get('/api/catalogos/categorias')
    categorias.value = res.data.map(c => ({ label: c.nombre.toUpperCase(), value: c.id }))
      .sort((a,b) => a.label.localeCompare(b.label))
    filteredCategorias.value = [...categorias.value]
  }

  const loadUnidades = async () => {
    const res = await api.get('/api/catalogos/medidas')
    unidadesOptions.value = res.data.map(u => ({ ...u, label_completo: `${u.c_ClaveUnidad} - ${u.nombre}` }))
    filteredUnidades.value = unidadesOptions.value.slice(0, 50)
  }

  const loadImpuestos = async () => {
    const res = await api.get('/api/catalogos/impuestos')
    impuestosOptions.value = res.data.map(i => ({ label: `${i.nombre} (${i.porcentaje}%)`, value: i.id }))
  }

  const onDialogOpen = async () => {
    tab.value = 'general'
    if (isEdit.value) {
      loading.value = true
      try {
        const res = await api.get(`/api/productos/${props.editData.id}`)
        const data = res.data

        if (data.precios) {
          data.precios = data.precios.map(p => ({
            ...p,
            precio: parseFloat(p.precio).toFixed(2),
            utilidad_porcentaje: parseFloat(p.utilidad_porcentaje || 0).toFixed(2)
          }))
        }


        if (data.impuestos) data.impuestos = data.impuestos.map(i => i.id)

       if (data.componentes) {
          data.componentes = data.componentes.map(h => {
            // 1. Extraemos la cantidad: primero del pivot, luego de la propiedad directa, o 1 por defecto
            const valorOriginal = h.pivot ? h.pivot.cantidad : (h.cantidad || 1);

            return {
              ...h,
              // 2. Limpiamos decimales: Number(parseFloat(...)) elimina ceros a la derecha
              // Ejemplo: "1.0000" -> 1 | "1.5000" -> 1.5
              cantidad: Number(parseFloat(valorOriginal))
            }
          })
        }
        Object.assign(form, data)

        if(form.clave_prod_serv) {
          buscarDescripcionSat(form.clave_prod_serv)
        }

      } finally { loading.value = false }
    } else {
      resetForm()
      satDescripcion.value = ''
    }
    nextTick(() => refGeneral.value?.focus())
  }

  const handleSubmit = async () => {
    if (!form.nombre || !form.categoria_id || !form.clave_unidad) {
      $q.notify({
        color: 'negative',
        message: 'Faltan datos obligatorios en la pestaña de Información General',
        icon: 'warning'
      })
      tab.value = 'general' // Regresamos al usuario a la pestaña donde está el error
      return
    }
    loading.value = true
    try {
      const url = isEdit.value ? `/api/productos/${props.editData.id}` : '/api/productos'
      await api[isEdit.value ? 'put' : 'post'](url, { ...form })
      $q.notify({ color: 'positive', message: 'Producto guardado con éxito', icon: 'check_circle' })
      emit('saved'); show.value = false
    } catch (e) {
      $q.notify({ color: 'negative', message: e.response?.data?.message || 'Error al guardar', icon: 'warning' })
    } finally { loading.value = false }
  }

  const resetForm = () => {
    Object.assign(form, {
                    nombre: '',
                    status: true,
                    codigo_barras: '',
                    categoria_id: null,
                    tipo_producto: 'Inventariable',
                    clave_prod_serv: '',
                    clave_unidad: '',
                    objeto_imp: '02',
                    ultimo_costo_compra: 0,
                    precios: [{ nombre_lista: 'PRECIO PUBLICO', precio: 0, utilidad_porcentaje: 0 }],
                    componentes: [],
                    impuestos: []
                  })
  }

  onMounted(() => { loadCategorias(); loadImpuestos(); loadUnidades(); })
</script>

<style scoped>
  .border-radius-20 { border-radius: 20px; }
  .border-radius-10 { border-radius: 10px; }
  .opacity-70 { opacity: 0.7; }
</style>
