<template>
  <q-dialog
    v-model="internalValue"
    persistent
    backdrop-filter="blur(10px) brightness(30%)"
  >
    <q-card
        style="width: 100%; max-width: 1000px; max-height: 90vh;"
        class="bg-blue-grey-10 text-white overflow-hidden shadow-24 column no-wrap"
>

      <q-card-section class="bg-blue-grey-9 q-pa-lg row items-center border-bottom-white-10">
        <q-avatar color="primary" text-color="white" icon="analytics" size="50px" class="shadow-5" />
        <div class="q-ml-md">
          <div class="text-h5 text-bold tracking-widest uppercase">Cierre de Caja</div>
          <div class="text-h5 text-blue-grey-3">CORTE X - TURNO #{{ posStore.turno?.id }}</div>
        </div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup color="blue-grey-4" />
      </q-card-section>

      <q-card-section class="row q-col-gutter-md q-pa-md scroll col">

        <div class="col-12 col-md-7">
          <div class="row items-center q-mb-md">
            <div class="text-h6 text-yellow text-bold">Conteo</div>
            <q-space />
            <q-badge outline color="white" :label="`T.C. HOY: $${posStore.turno?.tipo_cambio}`" class="q-pa-xs" />
          </div>

          <q-scroll-area
              :style="$q.screen.lt.md ? 'height: 40vh;' : 'height: 69vh;'"
              class="rounded-borders bg-blue-grey-9 q-pa-md shadow-inner"
            >

            <q-card flat class="bg-blue-grey-11 q-pa-md q-mb-lg border-usd rounded-borders shadow-3">
              <div class="row items-center q-col-gutter-md">
                <q-item-section avatar>
                  <q-icon name="language" color="yellow-9" size="md" />
                </q-item-section>

                <q-item-section>
                  <q-item-label class="text-bold text-yellow-9 text-subtitle1">Dólares (USD)</q-item-label>
                  <q-item-label caption class="text-grey-5">Billetes / Monedas americanos</q-item-label>
                </q-item-section>

                <q-item-section side style="width: 130px;">
                  <q-input
                    v-model.number="dolaresCantidad"
                    type="number"
                    oninput="if(this.value < 0) this.value = 0;"
                    dark filled dense
                    input-class="text-center text-bold text-h6 text-yellow-9 font-mono"
                    @focus="$event.target.select()"
                  />
                </q-item-section>

                <q-item-section side class="text-right" style="min-width: 140px;">
                  <div class="text-caption text-grey-5 uppercase">En Pesos</div>
                  <div class="text-h6 text-bold text-white font-mono">
                    ${{ formatMoney(dolaresCantidad * posStore.turno?.tipo_cambio) }}
                  </div>
                </q-item-section>
              </div>
            </q-card>

            <q-card flat class="bg-blue-grey-11 q-pa-md q-mb-lg border-usd rounded-borders shadow-3">
              <div class="row items-center q-col-gutter-md">
                <q-item-section avatar>
                  <q-avatar color="cyan-9" text-color="white" icon="credit_card" />
                </q-item-section>

                <q-item-section class="text-bold text-yellow-9 text-subtitle1">
                  <q-item-label class="text-bold text-cyan-4 text-subtitle1">Ventas con Tarjeta</q-item-label>
                  <q-item-label caption class="text-grey-5">Suma de vouchers o reporte de terminal</q-item-label>
                </q-item-section>

                <q-item-section side style="width: 130px;">
                  <q-input
                    v-model.number="tarjetaContado"
                    type="number"
                    dark filled dense
                    prefix="$"
                    oninput="if(this.value < 0) this.value = 0;"
                    input-class="text-center text-bold text-h6 text-cyan-4 font-mono"
                    @focus="$event.target.select()"
                  />
                </q-item-section>

                <q-item-section side class="text-right" style="min-width: 140px;">
                  <div class="text-caption text-grey-5 uppercase">Esperado Sistema</div>
                  <div class="text-h6 text-bold text-white font-mono">
                    ${{ formatMoney(tarjetaEsperado) }}
                  </div>
                </q-item-section>
              </div>
            </q-card>

            <div class="text-overline text-grey-5 q-mb-sm">Denominaciones MXN</div>
            <q-list separator dark>
              <q-item v-for="den in denominaciones" :key="den.valor" class="q-py-sm">
                <q-avatar
                  :color="den.valor >= 100 ? 'primary' : 'blue-grey-7'"
                  text-color="white"
                  size="48px"
                  class="text-bold shadow-3 border-white-1"
                >
                  <span :class="[
                    'font-mono',
                    den.valor >= 2000 ? 'text-caption-custom' : 'text-subtitle2'
                  ]">
                    ${{ den.valor }}
                  </span>
                </q-avatar>

                <q-item-section>
                  <q-item-label class="text-subtitle1 text-bold">{{ den.label }}</q-item-label>
                </q-item-section>

                <q-item-section side>
                  <q-input
                    v-model.number="den.cantidad"
                    type="number"
                    dark
                    outlined
                    dense
                    oninput="if(this.value < 0) this.value = 0;"
                    style="width: 100px; background-color:rosybrown";
                    input-class="text-center text-bold font-mono"
                    @focus="$event.target.select()"
                  />
                </q-item-section>

                <q-item-section side class="text-right" style="width: 140px;">
                  <div class="text-h6 text-bold text-white font-mono text-cyan-4">
                    ${{ formatMoney(den.valor * (den.cantidad || 0)) }}
                  </div>
                </q-item-section>
              </q-item>
            </q-list>
          </q-scroll-area>
        </div>

        <div class="col-12 col-md-5">
          <q-card flat class="bg-blue-grey-9 q-pa-md full-height border-white-5 rounded-borders shadow-10">
            <div class="text-h6 text-bold text-center text-yellow q-mb-lg border-bottom-white-10 q-pb-sm uppercase tracking-widest">
              Resumen  <q-btn label="movimientos" @click="dialogMovimientosLista = true" />
            </div>

            <div class="q-gutter-y-md">
              <div class="row justify-between items-center bg-blue-grey-10 q-pa-md rounded-borders">
                <span class="text-grey-4">Ventas Efectivo:</span>
                <span class="text-h6 font-mono text-light-green">${{ formatMoney(ventasEfectivo) }}</span>

                <span class="text-grey-4">Total de entradas extra en caja:</span>
                <span class="text-h6 text-light-green font-mono">${{ formatMoney(totalEntradas) }}</span>

                <span class="text-grey-4">Total de retiros de caja:</span>
                <span class="text-h6 text-red font-mono">${{ formatMoney(totalRetiros) }}</span>

                <span class="text-grey-4">Efectivo esperado en caja:</span>
                <span class="text-h6 font-mono">${{ formatMoney(totalEsperado - tarjetaEsperado) }}</span>
              </div>

              <div class="row justify-between items-center bg-blue-grey-10 q-pa-md rounded-borders">
                <span class="text-grey-4">Efectivo Físico (Contado):</span>
                <span class="text-h6 font-mono text-cyan-4 text-bold">${{ formatMoney(efectivoContado) }}</span>
              </div>

              <q-separator dark class="q-my-md" />

              <div class="q-gutter-y-sm">
                <div class="row justify-between text-caption">
                  <span class="text-grey-5">Diferencia Efectivo:</span>
                  <span :class="diferenciaEfectivo < 0 ? 'text-orange' : 'text-green'">
                      {{ diferenciaEfectivo >= 0 ? '+' : '' }}${{ formatMoney(diferenciaEfectivo) }}
                  </span>
                </div>

                <div class="row justify-between text-caption">
                  <span class="text-grey-5">Diferencia Tarjeta:</span>
                  <span :class="diferenciaTarjeta < 0 ? 'text-red' : 'text-green'">
                      {{ diferenciaTarjeta >= 0 ? '+' : '' }}${{ formatMoney(diferenciaTarjeta) }}
                  </span>
                </div>

                <div :class="['q-pa-md rounded-borders text-center shadow-5 q-mt-md', diferenciaTotal >= 0 ? 'bg-green-10' : 'bg-red-10']">
                  <div class="text-overline text-white opacity-80 uppercase tracking-widest">Diferencia Total</div>
                  <div class="text-h3 text-bold font-mono text-white">
                    {{ diferenciaTotal >= 0 ? '+' : '' }}{{ formatMoney(diferenciaTotal) }}
                  </div>
                </div>
              </div>

              <div class="q-pt-md">
                <q-btn
                  label="PROCESAR CIERRE DE TURNO"
                  color="blue"
                  class="full-width q-py-lg text-bold text-subtitle1 border-radius-15 shadow-8"
                  unelevated
                  :loading="procesandoCierre"
                  @click="ejecutarCierreFinal"
                >
                  <q-icon right name="lock_open" class="q-ml-sm" />
                </q-btn>
                <div class="text-center q-mt-md text-caption text-grey-6 italic">
                  * Al confirmar, el turno se cerrará
                </div>
              </div>
            </div>
          </q-card>
        </div>
      </q-card-section>
    </q-card>
    <q-dialog v-model="dialogMovimientosLista">
      <div class="q-mt-lg">
        <q-card class="bg-blue-grey-10 text-white overflow-hidden shadow-24 column no-wrap">
          <q-card-section >
            <div class="text-h6 text-cyan-4 q-mb-sm tracking-widest row items-center">
            <q-icon name="list" class="q-mr-sm" />
            Detalle de Movimientos del Turno
            <q-btn dense flat icon="close" v-close-popup>
            <q-tooltip class="bg-white text-primary">Close</q-tooltip>
          </q-btn>
            </div>
          </q-card-section>
        </q-card>

        <q-card-section class="bg-blue-grey-9 q-pa-lg row items-center border-bottom-white-10">
          <q-list bordered separator dark class="rounded-borders">
                    <q-item v-for="mov in movimientos" :key="mov.id" class="q-py-md">
                      <q-item-section avatar>
                        <q-icon
                          :name="mov.tipo === 'Entrada' ? 'add_circle' : 'remove_circle'"
                          :color="mov.tipo === 'Entrada' ? 'cyan-4' : 'orange-5'"
                        />
                      </q-item-section>

                      <q-item-section>
                        <q-item-label class="text-bold">{{ mov.concepto }}</q-item-label>
                        <q-item-label caption class="text-grey-5">{{ mov.tipo }} registrada a las {{ new Date(mov.created_at).toLocaleTimeString() }}</q-item-label>
                      </q-item-section>

                      <q-item-section side>
                        <div :class="['text-h6 font-mono text-bold', mov.tipo === 'Entrada' ? 'text-cyan-4' : 'text-orange-5']">
                          {{ mov.tipo === 'Entrada' ? '+' : '-' }}${{ formatMoney(mov.monto) }}
                        </div>
                      </q-item-section>
                    </q-item>

                <q-item v-if="movimientos.length === 0">
                <q-item-section class="text-center text-grey-6 italic">
                   No se registraron movimientos manuales en este turno.
                </q-item-section>
              </q-item>
            </q-list>
        </q-card-section>


      </div>
    </q-dialog>
  </q-dialog>
