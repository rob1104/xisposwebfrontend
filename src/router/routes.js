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
      { path: 'auditoria', component: () => import('pages/LogsPage.vue'), name: 'auditoria' },
      { path: 'productos', component: () => import('pages/Productos/ProductosPage.vue'), name: 'productos' },
      { path: 'usuarios', component: () => import('pages/Usuarios/UsuariosPage.vue'), name: 'usuarios' },
      { path: 'roles', component: () => import('pages/Usuarios/RolesPage.vue'), name: 'roles' },
      { path: 'sucursales', component: () => import('pages/Sucursales/SucursalPage.vue'), name: 'sucursales' },
      { path: 'auditoria', component: () => import('pages/LogsPage.vue'), name: 'auditoria' },
      { path: 'transferencias', component: () => import('pages/Inventario/TransferenciasPage.vue'), name: 'transferencias' },
      { path: 'recibir', component: () => import('pages/Inventario/RecepcionPage.vue'), name: 'recepcion' },
      { path: 'movimientosinventario', component: () => import('pages/Movimientos/InventarioMovimientos.vue'), name: 'movimientosinventario' },
      { path: 'inventarioglobal', component: () => import('pages/Inventario/InventarioGlobal.vue'), name: 'inventarioglobal' },
      { path: 'inventarioxsucursal', component: () => import('pages/Reportes/StockReport.vue'), name: 'inventarioglobalreporte' },
      { path: 'inventariohistorico', component: () => import('pages/Inventario/InventarioHistorico.vue'), name: 'inventariohistorico' },
      { path: 'compras', component: () => import('pages/Compras/ComprasPage.vue'), name: 'compras' },
      { path: 'ventas', component: () => import('pages/Ventas/VentasPage.vue'), name: 'ventas' },
      { path: 'catalogos', component: () => import('pages/CatalogosPage.vue'), name: 'catalogos' },
      { path: 'pos', component: () => import('pages/Pos/PosPage.vue'), name: 'pos', meta: { hideLayout: true } },
      { path: 'configuracion', component: () => import('pages/Configuracion/ConfiguracionPage.vue'), name: 'configuracion' },
      { path: 'perfil', component: () => import('pages/Usuarios/ProfilePage.vue'), name: 'perfil' },
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
