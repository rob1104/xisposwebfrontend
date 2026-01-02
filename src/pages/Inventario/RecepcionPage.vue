<template>
  <q-page class="q-pa-lg bg-grey-2">
    <div class="row items-center q-mb-lg">
      <q-icon name="move_to_inbox" color="primary" size="md" class="q-mr-md" />
      <div>
        <div class="text-h5 text-bold text-grey-9">Entradas por Traspaso</div>
        <div class="text-caption text-grey-7">Gestione la recepción de mercancía entre sucursales.</div>
      </div>
    </div>

    <q-card class="shadow-10 border-radius-15 overflow-hidden">
      <q-toolbar class="bg-white q-py-md">
        <q-toolbar-title class="text-subtitle1 text-bold">Envíos Pendientes de Recibir</q-toolbar-title>
        <q-btn flat round icon="refresh" @click="loadPendientes" :loading="loading" />
      </q-toolbar>

      <q-separator />

      <q-card-section v-if="pendientes.length === 0" class="text-center q-pa-xl">
        <q-icon name="local_shipping" size="xl" color="grey-4" />
        <div class="text-grey-6 q-mt-md">No hay transferencias en tránsito hacia esta sucursal.</div>
      </q-card-section>

      <q-list v-else separator>
        <q-item v-for="t in pendientes" :key="t.id" class="q-py-md hover-row">
          <q-item-section avatar>
            <q-avatar color="orange-1" text-color="orange-9" icon="conveyor_belt" />
          </q-item-section>

          <q-item-section>
            <q-item-label class="text-bold text-subtitle1">Folio: #{{ t.id }}</q-item-label>
            <q-item-label caption class="row items-center">
              <q-icon name="location_on" class="q-mr-xs" /> Origen: {{ t.sucursal_origen?.nombre }}
            </q-item-label>
            <q-item-label caption>Enviado por: {{ t.user_envia?.name }}</q-item-label>
          </q-item-section>

          <q-item-section side>
            <div class="column items-end">
              <q-badge color="orange-9" label="EN TRÁNSITO" class="q-mb-sm" />
              <q-btn
                label="Verificar Carga"
                color="positive"
                unelevated
                dense
                padding="xs lg"
                @click="openRecepcion(t)"
              />
            </div>
          </q-item-section>
        </q-item>
      </q-list>
    </q-card>

    <q-dialog v-model="dialog" persistent maximized transition-show="slide-up" transition-hide="slide-down">
      <q-card class="bg-grey-1">
        <q-toolbar class="bg-primary text-white">
          <q-btn flat round dense icon="close" v-close-popup />
          <q-toolbar-title>Verificación de Mercancía - Folio #{{ selectedTransfer?.id }}</q-toolbar-title>
          <q-btn unelevated color="white" text-color="primary" label="Confirmar Recepción" @click="confirmRecepcion" :loading="saving" />
        </q-toolbar>

        <q-card-section class="q-pa-lg">
          <div class="row q-col-gutter-md">
            <div class="col-12">
              <q-banner dense class="bg-info text-white rounded-borders q-mb-md">
                <template v-slot:avatar><q-icon name="info" /></template>
                Por favor, cuente físicamente los productos. En caso de discrepancia, ajuste la columna "Recibido".
              </q-banner>

              <q-markup-table flat bordered class="shadow-2 border-radius-15">
                <thead class="bg-blue-grey-1">
                  <tr>
                    <th class="text-left">PRODUCTO</th>
                    <th class="text-right">ENVIADO</th>
                    <th class="text-right" style="width: 200px">RECIBIDO</th>
                    <th class="text-right">ESTADO</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="item in receptionList" :key="item.producto_id">
                    <td>
                      <div class="text-bold">{{ item.nombre }}</div>
                      <div class="text-caption text-grey-7">{{ item.codigo_barras }}</div>
                    </td>
                    <td class="text-right text-subtitle1">{{ formatNumber(item.cantidad_enviada) }}</td>
                    <td class="text-right">
                      <q-input
                        v-model.number="item.cantidad_recibida"
                        type="number"
                        outlined
                        dense
                        input-class="text-right text-bold"
                        color="positive"
                        :rules="[val => val <= item.cantidad_enviada || 'No puede recibir más de lo enviado']"
                      />
                    </td>
                    <td class="text-right">
                      <q-icon
                        :name="item.cantidad_recibida == item.cantidad_enviada ? 'check_circle' : 'warning'"
                        :color="item.cantidad_recibida == item.cantidad_enviada ? 'positive' : 'orange-9'"
                        size="sm"
                      >
                        <q-tooltip>{{ item.cantidad_recibida == item.cantidad_enviada ? 'Completo' : 'Incompleto / Discrepancia' }}</q-tooltip>
                      </q-icon>
                    </td>
                  </tr>
                </tbody>
              </q-markup-table>
            </div>
          </div>
        </q-card-section>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
  import { ref, onMounted } from 'vue'
  import { api } from 'boot/axios'
  import { useQuasar } from 'quasar'

  const $q = useQuasar()
  const pendientes = ref([])
  const loading = ref(false)
  const saving = ref(false)
  const dialog = ref(false)
  const selectedTransfer = ref(null)
  const receptionList = ref([])

  /**
   * Carga las transferencias con estatus 'Enviado'
   */
  const loadPendientes = async () => {
    loading.value = true
    try {
      const res = await api.get('/api/transferencias/pendientes')
      pendientes.value = res.data
    } catch (e) {
      $q.notify({ color: 'negative', message: 'Error al cargar pendientes' })
    } finally {
      loading.value = false
    }
  }

  /**
   * Prepara el diálogo de recepción mapeando los datos del envío
   */
  const openRecepcion = (transfer) => {
    selectedTransfer.value = transfer
    // Mapeamos los detalles para que sean editables en el frontend
    receptionList.value = transfer.detalles.map(d => ({
      producto_id: d.producto_id,
      nombre: d.producto.nombre,
      codigo_barras: d.producto.codigo_barras,
      cantidad_enviada: parseFloat(d.cantidad_enviada),
      cantidad_recibida: parseFloat(d.cantidad_enviada) // Precargamos el total para agilizar
    }))
    dialog.value = true
  }

  /**
   * Envía la confirmación al backend para actualizar stock y Kardex
   */
  const confirmRecepcion = async () => {
    if (receptionList.value.some(i => i.cantidad_recibida > i.cantidad_enviada)) {
      return $q.notify({ color: 'negative', message: 'Hay errores en las cantidades recibidas' })
    }

    saving.value = true
    try {
      // Procesamos la entrada oficial al inventario
      await api.post(`/api/transferencias/recibir/${selectedTransfer.value.id}`, {
        productos: receptionList.value
      })

      $q.notify({ color: 'positive', message: 'Inventario actualizado con éxito', icon: 'check' })
      dialog.value = false
      loadPendientes()
    } catch (e) {
      $q.notify({ color: 'negative', message: 'Error al procesar la recepción' })
    } finally {
      saving.value = false
    }
  }

  const formatNumber = (val) => Number(val).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 })

  onMounted(() => {
    loadPendientes()
  })
</script>

<style lang="scss" scoped>
  .border-radius-15 { border-radius: 15px; }
  .hover-row {
    transition: background 0.2s;
    &:hover { background: #f8fafc; }
  }
</style>
