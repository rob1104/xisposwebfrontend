<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated class="bg-primary">
      <q-toolbar>
        <q-btn flat dense round icon="menu" aria-label="Menu" @click="toggleLeftDrawer" />
        <q-toolbar-title>XisPOS - {{ auth.currentBranchName }} </q-toolbar-title>

        <q-btn flat round icon="account_circle">
          <q-menu>
            <q-list style="min-width: 150px">
              <q-item clickable v-close-popup @click="onLogout">
                <q-item-section>Cerrar Sesión</q-item-section>
              </q-item>
            </q-list>
          </q-menu>
        </q-btn>
      </q-toolbar>
    </q-header>

    <q-drawer v-model="leftDrawerOpen" show-if-above bordered class="bg-grey-2">
      <q-list>
        <q-item-label header class="text-bold text-primary">MENÚ PRINCIPAL</q-item-label>

        <q-item clickable v-ripple to="/dashboard" active-class="text-primary">
          <q-item-section avatar><q-icon name="dashboard" /></q-item-section>
          <q-item-section>Dashboard</q-item-section>
        </q-item>

        <q-item clickable v-ripple to="/ventas">
          <q-item-section avatar><q-icon name="shopping_cart" /></q-item-section>
          <q-item-section>Punto de Venta</q-item-section>
        </q-item>

        </q-list>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup>
  import { ref } from 'vue'
  import { useAuthStore } from 'stores/auth'
  import { useRouter } from 'vue-router'

  const auth = useAuthStore()
  const router = useRouter()
  const leftDrawerOpen = ref(false)

  const toggleLeftDrawer = () => { leftDrawerOpen.value = !leftDrawerOpen.value }

  const onLogout = async () => {
    await auth.logout()
    router.push('/login')
  }
</script>
