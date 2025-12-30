<template>
  <q-layout view="lHh Lpr lFf" class="bg-grey-1">
    <q-header elevated class="bg-primary text-white">
      <q-toolbar class="q-py-sm">
        <q-btn flat dense round icon="menu" @click="toggleLeftDrawer" />

        <q-toolbar-title>
          <div class="text-weight-bold">LA NACIONAL</div>
          <div class="text-caption text-grey-3" style="line-height: 10px;">
            Sucursal: {{ auth.currentBranchName || 'Sin sucursal' }}
          </div>
        </q-toolbar-title>

        <q-space />

        <q-btn flat no-caps>
          <div class="row items-center no-wrap">
            <q-avatar size="32px" color="white" text-color="primary" class="q-mr-sm shadow-2">
              {{ auth.user?.name?.charAt(0).toUpperCase() }}
            </q-avatar>
            <div class="column items-start gt-xs">
              <div class="text-subtitle2 text-bold" style="line-height: 1.1">
                {{ auth.user?.name }}
              </div>
              <div class="text-caption text-grey-4">Administrador</div>
            </div>
            <q-icon name="keyboard_arrow_down" size="sm" class="q-ml-xs" />
          </div>

          <q-menu transition-show="jump-down" transition-hide="jump-up" class="shadow-10">
            <q-list style="min-width: 220px">
              <q-item class="bg-grey-2 q-py-md">
                <q-item-section avatar>
                  <q-avatar color="primary" text-color="white">
                    {{ auth.user?.name?.charAt(0).toUpperCase() }}
                  </q-avatar>
                </q-item-section>
                <q-item-section>
                  <q-item-label class="text-bold">{{ auth.user?.name }}</q-item-label>
                  <q-item-label caption>{{ auth.user?.email }}</q-item-label>
                </q-item-section>
              </q-item>

              <q-separator />

              <q-item clickable v-ripple to="/perfil">
                <q-item-section avatar><q-icon name="person" color="primary" /></q-item-section>
                <q-item-section>Mi Perfil</q-item-section>
              </q-item>

              <q-item clickable v-ripple @click="onLogout" class="text-negative">
                <q-item-section avatar><q-icon name="logout" color="negative" /></q-item-section>
                <q-item-section>Cerrar Sesión</q-item-section>
              </q-item>
            </q-list>
          </q-menu>
        </q-btn>
      </q-toolbar>
    </q-header>

    <q-drawer v-model="leftDrawerOpen" show-if-above bordered class="bg-white shadow-2">
      <q-scroll-area class="fit">
        <div class="q-pa-lg text-center bg-grey-2">
          <q-icon name="point_of_sale" size="56px" color="primary" />
          <div class="text-h6 text-bold text-primary q-mt-sm">XisPOS</div>
          <div class="text-caption text-grey-7">Gestión Global v1.0</div>
        </div>

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
  import MenuPrincipal from 'src/components/MenuPrincipal.vue'

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
