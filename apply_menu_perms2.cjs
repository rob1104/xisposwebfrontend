const fs = require('fs');
let code = fs.readFileSync('d:/Escritorio/XisPOS 3.0/xisposfrontend/src/components/MenuPrincipal.vue', 'utf8');

// Add import computed
code = code.replace(/import { ref, watch, onMounted } from 'vue'/, "import { ref, computed, watch, onMounted } from 'vue'");

// Add computed properties
const computedProps = `
  const hasVentasAccess = computed(() => auth.can('clientes.ver') || auth.can('ventas.ver'))
  const hasInventarioAccess = computed(() => auth.can('productos.ver') || auth.can('inventario.movimientos') || auth.can('inventario.verconteofisico') || auth.can('inventario.transferir') || auth.can('inventario.recibir'))
  const hasComprasAccess = computed(() => auth.can('compras.ver') || auth.can('proveedores.ver'))
  const hasReportesAccess = computed(() => auth.can('reportes.ventasdetalladas') || auth.can('reportes.global') || auth.can('reportes.sucursal') || auth.can('reportes.traspasos') || auth.can('reportes.inventariohistorico'))
  
  const hasConfiguracionAccess = computed(() => auth.can('sucursales.ver') || auth.can('conceptos.ver') || auth.can('configuracion.editar') || auth.can('restaurante.config'))
  const hasSeguridadAccess = computed(() => auth.can('usuarios.ver') || auth.can('roles.ver') || auth.can('configuracion.logs') || auth.can('Respaldar base de datos'))
  const hasAdministracionAccess = computed(() => hasConfiguracionAccess.value || hasSeguridadAccess.value)
`;

code = code.replace(/(const route = useRoute\(\))/, '$1\n' + computedProps);

// Apply v-if to expansion items
code = code.replace(/<q-expansion-item dense\n\s*v-model="ventasExpanded"/g, '<q-expansion-item dense\n      v-if="hasVentasAccess"\n      v-model="ventasExpanded"');
code = code.replace(/<q-expansion-item dense\n\s*v-model="inventarioExpanded"/g, '<q-expansion-item dense\n      v-if="hasInventarioAccess"\n      v-model="inventarioExpanded"');
code = code.replace(/<q-expansion-item dense\n\s*v-model="comprasExpanded"/g, '<q-expansion-item dense\n      v-if="hasComprasAccess"\n      v-model="comprasExpanded"');
code = code.replace(/<q-expansion-item dense\n\s*v-model="reportesExpanded"/g, '<q-expansion-item dense\n      v-if="hasReportesAccess"\n      v-model="reportesExpanded"');
code = code.replace(/<q-expansion-item dense\n\s*v-model="seguridadExpanded"/g, '<q-expansion-item dense\n      v-if="hasConfiguracionAccess"\n      v-model="seguridadExpanded"');
code = code.replace(/<q-expansion-item dense\n\s*v-model="accesoExpanded"/g, '<q-expansion-item dense\n      v-if="hasSeguridadAccess"\n      v-model="accesoExpanded"');

// Try both inline and newline versions just in case
code = code.replace(/<q-expansion-item dense\s*v-model="ventasExpanded"/g, '<q-expansion-item dense\n      v-if="hasVentasAccess"\n      v-model="ventasExpanded"');
code = code.replace(/<q-expansion-item dense\s*v-model="inventarioExpanded"/g, '<q-expansion-item dense\n      v-if="hasInventarioAccess"\n      v-model="inventarioExpanded"');
code = code.replace(/<q-expansion-item dense\s*v-model="comprasExpanded"/g, '<q-expansion-item dense\n      v-if="hasComprasAccess"\n      v-model="comprasExpanded"');
code = code.replace(/<q-expansion-item dense\s*v-model="reportesExpanded"/g, '<q-expansion-item dense\n      v-if="hasReportesAccess"\n      v-model="reportesExpanded"');
code = code.replace(/<q-expansion-item dense\s*v-model="seguridadExpanded"/g, '<q-expansion-item dense\n      v-if="hasConfiguracionAccess"\n      v-model="seguridadExpanded"');
code = code.replace(/<q-expansion-item dense\s*v-model="accesoExpanded"/g, '<q-expansion-item dense\n      v-if="hasSeguridadAccess"\n      v-model="accesoExpanded"');

// Apply v-if to Administracion header
code = code.replace(/<q-item-label header class="menu-header">Administraci.n<\/q-item-label>/g, '<q-item-label v-if="hasAdministracionAccess" header class="menu-header">Administración</q-item-label>');

fs.writeFileSync('d:/Escritorio/XisPOS 3.0/xisposfrontend/src/components/MenuPrincipal.vue', code);
