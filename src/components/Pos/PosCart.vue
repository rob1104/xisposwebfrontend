<template>
  <q-table
    :rows="items"
    :columns="columns"
    row-key="uniqueId"
    flat dark bordered
    class="bg-blue-grey-9 pos-table full-height"
    virtual-scroll
    :pagination="{ rowsPerPage: 0 }"
    no-data-label="Esperando primer artículo..."
  >
    <template v-slot:body-cell-index="props">
      <q-td :props="props" class="text-grey-5">
        {{ props.rowIndex + 1 }}
      </q-td>
    </template>

    <template v-slot:body-cell-nombre="props">
      <q-td :props="props">
        <div class="text-bold text-h6 text-uppercase">{{ props.value }}</div>
        <div class="text-caption text-cyan text-bold">
          {{ props.row.codigo_barras }}
        </div>
      </q-td>
    </template>

    <template v-slot:body-cell-precio="props">
      <q-td :props="props" class="text-bold text-yellow" style="font-size: 20px;">
        $ {{ (props.value * 1).toFixed(2) }}
      </q-td>
    </template>

    <template v-slot:body-cell-cantidad="props">
      <q-td :props="props">
        <div class="row no-wrap items-center justify-center q-gutter-x-sm">
          <q-btn
            size="sm" round color="grey-8" icon="remove"
            @click="$emit('decrement', props.row)"
          />
          <span class="text-h6 text-bold">{{ props.value }}</span>
          <q-btn
            size="sm" round color="primary" icon="add"
            @click="$emit('increment', props.row)"
          />
        </div>
      </q-td>
    </template>

    <template v-slot:body-cell-total="props">
      <q-td :props="props" class="text-h6 text-bold text-pink-3" style="font-size: 20px;">
        $ {{ (props.row.precio * props.row.cantidad).toFixed(2) }}
      </q-td>
    </template>
  </q-table>
</template>

<script setup>
  defineProps(['items'])
  defineEmits(['increment', 'decrement'])

  const columns = [
    { name: 'index', label: '#', align: 'left', field: 'id' },
    { name: 'nombre', label: 'DESCRIPCIÓN', field: 'nombre', align: 'left' },
    { name: 'precio', label: 'PRECIO', field: 'precio', align: 'right' },
    { name: 'cantidad', label: 'CANT.', field: 'cantidad', align: 'center' },
    { name: 'total', label: 'TOTAL', align: 'right' }
  ]
</script>

<style scoped>
/* Estilo para que la tabla sea consistente con el diseño sofisticado */
.pos-table :deep(thead tr th) {
  background-color: #263238;
  font-weight: bold;
  font-size: 1.1rem;
}
</style>
