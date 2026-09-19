<template>
  <q-layout view="lHh Lpr lFf" class="bg-grey-1">

    <q-header
      v-if="!$route.meta.hideLayout"
      class="bg-primary text-white header-premium"
    >
      <q-toolbar class="q-py-sm q-px-lg">

        <q-btn flat dense round icon="menu" color="white" @click="toggleLeftDrawer" class="q-mr-md" />

        <q-toolbar-title>
          <div class="row items-center">
            <div class="text-h6 text-bold ls-1 text-white">
              {{ configStore.nombreTienda }}
              <span class="text-weight-light text-white" style="opacity: 0.8">POS</span>
            </div>

            <q-badge
              v-if="auth.currentBranchName"
              color="white" text-color="primary"
              class="q-ml-md text-weight-bold q-py-xs q-px-sm shadow-1"
              rounded
            >
              {{ auth.currentBranchName }}
            </q-badge>
          </div>
        </q-toolbar-title>

        <div v-if="auth.can('sucursales.ver')" class="row items-center q-gutter-sm q-mr-lg gt-xs">
          <q-select
            v-model="auth.sucursalSeleccionada"
            :options="sucursales"
            option-label="nombre"
            option-value="id"
            dense borderless
            options-dense
            color="white"
            class="branch-select"
            @update:model-value="cambiarSucursal"
          >
            <template v-slot:prepend>
              <q-icon name="storefront" size="xs" color="white" />
            </template>
            <template v-slot:selected>
              <div class="text-weight-bold text-white">{{ auth.sucursalSeleccionada?.nombre || 'Seleccionar' }}</div>
            </template>
          </q-select>
        </div>

        <q-separator vertical inset class="q-mx-md bg-white" style="opacity: 0.3" v-if="auth.can('sucursales.ver')" />

        <q-btn flat no-caps class="q-pl-sm q-pr-xs rounded-borders hover-effect text-white">
          <div class="row items-center no-wrap">
            <q-avatar size="36px" class="bg-white text-primary shadow-2 text-bold">
              {{ auth.user?.name?.charAt(0).toUpperCase() }}
            </q-avatar>

            <div class="column items-start q-ml-sm gt-xs">
              <div class="text-subtitle2 text-bold lh-1 text-white">{{ auth.user?.name }}</div>
              <div class="text-caption text-white" style="font-size: 10px; opacity: 0.8">{{ auth.roles?.[0] }}</div>
            </div>
            <q-icon name="keyboard_arrow_down" size="xs" color="white" class="q-ml-xs" />
          </div>

          <q-menu transition-show="jump-down" transition-hide="jump-up" class="menu-premium" :offset="[0, 10]">
            <div class="row no-wrap q-pa-md">
              <div class="column">
                <div class="text-h6 q-mb-xs">{{ auth.user?.name }}</div>
                <div class="text-caption text-grey-6 q-mb-md">{{ auth.user?.email }}</div>

                <q-separator class="q-mb-md" />

                <q-btn
                  to="/perfil"
                  align="left" flat dense icon="manage_accounts" label="Mi Perfil"
                  class="text-grey-8 q-mb-sm"
                />
                <q-btn
                  clickable @click="onLogout"
                  align="left" flat dense icon="logout" label="Cerrar Sesión"
                  class="text-negative"
                />
              </div>
            </div>
          </q-menu>
        </q-btn>
      </q-toolbar>
    </q-header>

    <q-drawer
      v-if="!$route.meta.hideLayout"
      v-model="leftDrawerOpen"
      show-if-above
      class="bg-blue-grey-10 text-white drawer-premium"
      :width="260"
    >
      <q-scroll-area class="fit">
        <div class="brand-section q-pa-lg text-center">
          <div class="logo-wrapper q-mx-auto q-mb-md">
            <q-img
              :src="configStore.logoUrl || 'assets/no-logo.png'"
              alt="Logo"
              fit="contain"
              class="logo-img"
            />
          </div>

          <div class="text-h5 text-bold text-white ls-tighter">Xis<span style="color:orange;">PosWeb</span></div>
          <div class="text-caption text-blue-grey-3 q-mt-xs">v1.0.12</div>
        </div>

        <div class="q-mb-md"></div>

        <MenuPrincipal />
      </q-scroll-area>
    </q-drawer>

    <q-page-container class="bg-grey-1">
      <router-view v-slot="{ Component }">
        <transition name="fade-slide" mode="out-in">
          <component :is="Component" :key="$route.path" />
        </transition>
      </router-view>
    </q-page-container>

    <q-dialog v-model="needsBranchSelection" persistent backdrop-filter="blur(4px)">
      <q-card style="min-width: 350px; border-radius: 12px;">
        <q-card-section class="bg-primary text-white">
          <div class="text-h6">Seleccionar Sucursal</div>
          <div class="text-caption">Para continuar, debes seleccionar una sucursal activa.</div>
        </q-card-section>

        <q-card-section class="q-pt-md">
          <q-select
            v-model="branchToSelect"
            :options="auth.can('sucursales.ver') && sucursales.length ? sucursales : auth.sucursales"
            option-label="nombre"
            option-value="id"
            label="Sucursal"
            filled
            autofocus
            options-dense
          >
            <template v-slot:prepend>
              <q-icon name="storefront" />
            </template>
            <template v-slot:no-option>
              <q-item>
                <q-item-section class="text-italic text-grey">
                  No tienes sucursales asignadas.
                </q-item-section>
              </q-item>
            </template>
          </q-select>
        </q-card-section>

        <q-card-actions align="right" class="q-pb-md q-pr-md">
          <q-btn flat label="Cerrar Sesión" color="negative" @click="onLogout" />
          <q-btn unelevated label="Confirmar" color="primary" @click="confirmBranchSelection" :disable="!branchToSelect" />
        </q-card-actions>
      </q-card>
    </q-dialog>

  </q-layout>
