const routes = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    meta: { auth: true },
    children: [
      { path: '', redirect: '/dashboard' },
      { path: 'dashboard', component: () => import('pages/IndexPage.vue'), name: 'dashboard' },
      { path: 'clientes', component: () => import('pages/Clientes/ClientesPage.vue'), name: 'clientes' },
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
