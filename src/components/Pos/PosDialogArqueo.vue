<template>
  <q-dialog
    v-model="internalValue"
    persistent
    maximized
    transition-show="slide-up"
    transition-hide="slide-down"
  >
    <q-card class="bg-grey-2 text-blue-grey-9">

      <q-card-section class="bg-primary text-white row items-center q-pa-md shadow-2">
        <q-icon name="analytics" size="md" class="q-mr-sm" />
        <div class="text-h5 text-bold uppercase tracking-widest">Conciliación de Efectivo - Corte X</div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>

      <q-card-section class="row q-col-gutter-xl q-pa-xl">

        <div class="col-12 col-md-7">
          <q-card flat bordered class="rounded-borders bg-white shadow-1">
            <q-card-section class="bg-grey-1 border-bottom-grey">
              <div class="text-h6 text-bold text-grey-8 uppercase">
                <q-icon name="payments" color="primary" class="q-mr-sm" /> Desglose de Billetes y Monedas
              </div>
            </q-card-section>

            <q-card-section class="q-pa-none">
              <q-markup-table flat class="pos-arqueo-table">
                <thead>
                  <tr class="bg-grey-1">
                    <th class="text-left text-bold">Denominación</th>
                    <th class="text-center text-bold">Cantidad de Piezas</th>
                    <th class="text-right text-bold">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="den in denominaciones" :key="den.valor">
                    <td class="text-left">
                      <div class="row items-center">
                        <q-avatar
                          :icon="den.valor >= 20 ? 'payments' : 'toll'"
                          :color="den.valor >= 20 ? 'blue-1' : 'orange-1'"
                          :text-color="den.valor >= 20 ? 'blue-9' : 'orange-9'"
                          size="sm"
                          class="q-mr-md"
                        />
                        <span class="text-subtitle1 text-bold">{{ den.label }}</span>
                      </div>
                    </td>
                    <td class="text-center" style="width: 150px;">
                      <q-input
                        v-model.number="den.cantidad"
                        type="number"
                        outlined
                        dense
                        input-class="text-center text-bold text-h6"
                        bg-color="grey-1"
                        @update:model-value="calcularEfectivoContado"
                      />
                    </td>
                    <td class="text-right text-h6 text-bold text-primary">
                      $ {{ (den.valor * den.cantidad).toFixed(2) }}
                    </td>
                  </tr>
                </tbody>
              </q-markup-table>
            </q-card-section>
          </q-card>
        </div>

        <div class="col-12 col-md-5">
          <q-card flat bordered class="bg-white q-pa-lg shadow-3 border-primary-top sticky-card">
            <div class="text-h4 text-bold text-center q-mb-xl text-blue-grey-9 uppercase">Resumen de Caja</div>

            <div class="q-gutter-y-lg">
              <div class="row justify-between items-center q-pa-md bg-blue-1 rounded-borders shadow-1">
                <div class="text-h6 text-primary">EFECTIVO CONTADO:</div>
                <div class="text-h3 text-bold text-primary">$ {{ efectivoContado.toFixed(2) }}</div>
              </div>

              <div class="row justify-between items-center q-px-md">
                <div class="text-subtitle1 text-grey-7">Efectivo Esperado (Ventas + Entradas - Retiros):</div>
                <div class="text-h5 text-grey-9 text-bold">$ {{ efectivoSistema.toFixed(2) }}</div>
              </div>

              <q-separator />

              <div class="row justify-between items-center q-pa-md rounded-borders shadow-1" :class="diferenciaBg">
                <div class="text-h5 text-bold">DIFERENCIA FINAL:</div>
                <div class="text-h2 text-bold">$ {{ diferencia.toFixed(2) }}</div>
              </div>

              <q-banner v-if="diferencia !== 0" dense class="bg-red-1 text-negative rounded-borders border-left-red">
                <template v-slot:avatar><q-icon name="warning" size="md" /></template>
                <div class="text-bold">ATENCIÓN: Se ha detectado un descuadre en caja.</div>
                La diferencia será registrada en el reporte histórico del turno.
              </q-banner>

              <q-btn
                label="Cerrar Turno y Generar Reporte"
                color="positive"
                class="full-width q-mt-xl text-h5 q-py-lg text-bold shadow-2"
                unelevated
                @click="ejecutarCierreFinal"
                :loading="procesandoCierre"
              />
            </div>
          </q-card>
        </div>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup>
  import { ref, computed, onMounted } from 'vue'
  import { api } from 'src/boot/axios'
  import { useQuasar } from 'quasar'
  import { usePosStore } from 'src/stores/pos'

  const props = defineProps(['modelValue'])
  const emit = defineEmits(['update:modelValue', 'closed'])

  const $q = useQuasar()
  const posStore = usePosStore()
  const procesandoCierre = ref(false)
  const efectivoSistema = ref(0) // Se carga desde el servidor

  /**
   * Lista de denominaciones monetarias oficiales
   */
  const denominaciones = ref([
    { label: 'Billetes $1,000', valor: 1000, cantidad: 0 },
    { label: 'Billetes $500', valor: 500, cantidad: 0 },
    { label: 'Billetes $200', valor: 200, cantidad: 0 },
    { label: 'Billetes $100', valor: 100, cantidad: 0 },
    { label: 'Billetes $50', valor: 50, cantidad: 0 },
    { label: 'Billetes $20', valor: 20, cantidad: 0 },
    { label: 'Monedas $20', valor: 20, cantidad: 0 },
    { label: 'Monedas $10', valor: 10, cantidad: 0 },
    { label: 'Monedas $5', valor: 5, cantidad: 0 },
    { label: 'Monedas $2', valor: 2, cantidad: 0 },
    { label: 'Monedas $1', valor: 1, cantidad: 0 },
    { label: 'Centavos', valor: 0.5, cantidad: 0 },
  ])

  const internalValue = computed({
    get: () => props.modelValue,
    set: (val) => emit('update:modelValue', val)
  })

  /**
   * Calcula la suma del dinero contado físicamente
   */
  const efectivoContado = computed(() => {
    return denominaciones.value.reduce((acc, d) => acc + (d.valor * d.cantidad), 0)
  })

  const diferencia = computed(() => efectivoContado.value - efectivoSistema.value)

  /**
   * Define el color del fondo de la diferencia para alerta visual
   */
  const diferenciaBg = computed(() => {
    if (diferencia.value === 0) return 'bg-green-1 text-positive'
    return diferencia.value < 0 ? 'bg-red-1 text-negative' : 'bg-orange-1 text-orange-9'
  })

  /**
   * Obtiene el balance esperado del servidor al abrir el arqueo
   */
  const cargarBalanceEsperado = async () => {
    try {
      const { data } = await api.get(`/api/pos/balance-turno/${posStore.turno?.id}`)
      efectivoSistema.value = parseFloat(data.balance_efectivo)
    } catch (e) {
      console.error("Error al cargar balance esperado")
    }
  }

  /**
   * Ejecuta el cierre definitivo del turno en la base de datos
   */
  const ejecutarCierreFinal = async () => {
    $q.dialog({
      title: 'Confirmar Cierre',
      message: 'Una vez cerrado el turno, no se podrán realizar más ventas ni movimientos. ¿Desea continuar?',
      cancel: true,
      persistent: true
    }).onOk(async () => {
      procesandoCierre.value = true
      try {
        const payload = {
          turno_id: posStore.turno.id,
          efectivo_contado: efectivoContado.value,
          diferencia: diferencia.value,
          denominaciones: denominaciones.value
        }

        await api.post('/api/pos/cerrar-turno', payload)

        $q.notify({ color: 'positive', message: 'TURNO CERRADO EXITOSAMENTE', icon: 'check_circle' })

        posStore.turno = null // Limpiar store
        internalValue.value = false
        emit('closed')

      } catch (e) {
        $q.notify({ color: 'negative', message: 'Error al procesar el cierre' })
      } finally {
        procesandoCierre.value = false
      }
    })
  }

  onMounted(() => {
    if (internalValue.value) cargarBalanceEsperado()
  })
</script>

<style lang="scss" scoped>
  .border-bottom-grey { border-bottom: 1px solid #e0e0e0; }
  .border-left-red { border-left: 5px solid var(--q-negative); }
  .border-primary-top { border-top: 6px solid var(--q-primary) !important; }

  .pos-arqueo-table :deep(thead tr th) {
    font-size: 0.9rem;
    color: #757575;
  }

  .pos-arqueo-table :deep(tbody tr:hover) {
    background: #f1f8e9;
  }

  .sticky-card {
    position: sticky;
    top: 20px;
  }

  .tracking-widest { letter-spacing: 0.15em; }
</style>
