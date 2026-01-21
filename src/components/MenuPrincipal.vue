<template>
  <q-list padding class="menu-list q-px-md">

    <q-item clickable v-ripple to="/dashboard" active-class="custom-active-link" class="menu-item q-mb-lg">
      <q-item-section avatar><q-icon name="dashboard" /></q-item-section>
      <q-item-section class="text-weight-bold text-uppercase">DASHBOARD</q-item-section>
    </q-item>

    <q-item-label header class="menu-header">Comercial</q-item-label>

    <q-item v-if="auth.can('ventas.pos')" clickable v-ripple to="/pos" active-class="custom-active-link" class="menu-item">
      <q-item-section avatar><q-icon name="point_of_sale" /></q-item-section>
      <q-item-section class="text-weight-medium">Punto de Venta (POS)</q-item-section>
    </q-item>

    <q-expansion-item
      v-model="ventasExpanded"
      icon="receipt_long"
      label="Ventas y Clientes"
      header-class="menu-expansion-header"
    >
      <q-item v-if="auth.can('ventas.ver')" clickable v-ripple to="/ventas" active-class="custom-active-link" class="menu-item-sub">
        <q-item-section avatar><q-icon name="history" /></q-item-section>
        <q-item-section>Historial de Ventas</q-item-section>
      </q-item>

      <q-item v-if="auth.can('clientes.ver')" clickable v-ripple to="/clientes" active-class="custom-active-link" class="menu-item-sub">
        <q-item-section avatar><q-icon name="person_search" /></q-item-section>
        <q-item-section>Clientes</q-item-section>
      </q-item>

    </q-expansion-item>

    <q-item v-if="auth.can('facturacion.ver')" clickable v-ripple to="/facturacion" active-class="custom-active-link" class="menu-item">
      <q-item-section avatar><q-icon name="money" /></q-item-section>
      <q-item-section class="text-weight-medium">Facturación</q-item-section>
    </q-item>

    <q-separator class="q-my-md opacity-20" />

    <q-item-label header class="menu-header">Logística</q-item-label>

    <q-expansion-item
      v-model="inventarioExpanded"
      icon="inventory"
      label="Almacén y Stock"
      header-class="menu-expansion-header"
    >
      <q-item v-if="auth.can('productos.ver')" clickable v-ripple to="/productos" active-class="custom-active-link" class="menu-item-sub">
        <q-item-section avatar><q-icon name="label" /></q-item-section>
        <q-item-section>Catálogo Productos</q-item-section>
      </q-item>
      <q-item v-if="auth.can('inventario.movimientos')" clickable v-ripple to="/movimientosinventario" active-class="custom-active-link" class="menu-item-sub">
        <q-item-section avatar><q-icon name="sync_alt" /></q-item-section>
        <q-item-section>Movimientos</q-item-section>
      </q-item>

       <q-item v-if="auth.can('inventario.verconteofisico')" clickable v-ripple to="/auditoriahistorial" active-class="custom-active-link" class="menu-item-sub">
        <q-item-section avatar><q-icon name="visibility" /></q-item-section>
        <q-item-section>Conteo Fisico</q-item-section>
      </q-item>

      <q-item v-if="auth.can('inventario.transferir')" clickable v-ripple to="/transferencias" active-class="custom-active-link" class="menu-item-sub">
        <q-item-section avatar><q-icon name="local_shipping" /></q-item-section>
        <q-item-section>Transferencias</q-item-section>
      </q-item>

      <q-item v-if="auth.can('inventario.recibir')" clickable v-ripple to="/recibir" active-class="custom-active-link" class="menu-item-sub">
        <q-item-section avatar><q-icon name="call_received" /></q-item-section>
        <q-item-section>Recibir Mercancía</q-item-section>
      </q-item>
    </q-expansion-item>

    <q-expansion-item
      v-model="comprasExpanded"
      icon="shopping_cart"
      label="Compras"
      header-class="menu-expansion-header"
    >
      <q-item v-if="auth.can('compras.ver')" clickable v-ripple to="/compras" active-class="custom-active-link" class="menu-item-sub">
        <q-item-section avatar><q-icon name="list_alt" /></q-item-section>
        <q-item-section>Historial de Compras</q-item-section>
      </q-item>

      <q-item v-if="auth.can('proveedores.ver')" clickable v-ripple to="/proveedores" active-class="custom-active-link" class="menu-item-sub">
        <q-item-section avatar><q-icon name="hail" /></q-item-section>
        <q-item-section>Proveedores</q-item-section>
      </q-item>
    </q-expansion-item>

    <q-separator class="q-my-md opacity-20" />

