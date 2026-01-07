<template>
  <q-page class="q-pa-lg bg-grey-2">
    <div class="row items-center q-mb-xl">
      <q-avatar icon="move_to_inbox" color="indigo-7" text-color="white" shadow-5 size="lg" />
      <div class="q-ml-md">
        <div class="text-h4 text-bold text-grey-9">Recepciones de Inventario</div>
        <div class="text-subtitle1 text-grey-7">Verifique y confirme la entrada de mercancía en tránsito.</div>
      </div>
      <q-space />
      <q-btn flat round color="primary" icon="refresh" @click="loadPendientes" :loading="loading">
        <q-tooltip>Actualizar listado</q-tooltip>
      </q-btn>
    </div>

    <div class="row q-col-gutter-lg">
      <div v-if="pendientes.length === 0" class="col-12 text-center q-pa-xl bg-white border-radius-20 shadow-1">
        <q-icon name="local_shipping" size="120px" color="grey-3" />
        <div class="text-h5 text-grey-5 q-mt-md">No hay unidades en ruta hacia esta sucursal</div>
      </div>

      <div v-for="t in pendientes" :key="t.id" class="col-12 col-md-6 col-lg-4">
        <q-card class="transfer-card shadow-10 border-radius-20 overflow-hidden">
          <q-card-section class="bg-indigo-7 text-white q-pa-md">
            <div class="row justify-between items-center">
              <div class="text-h6">Folio #{{ t.id }}</div>
              <q-badge color="orange-4" text-color="black" class="text-bold">EN TRÁNSITO</q-badge>
            </div>
          </q-card-section>

          <q-card-section class="q-pa-lg">
            <div class="row items-center q-mb-md">
              <q-icon name="location_on" color="primary" size="sm" class="q-mr-sm" />
              <div>
                <div class="text-caption text-grey-7">Origen del Traspaso</div>
                <div class="text-bold text-subtitle1">{{ t.sucursal_origen?.nombre }}</div>
              </div>
            </div>

            <q-separator q-my-md />

            <div class="row justify-between q-mt-sm">
              <div class="column">
                <span class="text-caption text-grey-7">Enviado por</span>
                <span class="text-weight-medium text-blue-grey-8">{{ t.user_envia?.name }}</span>
              </div>
              <div class="column items-end">
                <span class="text-caption text-grey-7">Fecha de Envío</span>
                <span class="text-weight-medium text-blue-grey-8">{{ formatDate(t.fecha_envio) }}</span>
              </div>
            </div>
          </q-card-section>

          <q-card-actions class="q-pa-md bg-grey-1">
            <q-btn
              label="Verificar Productos"
              color="indigo-7"
              unelevated
              class="full-width text-bold border-radius-10"
              icon="fact_check"
              @click="openRecepcion(t)"
            />
          </q-card-actions>
        </q-card>
      </div>
    </div>

    <q-dialog v-model="dialog" maximized transition-show="slide-up" transition-hide="slide-down">
      <q-card class="bg-grey-1">
        <q-toolbar class="bg-indigo-9 text-white q-py-md">
          <q-btn flat round icon="close" v-close-popup />
          <q-toolbar-title class="text-bold">Verificación de Mercancía: Folio #{{ selectedTransfer?.id }}</q-toolbar-title>
          <q-btn
            label="Confirmar Entrada de Stock"
            color="positive"
            unelevated
            class="q-px-xl text-bold"
            icon="done_all"
            @click="confirmRecepcion"
            :loading="saving"
          />
        </q-toolbar>

        <q-card-section class="q-pa-xl">
          <div class="row q-col-gutter-xl">
            <div class="col-12 col-md-4">
              <q-card flat bordered class="border-radius-15 bg-white q-pa-lg shadow-1">
                <div class="text-h6 q-mb-md text-indigo">Protocolo de Recepción</div>
                <q-list dense>
                  <q-item v-for="(tip, i) in tips" :key="i" class="q-px-none">
                    <q-item-section avatar><q-icon name="verified" color="positive" /></q-item-section>
                    <q-item-section class="text-caption text-grey-8">{{ tip }}</q-item-section>
                  </q-item>
                </q-list>

                <q-separator class="q-my-lg" />

                <div class="text-subtitle2 text-grey-7 q-mb-sm">Notas del Remitente:</div>
                <div class="bg-grey-2 q-pa-md rounded-borders italic text-grey-9">
                  {{ selectedTransfer?.notas || 'Sin observaciones adicionales.' }}
                </div>
              </q-card>
            </div>

            <div class="col-12 col-md-8">
              <q-table
                :rows="receptionList"
                :columns="columns"
                row-key="producto_id"
                flat bordered
                class="shadow-5 border-radius-15"
                hide-bottom
                :pagination="{ rowsPerPage: 0 }"
              >
                <template v-slot:header="props">
                  <q-tr :props="props" class="bg-blue-grey-1">
                    <q-th v-for="col in props.cols" :key="col.name" :props="props" class="text-bold">
                      {{ col.label }}
                    </q-th>
                  </q-tr>
                </template>

                <template v-slot:body-cell-producto="props">
                  <q-td :props="props">
                    <div class="text-bold text-primary">{{ props.row.nombre }}</div>
                    <div class="text-caption text-grey-7">{{ props.row.codigo_barras }}</div>
                  </q-td>
                </template>

                <template v-slot:body-cell-cantidad_enviada="props">
                  <q-td :props="props" class="text-center text-subtitle1 text-weight-light">
                    {{ formatNumber(props.value) }}
                  </q-td>
                </template>

                <template v-slot:body-cell-recibido="props">
                  <q-td :props="props">
                    <q-input
                      v-model.number="props.row.cantidad_recibida"
                      type="number"
                      step="0.000001"
                      outlined
                      dense
                      input-class="text-right text-bold"
                      bg-color="white"
                      :color="props.row.cantidad_recibida !== props.row.cantidad_enviada ? 'orange-8' : 'positive'"
                    >
                      <template v-slot:append>
                        <q-icon
                          :name="props.row.cantidad_recibida === props.row.cantidad_enviada ? 'check' : 'warning'"
                          :color="props.row.cantidad_recibida === props.row.cantidad_enviada ? 'positive' : 'orange'"
                        />
                      </template>
                    </q-input>
                  </q-td>
                </template>

                <template v-slot:body-cell-diferencia="props">
                  <q-td :props="props" class="text-center">
                    <q-badge
                      v-if="props.row.cantidad_recibida !== props.row.cantidad_enviada"
                      color="red-1" text-color="red-9" class="text-bold q-pa-sm"
                    >
                      - {{ formatNumber(props.row.cantidad_enviada - props.row.cantidad_recibida) }}
                    </q-badge>
                    <q-icon v-else name="check_circle" color="positive" size="sm" />
                  </q-td>
                </template>
              </q-table>
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

  const columns = [
    { name: 'producto', label: 'PRODUCTO / SKU', align: 'left' },
    { name: 'cantidad_enviada', label: 'CANT. ENVIADA', field: 'cantidad_enviada', align: 'center' },
    { name: 'recibido', label: 'CANT. RECIBIDA (CONTADA)', align: 'center' },
    { name: 'diferencia', label: 'ESTADO', align: 'center' }
  ]

  const tips = [
    'Cuente físicamente cada unidad antes de ingresar el valor.',
    'Ajuste la columna "Recibido" solo si hay daños o faltantes.',
    'Las discrepancias generarán una notificación al sistema central.',
    'Una vez confirmado, se registrará la ENTRADA POR TRASPASO en su Kardex.'
  ]

  const loadPendientes = async () => {
    loading.value = true
    try {
      const res = await api.get('/api/transferencias/pendientes')
      pendientes.value = res.data
    } catch (e) {
      $q.notify({ color: 'negative', message: 'No se pudieron cargar los envíos' })
    } finally { loading.value = false }
  }

  const openRecepcion = (transfer) => {
    selectedTransfer.value = transfer
    receptionList.value = transfer.detalles.map(d => ({
      producto_id: d.producto_id,
      nombre: d.producto.nombre,
      codigo_barras: d.producto.codigo_barras,
      cantidad_enviada: parseFloat(d.cantidad_enviada), // Precisión 14,6
      cantidad_recibida: parseFloat(d.cantidad_enviada)
    }))
    dialog.value = true
  }

  const confirmRecepcion = async () => {
    // Validación de seguridad para no recibir más de lo enviado
    if (receptionList.value.some(i => i.cantidad_recibida > i.cantidad_enviada)) {
      return $q.notify({ color: 'negative', message: 'La cantidad recibida no puede superar la enviada' })
    }

    saving.value = true
    try {
      // LLamamos al backend que registrará la ENTRADA POR TRASPASO en el KARDEX
      await api.post(`/api/transferencias/recibir/${selectedTransfer.value.id}`, {
        productos: receptionList.value
      })
      $q.notify({ color: 'positive', message: 'Inventario actualizado: Stock ingresado correctamente', icon: 'check' })
      dialog.value = false
      loadPendientes()
    } catch (e) {
      $q.notify({ color: 'negative', message: 'Fallo en la actualización de inventario' })
    } finally { saving.value = false }
  }

  const formatNumber = (val) => Number(val) // Smart Decimals
  const formatDate = (date) => new Date(date).toLocaleString()

  onMounted(loadPendientes)
</script>

<style lang="scss" scoped>
  .border-radius-20 { border-radius: 20px; }
  .border-radius-15 { border-radius: 15px; }
  .border-radius-10 { border-radius: 10px; }
  .transfer-card {
    transition: transform 0.3s ease;
    &:hover { transform: translateY(-8px); }
  }
</style>
