<template>
  <q-layout view="lHh Lpr lFf" class="bg-grey-2">
    <q-header v-if="!$route.meta.hideLayout" elevated class="bg-primary text-white header-shadow">
      <q-toolbar class="q-py-md q-px-lg">
        <q-btn flat dense round icon="menu" @click="toggleLeftDrawer" class="q-mr-sm" />

        <q-toolbar-title>
          <div class="text-h6 text-bold ls-1">PUNTO DE VENTA - {{ configStore.nombreTienda }}</div>
          <div class="text-caption text-red-2 text-uppercase text-weight-bolder">
            {{ auth.currentBranchName || 'Administración global' }}
          </div>
        </q-toolbar-title>

        <q-separator dark vertical inset class="q-mx-md" v-if="auth.can('sucursales.ver')" />

      <div v-if="auth.can('sucursales.ver')" class="row items-center q-gutter-sm">
        <q-icon name="storefront" size="xs" color="white" />
        <q-select
          v-model="auth.sucursalSeleccionada"
          :options="sucursales"
          option-label="nombre"
          dense
          borderless
          dark
          options-dark
          style="min-width: 200px"
          @update:model-value="cambiarSucursal"
          class="text-weight-bold"
        >
          <template v-slot:prepend>
            <div class="text-caption text-uppercase opacity-70" style="font-size: 10px">Sucursal:</div>
          </template>
        </q-select>
      </div>
      <q-space />

        <q-btn flat no-caps class="user-profile-btn q-px-md">
          <div class="row items-center no-wrap">
            <div class="column items-start q-ml-md gt-xs">
              <div class="text-subtitle2 text-bold lh-1">{{ auth.user?.name }}</div>
              <q-badge color="white" text-color="primary" class="text-bold" size="sm">
                {{ auth.roles[0] }}
                </q-badge>
            </div>
            <q-icon name="keyboard_arrow_down" size="sm" class="q-ml-sm" />
          </div>

          <q-menu transition-show="jump-down" transition-hide="jump-up" class="shadow-10 menu-radius">
            <q-list style="min-width: 250px">
              <q-item class="bg-primary text-white q-py-lg">
                <q-item-section avatar>
                  <q-avatar size="60px" class="bg-white text-primary text-bold shadow-5">
                    {{ auth.user?.name?.charAt(0).toUpperCase() }}
                  </q-avatar>
                </q-item-section>
                <q-item-section>
                  <q-item-label class="text-h6 text-bold">{{ auth.user?.name }}</q-item-label>
                  <q-item-label class="text-caption text-red-1">{{ auth.user?.email }}</q-item-label>
                </q-item-section>
              </q-item>

              <q-separator />

              <q-item clickable v-ripple to="/perfil" class="q-py-md">
                <q-item-section avatar><q-icon name="manage_accounts" color="primary" /></q-item-section>
                <q-item-section class="text-bold">Mi Perfil</q-item-section>
              </q-item>

              <q-item clickable v-ripple @click="onLogout" class="text-negative q-py-md">
                <q-item-section avatar><q-icon name="power_settings_new" color="negative" /></q-item-section>
                <q-item-section class="text-bold">Finalizar Sesión</q-item-section>
              </q-item>
            </q-list>
          </q-menu>
        </q-btn>
      </q-toolbar>
    </q-header>

    <q-drawer
        v-if="!$route.meta.hideLayout"
        v-model="leftDrawerOpen"
        show-if-above
        bordered
        class="bg-white drawer-shadow"
        :width="280"
      >
        <q-scroll-area class="fit">
          <div class="brand-section q-pa-lg text-center">
            <div class="logo-container q-mx-auto q-mb-lg shadow-2">
              <q-img
                :src="configStore.logoUrl || 'assets/no-logo.png'"
                alt="Logo"
                spinner-color="primary"
                style="max-width: 80px"
                fit="contain"
              />
            </div>

            <div class="brand-title">
              <span class="text-h4 text-bold text-blue-grey-10">Xis</span>
              <span class="text-h4 text-weight-light text-primary">POS</span>
            </div>

            <div class="row items-center justify-center q-gutter-x-xs q-mt-xs">
              <q-badge style="font-size: 18px;" color="blue-grey-1" text-color="blue-grey-7" label="PUNTO DE VENTA" class="text-bold" />
              <div class="text-caption text-grey-9">Versión 0.1.24</div>
            </div>
          </div>

          <q-separator inset class="q-mx-md q-mb-md opacity-50" />

          <MenuPrincipal />


        </q-scroll-area>
      </q-drawer>

    <q-page-container>
      <router-view v-slot="{ Component }">
        <transition name="fade-slide" mode="out-in">
          <component :is="Component" :key="$route.path" />
        </transition>
      </router-view>
    </q-page-container>
  </q-layout>
