<template>
  <q-list class="menu-list q-px-sm q-py-md">

    <q-item dense clickable v-ripple to="/dashboard" active-class="custom-active-link" class="menu-item q-mb-lg">
      <q-item-section avatar><q-icon name="dashboard" /></q-item-section>
      <q-item-section class="text-weight-bold text-uppercase">DASHBOARD</q-item-section>
    </q-item>

    <q-item-label header class="menu-header">Comercial</q-item-label>

    <q-item dense v-if="auth.can('ventas.pos')" clickable v-ripple to="/pos" active-class="custom-active-link" class="menu-item">
      <q-item-section avatar><q-icon name="point_of_sale" /></q-item-section>
      <q-item-section class="text-weight-medium">Punto de Venta (POS)</q-item-section>
    </q-item>

    <q-item dense v-if="auth.can('restaurante.ver')" clickable v-ripple to="/restaurante" active-class="custom-active-link" class="menu-item">
      <q-item-section avatar><q-icon name="restaurant" /></q-item-section>
      <q-item-section class="text-weight-medium">Restaurante</q-item-section>
    </q-item>

     <q-item dense v-if="auth.can('restaurante.ordenes')" clickable v-ripple to="/restaurante/ordenes" active-class="custom-active-link" class="menu-item">
      <q-item-section avatar><q-icon name="restaurant_menu" /></q-item-section>
      <q-item-section class="text-weight-medium">Ordenes</q-item-section>
    </q-item>

    <q-item dense v-if="auth.can('facturacion.ver')" clickable v-ripple to="/facturacion" active-class="custom-active-link" class="menu-item">
      <q-item-section avatar><q-icon name="money" /></q-item-section>
      <q-item-section class="text-weight-medium">Facturación</q-item-section>
    </q-item>

    <q-expansion-item dense
      v-model="ventasExpanded"
      icon="receipt_long"
      label="Ventas y Clientes"
      header-class="menu-expansion-header"
    >

      <q-item dense v-if="auth.can('clientes.ver')" clickable v-ripple to="/clientes" active-class="custom-active-link" class="menu-item-sub">
        <q-item-section avatar><q-icon name="person_search" /></q-item-section>
        <q-item-section>Cartera de Clientes</q-item-section>
      </q-item>

      <q-item dense v-if="auth.can('ventas.ver')" clickable v-ripple to="/ventas" active-class="custom-active-link" class="menu-item-sub">
        <q-item-section avatar><q-icon name="history" /></q-item-section>
        <q-item-section>Historial de Ventas</q-item-section>
      </q-item>



    </q-expansion-item>

    <q-item dense v-if="auth.can('ventas.turnos')" clickable v-ripple to="/turnos" active-class="custom-active-link" class="menu-item">
      <q-item-section avatar><q-icon name="offline_bolt" /></q-item-section>
      <q-item-section class="text-weight-medium">Turnos</q-item-section>
    </q-item>

    <q-separator class="q-my-md opacity-20" />

    <q-item-label header class="menu-header">Logística</q-item-label>

    <q-expansion-item dense
      v-model="inventarioExpanded"
      icon="inventory"
      label="Almacén y Stock"
      header-class="menu-expansion-header"
    >
      <q-item dense v-if="auth.can('productos.ver')" clickable v-ripple to="/productos" active-class="custom-active-link" class="menu-item-sub">
        <q-item-section avatar><q-icon name="label" /></q-item-section>
        <q-item-section>Catálogo Productos</q-item-section>
      </q-item>
      <q-item dense v-if="auth.can('inventario.movimientos')" clickable v-ripple to="/movimientosinventario" active-class="custom-active-link" class="menu-item-sub">
        <q-item-section avatar><q-icon name="sync_alt" /></q-item-section>
        <q-item-section>Movimientos</q-item-section>
      </q-item>

       <q-item dense v-if="auth.can('inventario.verconteofisico')" clickable v-ripple to="/auditoriahistorial" active-class="custom-active-link" class="menu-item-sub">
        <q-item-section avatar><q-icon name="visibility" /></q-item-section>
        <q-item-section>Conteo Fisico</q-item-section>
      </q-item>

      <q-item dense v-if="auth.can('inventario.transferir')" clickable v-ripple to="/transferencias" active-class="custom-active-link" class="menu-item-sub">
        <q-item-section avatar><q-icon name="local_shipping" /></q-item-section>
        <q-item-section>Transferir Mercancia</q-item-section>
      </q-item>

      <q-item dense v-if="auth.can('inventario.recibir')" clickable v-ripple to="/recibir" active-class="custom-active-link" class="menu-item-sub">
        <q-item-section avatar><q-icon name="call_received" /></q-item-section>
        <q-item-section>Recibir Mercancía</q-item-section>
      </q-item>
    </q-expansion-item>

    <q-expansion-item dense
      v-model="comprasExpanded"
      icon="shopping_cart"
      label="Compras"
      header-class="menu-expansion-header"
    >
      <q-item dense v-if="auth.can('compras.ver')" clickable v-ripple to="/compras" active-class="custom-active-link" class="menu-item-sub">
        <q-item-section avatar><q-icon name="list_alt" /></q-item-section>
        <q-item-section>Historial de Compras</q-item-section>
      </q-item>

      <q-item dense v-if="auth.can('proveedores.ver')" clickable v-ripple to="/proveedores" active-class="custom-active-link" class="menu-item-sub">
        <q-item-section avatar><q-icon name="hail" /></q-item-section>
        <q-item-section>Proveedores</q-item-section>
      </q-item>
    </q-expansion-item>

    <q-separator class="q-my-md opacity-20" />

