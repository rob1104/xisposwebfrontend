<template>
  <div class="row q-pa-sm bg-blue-grey-9 shadow-1 items-center">

    <div class="col-12 col-md-8 q-px-sm">
      <q-input
        ref="scannerInput"
        v-model="barcode"
        placeholder="Escanee código o presione ENTER para buscar..."
        outlined
        bg-color="white"
        color="primary"
        @keyup.enter="handleEnter"
        class="text-h5 barcode-input-light"
        autofocus
      >
        <template v-slot:prepend>
          <q-icon name="qr_code_scanner" color="primary" />
        </template>
        <template v-slot:append v-if="barcode">
          <q-icon name="close" @click="barcode = ''" class="cursor-pointer" />
        </template>
      </q-input>
    </div>

    <div class="col-12 col-md-4 row justify-end q-gutter-sm items-center q-px-sm">

      <div class="text-right q-mr-md text-white">
        <div class="text-caption text-weight-bold">
          SUCURSAL: <span class="text-cyan text-uppercase">{{ auth.sucursalSeleccionada?.nombre || 'S/N' }}</span>
        </div>
        <div class="text-caption text-weight-bold">
          CAJERO: <span class="text-cyan text-uppercase">{{ auth.user?.name || 'Invitado' }}</span>
        </div>
      </div>

      <q-btn
        unelevated
        round
        color="blue"
        icon="search"
        @click="$emit('open-search')"
      >
        <q-tooltip>Buscar Producto (F2)</q-tooltip>
      </q-btn>

      <q-btn
        unelevated
        round
        color="orange-8"
        icon="payments"
        @click="$emit('open-cash')"
      >
        <q-tooltip>Entrada/Retiro de Efectivo</q-tooltip>
      </q-btn>

      <q-btn
        unelevated
        round
        color="negative"
        icon="power_settings_new"
        @click="$emit('close-turn')"
      >
        <q-tooltip>Cerrar Turno (Corte X)</q-tooltip>
      </q-btn>
    </div>
  </div>
</template>

<script setup>
  import { ref, onMounted } from 'vue'
  import { useAuthStore } from 'src/stores/auth'

  // Emitimos los eventos hacia el padre (PosPage.vue)
  const emit = defineEmits(['scan', 'open-search', 'open-cash', 'close-turn'])

  const auth = useAuthStore()
  const barcode = ref('')
  const scannerInput = ref(null)

  /**
   * Procesa la entrada del teclado
   */
  const handleEnter = () => {
    if (!barcode.value) {
      emit('open-search')
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

  // Exponemos el método de foco por si el padre necesita activarlo remotamente
  defineExpose({
    focus: () => scannerInput.value?.focus()
  })
</script>

<style lang="scss" scoped>
  /* Estilo Premium para el input de scanner */
  .barcode-input-light :deep(.q-field__control) {
    height: 65px;
    font-size: 1.8rem;
    font-weight: bold;
    border-radius: 12px;
    box-shadow: 0 1px 5px rgba(0,0,0,0.05);
  }

  .barcode-input-light :deep(.q-field__marginal) {
    height: 65px;
  }

  /* Ajustes de tipografía para la información del cajero */
  .text-caption {
    line-height: 1.2;
  }
</style>
