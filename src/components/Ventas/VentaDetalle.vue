<template>
  <q-dialog v-model="internalValue" backdrop-filter="blur(4px) brightness(60%)">
    <q-card style="width: 700px; max-width: 95vw; border-radius: 12px;" class="bg-white text-blue-grey-10">

      <q-card-section class="row items-center q-pb-none">
        <div class="column">
          <div class="text-h6 text-bold text-primary flex items-center">
            <q-icon name="receipt" class="q-mr-sm" />
            Detalle de Operación
          </div>
          <div class="text-caption text-grey-7 font-mono">ID Transacción: {{ venta.id }}</div>
        </div>
        <q-space />
        <q-badge
          :color="venta.status === 'Completada' ? 'green-1' : 'red-1'"
          :text-color="venta.status === 'Completada' ? 'green-9' : 'red-9'"
          class="text-bold q-pa-sm rounded-borders"
        >
          {{ venta.status?.toUpperCase() }}
        </q-badge>
        <q-btn icon="close" flat round dense v-close-popup class="q-ml-md" />
      </q-card-section>

      <q-card-section class="q-pa-lg">
        <div class="row q-col-gutter-md q-mb-lg bg-grey-1 q-pa-md rounded-borders border-light">
          <div class="col-12 col-sm-4">
            <div class="text-overline text-grey-6 line-height-1">Folio</div>
            <div class="text-subtitle1 text-bold text-blue-grey-9">{{ venta.folio }}</div>
          </div>
          <div class="col-12 col-sm-4">
            <div class="text-overline text-grey-6 line-height-1">Fecha de Registro</div>
            <div class="text-subtitle1 text-bold">{{ formatFecha(venta.created_at) }}</div>
          </div>
          <div class="col-12 col-sm-4">
            <div class="text-overline text-grey-6 line-height-1">Responsable</div>
            <div class="text-subtitle1 text-bold">{{ venta.user?.name || 'Cajero' }}</div>
          </div>
        </div>

        <div class="row items-center q-mb-md q-px-sm">
          <q-avatar size="32px" color="blue-1" text-color="primary" icon="person" />
          <div class="q-ml-sm">
            <div class="text-caption text-grey-7 uppercase text-bold" style="font-size: 10px;">Cliente</div>
            <div class="text-body1 text-bold">{{ venta.cliente?.nombre || 'Público General' }}</div>
          </div>
        </div>

        <div class="border-light rounded-borders overflow-hidden q-mb-lg">
          <div class="row bg-grey-2 q-pa-sm text-bold text-grey-8 uppercase" style="font-size: 11px;">
            <div class="col-6">Descripción del Producto</div>
            <div class="col-2 text-center">Cant.</div>
            <div class="col-2 text-right">Unitario</div>
            <div class="col-2 text-right">Subtotal</div>
          </div>
          <q-list separator>
            <q-item v-for="item in venta.detalles" :key="item.id" class="q-py-sm">
              <div class="row full-width items-center">
                <div class="col-6">
                  <div class="text-bold text-blue-grey-9">{{ item.producto?.nombre }}</div>
                  <div class="text-caption text-grey-6">Codigo: {{ item.producto?.codigo_barras }}</div>
                </div>
                <div class="col-2 text-center text-bold">{{ formatQty(item.cantidad) }}</div>
                <div class="col-2 text-right text-grey-7">${{ formatMoney(parseFloat(item.precio_unitario) + parseFloat(item.impuesto_unitario)) }}</div>
                <div class="col-2 text-right text-bold">${{ formatMoney(item.total) }}</div>
              </div>
            </q-item>
          </q-list>
        </div>

        <div class="row q-col-gutter-lg">
          <div class="col-12 col-md-6">
            <div class="text-overline text-primary text-bold q-mb-sm">Historial de Cobros</div>
            <div v-for="pago in venta.pagos" :key="pago.id" class="row items-center q-mb-xs bg-grey-1 q-pa-sm rounded-borders border-light">
              <q-icon :name="pago.metodo_pago === 'Efectivo' ? 'payments' : 'credit_card'" color="grey-7" size="xs" />
              <span class="q-ml-sm text-grey-8">{{ pago.metodo_pago }}</span>
              <q-space />
              <span class="text-bold text-green-8">${{ formatMoney(pago.monto) }}</span>
            </div>
          </div>

          <div class="col-12 col-md-6">
            <div class="column q-gutter-y-xs">
              <div class="row justify-between text-grey-7">
                <span>Subtotal Neto</span>
                <span class="text-bold">${{ formatMoney(venta.subtotal) }}</span>
              </div>
              <div class="row justify-between text-grey-7">
                <span>Total Impuestos</span>
                <span class="text-bold text-orange-9">${{ formatMoney(venta.impuestos) }}</span>
              </div>
              <q-separator class="q-my-sm" />
              <div class="row justify-between items-center text-primary">
                <span class="text-h6 text-bold">TOTAL</span>
                <span class="text-h4 text-bold font-mono">${{ formatMoney(venta.total) }}</span>
              </div>
            </div>
          </div>
        </div>
      </q-card-section>

      <q-card-actions align="right" class="q-pa-md bg-grey-1">
        <q-btn flat label="Cerrar" color="grey-7" v-close-popup class="q-px-lg" />
        <q-btn outline color="primary" icon="print" label="Reimprimir" class="q-px-lg" />
        <q-btn color="primary" icon="download" label="Exportar PDF" unelevated class="q-px-lg" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
  import { computed } from 'vue'
  import { date } from 'quasar'

  const props = defineProps(['modelValue', 'venta'])
  const emit = defineEmits(['update:modelValue'])

  const internalValue = computed({
    get: () => props.modelValue,
    set: (val) => emit('update:modelValue', val)
  })

  const formatMoney = (val) => Number(val).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  const formatQty = (val) => parseFloat(val)
  const formatFecha = (f) => date.formatDate(f, 'DD/MM/YYYY hh:mm A')



</script>

<style scoped>
  .font-mono { font-family: 'Roboto Mono', monospace; }
  .border-light { border: 1px solid #e0e0e0; }
  .line-height-1 { line-height: 1; }
  .bg-grey-1 { background: #fafafa; }
  .bg-grey-2 { background: #f0f2f5; }
  .rounded-borders { border-radius: 8px; }
</style>
