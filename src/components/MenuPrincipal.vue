<template>
  <q-list padding class="menu-list q-px-md">
    <q-item-label header class="text-overline text-grey-6 q-mt-md">Operaciones</q-item-label>

    <q-item clickable v-ripple to="/dashboard" active-class="custom-active-link" class="menu-item">
      <q-item-section avatar><q-icon name="dashboard_customize" /></q-item-section>
      <q-item-section class="text-weight-medium">Panel Principal</q-item-section>
    </q-item>

    <q-item clickable v-ripple to="/ventas" active-class="custom-active-link" class="menu-item">
      <q-item-section avatar><q-icon name="point_of_sale" /></q-item-section>
      <q-item-section class="text-weight-medium">Punto de Venta</q-item-section>
    </q-item>

    <q-item clickable v-ripple to="/compras" active-class="custom-active-link" class="menu-item">
      <q-item-section avatar><q-icon name="shopping_basket" /></q-item-section>
      <q-item-section class="text-weight-medium">Compras</q-item-section>
    </q-item>


    <q-expansion-item
      v-model="catalogoExpanded"
      icon="auto_stories"
      label="Catálogos"
      header-class="text-weight-bold text-grey-8 custom-expansion"
      expand-separator
    >
      <q-item clickable v-ripple to="/clientes" active-class="custom-active-link" class="menu-item-sub">
        <q-item-section avatar><q-icon name="group" /></q-item-section>
        <q-item-section>Clientes</q-item-section>
      </q-item>

      <q-item clickable v-ripple to="/proveedores" active-class="custom-active-link" class="menu-item-sub">
        <q-item-section avatar><q-icon name="local_shipping" /></q-item-section>
        <q-item-section>Proveedores</q-item-section>
      </q-item>

      <q-item clickable v-ripple to="/productos" active-class="custom-active-link" class="menu-item-sub">
        <q-item-section avatar><q-icon name="inventory_2" /></q-item-section>
        <q-item-section>Productos</q-item-section>
      </q-item>
    </q-expansion-item>

    <q-expansion-item
      v-model="inventarioExpanded"
      icon="storage"
      label="Inventario"
      header-class="text-weight-bold text-grey-8 custom-expansion"
      class="q-mt-sm"
    >
      <q-item clickable v-ripple to="/movimientosinventario" active-class="custom-active-link" class="menu-item-sub">
        <q-item-section avatar><q-icon name="swap_vert" /></q-item-section>
        <q-item-section>Movimientos</q-item-section>
      </q-item>

      <q-item clickable v-ripple to="/inventarioglobal" active-class="custom-active-link" class="menu-item-sub">
        <q-item-section avatar><q-icon name="assignment" /></q-item-section>
        <q-item-section>Inventario Global</q-item-section>
      </q-item>

      <q-item clickable v-ripple to="/inventariogxsucursal" active-class="custom-active-link" class="menu-item-sub">
        <q-item-section avatar><q-icon name="assignment" /></q-item-section>
        <q-item-section>Inventario Por Sucursal</q-item-section>
      </q-item>

    </q-expansion-item>

    <q-expansion-item
      v-model="seguridadExpanded"
      icon="admin_panel_settings"
      label="Seguridad"
      header-class="text-weight-bold text-grey-8 custom-expansion"
      class="q-mt-sm"
    >
      <q-item clickable v-ripple to="/usuarios" active-class="custom-active-link" class="menu-item-sub">
        <q-item-section avatar><q-icon name="person_search" /></q-item-section>
        <q-item-section>Control de Usuarios</q-item-section>
      </q-item>

      <q-item clickable v-ripple to="/roles" active-class="custom-active-link" class="menu-item-sub">
        <q-item-section avatar><q-icon name="policy" /></q-item-section>
        <q-item-section>Permisos del Sistema</q-item-section>
      </q-item>
    </q-expansion-item>

    <q-separator class="q-my-lg" />

    <q-item-label header class="text-overline text-grey-6">Administración</q-item-label>

    <q-item clickable v-ripple to="/catalogos" active-class="custom-active-link" class="menu-item">
      <q-item-section avatar><q-icon name="collections" /></q-item-section>
      <q-item-section class="text-weight-medium">Conceptos</q-item-section>
    </q-item>

    <q-item clickable v-ripple to="/sucursales" active-class="custom-active-link" class="menu-item">
      <q-item-section avatar><q-icon name="storefront" /></q-item-section>
      <q-item-section class="text-weight-medium">Sucursales</q-item-section>
    </q-item>

    <q-item clickable v-ripple to="/auditoria" active-class="custom-active-link" class="menu-item">
      <q-item-section avatar><q-icon name="manage_history" /></q-item-section>
      <q-item-section class="text-weight-medium">Logs de Auditoría</q-item-section>
    </q-item>

    <q-item clickable v-ripple to="/configuracion" active-class="custom-active-link" class="menu-item">
      <q-item-section avatar><q-icon name="tune" /></q-item-section>
      <q-item-section class="text-weight-medium">Configuración</q-item-section>
    </q-item>
  </q-list>
</template>

<script setup>
  import { ref, watch, onMounted } from 'vue'
  import { useRoute } from 'vue-router'

  const route = useRoute()
  const catalogoExpanded = ref(false)
  const inventarioExpanded = ref(false)
  const seguridadExpanded = ref(false)

  // Función para verificar si la ruta actual pertenece a Catálogos
  const checkRoute = () => {
    const catalogosPaths = ['/clientes', '/proveedores', '/productos']
    if (catalogosPaths.some(path => route.path.includes(path))) {
      catalogoExpanded.value = true
    }

    const inventarioPaths = ['/movimientosinventario', '/inventarioglobal']
    if (inventarioPaths.some(path => route.path.includes(path))) {
      inventarioExpanded.value = true
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
  .menu-item {
    border-radius: 12px;
    margin-bottom: 4px;
    color: #555;
    transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
    &:hover { background: rgba(142, 0, 0, 0.05); color: $primary; }
  }

  .menu-item-sub {
    border-radius: 10px;
    margin-bottom: 2px;
    font-size: 0.9em;
    margin-left: 24px;
    padding-left: 16px;
    transition: all 0.2s ease;
    &:hover {
      border-left: 2px solid;
      background: rgba(142, 0, 0, 0.05);
    }
  }

  .custom-active-link {
    background: $primary !important;
    color: white !important;
    font-weight: bold;
    box-shadow: 0 4px 12px rgba(142, 0, 0, 0.3);
    .q-icon { color: white !important; }
  }

  .custom-expansion { border-radius: 12px; }
</style>
