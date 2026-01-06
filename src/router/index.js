import { defineRouter } from '#q-app/wrappers'
import { createRouter, createMemoryHistory, createWebHistory, createWebHashHistory } from 'vue-router'
import routes from './routes'
import { useAuthStore } from 'src/stores/auth'

/*
 * If not building with SSR mode, you can
 * directly export the Router instantiation;
 *
 * The function below can be async too; either use
 * async/await or return a Promise which resolves
 * with the Router instance.
 */

export default defineRouter(function (/* { store, ssrContext } */) {
  const createHistory = process.env.SERVER
    ? createMemoryHistory
    : (process.env.VUE_ROUTER_MODE === 'history' ? createWebHistory : createWebHashHistory)

  const Router = createRouter({
    scrollBehavior: () => ({ left: 0, top: 0 }),
    routes,

    // Leave this as is and make changes in quasar.conf.js instead!
    // quasar.conf.js -> build -> vueRouterMode
    // quasar.conf.js -> build -> publicPath
    history: createHistory(process.env.VUE_ROUTER_BASE)
  })

  Router.beforeEach(async(to, from, next) => {
    const auth = useAuthStore()

      // 1. Si el usuario está logueado, sincronizamos sus datos al menos una vez al entrar
      // o cada vez que navegue a una ruta con permisos para asegurar cambios "en vivo".
      if (auth.isLoggedIn) {
        // Para evitar lentitud, puedes elegir sincronizar solo en rutas con meta.permission
        if (to.meta.permission || to.meta.auth) {
          await auth.fetchUser() // <--- ESTO TRAE LOS PERMISOS NUEVOS CADA VEZ
        }
      }

      // 2. Validación de seguridad
      if (to.meta.permission) {
        // El getter 'can' ahora responderá con los permisos recién descargados
        if (auth.can(to.meta.permission)) {
          next()
        } else {
          next('/403') // Redirigir si el admin le quitó el acceso
        }
      } else {
        next()
      }
    })
    return Router
})
