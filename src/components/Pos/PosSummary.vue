<template>
  <q-card class="summary-card text-white full-height flex flex-center shadow-8" flat>
    <q-card-section class="full-width q-pa-xl full-height column no-wrap">

      <div class="text-center q-mb-lg">
        <div class="text-overline text-blue-grey-2 letter-spacing-2">Resumen de Venta</div>
        <div class="text-h6 text-grey-4 q-mt-sm">Total a Pagar</div>

        <div class="total-container q-py-md">
          <span class="currency text-h4 text-light-green-13 text-weight-light">$</span>
          <span class="text-h2 text-bold text-light-green-13 tracking-tight">
            {{ resumen.total.toFixed(2) }}
          </span>
        </div>

        <q-badge outline color="blue-grey-2" class="q-pa-sm q-px-md text-subtitle2 text-weight-medium glass-badge">
          <q-icon name="inventory_2" size="xs" class="q-mr-xs" />
          {{ count }} Artículos
        </q-badge>
      </div>

      <div class="column q-gutter-y-xs q-pt-md">
        <div class="text-overline text-grey text-bold letter-spacing-1 q-mb-xs">
          Desglose de Venta
        </div>

        <div class="row justify-between items-center text-grey-5">
          <span class="text-overline">Subtotal:</span>
          <span class="text-subtitle1 font-mono text-white text-bold">
            $ {{ resumen.subtotal.toFixed(2) }}
          </span>
        </div>

        <div class="row justify-between items-center text-grey-5">
          <span class="text-overline">Impuestos:</span>
          <span class="text-subtitle1 font-mono text-white text-bold">
            $ {{ resumen.impuestos.toFixed(2) }}
          </span>
        </div>

        <q-separator dark class="q-my-sm opacity-20" />
      </div>

      <q-separator dark dense class="q-my-xl opacity-2" />

      <div class="q-gutter-y-md">
        <q-btn
          unelevated
          color="primary"
          class="full-width pay-btn text-bold shadow-4"
          @click="$emit('pay')"
        >
          <div class="row items-center justify-between full-width q-px-md">
            <span class="text-h6">COBRAR</span>
            <div class="row items-center">
              <span class="text-caption q-mr-sm text-weight-light text-uppercase">F12</span>
              <q-icon name="arrow_forward_ios" size="xs" />
            </div>
          </div>
        </q-btn>

        <q-btn
          flat
          no-caps
          color="orange-3"
          icon="delete_sweep"
          label="Vaciar venta"
          class="clear-btn full-width text-weight-regular opacity-7 hover-opacity-10 q-mt-xl"
          @click="$emit('clear')"
        />
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup>
  defineProps(['resumen', 'count'])
  defineEmits(['pay', 'clear'])
</script>

<style scoped lang="scss">
  .summary-card {
    /* Gradiente premium oscuro */
    background: linear-gradient(145deg, #263238 0%, #1a2327 100%);
    border-radius: 24px;
    border: 1px solid rgba(255, 255, 255, 0.05);
    overflow: hidden;
  }

  .total-container {
    display: flex;
    align-items: baseline;
    justify-content: center;
    gap: 4px;
  }

  .letter-spacing-2 {
    letter-spacing: 2px;
  }

  .tracking-tight {
    letter-spacing: -2px;
  }

  .glass-badge {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
  }

  .pay-btn {
    height: 70px;
    border-radius: 16px;
    transition: transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);

    &:hover {
      transform: scale(1.02);
    }

    &:active {
      transform: scale(0.98);
    }
  }

  .clear-btn {
    transition: all 0.3 ease;
    border-radius: 12px;
    &:hover {
      background-color: rgba(255, 87, 34, 0.05) !important;
    }
  }

  .opacity-2 { opacity: 0.2; }
  .opacity-7 { opacity: 0.7; }
  .hover-opacity-10:hover { opacity: 1; }

  /* Efecto de borde superior sutil en lugar de grueso */
  .summary-card::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: var(--q-primary);
    opacity: 0.8;
  }
</style>
