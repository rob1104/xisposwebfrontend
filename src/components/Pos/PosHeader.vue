<template>
  <div class="row q-pa-md bg-dark-header shadow-10 items-center pos-header-border no-wrap">

    <div class="col-12 col-md-5">
      <q-input
        ref="scannerInput"
        v-model="barcode"
        placeholder="Escanee código o [F5] para buscar..."
        filled
        dark
        color="cyan-5"
        @keyup.enter="handleEnter"
        class="text-h6 barcode-input-dark foco-escaner shadow-2"
        autofocus
      >
        <template v-slot:prepend>
          <q-icon name="qr_code_scanner" color="cyan-5" size="sm" class="animate__animated animate__pulse animate__infinite" />
        </template>
        <template v-slot:append v-if="barcode">
          <q-icon name="close" @click="barcode = ''" class="cursor-pointer" color="grey-5" />
        </template>
      </q-input>
    </div>


    <div class="col-12 col-md-4 q-px-md row no-wrap items-center justify-center">

      <div class="column q-mr-lg">
        <div class="info-item">
          <span class="label" style="color: white; font-weight: bold;">SUCURSAL: </span>
          <span class="value text-cyan-4">{{ auth.sucursalSeleccionada?.nombre || 'S/N' }}</span>
        </div>
        <div class="info-item q-mt-xs">
          <span class="label" style="color: white; font-weight: bold;">CAJERO: </span>
          <span class="value text-yellow">{{ auth.user?.name || 'Invitado' }}</span>
        </div>
      </div>

      <q-separator vertical dark inset class="q-mx-md opacity-20" />

      <div class="column">
        <div class="info-item">
          <span class="label" style="color: white; font-weight: bold;">TURNO: </span>
          <span class="value text-amber-5">#{{ posStore.turno?.id || '---' }}</span>
        </div>
        <div class="info-item q-mt-xs client-box">
          <span class="label" style="color: white; font-weight: bold;">CLIENTE: </span>

          <span class="value text-light-green-13">
            {{ posStore.clienteSeleccionado?.nombre_comercial || 'PÚBLICO GENERAL' }}
          </span>
        </div>
      </div>
      <div class="column q-mr-lg q-ml-lg">
        <q-btn unelevated round color="blue-grey-10" text-color="red-5" icon="delete_sweep" @click="$emit('cancel-sale')">
          <q-tooltip class="bg-red-10 text-bold">CANCELAR VENTA (ESC)</q-tooltip>
        </q-btn>
      </div>
    </div>

    <div class="col-12 col-md-3 row justify-end items-center q-gutter-x-sm">
      <div class="action-container q-pa-xs">


        <q-btn unelevated round color="blue-grey-10" text-color="cyan-4" icon="search" @click="$emit('open-search')">
          <q-tooltip class="bg-cyan-10 text-bold">BUSCAR PRODUCTO (F5)</q-tooltip>
        </q-btn>

        <q-btn unelevated round color="blue-grey-10" text-color="orange-5" icon="account_balance_wallet" @click="$emit('open-cash')">
          <q-tooltip class="bg-orange-10 text-bold">MOVIMIENTOS CAJA</q-tooltip>
        </q-btn>

        <q-btn unelevated round color="negative" icon="power_settings_new" @click="$emit('close-turn')" class="shadow-5">
          <q-tooltip class="bg-black text-bold">CERRAR TURNO (CORTE X)</q-tooltip>
        </q-btn>
      </div>
    </div>

  </div>
</template>

<script setup>
  import { ref, onMounted } from 'vue'
  import { useAuthStore } from 'src/stores/auth'
  import { usePosStore } from 'src/stores/pos'


  const emit = defineEmits(['scan', 'open-search', 'open-cash', 'close-turn'])

  const auth = useAuthStore()
  const posStore = usePosStore()

  const barcode = ref('')
  const scannerInput = ref(null)


  /**
   * Procesa la entrada del teclado
   */
  const handleEnter = () => {
    if (!barcode.value) {
      //emit('open-search')
      return
    }

    // Enviamos el código al padre para que busque el producto
    emit('scan', barcode.value)

    // Limpiamos y mantenemos el foco
    barcode.value = ''
    scannerInput.value?.focus()
  }

  /**
   * Asegura que el foco siempre regrese al scanner al montar el componente
   */
  onMounted(() => {
    scannerInput.value?.focus()
  })

  // Exponemos el método de foco por si el padre necesita activarlo
  defineExpose({
    focus: () => scannerInput.value?.focus()
  })

</script>

<style lang="scss" scoped>
  /* Contenedor Principal */
  .bg-dark-header {
    background: #101619; // Un negro más profundo
    height: 90px;
  }

  .pos-header-border {
    border-bottom: 2px solid rgba(0, 188, 212, 0.3);
  }

  /* Input del Scanner */
  .barcode-input-dark :deep(.q-field__control) {
    height: 60px;
    background: #1a2327 !important;
    border-radius: 15px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    transition: all 0.3s ease;

    &:hover, &.q-field--focused {
      border-color: #00bcd4;
      box-shadow: 0 0 15px rgba(0, 188, 212, 0.2);
    }
  }

  /* Bloques de Información */
  .info-block {
    display: flex;
    flex-direction: column;
    .label {
      font-size: 0.65rem;
      font-weight: 800;
      color: #ffffff;
      letter-spacing: 1px;
    }
    .value {
      font-size: 0.85rem;
      font-weight: 700;
      text-transform: uppercase;
    }
  }

  .highlight-client {
    background: rgba(139, 195, 74, 0.05);
    padding: 2px 8px;
    border-radius: 6px;
    border-left: 3px solid #8bc34a;
  }

  /* Grupos de Botones */
  .button-group {
    background: rgba(255, 255, 255, 0.03);
    padding: 6px 12px;
    border-radius: 50px;
    display: flex;
    gap: 12px;
    border: 1px solid rgba(255, 255, 255, 0.05);
  }

  .opacity-20 { opacity: 0.2; }
</style>
