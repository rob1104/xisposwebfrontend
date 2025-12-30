<template>
  <q-list padding class="menu-list">
    <q-item-label header class="text-weight-bolder text-grey-8">OPERACIONES</q-item-label>

    <q-item clickable v-ripple to="/dashboard" active-class="my-menu-link">
      <q-item-section avatar><q-icon name="dashboard" /></q-item-section>
      <q-item-section>Dashboard</q-item-section>
    </q-item>

    <q-item clickable v-ripple to="/ventas" active-class="my-menu-link">
      <q-item-section avatar><q-icon name="shopping_cart" /></q-item-section>
      <q-item-section>Punto de Venta</q-item-section>
    </q-item>

    <q-separator class="q-my-md" />

    <q-expansion-item
      v-model="catalogoExpanded"
      icon="inventory"
      label="CATÁLOGOS"
      header-class="text-weight-bolder text-grey-8"
      :content-inset-level="0.5"
      expand-separator
    >
      <q-item clickable v-ripple to="/clientes" active-class="my-menu-link">
        <q-item-section avatar><q-icon name="people" /></q-item-section>
        <q-item-section>Clientes</q-item-section>
      </q-item>

      <q-item clickable v-ripple to="/proveedores" active-class="my-menu-link">
        <q-item-section avatar><q-icon name="local_shipping" /></q-item-section>
        <q-item-section>Proveedores</q-item-section>
      </q-item>

      <q-item clickable v-ripple to="/productos" active-class="my-menu-link">
        <q-item-section avatar><q-icon name="restaurant" /></q-item-section>
        <q-item-section>Productos</q-item-section>
      </q-item>
    </q-expansion-item>

    <q-separator class="q-my-md" />


    <q-expansion-item
      v-model="seguridadExpanded"
      icon="security"
      label="SEGURIDAD"
      header-class="text-weight-bolder text-grey-8"
      :content-inset-level="0.5"
      expand-separator
    >
      <q-item clickable v-ripple to="/usuarios" active-class="my-menu-link">
        <q-item-section avatar><q-icon name="manage_accounts" /></q-item-section>
        <q-item-section>Usuarios</q-item-section>
      </q-item>

      <q-item clickable v-ripple to="/roles" active-class="my-menu-link">
        <q-item-section avatar><q-icon name="admin_panel_settings" /></q-item-section>
        <q-item-section>Roles y Permisos</q-item-section>
      </q-item>
    </q-expansion-item>

    <q-separator class="q-my-md" />
     <q-item-label header class="text-weight-bolder text-grey-8">ADMINISTRACIÓN</q-item-label>

     <q-item clickable v-ripple to="/sucursales" active-class="my-menu-link">
      <q-item-section avatar><q-icon name="store" /></q-item-section>
      <q-item-section>Sucursales</q-item-section>
    </q-item>

    <q-item clickable v-ripple to="/auditoria" active-class="my-menu-link">
      <q-item-section avatar><q-icon name="history" /></q-item-section>
      <q-item-section>Auditoría de Logs</q-item-section>
    </q-item>

    <q-item clickable v-ripple to="/configuracion" active-class="my-menu-link">
      <q-item-section avatar><q-icon name="settings" /></q-item-section>
      <q-item-section>Configuración</q-item-section>
    </q-item>

  </q-list>
</template>

<script setup>
  import { ref, watch, onMounted } from 'vue'
  import { useRoute } from 'vue-router'

  const route = useRoute()
  const catalogoExpanded = ref(false)
  const seguridadExpanded = ref(false)

  // Función para verificar si la ruta actual pertenece a Catálogos
  const checkRoute = () => {
    const catalogosPaths = ['/clientes', '/proveedores', '/productos']
    if (catalogosPaths.some(path => route.path.includes(path))) {
      catalogoExpanded.value = true
    }

    const seguridadPaths = ['/usuarios', '/roles']
    if (seguridadPaths.some(path => route.path.includes(path))) {
      seguridadExpanded.value = true
    }
  }

  // Observar cambios en la ruta para expandir automáticamente
  watch(() => route.path, () => {
    checkRoute()
  })

  // Verificar al cargar el componente (por si entran directo por URL)
  onMounted(() => {
    checkRoute()
  })
</script>

<style lang="scss" scoped>
  .my-menu-link {
    color: white !important;
    background: $primary;
    border-radius: 0 25px 25px 0;
    margin-right: 12px;
    font-weight: bold;
    box-shadow: 2px 2px 5px rgba(0, 0, 0, 0.1);

    .q-item__section--avatar {
      color: white;
    }
  }

  .q-item__section--avatar {
    min-width: 44px;
  }

  .q-expansion-item--expanded {
    background: rgba(0, 0, 0, 0.03);
    transition: background 0.3s ease;
  }
</style>