<q-item-label header class="menu-header">Analisis y Datos</q-item-label>

  <q-expansion-item
    v-model="reportesExpanded"
    icon="assessment"
    label="Reportes"
    header-class="menu-expansion-header"
  >

   <q-item v-if="auth.can('reportes.ventasdetalladas')" clickable v-ripple to="/reportes/ventasdetalladas" active-class="custom-active-link" class="menu-item-sub">
        <q-item-section avatar><q-icon name="monetization_on" /></q-item-section>
        <q-item-section>Ventas detalladas</q-item-section>
      </q-item>

    <q-item v-if="auth.can('reportes.global')" clickable v-ripple to="/inventarioglobal" active-class="custom-active-link" class="menu-item-sub">
        <q-item-section avatar><q-icon name="public" /></q-item-section>
        <q-item-section>Inventario Global</q-item-section>
      </q-item>

      <q-item v-if="auth.can('reportes.sucursal')" clickable v-ripple to="/inventarioxsucursal" active-class="custom-active-link" class="menu-item-sub">
        <q-item-section avatar><q-icon name="location_on" /></q-item-section>
        <q-item-section>Inventario por Sucursal</q-item-section>
      </q-item>



    <q-item
      v-if="auth.can('reportes.inventariohistorico')"
      clickable
      v-ripple
      to="/inventariohistorico"
      active-class="custom-active-link"
      class="menu-item-sub"
    >
      <q-item-section avatar><q-icon name="history_edu" /></q-item-section>
      <q-item-section>Inventario Histórico</q-item-section>
    </q-item>

  </q-expansion-item>

    <q-separator class="q-my-md opacity-20" />

    <q-item-label header class="menu-header">Administración</q-item-label>

    <q-expansion-item
      v-model="seguridadExpanded"
      icon="settings_suggest"
      label="Configuración"
      header-class="menu-expansion-header"
    >
      <q-item v-if="auth.can('sucursales.ver')" clickable v-ripple to="/sucursales" active-class="custom-active-link" class="menu-item-sub">
        <q-item-section avatar><q-icon name="store" /></q-item-section>
        <q-item-section>Sucursales</q-item-section>
      </q-item>

      <q-item v-if="auth.can('conceptos.ver')" clickable v-ripple to="/catalogos" active-class="custom-active-link" class="menu-item-sub">
        <q-item-section avatar><q-icon name="category" /></q-item-section>
        <q-item-section>Conceptos Base</q-item-section>
      </q-item>

      <q-item v-if="auth.can('configuracion.editar')" clickable v-ripple to="/configuracion" active-class="custom-active-link" class="menu-item-sub">
        <q-item-section avatar><q-icon name="tune" /></q-item-section>
        <q-item-section>Ajustes Generales</q-item-section>
      </q-item>
    </q-expansion-item>

    <q-expansion-item
      v-model="accesoExpanded"
      icon="shield"
      label="Seguridad"
      header-class="menu-expansion-header"
    >
      <q-item v-if="auth.can('usuarios.ver')" clickable v-ripple to="/usuarios" active-class="custom-active-link" class="menu-item-sub">
        <q-item-section avatar><q-icon name="manage_accounts" /></q-item-section>
        <q-item-section>Gestión de Usuarios</q-item-section>
      </q-item>

      <q-item v-if="auth.can('roles.ver')" clickable v-ripple to="/roles" active-class="custom-active-link" class="menu-item-sub">
        <q-item-section avatar><q-icon name="lock_person" /></q-item-section>
        <q-item-section>Roles y Permisos</q-item-section>
      </q-item>

      <q-item v-if="auth.can('configuracion.logs')" clickable v-ripple to="/auditoria" active-class="custom-active-link" class="menu-item-sub">
        <q-item-section avatar><q-icon name="fingerprint" /></q-item-section>
        <q-item-section>Logs de Auditoría</q-item-section>
      </q-item>
    </q-expansion-item>

  </q-list>
</template>

<script setup>
  import { ref, watch, onMounted } from 'vue'
  import { useRoute } from 'vue-router'
  import { useAuthStore } from 'stores/auth'

  const auth = useAuthStore()
  const route = useRoute()

  // Estados de expansión
  const ventasExpanded = ref(false)
  const inventarioExpanded = ref(false)
  const comprasExpanded = ref(false)
  const seguridadExpanded = ref(false)
  const accesoExpanded = ref(false)
  const reportesExpanded = ref(false)

  const checkRoute = () => {
    const path = route.path

    ventasExpanded.value = ['/ventas', '/clientes'].some(p => path.includes(p))
    inventarioExpanded.value = ['/productos', '/transferencias', '/recibir', '/movimientosinventario'].some(p => path.includes(p))
    comprasExpanded.value = ['/compras', '/proveedores'].some(p => path.includes(p))
    seguridadExpanded.value = ['/sucursales', '/catalogos', '/configuracion'].some(p => path.includes(p))
    accesoExpanded.value = ['/usuarios', '/roles', '/auditoria'].some(p => path.includes(p))
    reportesExpanded.value = ['/inventarioglobal', '/inventarioxsucursal', '/inventariohistorico'].some(p => path.includes(p))
  }

  watch(() => route.path, () => checkRoute())
  onMounted(() => checkRoute())
</script>

<style lang="scss" scoped>
  .menu-header {
    text-transform: uppercase;
    font-weight: 800;
    color: $red-9;
    letter-spacing: 1.2px;
    font-size: 0.75rem;
    padding-top: 10px;
  }

  .menu-item {
    border-radius: 10px;
    margin-bottom: 4px;
    color: #444;
    transition: all 0.2s ease;
    &:hover { background: rgba(142, 0, 0, 0.04); color: $primary; }
  }

  .menu-expansion-header {
    border-radius: 10px;
    font-weight: 600;
    color: #444;
  }

  .menu-item-sub {
    border-radius: 8px;
    margin-left: 12px;
    margin-right: 8px;
    margin-bottom: 2px;
    font-size: 0.92em;
    color: #666;
    &:hover {
      background: rgba(142, 0, 0, 0.04);
      color: $primary;
    }
  }

  .custom-active-link {
    background: $primary !important;
    color: white !important;
    box-shadow: 0 4px 10px rgba(142, 0, 0, 0.2);
    .q-icon { color: white !important; }
  }

  .opacity-20 { opacity: 0.2; }
</style>
