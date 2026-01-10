<template>
  <q-dialog v-model="show" persistent transition-show="slide-up" transition-hide="slide-down">
    <q-card style="width: 900px; max-width: 95vw;" class="bg-grey-1 border-radius-20 overflow-hidden">

      <q-card-section class="bg-primary text-white row items-center q-py-md">
        <q-avatar icon="receipt" color="white" text-color="primary" shadow-5 />
        <div class="q-ml-md">
          <div class="text-h6 text-bold">Detalle de Compra</div>
          <div class="text-caption opacity-80">Folio: {{ compra?.folio || 'Cargando...' }}</div>
        </div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>

      <q-card-section v-if="loading" class="q-pa-xl text-center">
        <q-spinner-tail color="primary" size="4em" />
        <div class="text-grey-7 q-mt-md">Obteniendo información detallada...</div>
      </q-card-section>

      <template v-else>
        <q-card-section class="q-pa-lg">
          <div class="row q-col-gutter-md">

            <div class="col-12 col-md-6">
              <q-card flat bordered class="rounded-borders bg-white full-height shadow-1">
                <q-item>
                  <q-item-section avatar>
                    <q-icon name="business" color="primary" size="sm" />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label class="text-caption text-grey-7 uppercase text-bold">Proveedor</q-item-label>
                    <q-item-label class="text-subtitle1 text-bold">{{ compra.provider?.razon_social }}</q-item-label>
                    <q-item-label caption>RFC: {{ compra.provider?.rfc || 'No registrado' }}</q-item-label>
                  </q-item-section>
                </q-item>
              </q-card>
            </div>

            <div class="col-12 col-md-6">
              <q-card flat bordered class="rounded-borders bg-white full-height shadow-1">
                <q-item>
                  <q-item-section avatar>
                    <q-icon name="info" color="primary" size="sm" />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label class="text-caption text-grey-7 uppercase text-bold">Información de Pago</q-item-label>
                    <q-item-label class="text-subtitle2">Método: <q-badge :label="compra.metodo_pago" color="blue-grey-8" /></q-item-label>
                    <q-item-label class="text-subtitle2 q-mt-xs">
                      Estado: <q-badge :label="compra.estatus" :color="getStatusColor(compra.estatus)" />
                    </q-item-label>
                  </q-item-section>
                </q-item>
              </q-card>
            </div>
          </div>

          <div class="q-mt-lg">
            <div class="text-subtitle2 q-mb-sm text-grey-8 text-bold row items-center">
              <q-icon name="list" color="primary" class="q-mr-xs" /> Artículos en esta compra
            </div>
            <q-markup-table flat bordered class="rounded-borders shadow-1 overflow-hidden">
              <thead class="bg-blue-grey-1 text-primary">
                <tr>
                  <th class="text-left">Descripción</th>
                  <th class="text-center">Cant.</th>
                  <th class="text-right">Costo Unit.</th>
                  <th class="text-right">Importe</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="det in compra.detalles" :key="det.id">
                  <td class="text-left">
                    <div class="text-bold">{{ det.producto?.nombre }}</div>
                    <div class="text-caption text-grey-6">SKU: {{ det.producto?.codigo_barras || 'N/A' }}</div>
                  </td>
                  <td class="text-center">{{ det.cantidad }}</td>
                  <td class="text-right text-grey-8">${{ formatMoney(det.costo_unitario) }}</td>
                  <td class="text-right text-bold text-primary">${{ formatMoney(det.importe) }}</td>
                </tr>
              </tbody>
            </q-markup-table>
          </div>
        </q-card-section>

        <q-separator />
        <q-card-section class="bg-white q-pa-lg">
          <div class="row items-center">
            <div class="col-12 col-md-6">
              <div class="text-caption text-grey-7 uppercase">Registrado por:</div>
              <div class="text-subtitle2 text-bold">{{ compra.user?.name }} en {{ compra.sucursal?.nombre }}</div>
            </div>
            <div class="col-12 col-md-6 text-right">
              <div class="row justify-end q-gutter-x-xl">
                <div>
                  <div class="text-caption text-grey-7">Subtotal</div>
                  <div class="text-h6">${{ formatMoney(compra.subtotal) }}</div>
                </div>
                <div>
                  <div class="text-caption text-grey-7">IVA</div>
                  <div class="text-h6">${{ formatMoney(compra.iva) }}</div>
                </div>
                <div class="text-primary">
                  <div class="text-caption text-bold uppercase">Total Compra</div>
                  <div class="text-h4 text-bold">${{ formatMoney(compra.total) }}</div>
                </div>
              </div>
            </div>
          </div>

          <div class="row justify-end q-mt-xl q-gutter-sm">
            <q-btn outline color="primary" icon="picture_as_pdf" label="Descargar PDF" @click="emit('download', compra)" />
            <q-btn flat color="grey-7" label="Cerrar Ventana" v-close-popup />
          </div>
        </q-card-section>
      </template>
    </q-card>
  </q-dialog>
</template>

<script setup>
  import { ref, computed, watch } from 'vue'
  import { api } from 'boot/axios'

  const props = defineProps({
    modelValue: Boolean,
    compraId: [Number, String]
  })

  const emit = defineEmits(['update:modelValue', 'download'])

  const loading = ref(false)
  const compra = ref(null)

  const show = computed({
    get: () => props.modelValue,
    set: (val) => emit('update:modelValue', val)
  })

  const formatMoney = (val) => Number(val).toLocaleString('en-US', { minimumFractionDigits: 2 })

  const getStatusColor = (status) => {
    switch (status) {
      case 'PAGADA': return 'positive';
      case 'PENDIENTE': return 'orange-8';
      case 'CANCELADA': return 'negative';
      default: return 'grey';
    }
  }

  const fetchDetalle = async () => {
    if (!props.compraId) return
    loading.value = true
    try {
      // Es vital obtener el detalle completo porque el index no trae 'detalles'
      const { data } = await api.get(`/api/compras/${props.compraId}`)
      compra.value = data
    } catch (e) {
      console.error(e)
    } finally {
      loading.value = false
    }
  }

  // Cada vez que se abra el modal con un nuevo ID, consultamos
  watch(() => props.modelValue, (newVal) => {
    if (newVal) fetchDetalle()
  })
</script>

<style scoped>
  .border-radius-20 { border-radius: 20px; }
  .rounded-borders { border-radius: 12px; }
</style>
