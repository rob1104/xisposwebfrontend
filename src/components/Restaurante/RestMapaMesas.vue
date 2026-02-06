<template>
  <div class="full-height q-pa-md overflow-auto">

    <div class="row q-mb-lg justify-end">
      <q-btn
        push color="deep-orange" icon="takeout_dining"
        label="NUEVA ORDEN PARA LLEVAR"
        class="q-py-sm q-px-lg text-bold"
        size="lg"
        @click="$emit('para-llevar')"
      />
    </div>

    <div v-if="cargando" class="row justify-center q-mt-xl">
      <q-spinner-orbit color="amber" size="4em" />
    </div>

    <div v-else class="row q-col-gutter-lg">
      <div
        v-for="mesa in mesas"
        :key="mesa.id"
        class="col-xs-6 col-sm-4 col-md-3 col-lg-2"
      >
        <q-card
          v-ripple
          class="mesa-card column flex-center cursor-pointer transition-generic"
          :class="mesa.ocupada ? 'bg-ocupada' : 'bg-libre'"
          @click="$emit('seleccionar', mesa)"
        >
          <q-icon
            :name="mesa.ocupada ? 'restaurant' : 'table_restaurant'"
            size="3em"
            class="q-mb-sm opacity-80"
          />
          <div class="text-h6 text-bold text-center leading-tight">{{ mesa.nombre }}</div>
          <div class="text-caption text-uppercase q-mt-xs badge-status">
            {{ mesa.ocupada ? 'OCUPADA' : 'DISPONIBLE' }}
          </div>

          <div v-if="mesa.ocupada" class="text-caption text-yellow q-mt-sm text-bold">
            $ {{ mesa.total_actual || '0.00' }}
          </div>
        </q-card>
      </div>
    </div>
  </div>
</template>

<script setup>
  import { ref, onMounted, onUnmounted } from 'vue'
  import { api } from 'src/boot/axios'

  const emit = defineEmits(['seleccionar', 'para-llevar'])
  const mesas = ref([])
  const cargando = ref(true)

  let intervaloPolling = null

  const cargarMesas = async (esBackground = false) => {
    if (!esBackground) cargando.value = true
    try {
      const { data } = await api.get('/api/restaurante/mesas')
      mesas.value = data
    } catch (e) {
      console.error("Error sincronizando mesas:", e)
    } finally {
      cargando.value = false
    }
  }

  onMounted(() => {
    cargarMesas()
    intervaloPolling = setInterval(() => {
    cargarMesas(true)
    }, 10000)
  })

  onUnmounted(() => {
    if (intervaloPolling) {
      clearInterval(intervaloPolling)
    }
  })

</script>

<style scoped>
  .mesa-card {
    height: 160px;
    border-radius: 20px;
    color: white;
    box-shadow: 0 4px 15px rgba(0,0,0,0.3);
    border: 1px solid rgba(255,255,255,0.1);
  }
  .mesa-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 25px rgba(0,0,0,0.4);
  }
  .bg-libre {
    background: linear-gradient(135deg, #11998e, #38ef7d); /* Verde Premium */
  }
  .bg-ocupada {
    background: linear-gradient(135deg, #cb2d3e, #ef473a); /* Rojo Premium */
  }
  .badge-status {
    background: rgba(0,0,0,0.2);
    padding: 2px 8px;
    border-radius: 10px;
  }
</style>