</template>

<script setup>
  import { ref, onMounted, computed } from 'vue'
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

  const needsBranchSelection = computed(() => {
    return auth.isLoggedIn && !auth.sucursalSeleccionada
  })
  const branchToSelect = ref(null)

  const confirmBranchSelection = () => {
    cambiarSucursal(branchToSelect.value)
  }

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
      } catch (e) { console.error(e) }
    }
  }

  const cambiarSucursal = (nuevaSucursal) => {
    if (!nuevaSucursal) return
    $q.loading.show({ message: `Cambiando a ${nuevaSucursal.nombre}...` })
    auth.setSucursal(nuevaSucursal)
    setTimeout(() => {
      $q.loading.hide()
      window.location.reload()
    }, 500)
  }

  const onLogout = async () => {
    await auth.logout()
    router.push('/login')
  }
</script>

<style lang="scss" scoped>
  /* 1. Header  (Efecto Vidrio Más Pronunciado) */
  .header-premium {
    /* Hacemos el borde casi imperceptible */
    border-bottom: 1px solid rgba(0,0,0,0.03);
    /* Sombra muy suave para que "flote" */
    box-shadow: 0 4px 15px rgba(0,0,0,0.05);
    /* NOTA: Ahora usa bg-primary de Quasar, el desenfoque aplicaría
       si se volviera semitransparente. */
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px); /* Soporte Safari */
  }

  /* 2. Drawer Premium (Barra lateral) */
  .drawer-premium {
    /* Borde más oscuro para separar del contenido */
    border-right: 1px solid rgba(0,0,0,0.2);
    box-shadow: 2px 0 10px rgba(0,0,0,0.1);
  }

  /* 3. Logo y Marca */
  .brand-section {
    /* Degradado oscuro para que combine con el sidebar azul grisáceo */
    background: linear-gradient(to bottom, rgba(255,255,255,0.05) 0%, transparent 100%);
    border-bottom: 1px solid rgba(255,255,255,0.05);
  }

  .logo-wrapper {
    width: 120px;
    height: 120px;
    display: flex;
    align-items: center;
    justify-content: center;
    /* Sombra suave para que resalte sin contorno */
    filter: drop-shadow(0 4px 8px rgba(0,0,0,0.3));
    transition: transform 0.3s ease;
  }
  .logo-wrapper:hover { transform: scale(1.05); }

  /* 4. Utilidades y Menús */
  .ls-1 { letter-spacing: 1px; }
  .ls-tighter { letter-spacing: -1px; }
  .opacity-20 { opacity: 0.2; }
  .lh-1 { line-height: 1; }

  .menu-premium {
    border-radius: 12px;
    box-shadow: 0 10px 30px rgba(0,0,0,0.08);
    border: 1px solid rgba(0,0,0,0.05);
  }

  .hover-effect {
    transition: background 0.2s;
    border-radius: 8px;
  }
  .hover-effect:hover {
    /* Un hover un poco más oscuro para contrastar con el header */
    background: rgba(0,0,0,0.05);
  }

  /* 5. Animaciones de Página (Suavizadas) */
  .fade-slide-enter-from {
    opacity: 0;
    transform: translateY(15px); /* Entra desde un poco más abajo */
  }
  .fade-slide-leave-to {
    opacity: 0;
    transform: translateY(-10px); /* Sale un poco hacia arriba */
  }
  .fade-slide-enter-active, .fade-slide-leave-active {
    transition: all 0.35s cubic-bezier(0.2, 0.8, 0.2, 1); /* Curva de animación más suave */
  }
</style>
