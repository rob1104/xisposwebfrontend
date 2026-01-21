<template>
  <q-page class="bg-grey-1 q-pa-lg column no-wrap" style="height: 100vh;">

    <q-card class="q-mb-md shadow-2" style="border-radius: 8px;">
      <q-card-section class="row items-center q-py-sm bg-white">
        <div class="row items-center">
          <q-icon name="assignment" color="primary" size="md" class="q-mr-sm" />
          <div class="column">
            <div class="text-h6 text-grey-9 text-bold">Auditoría de Inventario</div>
            <div class="text-caption text-grey-7">
              Sucursal: <span class="text-primary text-bold">{{ auth.sucursalSeleccionada?.nombre }}</span>
            </div>
          </div>
        </div>

        <q-space />

        <div class="row q-gutter-sm">
          <q-btn
            unelevated
            color="primary"
            label="Procesar Ajuste"
            icon="save"
            :loading="procesando"
            @click="confirmarCuadre"
          />
        </div>
      </q-card-section>
    </q-card>

    <div class="col overflow-hidden bg-white rounded-borders shadow-1">
      <q-table
        :rows="productos"
        :columns="columns"
        row-key="id"
        flat
        bordered
        :pagination="{ rowsPerPage: 0 }"
        virtual-scroll
        style="height: 100%"
        class="admin-audit-table sticky-header-light"
        :filter="filtro"
      >
        <template v-slot:top-left>
          <q-input
            v-model="filtro"
            placeholder="Buscar por código o nombre..."
            outlined
            dense
            class="bg-white"
            style="width: 300px;"
          >
            <template v-slot:append>
              <q-icon name="search" color="primary" />
            </template>
          </q-input>
        </template>

        <template v-slot:body-cell-codigo_barras="props">
          <q-td :props="props" class="text-purple-8">
            <span style="font-weight: bold;">{{ props.value }}</span>
          </q-td>
        </template>

        <template v-slot:body-cell-nombre="props">
          <q-td :props="props" class="text-grey-8">
            <span style="font-weight: bold;">{{ props.value }}</span>
          </q-td>
        </template>

        <template v-slot:body-cell-stock_sistema="props">
          <q-td :props="props" class="text-grey-8 bg-grey-2">
            {{ Number(props.value).toFixed(2) }}
          </q-td>
        </template>

        <template v-slot:body-cell-stock_fisico="props">
          <q-td :props="props" style="width: 140px;">
            <q-input
              v-model.number="props.row.stock_fisico"
              type="number"
              outlined
              dense
              input-class="text-center text-bold text-primary"
              color="primary"
              bg-color="white"
              @focus="$event.target.select()"
            />
          </q-td>
        </template>

        <template v-slot:body-cell-diferencia="props">
          <q-td :props="props">
            <q-badge
              :color="obtenerColorDiferencia(props.row)"
              class="text-bold q-pa-xs"
              outline
            >
              {{ calcularDiferencia(props.row) }}
            </q-badge>
          </q-td>
        </template>
      </q-table>
    </div>
  </q-page>
</template>

<script setup>
  import { ref, onMounted, computed } from 'vue'
  import { useQuasar } from 'quasar'
  import { api } from 'src/boot/axios'
  import { useAuthStore } from 'src/stores/auth'
  import { useRouter } from 'vue-router'

  const $q = useQuasar()
  const auth = useAuthStore()
  const router = useRouter()

  const productos = ref([])
  const procesando = ref(false)
  const filtro = ref('')

  const columns = [
    { name: 'codigo_barras', label: 'CÓDIGO', field: 'codigo_barras', align: 'left', sortable: true },
    { name: 'nombre', label: 'PRODUCTO', field: 'nombre', align: 'left', sortable: true },
    { name: 'stock_sistema', label: 'SISTEMA', field: 'stock_actual', align: 'center' },
    { name: 'stock_fisico', label: 'REAL (FÍSICO)', field: 'stock_fisico', align: 'center' },
    { name: 'diferencia', label: 'DIFERENCIA', align: 'center' }
  ]

  // Cargar productos de la sucursal activa
  const cargarProductos = async () => {
    try {
      const sucursalId = auth.sucursalSeleccionada.id
      const { data } = await api.get(`/api/auditoria/productos-sucursal/${sucursalId}`)
      // Inicializamos stock_fisico igual al sistema por defecto para que el usuario solo cambie discrepancias
      productos.value = data.map(p => ({
        ...p,
        stock_fisico: p.stock_actual || 0
      }))
    } catch (e) {
      $q.notify({ color: 'negative', message: 'Error al cargar inventario' })
    }
  }

  const calcularDiferencia = (row) => {
    const diff = Number(row.stock_fisico) - Number(row.stock_actual)
    return diff > 0 ? `+${diff.toFixed(2)}` : diff.toFixed(2)
  }

  const obtenerColorDiferencia = (row) => {
    const diff = Number(row.stock_fisico) - Number(row.stock_actual)
    if (diff === 0) return 'grey-8'
    return diff > 0 ? 'positive' : 'negative'
  }

  const confirmarCuadre = () => {
    $q.dialog({
      title: 'Confirmar Ajuste',
      message: 'Esta acción generará movimientos de entrada/salida en el Kardex y actualizará el stock final. ¿Desea continuar?',
      cancel: true,
      persistent: true
    }).onOk(guardarAuditoria)
  }

  const guardarAuditoria = async () => {
    procesando.value = true
    try {
      const payload = {
        sucursal_id: auth.sucursalSeleccionada.id,
        productos: productos.value.map(p => ({
          id: p.id,
          stock_fisico: p.stock_fisico
        }))
      }

      await api.post('/api/auditoria/procesar', payload)

      $q.notify({ color: 'positive', message: 'Inventario cuadrado exitosamente', icon: 'done_all' })
      router.push('/auditoriahistorial')
    } catch (e) {
      $q.notify({ color: 'negative', message: 'Error al procesar el cuadre' })
    } finally {
      procesando.value = false
    }
  }

  onMounted(cargarProductos)
</script>

<style lang="scss" scoped>
  .bg-grey-1 {
    background-color: #f5f7f8;
  }

  .admin-audit-table {

    :deep(.q-table__middle) {
      max-height: 100%;
    }

    :deep(thead tr th) {
      position: sticky;
      top: 0;
      z-index: 1;
      background-color: #f8f9fa;
      color: #37474f;
      font-weight: 800;
      border-bottom: 2px solid var(--q-primary);
    }

    /* Zebra striping para lectura fácil */
    :deep(tbody tr:nth-child(even)) {
      background-color: #fafafa;
    }

    :deep(tbody tr:hover) {
      background-color: rgba(var(--q-primary), 0.05);
    }
  }

  .sticky-header-light {
    border-radius: 8px;
  }
</style>