</template>

<script setup>
  import { ref, onMounted } from 'vue'
  import { useAuthStore } from 'stores/auth'
  import { useRouter } from 'vue-router'
  import { useConfigStore } from 'stores/config'
  import { useQuasar } from 'quasar'
  import { api } from 'src/boot/axios'


  import MenuPrincipal from 'components/MenuPrincipal.vue'


  const auth = useAuthStore()
  const $q = useQuasar()
  const configStore = useConfigStore()
  const router = useRouter()
  const leftDrawerOpen = ref(false)
  const sucursales = ref([])

  const toggleLeftDrawer = () => {
    leftDrawerOpen.value = !leftDrawerOpen.value
  }

  onMounted(async () => {
    await configStore.loadConfig()
    await cargarSucursales()
  })

  const cargarSucursales = async () => {
  if (auth.can('sucursales.ver')) {
    try {
      const { data } = await api.get('/api/sucursales')
      sucursales.value = data
    } catch (e) {
      console.error('Error al cargar sucursales: ' + e.message)
    }
  }
}

  const cambiarSucursal = (nuevaSucursal) => {
    $q.loading.show({
      message: `Cambiando a sucursal: ${nuevaSucursal.nombre}...`,
      backgroundColor: 'primary'
    })

    // 1. Actualizamos el store (esto ya afecta a todos los componentes reactivos)
    auth.sucursalSeleccionada = nuevaSucursal

    // 2. Opcional: Recargar la página para limpiar estados de tablas o reportes
    setTimeout(() => {
      $q.loading.hide()
      // Si quieres que todas las tablas se refresquen forzosamente:
      window.location.reload()
    }, 500)
  }


  const onLogout = async () => {
    await auth.logout()
    router.push('/login')
  }
</script>

<style lang="scss" scoped>
  .ls-1 {
    letter-spacing: 1px
  }

  /* Estilos para la transición Fade-Slide */

  // 1. Estado de entrada (cuando llega la página)
  .fade-slide-enter-from {
    opacity: 0;
    transform: translateX(-20px); // Desliza desde la izquierda
  }

  // 2. Estado de salida (cuando se va la página)
  .fade-slide-leave-to {
    opacity: 0;
    transform: translateX(-20px); // Se desliza hacia la izquierda
  }

  // 3. Configuración de la animación (duración y suavizado)
  .fade-slide-enter-active,
  .fade-slide-leave-active {
    transition: all 0.3s ease-out;
  }

  .brand-section {
    position: relative;
    background: linear-gradient(to bottom, #ffffff 0%, #fafafa 100%);
  }

  .logo-container {
    width: 100px;
    height: 100px;
    background: white;
    border-radius: 24px; // Bordes tipo app moderna
    border: 1px solid rgba(0,0,0,0.05);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: transform 0.3s ease;

    &:hover {
      transform: rotate(-3deg) scale(1.05);
    }
  }

  .brand-title {
    letter-spacing: -1.5px; // Interletrado apretado para look premium
    line-height: 1;
  }

  .drawer-shadow {
    box-shadow: 10px 0 30px rgba(0,0,0,0.02) !important;
  }

  .font-mono {
    font-family: 'Roboto Mono', monospace;
  }

  // Suavizar la opacidad de los separadores
  .opacity-50 {
    opacity: 0.5;
  }


</style>