<q-item-label header class="menu-header">Analisis y Datos</q-item-label>

  <q-expansion-item dense
    v-model="reportesExpanded"
    icon="assessment"
    label="Reportes"
    header-class="menu-expansion-header"
  >

   <q-item dense v-if="auth.can('reportes.ventasdetalladas')" clickable v-ripple to="/reportes/ventasdetalladas" active-class="custom-active-link" class="menu-item-sub">
        <q-item-section avatar><q-icon name="monetization_on" /></q-item-section>
        <q-item-section>Ventas detalladas</q-item-section>
      </q-item>

      <q-item dense v-if="auth.can('reportes.ventasdetalladas')" clickable v-ripple to="/reportes/ventasporproducto" active-class="custom-active-link" class="menu-item-sub">
        <q-item-section avatar><q-icon name="inventory_2" /></q-item-section>
        <q-item-section>Ventas por Producto</q-item-section>
      </q-item>

    <q-item dense v-if="auth.can('reportes.global')" clickable v-ripple to="/inventarioglobal" active-class="custom-active-link" class="menu-item-sub">
        <q-item-section avatar><q-icon name="public" /></q-item-section>
        <q-item-section>Inventario Global</q-item-section>
      </q-item>

      <q-item dense v-if="auth.can('reportes.sucursal')" clickable v-ripple to="/inventarioxsucursal" active-class="custom-active-link" class="menu-item-sub">
        <q-item-section avatar><q-icon name="location_on" /></q-item-section>
        <q-item-section>Inventario por Sucursal</q-item-section>
      </q-item>

      <q-item dense v-if="auth.can('reportes.traspasos')" clickable v-ripple to="/reportes/traspasos" active-class="custom-active-link" class="menu-item-sub">
        <q-item-section avatar><q-icon name="sync_alt" /></q-item-section>
        <q-item-section>Reporte de Traspasos</q-item-section>
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

    <q-expansion-item dense
      v-model="seguridadExpanded"
      icon="settings_suggest"
      label="Configuración"
      header-class="menu-expansion-header"
    >
      <q-item dense v-if="auth.can('sucursales.ver')" clickable v-ripple to="/sucursales" active-class="custom-active-link" class="menu-item-sub">
        <q-item-section avatar><q-icon name="store" /></q-item-section>
        <q-item-section>Sucursales</q-item-section>
      </q-item>

      <q-item dense v-if="auth.can('conceptos.ver')" clickable v-ripple to="/catalogos" active-class="custom-active-link" class="menu-item-sub">
        <q-item-section avatar><q-icon name="category" /></q-item-section>
        <q-item-section>Conceptos Base</q-item-section>
      </q-item>

      <q-item dense v-if="auth.can('configuracion.editar')" clickable v-ripple to="/configuracion" active-class="custom-active-link" class="menu-item-sub">
        <q-item-section avatar><q-icon name="tune" /></q-item-section>
        <q-item-section>Ajustes Generales</q-item-section>
      </q-item>

       <q-item dense v-if="auth.can('restaurante.config')" clickable v-ripple to="/restaurante/admin" active-class="custom-active-link" class="menu-item-sub">
        <q-item-section avatar><q-icon name="restaurant" /></q-item-section>
        <q-item-section>Ajustes Restaurante</q-item-section>
      </q-item>

    </q-expansion-item>

    <q-expansion-item dense
      v-model="accesoExpanded"
      icon="shield"
      label="Seguridad"
      header-class="menu-expansion-header"
    >
      <q-item dense v-if="auth.can('usuarios.ver')" clickable v-ripple to="/usuarios" active-class="custom-active-link" class="menu-item-sub">
        <q-item-section avatar><q-icon name="manage_accounts" /></q-item-section>
        <q-item-section>Gestión de Usuarios</q-item-section>
      </q-item>

      <q-item dense v-if="auth.can('roles.ver')" clickable v-ripple to="/roles" active-class="custom-active-link" class="menu-item-sub">
        <q-item-section avatar><q-icon name="lock_person" /></q-item-section>
        <q-item-section>Roles y Permisos</q-item-section>
      </q-item>

      <q-item dense v-if="auth.can('configuracion.logs')" clickable v-ripple to="/auditoria" active-class="custom-active-link" class="menu-item-sub">
        <q-item-section avatar><q-icon name="fingerprint" /></q-item-section>
        <q-item-section>Logs de Auditoría</q-item-section>
      </q-item>

      <q-item dense v-if="auth.can('Respaldar base de datos')" clickable v-ripple to="/backups" active-class="custom-active-link" class="menu-item-sub">
        <q-item-section avatar><q-icon name="backup" /></q-item-section>
        <q-item-section>Respaldos de base de datos</q-item-section>
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
    inventarioExpanded.value = ['/productos', '/transferencias', '/recibir', '/movimientosinventario', 'auditoriahistorial'].some(p => path.includes(p))
    comprasExpanded.value = ['/compras', '/proveedores'].some(p => path.includes(p))
    seguridadExpanded.value = ['/sucursales', '/catalogos', '/configuracion', 'restaurante/admin'].some(p => path.includes(p))
    accesoExpanded.value = ['/usuarios', '/roles', '/auditoria', '/backups'].some(p => path.includes(p))
    reportesExpanded.value = ['/inventarioglobal', '/inventarioxsucursal', '/inventariohistorico', 'reportes/ventasdetalladas', 'reportes/ventasporproducto', 'reportes/traspasos'].some(p => path.includes(p))
  }

  watch(() => route.path, () => checkRoute())
  onMounted(() => checkRoute())
