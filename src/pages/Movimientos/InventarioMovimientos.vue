<template>
  <q-page padding class="bg-grey-1">
    <div class="row q-col-gutter-md q-mb-lg">
      <div class="col-12 col-sm-6 col-md-3">
        <q-card flat bordered class="q-pa-sm shadow-1">
          <q-item>
            <q-item-section avatar>
              <q-icon name="history" color="primary" size="md" />
            </q-item-section>
            <q-item-section>
              <q-item-label class="text-caption text-grey">Total Movimientos</q-item-label>
              <q-item-label class="text-h6">{{ movimientos.length }}</q-item-label>
            </q-item-section>
          </q-item>
        </q-card>
      </div>

      <div class="col-12 col-sm-6 col-md-3">
        <q-card flat bordered class="q-pa-sm shadow-1">
          <q-item>
            <q-item-section avatar>
              <q-icon name="trending_up" color="positive" size="md" />
            </q-item-section>
            <q-item-section>
              <q-item-label class="text-caption text-grey">Entradas</q-item-label>
              <q-item-label class="text-h6">{{ totalEntradas }}</q-item-label>
            </q-item-section>
          </q-item>
        </q-card>
      </div>

      <div class="col-12 col-sm-6 col-md-3">
        <q-card flat bordered class="q-pa-sm shadow-1">
          <q-item>
            <q-item-section avatar>
              <q-icon name="trending_down" color="negative" size="md" />
            </q-item-section>
            <q-item-section>
              <q-item-label class="text-caption text-grey">Salidas</q-item-label>
              <q-item-label class="text-h6">{{ totalSalidas }}</q-item-label>
            </q-item-section>
          </q-item>
        </q-card>
      </div>

      <div class="col-12 col-sm-6 col-md-3">
        <q-card flat bordered class="q-pa-sm shadow-1">
          <q-item>
            <q-item-section avatar>
              <q-icon name="tune" color="orange" size="md" />
            </q-item-section>
            <q-item-section>
              <q-item-label class="text-caption text-grey">Ajustes</q-item-label>
              <q-item-label class="text-h6">{{ totalAjustes }}</q-item-label>
            </q-item-section>
          </q-item>
        </q-card>
      </div>
    </div>

    <q-table
      :rows="movimientos"
      :columns="columns"
      row-key="id"
      flat bordered
      class="rounded-borders shadow-1"
      :loading="loading"
    >
      <template v-slot:top>
        <div class="text-h6 text-primary flex items-center">
          <q-icon name="inventory_2" class="q-mr-sm" />
          Movimientos al Inventario
        </div>

        <q-space />

        <q-select
          v-if="auth.roles[0] === 'Administrador'"
          v-model="sucursalFiltroId"
          :options="sucursales"
          option-label="nombre"
          option-value="id"
          emit-value
          map-options
          outlined
          dense
          label="Ver Sucursal"
          class="q-mr-md bg-white"
          style="min-width: 200px"
          @update:model-value="onSucursalFilterChange"
        >
          <template v-slot:prepend>
            <q-icon name="filter_list" color="primary" size="xs" />
          </template>
        </q-select>

        <q-btn
          color="primary"
          icon="add"
          label="Nuevo Movimiento"
          unelevated
          @click="abrirDialogo"
        />
      </template>

      <template v-slot:body-cell-fecha="props">
        <q-td :props="props" class="text-grey-7">
          <q-icon name="calendar_today" size="xs" class="q-mr-xs" />
          {{ props.value }}
        </q-td>
      </template>

      <template v-slot:body-cell-producto="props">
        <q-td :props="props">
          <div class="text-weight-bold text-purple-10">{{ props.value }}</div>
          <div class="text-caption text-grey-10">{{ props.row.producto?.codigo_barras }}</div>
        </q-td>
      </template>

      <template v-slot:body-cell-tipo_movimiento="props">
        <q-td :props="props">
          <q-chip
            :color="getChipColor(props.value)"
            text-color="white"
            dense
            square
            class="text-weight-bold"
            size="md"
          >
            {{ props.value }}
          </q-chip>
        </q-td>
      </template>

      <template v-slot:body-cell-cantidad="props">
        <q-td :props="props">
          <span :class="getCantidadClass(props.row.tipo_movimiento)" class="text-weight-bold" style="font-size: 22px;">
            {{ props.row.tipo_movimiento.includes('SALIDA') ? '-' : '+' }}
            {{ formatCant(props.value) }}
          </span>
        </q-td>
      </template>

      <template v-slot:body-cell-stock_nuevo="props">
        <q-td :props="props">
          <q-chip dense size="lg" class="text-weight-bold" color="blue-9" text-color="white">
            {{ formatCant(props.value) }}
        </q-chip>
        </q-td>
      </template>
    </q-table>

    <q-dialog v-model="dialogo" persistent>
      <q-card style="width: 500px; max-width: 90vw;">
        <q-card-section class="bg-primary text-white">
          <div class="text-h6">Nuevo Movimiento</div>
        </q-card-section>

        <q-card-section class="q-gutter-md">
          <div v-if="auth.isAdmin" class="q-mb-md">
            <q-select
              v-model="form.sucursal_id"
              :options="sucursales"
              option-label="nombre"
              option-value="id"
              emit-value
              map-options
              label="Sucursal *"
              outlined
              @update:model-value="consultarStock"
            >
              <template v-slot:prepend>
                <q-icon name="storefront" color="primary" />
              </template>
            </q-select>
          </div>
          <div v-else>
             <q-field color="grey-3" outlined label="Sucursal" stack-label>
                <template v-slot:prepend>
                  <q-icon name="storefront" color="primary" />
                </template>
                <template v-slot:control>
                  <div class="self-center full-width no-outline" tabindex="0">{{ auth.sucursalSeleccionada.nombre }}</div>
                </template>
              </q-field>

          </div>

          <q-select
              v-model="productoSeleccionado"
              use-input
              outlined
              autofocus
              label="Buscar Producto (Nombre o Código) *"
              :options="opcionesProductos"
              @filter="filtrarProductos"
              option-label="nombre"
              option-value="id"
              map-options
              @update:model-value="alSeleccionarProducto"
              :loading="buscando"
            >
              <template v-slot:no-option>
                <q-item>
                  <q-item-section class="text-grey">
                    No se encontraron resultados
                  </q-item-section>
                </q-item>
              </template>

              <template v-slot:option="scope">
                <q-item v-bind="scope.itemProps">
                  <q-item-section>
                    <q-item-label>{{ scope.opt.nombre }}</q-item-label>
                    <q-item-label caption>SKU: {{ scope.opt.sku }}</q-item-label>
                  </q-item-section>
                  <q-item-section side>
                    <q-badge color="blue-grey" :label="scope.opt.categoria?.nombre" />
                  </q-item-section>
                </q-item>
              </template>
            </q-select>

          <q-banner v-if="productoEncontrado" class="bg-blue-1 rounded-borders">
            <div class="text-weight-bold">{{ productoEncontrado.nombre }}</div>
            <div class="text-caption">Stock Actual: {{ stockActual }}</div>
          </q-banner>

          <div class="row q-col-gutter-sm">
            <q-select
              v-model="form.tipo"
              :options="['ENTRADA', 'SALIDA', 'AJUSTE']"
              label="Tipo *"
              class="col-6"
              outlined
            />
            <q-input
              v-model.number="form.cantidad"
              type="number"
              :label="form.tipo === 'AJUSTE' ? 'Stock Final' : 'Cantidad'"
              class="col-6"
              outlined
            />
          </div>

          <q-input
            v-model="form.observaciones"
            type="textarea"
            label="Concepto / Observaciones"
            outlined
            rows="2"
          />
        </q-card-section>

        <q-card-actions align="right" class="q-pb-md q-px-md">
          <q-btn flat label="Cancelar" color="grey" v-close-popup />
          <q-btn
            label="Guardar"
            color="primary"
            @click="guardarMovimiento"
            :loading="loading"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    </q-page>
