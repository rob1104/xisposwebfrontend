const routes = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    meta: { auth: true },
    children: [
      { path: '', redirect: '/dashboard' },
      { path: 'dashboard', component: () => import('pages/IndexPage.vue'), name: 'dashboard' },
      { path: 'clientes', component: () => import('pages/Clientes/ClientesPage.vue'), name: 'clientes', meta: { permission: 'clientes.ver' } },
      { path: 'proveedores', component: () => import('pages/Proveedores/ProveedoresPage.vue'), name: 'proveedores', meta: { permission: 'proveedores.ver' } },
      { path: 'auditoria', component: () => import('pages/LogsPage.vue'), name: 'auditoria', meta: { permission: 'configuracion.log' } },
      { path: 'productos', component: () => import('pages/Productos/ProductosPage.vue'), name: 'productos', meta: { permission: 'productos.ver' } },
      { path: 'usuarios', component: () => import('pages/Usuarios/UsuariosPage.vue'), name: 'usuarios', meta: { permission: 'usuarios.ver' } },
      { path: 'roles', component: () => import('pages/Usuarios/RolesPage.vue'), name: 'roles', meta: { permission: 'roles.ver' } },
      { path: 'sucursales', component: () => import('pages/Sucursales/SucursalPage.vue'), name: 'sucursales', meta: { permission: 'sucursales.ver' } },
      { path: 'transferencias', component: () => import('pages/Inventario/TransferenciasPage.vue'), name: 'transferencias', meta: { permission: 'inventario.recibir' } },
      { path: 'recibir', component: () => import('pages/Inventario/RecepcionPage.vue'), name: 'recepcion', meta: { permission: 'inventario.recibir' } },
      { path: 'movimientosinventario', component: () => import('pages/Movimientos/InventarioMovimientos.vue'), name: 'movimientosinventario', meta: { permission: 'inventario.movimientos' } },
      { path: 'inventarioglobal', component: () => import('pages/Inventario/InventarioGlobal.vue'), name: 'inventarioglobal', meta: { permission: 'inventario.global' } },
      { path: 'inventarioxsucursal', component: () => import('pages/Reportes/StockReport.vue'), name: 'inventarioglobalreporte', meta: { permission: 'inventario.sucursal' } },
      { path: 'inventariohistorico', component: () => import('pages/Inventario/InventarioHistorico.vue'), name: 'inventariohistorico', meta: { permission: 'reportes.inventariohistorico' } },
      { path: 'compras', component: () => import('pages/Compras/ComprasPage.vue'), name: 'compras', meta: { permission: 'compras.ver' } },
      { path: 'ventas', component: () => import('pages/Ventas/VentasPage.vue'), name: 'ventas', meta: { permission: 'ventas.ver' } },
      { path: 'catalogos', component: () => import('pages/CatalogosPage.vue'), name: 'catalogos', meta: { permission: 'conceptos.ver' } },
      { path: 'pos', component: () => import('pages/Pos/PosPage.vue'), name: 'pos', meta: { hideLayout: true, permission: 'ventas.pos' } },
      { path: 'configuracion', component: () => import('pages/Configuracion/ConfiguracionPage.vue'), name: 'configuracion.editar',  },
      { path: 'perfil', component: () => import('pages/Usuarios/ProfilePage.vue'), name: 'perfil' },
      { path: 'facturacion', component: () => import('pages/Facturacion/FacturasPage.vue'), name: 'facturacion', meta: { permission: 'facturacion.ver' } },
      { path: 'conteofisico', component: () => import('pages/Inventario/AuditoriaInventario.vue'), name: 'conteofisico', meta: { permission: 'inventario.crearconteofisico' } },
      { path: 'auditoriahistorial', component: () => import('pages/Inventario/AuditoriaHistorial.vue'), name: 'auditoriahistorial', meta: { permission: 'inventario.verconteofisico' } },
      { path: 'reportes/ventasdetalladas', component: () => import('pages/Reportes/VentasDetalladas.vue'), name: 'ventasdetalladas', meta: { permission: 'reportes.ventasdetalladas' } },
    ]
  },
  {
    path: '/login',
    component: () => import('pages/LoginPage.vue')
  },

  { path: '/403', name: 'Forbidden', component: () => import('pages/ErrorNotAuthorized.vue'), meta: { auth: true } },


  // Always leave this as last one,
  // but you can also remove it
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue')
  }
]

export default routes
