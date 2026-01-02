<template>
  <q-dialog v-model="show" @show="onDialogOpen" persistent>
    <q-card style="width: 900px; max-width: 95vw;" class="menu-radius shadow-24">
      <q-card-section class="bg-primary text-white row items-center q-py-md">
        <q-icon name="local_mall" size="sm" class="q-mr-md" />
        <div class="text-h6 text-bold">{{ isEdit ? 'Editar Producto: ' + form.nombre : 'Nuevo Producto' }}</div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>

      <q-tabs v-model="tab" class="text-primary bg-grey-1" active-color="primary" indicator-color="primary" align="justify">
        <q-tab name="general" icon="info" label="General / SAT" />
        <q-tab name="precios" icon="sell" label="Precios e Impuestos" />
        <q-tab name="kit" icon="account_tree" label="Compuesto (Kit)" v-if="form.tipo_producto === 'Compuesto'" />
      </q-tabs>

      <q-form @submit="handleSubmit">
        <q-tab-panels v-model="tab" animated class="q-pa-md">

          <q-tab-panel name="general" class="q-gutter-y-md">
            <div class="row q-col-gutter-md">
              <q-input v-bind="inputProps" v-model="form.nombre" label="Nombre del Producto *" class="col-12" ref="refGeneral" :rules="[val => !!val || 'Requerido']" />
              <q-input v-bind="inputProps" v-model="form.codigo_barras" label="Código de Barras" class="col-12 col-md-6" />
              <q-select
                  v-bind="inputProps"
                  v-model="form.categoria_id"
                  :options="categorias"
                  label="Categoría *"
                  class="col-12 col-md-6"
                  emit-value
                  map-options
                  :rules="[val => !!val || 'La categoría es obligatoria']"
                >
                  <template v-slot:after>
                    <q-btn
                      round
                      dense
                      flat
                      color="primary"
                      icon="add_circle"
                      @click="showCatDialog = true"
                    >
                      <q-tooltip>Crear nueva categoría</q-tooltip>
                    </q-btn>
                  </template>
                </q-select>

                <q-dialog v-model="showCatDialog" persistent transition-show="scale" transition-hide="scale">
                  <q-card style="width: 400px; border-radius: 15px;">
                    <q-card-section class="bg-primary text-white row items-center q-py-sm">
                      <q-icon name="category" class="q-mr-sm" />
                      <div class="text-bold">Nueva Categoría</div>
                      <q-space />
                      <q-btn icon="close" flat round dense v-close-popup />
                    </q-card-section>

                    <q-card-section class="q-pt-lg">
                      <q-input
                        v-bind="inputProps"
                        v-model="quickCatName"
                        label="Nombre de la Categoría"
                        autofocus
                        @keyup.enter="saveQuickCategory"
                      />
                    </q-card-section>

                    <q-card-actions align="right" class="q-pb-md q-px-md">
                      <q-btn label="Cancelar" flat color="grey-7" v-close-popup />
                      <q-btn
                        label="Guardar"
                        color="primary"
                        unelevated
                        :loading="catLoading"
                        @click="saveQuickCategory"
                      />
                    </q-card-actions>
                  </q-card>
                </q-dialog>

              <div class="col-12 text-subtitle2 text-grey-7 q-mt-sm">Datos Fiscales CFDI 4.0</div>
              <q-input v-bind="inputProps" v-model="form.clave_prod_serv" label="Clave Prod/Serv (SAT) *" mask="########" class="col-12 col-md-4" :rules="[val => val?.length === 8 || '8 dígitos']" />
              <q-input v-bind="inputProps" v-model="form.clave_unidad" label="Clave Unidad (SAT) *" class="col-12 col-md-4" />
              <q-select v-bind="inputProps" v-model="form.tipo_producto" :options="['Inventariable', 'Compuesto', 'Servicio']" label="Tipo de Producto" class="col-12 col-md-4" />
            </div>
          </q-tab-panel>

          <q-tab-panel name="kit" class="q-gutter-y-md">
            <div class="bg-indigo-1 q-pa-md rounded-borders row items-center no-wrap shadow-1">
              <q-icon name="account_tree" color="indigo-9" size="md" class="q-mr-md" />
              <div>
                <div class="text-bold text-indigo-9">Estructura del Producto Compuesto</div>
                <div class="text-caption text-indigo-7">Busque y añada los elementos que se descontarán del inventario al vender este artículo.</div>
              </div>
            </div>
            <q-banner dense class="bg-amber-1 text-amber-9 rounded-borders">
              <template v-slot:avatar><q-icon name="warning" /></template>
              Solo se pueden añadir <b>productos simples o servicios</b> como hijos. No se permiten kits dentro de otros kits.
            </q-banner>

            <q-select
              v-bind="inputProps"
              v-model="selectedHijo"
              use-input
              hide-selected
              fill-input
              input-debounce="300"
              label="Escriba nombre o escanee código de barras..."
              :options="searchOptions"
              @filter="filterProducts"
              @update:model-value="addComponent"
              ref="refKitSearch"
            >
              <template v-slot:no-option>
                <q-item><q-item-section class="text-grey">No se encontraron productos</q-item-section></q-item>
              </template>
              <template v-slot:option="scope">
                <q-item v-bind="scope.itemProps">
                  <q-item-section avatar><q-icon name="inventory_2" color="primary" /></q-item-section>
                  <q-item-section>
                    <q-item-label>{{ scope.opt.nombre }}</q-item-label>
                    <q-item-label caption>Cód: {{ scope.opt.codigo_barras }}</q-item-label>
                  </q-item-section>
                </q-item>
              </template>
            </q-select>

            <q-markup-table flat bordered class="menu-radius overflow-hidden">
              <thead class="bg-grey-3">
                <tr>
                  <th class="text-left">CÓDIGO</th>
                  <th class="text-left">PRODUCTO HIJO</th>
                  <th class="text-center" style="width: 180px;">CANTIDAD A DESCONTAR</th>
                  <th class="text-center" style="width: 50px;"></th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(hijo, index) in form.componentes" :key="hijo.id" class="hover-row">
                  <td class="text-caption text-bold">{{ hijo.codigo_barras }}</td>
                  <td>{{ hijo.nombre }}</td>
                  <td>
                    <q-input
                      v-bind="inputProps"
                      v-model.number="hijo.cantidad"
                      type="number"
                      step="0.000001"
                      input-class="text-center text-bold"
                      class="q-mb-none"
                    />
                  </td>
                  <td class="text-center">
                    <q-btn flat round color="negative" icon="delete" size="sm" @click="form.componentes.splice(index, 1)" />
                  </td>
                </tr>
                <tr v-if="form.componentes.length === 0">
                  <td colspan="4" class="text-center q-pa-xl text-grey-6 italic">
                    No hay componentes en este kit. Use el buscador superior para añadir elementos.
                  </td>
                </tr>
              </tbody>
            </q-markup-table>
          </q-tab-panel>

          <q-tab-panel name="precios" class="q-gutter-y-md">

            <div class="bg-blue-grey-1 q-pa-md rounded-borders shadow-1 q-mb-md">
              <div class="text-subtitle1 text-bold text-blue-grey-9 q-mb-sm">
                <q-icon name="gavel" class="q-mr-xs" /> Impuestos Aplicables (CFDI 4.0)
              </div>
              <q-select
                v-bind="inputProps"
                v-model="form.impuestos"
                :options="impuestosOptions"
                label="Seleccione los impuestos para este producto"
                multiple
                use-chips
                stack-label
                emit-value
                map-options
                class="bg-white"
              >

                <template v-slot:selected-item="scope">
                  <q-chip
                    removable
                    dense
                    @remove="scope.removeAtIndex(scope.index)"
                    :tabindex="scope.tabindex"
                    color="deep-purple-7"
                    text-color="white"
                    class="q-ma-xs shadow-1"
                  >
                    <q-avatar color="deep-purple-9" text-color="white" icon="gavel" />
                    {{ scope.opt.label }}
                  </q-chip>
                </template>
                <template v-slot:no-option>
                  <q-item><q-item-section class="text-grey">No hay impuestos configurados</q-item-section></q-item>
                </template>
              </q-select>
              <div class="text-caption text-blue-grey-6 q-mt-xs">
                * Los impuestos seleccionados se aplicarán automáticamente en el Punto de Venta.
              </div>
            </div>

            <q-separator spaced />

            <div class="row q-col-gutter-md">
              <div class="col-12 row items-center">
                <div class="text-subtitle1 text-bold text-primary">
                  <q-icon name="payments" class="q-mr-sm" /> Configuración de Precios
                </div>
                <q-space />
                <q-btn icon="add_circle" color="positive" label="Nuevo Precio" flat @click="addPriceList" />
              </div>

              <div v-for="(p, index) in form.precios" :key="index" class="col-12 row q-col-gutter-sm items-start animate__animated animate__fadeIn">
                <q-select
                  v-bind="inputProps"
                  v-model="p.nombre_lista"
                  :options="['PRECIO PUBLICO', 'PRECIO MAYOREO', 'PRECIO MEDIO MAYOREO', 'PRECIO VIP', 'PRECIO ESPECIAL']"
                  label="Nivel de Precio *"
                  class="col-5"
                  :disable="p.nombre_lista === 'PRECIO PUBLICO' && isEdit"
                />

                <q-input
                  v-bind="inputProps"
                  v-model.number="p.precio"
                  label="Precio de Venta ($)"
                  type="number"
                  step="0.000001"
                  class="col-5"
                >
                  <template v-slot:prepend><q-icon name="attach_money" color="green" /></template>
                </q-input>

                <div class="col-2 q-mt-xs text-center">
                  <q-btn
                    v-if="p.nombre_lista !== 'PRECIO PUBLICO'"
                    icon="delete_outline"
                    color="negative"
                    flat
                    round
                    @click="removePriceList(index)"
                  >
                    <q-tooltip>Eliminar esta tarifa</q-tooltip>
                  </q-btn>
                </div>
              </div>
            </div>
          </q-tab-panel>

          <q-tab-panel name="kit" class="q-gutter-y-md">
            <div class="bg-indigo-1 q-pa-md rounded-borders row items-center no-wrap shadow-1">
              <q-icon name="account_tree" color="indigo-9" size="md" class="q-mr-md" />
              <div>
                <div class="text-bold text-indigo-9">Estructura del Producto Compuesto</div>
                <div class="text-caption text-indigo-7">Busque y añada los elementos que se descontarán del inventario al vender este artículo.</div>
              </div>
            </div>

            <q-select
              v-bind="inputProps"
              v-model="selectedHijo"
              use-input
              hide-selected
              fill-input
              input-debounce="300"
              label="Escriba nombre o escanee código de barras..."
              :options="searchOptions"
              @filter="filterProducts"
              @update:model-value="addComponent"
              ref="refKitSearch"
            >
              <template v-slot:no-option>
                <q-item><q-item-section class="text-grey">No se encontraron productos</q-item-section></q-item>
              </template>
              <template v-slot:option="scope">
                <q-item v-bind="scope.itemProps">
                  <q-item-section avatar><q-icon name="inventory_2" color="primary" /></q-item-section>
                  <q-item-section>
                    <q-item-label>{{ scope.opt.nombre }}</q-item-label>
                    <q-item-label caption>Cód: {{ scope.opt.codigo_barras }}</q-item-label>
                  </q-item-section>
                </q-item>
              </template>
            </q-select>

            <q-markup-table flat bordered class="menu-radius overflow-hidden">
              <thead class="bg-grey-3">
                <tr>
                  <th class="text-left">CÓDIGO</th>
                  <th class="text-left">PRODUCTO HIJO</th>
                  <th class="text-center" style="width: 180px;">CANTIDAD A DESCONTAR</th>
                  <th class="text-center" style="width: 50px;"></th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(hijo, index) in form.componentes" :key="hijo.id" class="hover-row">
                  <td class="text-caption text-bold">{{ hijo.codigo_barras }}</td>
                  <td>{{ hijo.nombre }}</td>
                  <td>
                    <q-input
                      v-bind="inputProps"
                      v-model.number="hijo.cantidad"
                      type="number"
                      step="0.000001"
                      input-class="text-center text-bold"
                      class="q-mb-none"
                    />
                  </td>
                  <td class="text-center">
                    <q-btn flat round color="negative" icon="delete" size="sm" @click="form.componentes.splice(index, 1)" />
                  </td>
                </tr>
                <tr v-if="form.componentes.length === 0">
                  <td colspan="4" class="text-center q-pa-xl text-grey-6 italic">
                    No hay componentes en este kit. Use el buscador superior para añadir elementos.
                  </td>
                </tr>
              </tbody>
            </q-markup-table>
          </q-tab-panel>

        </q-tab-panels>

        <q-card-actions align="right" class="bg-grey-2 q-pa-md">
          <q-btn label="Cancelar" flat v-close-popup color="grey-7" />
          <q-btn label="Guardar Producto" color="primary" type="submit" :loading="loading" icon="save" />
        </q-card-actions>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script setup>
  import { ref, reactive, computed, watch, nextTick, onMounted } from 'vue'
  import { api } from 'boot/axios'
  import { useQuasar } from 'quasar'

  const props = defineProps({ modelValue: Boolean, editData: Object })
  const emit = defineEmits(['update:modelValue', 'saved'])
  const $q = useQuasar()

  const tab = ref('general')
  const loading = ref(false)
  const refGeneral = ref(null)
  const refPrecios = ref(null)

  const refKitSearch = ref(null)
  const selectedHijo = ref(null)
  const searchOptions = ref([])
  const categorias = ref([])

  const showCatDialog = ref(false)
  const catLoading = ref(false)
  const quickCatName = ref('')

  const impuestosOptions = ref([])


  const isEdit = computed(() => !!props.editData)

  const inputProps = {
    outlined: true, dense: true, 'stack-label': true, standout: 'bg-yellow-1', class: 'q-mb-sm'
  }

  const form = reactive({
    nombre: '', codigo_barras: '', categoria_id: null, tipo_producto: 'Inventariable',
    clave_prod_serv: '', clave_unidad: '', objeto_imp: '02',
    precios: [{ nombre_lista: 'Público', precio: 0, utilidad_porcentaje: 0 }],
    componentes: [],
    impuestos: [],
  })


  const setFocus = () => {
    nextTick(() => {
      if (tab.value === 'general') refGeneral.value?.focus()
      if (tab.value === 'precios') refPrecios.value?.focus()
    })
  }

  watch(tab, () => setFocus())

  const loadImpuestos = async () => {
    try {
      const res = await api.get('/api/impuestos')
      impuestosOptions.value = res.data.map(i => ({
        label: `${i.nombre} (${i.porcentaje}%)`,
        value: i.id,
        tipo: i.tipo // Traslado o Retención
      }))
    } catch (e) {
      console.error("Error al cargar impuestos:", e)
    }
  }

  const loadCategorias = async () => {
    try {
      const res = await api.get('/api/categorias')
      categorias.value = res.data.map(c => ({
        label: c.nombre,
        value: c.id
      }))

    } catch (e) {
      console.error("Error al cargar categorías:", e)
      $q.notify({ color: 'negative', message: 'No se pudieron cargar las categorías' })
    }
  }

  const onDialogOpen = async() => {
    tab.value = 'general'

    if (isEdit.value) {
      loading.value = true
      try {
        // 1. Cargamos el producto completo con sus relaciones
        const res = await api.get(`/api/productos/${props.editData.id}`)
        const data = res.data

        // 2. Mapeo de Impuestos (IDs para el select morado)
        if (data.impuestos) {
          data.impuestos = data.impuestos.map(i => i.id)
        }

        // 3. CORRECCIÓN: Mapeo de Componentes (Kit)
        // Esto extrae el nombre y código, y mueve la cantidad del 'pivot' al nivel superior
        if (data.componentes) {
          data.componentes = data.componentes.map(h => ({
            id: h.id,
            nombre: h.nombre,
            codigo_barras: h.codigo_barras,
            // Si Laravel devuelve la cantidad en el objeto pivot, la extraemos
            cantidad: h.pivot ? h.pivot.cantidad : (h.cantidad || 1.000000)
          }))
        }

        // 4. Asignamos los datos limpios al formulario reactivo
        Object.assign(form, data)

      } catch (e) {
        $q.notify({ color: 'negative', message: 'Error al cargar estructura del kit' })
        console.error(e)
      } finally {
        console.log(form.componentes)
        loading.value = false
      }
    } else {
      resetForm()
    }

    nextTick(() => setFocus())
  }

  const handleSubmit = async () => {
    loading.value = true
    try {
      const url = isEdit.value ? `/api/productos/${props.editData.id}` : '/api/productos'
      const method = isEdit.value ? 'put' : 'post'

      // Enviamos el formulario reactivo directamente
      await api[method](url, form)

      $q.notify({
        color: 'positive',
        message: isEdit.value ? '¡Producto actualizado!' : '¡Producto registrado!',
        icon: 'check_circle',
        position: 'top-right'
      })

      emit('saved')
      show.value = false // Esto cerrará el diálogo
    } catch (e) {
      // Manejo de errores profesional
      const msg = e.response?.data?.message || 'Error al procesar'
      $q.notify({ color: 'negative', message: msg, icon: 'warning' })
    } finally {
      loading.value = false
    }
  }

  const addPriceList = () => form.precios.push({ nombre_lista: '', precio: 0, utilidad_porcentaje: 0 })

  const show = computed({
    get: () => props.modelValue,
    set: (val) => emit('update:modelValue', val)
  })

  const filterProducts = async (val, update) => {
    if (val.length < 2) {
      update(() => { searchOptions.value = [] })
      return
    }

    try {
      // Buscamos productos que NO sean el actual y que no sean servicios
      const res = await api.get(`/api/productos/search?q=${val}`)
      update(() => {
        searchOptions.value = res.data.filter(p => p.id !== props.editData?.id)
      })
    } catch (e) {
      console.error("Error en búsqueda de componentes", e)
    }
  }

  const addComponent = (product) => {
    if (!product) return

    // Evitar duplicados
    const exists = form.componentes.find(c => c.id === product.id)
    if (exists) {
      $q.notify({ message: 'Este producto ya está en la lista', color: 'warning' })
    } else {
      form.componentes.push({
        id: product.id,
        nombre: product.nombre,
        codigo_barras: product.codigo_barras,
        cantidad: 1.000000
      })
    }


    selectedHijo.value = null
  }

  const removeComponent = (index) => {
    form.componentes.splice(index, 1)
  }

  // Foco automático para la pestaña de Kit
  watch(tab, (newTab) => {
    nextTick(() => {
      if (newTab === 'kit') refKitSearch.value?.focus()
    })
  })

  const resetForm = () => {
    // Limpiamos cada campo explícitamente para asegurar limpieza total
    form.nombre = ''
    form.codigo_barras = ''
    form.categoria_id = null
    form.tipo_producto = 'Inventariable'
    form.clave_prod_serv = ''
    form.clave_unidad = ''
    form.objeto_imp = '02'
    form.ultimo_costo_compra = 0

    // IMPORTANTE: Reiniciamos los arreglos con datos frescos
    form.precios = [
      { nombre_lista: 'PRECIO PUBLICO', precio: 0.000000, utilidad_porcentaje: 0 }
    ]
    form.componentes = []
    form.impuestos = []

    // Limpiamos variables de apoyo del buscador de kits
    selectedHijo.value = null
    searchOptions.value = []
  }

  const saveQuickCategory = async () => {
    if (!quickCatName.value) return

    catLoading.value = true
    try {
      const res = await api.post('/api/categorias', {
        nombre: quickCatName.value.toUpperCase()
      })

      // 1. Recargamos el listado completo de categorías
      await loadCategorias()

      // 2. Seleccionamos automáticamente la nueva categoría
      form.categoria_id = res.data.id

      $q.notify({
        color: 'positive',
        message: 'Categoría creada y seleccionada',
        icon: 'check'
      })

      // Limpiamos y cerramos
      quickCatName.value = ''
      showCatDialog.value = false
    } catch (e) {
      const msg = e.response?.data?.message || 'Error al crear categoría'
      $q.notify({ color: 'negative', message: msg, icon: 'warning' })
    } finally {
      catLoading.value = false
    }
  }

  const validateUniquePriceName = (val, index) => {
    if (!val) return 'El nombre es requerido';

    const isDuplicate = form.precios.some((p, i) =>
      i !== index && p.nombre_lista?.toUpperCase() === val.toUpperCase()
    );

    return isDuplicate ? 'Este nombre de lista ya está en uso' : true;
  };

  const removePriceList = (index) => {
    const precio = form.precios[index];
    if (precio.nombre_lista === 'PRECIO PUBLICO') {
      $q.notify({
        message: 'El PRECIO PUBLICO es obligatorio y no puede eliminarse',
        color: 'negative',
        icon: 'warning'
      });
      return;
    }
    form.precios.splice(index, 1);
  };

  onMounted( async() => {
    await loadCategorias()
    await loadImpuestos()
  })

</script>
