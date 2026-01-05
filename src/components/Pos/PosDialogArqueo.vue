<template>
  <q-dialog
    v-model="internalValue"
    persistent
    backdrop-filter="blur(10px) brightness(30%)"
  >
    <q-card style="width: 1000px; max-width: 95vw; border-radius: 20px;" class="bg-blue-grey-10 text-white overflow-hidden shadow-24">

      <q-card-section class="bg-blue-grey-9 q-pa-lg row items-center border-bottom-white-10">
        <q-avatar color="primary" text-color="white" icon="analytics" size="50px" class="shadow-5" />
        <div class="q-ml-md">
          <div class="text-h5 text-bold tracking-widest uppercase">Cierre de Caja</div>
          <div class="text-h5 text-blue-grey-3">CORTE X - TURNO #{{ posStore.turno?.id }}</div>
        </div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup color="blue-grey-4" />
      </q-card-section>

      <q-card-section class="row q-col-gutter-lg q-pa-xl">

        <div class="col-12 col-md-7">
          <div class="text-h6 text-yellow text-bold q-mb-sm">Desglose de Efectivo</div>
          <q-scroll-area style="height: 500px;" class="rounded-borders bg-blue-grey-9 q-pa-md shadow-inner">
            <q-list padding>
              <q-item v-for="den in denominaciones" :key="den.valor" class="q-mb-sm bg-blue-grey-10 rounded-borders border-white-5">
                <q-item-section avatar>
                  <q-icon
                    :name="den.valor >= 20 ? 'payments' : 'toll'"
                    :color="den.valor >= 20 ? 'cyan-4' : 'amber-4'"
                    size="sm"
                  />
                </q-item-section>

                <q-item-section>
                  <q-item-label class="text-bold text-subtitle1">{{ den.label }}</q-item-label>
                </q-item-section>

                <q-item-section side style="width: 120px;">
                  <q-input
                    v-model.number="den.cantidad"
                    type="number"
                    dark
                    filled
                    dense
                    input-class="text-center text-bold text-h6 font-mono"
                    @click="$event.target.select()"
                  />
                </q-item-section>

                <q-item-section side style="width: 120px;" class="text-right">
                  <div class="text-h6 text-bold text-cyan-4 font-mono">
                    ${{ formatMoney(den.valor * den.cantidad) }}
                  </div>
                </q-item-section>
              </q-item>
            </q-list>
          </q-scroll-area>
        </div>

        <div class="col-12 col-md-5">
          <div class="column q-gutter-y-md">

            <q-card flat class="bg-blue-grey-9 q-pa-lg rounded-borders border-white-5">
              <div class="text-caption text-blue-grey-4 uppercase text-bold">Total Contado Físicamente</div>
              <div class="text-h2 text-bold text-cyan-4 font-mono text-shadow-blue">
                ${{ formatMoney(efectivoContado) }}
              </div>
            </q-card>

            <div class="row q-pa-md bg-blue-grey-11 rounded-borders items-center">
              <div class="column col-7">
                <span class="text-caption text-black uppercase">Efectivo en Sistema</span>
                <span class="text-h6 text-bold font-mono text-black">${{ formatMoney(efectivoSistema) }}</span>
              </div>
              <q-icon name="monitor" color="blue-grey-4" size="md" class="col-5 text-right opacity-30" />
            </div>

            <q-card flat class="q-pa-lg rounded-borders shadow-10" :class="diferenciaEstilo.bg">
              <div class="row items-center justify-between">
                <div class="column">
                  <span class="text-caption uppercase text-bold" :class="diferenciaEstilo.text">Diferencia Final</span>
                  <span class="text-h3 text-bold font-mono" :class="diferenciaEstilo.text">
                    ${{ formatMoney(diferencia) }}
                  </span>
                </div>
                <q-icon :name="diferenciaEstilo.icon" size="xl" :class="diferenciaEstilo.text" />
              </div>
            </q-card>

            <q-banner v-if="diferencia !== 0" dense class="bg-red-9 text-white rounded-borders q-pa-md">
              <template v-slot:avatar><q-icon name="warning" /></template>
              <div class="text-caption">Existe un descuadre que será notificado al administrador al cerrar.</div>
            </q-banner>

            <q-btn
              label="FINALIZAR CORTE Y CERRAR TURNO"
              color="positive"
              size="lg"
              unelevated
              class="full-width q-py-md text-bold shadow-10 btn-premium"
              @click="ejecutarCierreFinal"
              :loading="procesandoCierre"
            />
          </div>
        </div>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup>
  import { ref, computed, onMounted, watch } from 'vue'
  import { api } from 'src/boot/axios'
  import { useQuasar } from 'quasar'
  import { usePosStore } from 'src/stores/pos'

  const props = defineProps(['modelValue'])
  const emit = defineEmits(['update:modelValue', 'closed'])

  const $q = useQuasar()
  const posStore = usePosStore()
  const procesandoCierre = ref(false)
  const efectivoSistema = ref(0)
  const efectivoContado = ref(0)

  /**
   * Lista Optimizada (Sin redundancias)
   */
  const denominaciones = ref([
    { label: '$1,000', valor: 1000, cantidad: 0 },
    { label: '$500',   valor: 500,  cantidad: 0 },
    { label: '$200',   valor: 200,  cantidad: 0 },
    { label: '$100',   valor: 100,  cantidad: 0 },
    { label: '$50',    valor: 50,   cantidad: 0 },
    { label: '$20',    valor: 20,   cantidad: 0 },
    { label: '$10',    valor: 10,   cantidad: 0 },
    { label: '$5',     valor: 5,    cantidad: 0 },
    { label: '$2',     valor: 2,    cantidad: 0 },
    { label: '$1',     valor: 1,    cantidad: 0 },
    { label: '50¢',    valor: 0.5,  cantidad: 0 },
  ])

  const internalValue = computed({
    get: () => props.modelValue,
    set: (val) => emit('update:modelValue', val)
  })

  /**
   * REEMPLAZO DE LA FUNCIÓN: Uso de Watcher para reactividad premium
   * Esto elimina la necesidad de llamar a una función en el @update:model-value
   */
  watch(denominaciones, () => {
    efectivoContado.value = denominaciones.value.reduce((acc, d) => {
      return acc + (d.valor * (parseFloat(d.cantidad) || 0))
    }, 0)
  }, { deep: true })

  const diferencia = computed(() => efectivoContado.value - efectivoSistema.value)

  const diferenciaEstilo = computed(() => {
    if (Math.abs(diferencia.value) < 0.01) return { bg: 'bg-green-9', text: 'text-green-2', icon: 'check_circle' }
    return diferencia.value < 0
      ? { bg: 'bg-red-9', text: 'text-red-2', icon: 'error_outline' }
      : { bg: 'bg-orange-9', text: 'text-orange-2', icon: 'add_circle_outline' }
  })

  const formatMoney = (val) => Number(val).toLocaleString('en-US', { minimumFractionDigits: 2 })

  const cargarBalanceEsperado = async () => {
    try {
      const { data } = await api.get(`/api/pos/balance-turno/${posStore.turno?.id}`)
      efectivoSistema.value = parseFloat(data.balance_efectivo)
    } catch (e) {
      $q.notify({ color: 'negative', message: 'No se pudo obtener el balance de sistema' })
    }
  }

  const ejecutarCierreFinal = async () => {
    $q.dialog({
      title: '<span class="text-yellow text-bold">CONFIRMAR CIERRE</span>',
      message: '¿Está seguro de finalizar el turno? Esta acción es irreversible.',
      html: true,
      dark: true,
      cancel: true,
      ok: { label: 'SÍ, CERRAR CAJA', color: 'positive', unelevated: true }
    }).onOk(async () => {
      procesandoCierre.value = true
      try {
        const payload = {
          turno_id: posStore.turno.id,
          efectivo_contado: efectivoContado.value,
          diferencia: diferencia.value,
          denominaciones: denominaciones.value.map(d => ({
            label: d.label,
            valor: d.valor,
            cantidad: d.cantidad,
            subtotal: d.valor * d.cantidad
          }))
        }
        await api.post('/api/pos/cerrar-turno', payload) //

        //$q.notify({ color: 'positive', message: 'TURNO CERRADO CON ÉXITO', icon: 'lock_outline' })
        posStore.turno = null
        internalValue.value = false
        emit('closed')
      } catch (e) {
        $q.notify({ color: 'negative', message: 'Error al procesar el cierre' })
      } finally {
        procesandoCierre.value = false
      }
    })
  }

  watch(internalValue, (nuevoEstado) => {
    if (nuevoEstado) {
      cargarBalanceEsperado()
    }
  })

  onMounted(() => {
    if (internalValue.value) cargarBalanceEsperado()
  })
</script>

<style lang="scss" scoped>
  .font-mono { font-family: 'Roboto Mono', monospace; }
  .tracking-widest { letter-spacing: 0.15em; }
  .border-bottom-white-10 { border-bottom: 1px solid rgba(255,255,255,0.1); }
  .border-white-5 { border: 1px solid rgba(255,255,255,0.05); }
  .bg-blue-grey-11 { background: #1e282c; }
  .shadow-inner { box-shadow: inset 0 2px 10px rgba(0,0,0,0.5); }
  .text-shadow-blue { text-shadow: 0 0 15px rgba(77, 208, 225, 0.4); }

  .btn-premium {
    border-radius: 12px;
    transition: all 0.3s ease;
    &:hover { transform: scale(1.02); filter: brightness(1.1); }
  }

  /* Ocultar flechas del input number */
  :deep(input::-webkit-outer-spin-button),
  :deep(input::-webkit-inner-spin-button) {
    -webkit-appearance: none;
    margin: 0;
  }
</style>