</template>

<script setup>
  import { ref, computed, watch, onMounted } from 'vue'
  import { usePosStore } from 'src/stores/pos'
  import { useQuasar } from 'quasar'
  import { api } from 'boot/axios'

  const props = defineProps(['modelValue'])
  const emit = defineEmits(['update:modelValue', 'closed'])

  const $q = useQuasar()
  const posStore = usePosStore()
  const totalEsperado = ref(0)
  const efectivoContado = ref(0)
  const procesandoCierre = ref(false)
  const tarjetaEsperado = ref(0)
  const tarjetaContado = ref(0)
  const efectivoEsperado = ref(0)

  //Movimientos de caja
  const movimientos = ref([])
  const totalEntradas = ref(0)
  const totalRetiros = ref(0)
  const ventasEfectivo = ref(0)

  // CAPTURA DE DÓLARES
  const dolaresCantidad = ref(0)

  const dialogMovimientosLista = ref(false)

  const internalValue = computed({
    get: () => props.modelValue,
    set: (val) => emit('update:modelValue', val)
  })

  const resetArqueo = () => {
    // 1. Ponemos en cero todas las denominaciones MXN
    denominaciones.value.forEach(d => {
      d.cantidad = 0
    })

    // 2. Reseteamos dólares y tarjetas
    dolaresCantidad.value = 0
    tarjetaContado.value = 0

    // 3. Reseteamos el total contado acumulado
    efectivoContado.value = 0
  }

  watch(internalValue, (abierto) => {
    if (abierto) {
      // Primero limpiamos los datos anteriores
      resetArqueo()

      // Luego cargamos los datos nuevos del servidor
      cargarBalanceEsperado()
    }
  })

  const denominaciones = ref([
    { label: 'Billete $1000', valor: 1000, cantidad: 0 },
    { label: 'Billete $500',  valor: 500,  cantidad: 0 },
    { label: 'Billete $200',  valor: 200,  cantidad: 0 },
    { label: 'Billete $100',  valor: 100,  cantidad: 0 },
    { label: 'Billete $50',   valor: 50,   cantidad: 0 },
    { label: 'Billete $20',   valor: 20,   cantidad: 0 },
    { label: 'Moneda $10',    valor: 10,   cantidad: 0 },
    { label: 'Moneda $5',     valor: 5,    cantidad: 0 },
    { label: 'Moneda $2',     valor: 2,    cantidad: 0 },
    { label: 'Moneda $1',     valor: 1,    cantidad: 0 },
    { label: 'Centavos',      valor: 0.50, cantidad: 0 }
  ])

  const diferencia = computed(() => efectivoContado.value - totalEsperado.value)
  const diferenciaEfectivo = computed(() => efectivoContado.value - efectivoEsperado.value)
  const diferenciaTarjeta = computed(() => tarjetaContado.value - tarjetaEsperado.value)
  const diferenciaTotal = computed(() => diferenciaEfectivo.value + diferenciaTarjeta.value)

  const formatMoney = (val) => {
    return Number(val || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }

  const cargarBalanceEsperado = async () => {
    try {
      const { data } = await api.get(`/api/pos/balance-turno/${posStore.turno.id}`)

      ventasEfectivo.value = data.ventas_efectivo
      tarjetaEsperado.value = data.tarjeta_esperado
      movimientos.value = data.movimientos || []
      totalEntradas.value = data.total_entradas || 0
      totalRetiros.value = data.total_retiros || 0
      efectivoEsperado.value = (ventasEfectivo.value + totalEntradas.value) - totalRetiros.value
      totalEsperado.value = efectivoEsperado.value + tarjetaEsperado.value

    } catch (e) {
      console.error("Error al obtener balance: " + e.message)
    }
  }

  // WATCHER: Suma denominaciones MXN + Dólares convertidos
  watch([denominaciones, dolaresCantidad], () => {
    const totalPesos = denominaciones.value.reduce((acc, d) => acc + (d.valor * (parseFloat(d.cantidad) || 0)), 0)
    const valorDolaresEnPesos = dolaresCantidad.value * (posStore.turno?.tipo_cambio || 1)

    efectivoContado.value = totalPesos + valorDolaresEnPesos
  }, { deep: true })

  const ejecutarCierreFinal = async () => {
    $q.dialog({
      title: 'Confirmar Cierre',
      message: '¿Está seguro de finalizar el turno? Esta acción es irreversible.',
      dark: true,
      persistent: true,
      ok: { label: 'Si, Cerrar Caja', color: 'primary', unelevated: true },
      cancel: { label: 'Cancelar', flat: true, color: 'grey-5' }
    }).onOk(async () => {
      procesandoCierre.value = true
      try {

        const desgloseMXN = denominaciones.value.map(d => ({
          label: d.label,
          valor: d.valor,
          cantidad: d.cantidad || 0,
          subtotal: d.valor * (d.cantidad || 0)
        }))


        const filaDolares = {
          label: "Dolares (USD)",
          valor: posStore.turno?.tipo_cambio || 1,
          cantidad: dolaresCantidad.value || 0,
          subtotal: Number((dolaresCantidad.value * (posStore.turno?.tipo_cambio || 1)).toFixed(2))
        }

        const payload = {
          turno_id: posStore.turno.id,
          efectivo_contado: efectivoContado.value,
          diferencia: diferencia.value,
          tarjeta_contado: tarjetaContado.value, // <--- NUEVO
          tarjeta_esperado: tarjetaEsperado.value, // <--- PARA AUDITORÍA
          denominaciones: [...desgloseMXN, filaDolares],
        }

        await api.post('/api/pos/cerrar-turno', payload)

        // === IMPRESIÓN TICKET ===
        $q.notify({ message: 'Imprimiendo Ticket de Corte...', color: 'info', icon: 'print' })
        try {
           await PrintService.imprimirCorteCaja(posStore.turno.id)
        } catch(printErr) {
           $q.notify({ type: 'warning', message: 'Corte guardado, pero falló la impresión' })
        }
        // ===================================

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
    if (nuevoEstado) cargarBalanceEsperado()
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
  .border-radius-15 { border-radius: 15px; }

  .border-usd {
    border: 1px solid rgba(242, 192, 55, 0.4) !important;
    background: linear-gradient(135deg, rgba(242, 192, 55, 0.05) 0%, rgba(30, 40, 44, 1) 100%) !important;
  }
</style>
