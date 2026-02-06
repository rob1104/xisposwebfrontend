<template>
<q-page class="bg-dark-restaurante column overflow-hidden window-height">
    <div class="row items-center q-px-md q-py-sm bg-header shadow-2" style="min-height: 60px;">
      <div class="col">
        <div class="row text-white text-bold row items-center">
          <q-icon name="restaurant_menu" color="amber" class="q-mr-sm" size="sm" />
          <span :class="$q.screen.gt.xs ? 'text-h6' : 'text-subtitle1'">
            Restaurante
          </span>
        </div>
        <div class="text-caption text-grey-4" v-if="$q.screen.gt.xs">
          {{ sucursalNombre }} | {{ fechaActual }}
        </div>
        <div class="text-caption text-grey-4" v-else>
          {{ sucursalNombre }}
        </div>
      </div>

      <div class="col-auto row items-center q-gutter-x-sm">
        <q-btn
              v-if="vistaActual === 'comanda'"
              flat
              :round="$q.screen.lt.sm"
              icon="arrow_back"
              :label="$q.screen.gt.xs ? 'Mesas' : ''"
              color="white"
              @click="cerrarComanda">
              <q-tooltip>Volver a Mesas</q-tooltip>
            </q-btn>
        <q-btn
          flat
          round
          icon="apps"
          color="white"
          @click="router.push('/dashboard')"
        >
          <q-tooltip>Salir al Dashboard</q-tooltip>
        </q-btn>
        <q-btn
              flat
              round
              :icon="$q.fullscreen.isActive ? 'fullscreen_exit' : 'fullscreen'"
              :color="$q.fullscreen.isActive ? 'negative' : 'white'"
              @click="$q.fullscreen.toggle()"
              class="gt-xs">
              <q-tooltip>Pantalla Completa</q-tooltip>
        </q-btn>
      </div>

    </div>

    <div class="col relative-position overflow-hidden">
      <transition
        enter-active-class="animated fadeIn"
        leave-active-class="animated fadeOut"
        mode="out-in"
      >
        <RestMapaMesas
          v-if="vistaActual === 'mesas'"
          @seleccionar="alSeleccionarMesa"
          @para-llevar="abrirParaLlevar"
        />

        <RestComandaView
          v-else
          :mesa="mesaSeleccionada"
          :orden-id="ordenActivaId"
          :mesero="meseroActivo"
          @finalizar="alTerminarOrden"
        />
      </transition>
    </div>

    <RestMeseroDialog
      v-model="showMeseroDialog"
      @confirmar="iniciarOrden"
    />

  </q-page>
</template>

<script setup>
  import { ref, computed } from 'vue'
  import { useAuthStore } from 'src/stores/auth'
  import { date, useQuasar } from 'quasar'
  import { api } from 'src/boot/axios'
  import { useRouter } from 'vue-router'
  import RestMapaMesas from 'components/Restaurante/RestMapaMesas.vue'
  import RestComandaView from 'components/Restaurante/RestComandaView.vue'
  import RestMeseroDialog from 'components/Restaurante/RestMeseroDialog.vue'


  const authStore = useAuthStore()
  const $q = useQuasar()
  const router = useRouter()

  // Estado
  const vistaActual = ref('mesas') // 'mesas' | 'comanda'
  const showMeseroDialog = ref(false)
  const mesaSeleccionada = ref(null) // Objeto mesa
  const ordenActivaId = ref(null) // ID de la orden (null si es nueva)
  const meseroActivo = ref(null)

  // Computed
  const sucursalNombre = computed(() => authStore.sucursalSeleccionada?.nombre || 'Sucursal Principal')
  const fechaActual = computed(() => date.formatDate(Date.now(), 'DD MMMM YYYY'))

  // Lógica
  const alSeleccionarMesa = (mesa) => {
    mesaSeleccionada.value = mesa

    if (mesa.ocupada) {
      // Si está ocupada, cargamos la orden existente directa
      // (Asumimos que el componente mapa nos pasa el ID de orden si existe, o lo buscamos)
      abrirComandaExistente(mesa.id)
    } else {
      // Si está libre, pedimos mesero
      meseroActivo.value = authStore.user // Por defecto el usuario logueado
      showMeseroDialog.value = true
    }
  }

  const abrirParaLlevar = () => {
    mesaSeleccionada.value = null // Null indica "Para Llevar"
    meseroActivo.value = authStore.user
    iniciarOrden(authStore.user) // Saltamos dialogo o lo mostramos si quieres cambiar mesero
  }

  const iniciarOrden = async(usuarioMesero) => {
    meseroActivo.value = usuarioMesero
    showMeseroDialog.value = false
    if (mesaSeleccionada.value) {
        await abrirComandaExistente(mesaSeleccionada.value.id)
    } else {
        vistaActual.value = 'comanda'
    }
  }

  const abrirComandaExistente = async (mesaId) => {
    $q.loading.show({ message: 'Abriendo mesa...' })
    try {
        const { data } = await api.post('/api/restaurante/abrir-orden', {
            mesa_id: mesaId,
            mesero_id: meseroActivo.value?.id
        })

        ordenActivaId.value = data.id
        vistaActual.value = 'comanda' // Cambiamos de vista YA con ID de orden
    } catch (e) {
        $q.notify({ message: 'Error al abrir mesa', color: 'negative' })
    } finally {
        $q.loading.hide()
    }
  }

  const cerrarComanda = () => {
    vistaActual.value = 'mesas'
    mesaSeleccionada.value = null
    ordenActivaId.value = null
  }

  const alTerminarOrden = () => {
    // Cuando se cierra la cuenta o se imprime ticket final
    cerrarComanda()
  }
</script>

<style scoped>
  .bg-dark-restaurante {
    background: radial-gradient(circle at center, #2c3e50, #000000);
  }
  .bg-header {
    background: rgba(255,255,255,0.05);
    backdrop-filter: blur(10px);
    border-bottom: 1px solid rgba(255,255,255,0.1);
  }
</style>
