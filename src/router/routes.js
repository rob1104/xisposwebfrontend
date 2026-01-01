const routes = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    meta: { auth: true },
    children: [
      { path: '', redirect: '/dashboard' },
      { path: 'dashboard', component: () => import('pages/IndexPage.vue'), name: 'dashboard' },
      { path: 'clientes', component: () => import('pages/Clientes/ClientesPage.vue'), name: 'clientes' },
      { path: 'proveedores', component: () => import('pages/Proveedores/ProveedoresPage.vue'), name: 'proveedores' },
      { path: 'usuarios', component: () => import('pages/Usuarios/UsuariosPage.vue'), name: 'usuarios' },
      { path: 'roles', component: () => import('pages/Usuarios/RolesPage.vue'), name: 'roles' },
      { path: 'sucursales', component: () => import('pages/Sucursales/SucursalPage.vue'), name: 'sucursales' },
      { path: 'auditoria', component: () => import('pages/LogsPage.vue'), name: 'auditoria' },
    ]
  },
  {
    path: '/login',
    component: () => import('pages/LoginPage.vue')
  },


  // Always leave this as last one,
  // but you can also remove it
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue')
  }
]

export default routes