</script>

<style lang="scss" scoped>
  .menu-list {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  }

  .menu-header {
    text-transform: uppercase;
    font-weight: 700;
    color: #64748b; /* Slate 500 */
    letter-spacing: 0.8px;
    font-size: 0.7rem;
    padding-top: 16px;
    padding-bottom: 8px;
    margin-left: 4px;
  }

  /* Base Item */
  .menu-item {
    border-radius: 8px;
    margin-bottom: 2px;
    color: #cbd5e1; /* Slate 300 */
    font-weight: 500;
    transition: all 0.2s ease;

    &:hover {
      background: rgba(255, 255, 255, 0.05);
      color: white;
    }

    :deep(.q-item__section--avatar) {
      min-width: 40px;
      padding-right: 12px;
    }

    .q-icon {
      font-size: 1.3rem;
      color: #94a3b8; /* Slate 400 */
      transition: color 0.2s ease;
    }

    &:hover .q-icon {
      color: white;
    }
  }

  /* Sub Item */
  .menu-item-sub {
    border-radius: 0 8px 8px 0;
    margin-left: 18px;
    margin-right: 4px;
    margin-bottom: 2px;
    font-size: 0.88rem;
    font-weight: 500;
    color: #94a3b8; /* Slate 400 */
    border-left: 2px solid transparent;
    transition: all 0.2s ease;

    &:hover {
      background: rgba(255, 255, 255, 0.05);
      color: white;
      border-left-color: rgba(255, 255, 255, 0.2);
    }

    :deep(.q-item__section--avatar) {
      min-width: 36px;
      padding-right: 10px;
    }

    .q-icon {
      font-size: 1.15rem;
    }
  }

  /* Active Links */
  .custom-active-link {
    background: rgba(255, 255, 255, 0.1) !important;
    color: white !important;
    font-weight: 600 !important;

    &.menu-item-sub {
      border-left: 2px solid $primary !important;
      background: linear-gradient(90deg, rgba($primary, 0.15) 0%, rgba(255,255,255,0.05) 100%) !important;
    }

    &.menu-item {
      /* Top level items active state */
      border-left: 3px solid $primary;
      border-radius: 0 8px 8px 0;
      background: linear-gradient(90deg, rgba($primary, 0.2) 0%, rgba(255,255,255,0.05) 100%) !important;
    }

    .q-icon {
      color: $primary !important;
    }
  }

  /* Expansion Header specifically */
  :deep(.menu-expansion-header) {
    border-radius: 8px;
    font-weight: 500;
    color: #cbd5e1;
    transition: all 0.2s ease;
    padding-left: 16px;

    &:hover {
      background: rgba(255, 255, 255, 0.05);
      color: white;
    }

    .q-item__section--avatar {
      min-width: 40px;
      padding-right: 12px;
    }

    .q-icon {
      font-size: 1.3rem;
      color: #94a3b8;
    }
  }

  :deep(.q-expansion-item--expanded > .q-expansion-item__container > .menu-expansion-header) {
    color: white;
    font-weight: 600;
    .q-icon {
      color: $primary;
    }
  }

  .opacity-20 { opacity: 0.1; margin: 12px 16px; }
</style>
