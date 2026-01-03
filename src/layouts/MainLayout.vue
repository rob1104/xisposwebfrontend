<template>
  <q-layout view="lHh Lpr lFf" class="bg-grey-2">
    <q-header elevated class="bg-primary text-white header-shadow">
      <q-toolbar class="q-py-md q-px-lg">
        <q-btn flat dense round icon="menu" @click="toggleLeftDrawer" class="q-mr-sm" />



        <q-toolbar-title>
          <div class="text-h6 text-bold ls-1">PUNTO DE VENTA - LA NACIONAL</div>
          <div class="text-caption text-red-2 text-uppercase text-weight-bolder">
            {{ auth.currentBranchName || 'Administración global' }}
          </div>
        </q-toolbar-title>

        <q-space />

        <q-btn flat no-caps class="user-profile-btn q-px-md">
          <div class="row items-center no-wrap">
            <div class="column items-start q-ml-md gt-xs">
              <div class="text-subtitle2 text-bold lh-1">{{ auth.user?.name }}</div>
              <q-badge color="white" text-color="primary" label="ADMIN" class="text-bold" size="sm" />
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
                <q-item-section class="text-bold">Configuración de Perfil</q-item-section>
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

    <q-drawer v-model="leftDrawerOpen" show-if-above bordered class="bg-white drawer-shadow">
      <q-scroll-area class="fit">
        <div class="q-pa-lg text-center drawer-header bg-white">
          <q-avatar size="100px" class="q-mb-md shadow-10 bg-white p-2">
             <q-img src="~assets/logo-nacional.png" />
          </q-avatar>
          <div class="text-h5 text-bold text-primary text-black ls-2">XisPOS</div>
          <div class="text-caption text-black text-weight-medium">Punto de venta</div>
        </div>
        <q-separator />

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
  import { ref } from 'vue'
  import { useAuthStore } from 'stores/auth'
  import { useRouter } from 'vue-router'
  import MenuPrincipal from 'components/MenuPrincipal.vue'


  const auth = useAuthStore()
  const router = useRouter()
  const leftDrawerOpen = ref(false)

  const toggleLeftDrawer = () => {
    leftDrawerOpen.value = !leftDrawerOpen.value
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


</style>