</template>

<script setup>
  import { ref, onMounted, computed } from 'vue'
  import { api } from 'src/boot/axios'
  import { useQuasar } from 'quasar'
  import { useAuthStore } from 'src/stores/auth'

  const auth = useAuthStore()
  const $q = useQuasar()
  const movimientos = ref([])
  const sucursales = ref([])
  const dialogo = ref(false)
  const loading = ref(false)
  const productoEncontrado = ref(null)
  const stockActual = ref(0)
  const buscando = ref(false)
  const opcionesProductos = ref([])
  const productoSeleccionado = ref(null)
  const sucursalFiltroId = ref(auth.sucursalSeleccionada)

  const form = ref({
    sucursal_id: null,
    codigo: '',
    producto_id: null,
    tipo: 'ENTRADA',
    cantidad: 0,
    observaciones: ''
  })

  console.log(auth.isAdmin)

  // KPIs Computados (Calculados localmente para velocidad)
  const totalEntradas = computed(() => movimientos.value.filter(m => m.tipo_movimiento.includes('ENTRADA')).length)
  const totalSalidas = computed(() => movimientos.value.filter(m => m.tipo_movimiento.includes('SALIDA')).length)
  const totalAjustes = computed(() => movimientos.value.filter(m => m.tipo_movimiento.includes('AJUSTE')).length)

  // Formato de cantidades solicitado
  const formatCant = (val) => {
    if (val === null || val === undefined) return '0'
    return Number(parseFloat(val))
  }

  const getCantidadClass = (tipo) => {
    if (tipo.includes('ENTRADA')) return 'text-positive'
    if (tipo.includes('SALIDA')) return 'text-negative'
    return 'text-orange-9'
  }

  const getChipColor = (tipo) => {
    if (tipo.includes('ENTRADA')) return 'positive'
    if (tipo.includes('SALIDA')) return 'negative'
    return 'orange'
  }

  const columns = [
    { name: 'fecha', label: 'Fecha', field: row => row.created_at.substring(0,10), align: 'left', sortable: true },
    { name: 'sucursal', label: 'Sucursal', field: row => row.sucursal?.nombre, align: 'left' },
    { name: 'producto', label: 'Producto', field: row => row.producto?.nombre, align: 'left', sortable: true },
    { name: 'tipo_movimiento', label: 'Tipo', field: 'tipo_movimiento', align: 'center' },
    { name: 'observaciones', label: 'Concepto', field: 'observaciones', align: 'center' },
    { name: 'cantidad', label: 'Movimiento', field: 'cantidad', align: 'right' },
    { name: 'stock_nuevo', label: 'Stock Final', field: 'stock_nuevo', align: 'right' },
    { name: 'user', label: 'Realizado por', field: row => row.user?.name, align: 'right' }
  ]

  const cargarMovimientos = async () => {
    loading.value = true
    try {
      // El interceptor adjunta el X-Sucursal-Id automáticamente basándose en auth.sucursalSeleccionada
      const { data } = await api.get('/api/inventario')
      movimientos.value = Array.isArray(data) ? data : (data.data || [])
    } catch (error) {
      console.error('Error al cargar movimientos:', error)
    } finally {
      loading.value = false
    }
  }

    /**
   * Abre el diálogo de nuevo movimiento y resetea el formulario
   */
  const abrirDialogo = () => {
    // 1. Limpiamos los datos del producto y stock previo
    productoEncontrado.value = null
    stockActual.value = 0

    // 2. Reiniciamos el formulario a sus valores iniciales
    form.value = {
      sucursal_id: auth.sucursalSeleccionada?.id || null, // Pre-selecciona la sucursal actual
      codigo: '',
      producto_id: null,
      tipo: 'ENTRADA',
      cantidad: 0,
      observaciones: ''
    }

    // 3. Activamos el diálogo de Quasar
    dialogo.value = true

    // Opcional: Si la sucursal ya viene seleccionada,
    // podríamos querer enfocar automáticamente el input del código de barras
  }

  /**
   * Función auxiliar para limpiar el formulario sin cerrar el diálogo
   * (Útil si quieres registrar varios productos seguidos)
   */
  const limpiarFormularioPostRegistro = () => {
    form.value.codigo = ''
    form.value.producto_id = null
    form.value.cantidad = 0
    form.value.observaciones = ''
    productoEncontrado.value = null
    stockActual.value = 0

    // Mantenemos la sucursal_id para no obligar al usuario a elegirla de nuevo
  }

  const buscarProducto = async () => {
    if (!form.value.sucursal_id || !form.value.codigo) return
    try {
      const { data } = await api.get(`/api/inventario/buscar?codigo=${form.value.codigo}&sucursal_id=${form.value.sucursal_id}`)
      productoEncontrado.value = data.producto
      stockActual.value = data.stock_actual
      form.value.producto_id = data.producto.id
    } catch (e) {
      $q.notify({ color: 'negative', message: 'Producto no encontrado' })
    }
  }

  const CargarSucursales = async () => {
    try {
      const { data } = await api.get('/api/sucursales');
      sucursales.value = data;

      // Si ya hay una sucursal seleccionada en el store, la asignamos al form
      if (auth.sucursalSeleccionada) {
        form.value.sucursal_id = auth.sucursalSeleccionada.id;
      }
    } catch (error) {
      console.error('Error al cargar sucursales:', error);
    }
  };

  const consultarStock = async () => {
    if (!form.value.sucursal_id || !form.value.producto_id) return;

    try {
      const { data } = await api.get(`/api/inventario/stock-actual`, {
        params: {
          producto_id: form.value.producto_id,
          sucursal_id: form.value.sucursal_id
        }
      });
      stockActual.value = data.stock_actual;
    } catch (error) {
      stockActual.value = 0;
    }
  };

  const guardarMovimiento = async () => {
    loading.value = true
    try {
      await api.post('/api/inventario/movimiento', form.value)
      $q.notify({ color: 'positive', message: 'Movimiento registrado' })
      dialogo.value = false
      cargarMovimientos()
    } catch (e) {
      console.error(e)
    } finally {
      loading.value = false
    }
  }

  // Lógica de filtrado (idéntica a la de productos compuestos)
  const filtrarProductos = (val, update, abort) => {
    if (val.length < 2) {
      abort()
      return
    }

    update(async () => {
      buscando.value = true
      try {
        const { data } = await api.get('/api/inventario/buscar-filtro', {
          params: { q: val }
        })
        opcionesProductos.value = data
      } catch (e) {
        console.error(e)
      } finally {
        buscando.value = false
      }
    })
  }

  // Al elegir un producto, consultamos su stock en la sucursal seleccionada
  const alSeleccionarProducto = async (producto) => {
    if (!producto || !form.value.sucursal_id) return

    form.value.producto_id = producto.id
    productoEncontrado.value = producto

    try {
      const { data } = await api.get('/api/inventario/stock-especifico', {
        params: {
          producto_id: producto.id,
          sucursal_id: form.value.sucursal_id
        }
      })
      stockActual.value = data.stock_actual
    } catch (e) {
      stockActual.value = 0
    }
  }

  const onSucursalFilterChange = (id) => {
    const sede = sucursales.value.find(s => s.id === id)
    if (sede) {
      auth.setSucursal(sede)
      cargarMovimientos()
    }
  }

  onMounted(async() => {
    await CargarSucursales()
    sucursalFiltroId.value = auth.sucursalSeleccionada?.id
    cargarMovimientos()
  })
</script>
