import { defineBoot } from '#q-app/wrappers'
import axios from 'axios'
import { Notify } from 'quasar'
import { useAuthStore } from 'src/stores/auth'

// Creamos la instancia de Axios
const api = axios.create({
  baseURL: 'http://localhost:8000',
  withCredentials: true,
  withXSRFToken: true,
  headers: {
    'X-Requested-With': 'XMLHttpRequest',
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }
})

export default defineBoot(({ app, router }) => {

  // 1. Interceptor de peticiones
  api.interceptors.request.use(
    async (config) => {
      const auth = useAuthStore()

      // Inyectar Sucursal ID si existe
      if (auth.sucursalSeleccionada?.id) {
        config.headers['X-Sucursal-Id'] = auth.sucursalSeleccionada.id
      }

      // Inyectar Token Bearer si existe
      if (auth.token) {
        config.headers.Authorization = `Bearer ${auth.token}`
      }

      // Lógica de CSRF para métodos de escritura
      if (['post', 'put', 'patch', 'delete'].includes(config.method)) {
        if (!document.cookie.includes('XSRF-TOKEN')) {
          await axios.get('http://localhost:8000/sanctum/csrf-cookie', {
            withCredentials: true
          })
        }
      }
      return config
    },
    (error) => Promise.reject(error)
  )

  // 2. Interceptor de respuestas
  api.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config

      // Error 401 o 421: Sesión expirada
      if (error.response?.status === 401 || error.response?.status === 421) {
        const isAuthRequest = originalRequest.url?.includes('/login') ||
                            originalRequest.url?.includes('/logout')

        if (!isAuthRequest) {
          const auth = useAuthStore()
          auth.clearLocalAuth()

          Notify.create({
            color: 'negative',
            message: 'Tu sesión ha caducado. Por favor, ingresa de nuevo.',
            icon: 'timer_off',
            position: 'bottom'
          })

          if (router.currentRoute.value.path !== '/login') {
            router.push('/login')
          }
        }
        return Promise.reject(error)
      }

      // Error 419: CSRF expirado
      if (error.response?.status === 419) {
        try {
          await axios.get('http://localhost:8000/sanctum/csrf-cookie', {
            withCredentials: true
          })
          return api(originalRequest)
        } catch (csrfError) {
          Notify.create({
            color: 'negative',
            message: 'Error de seguridad. Por favor, recarga la página.',
            icon: 'security',
            position: 'bottom'
          })
          return Promise.reject(csrfError)
        }
      }

      // Otros errores (403, 422, 500)
      if (error.response?.status === 403) {
        Notify.create({ color: 'warning', message: 'No tienes permisos.', icon: 'block' })
      }

      if (error.response?.status === 422) {
        const errors = error.response.data.errors
        const message = errors ? Object.values(errors)[0][0] : 'Error de validación'
        //Notify.create({ color: 'orange', message: message, icon: 'warning' })
      }

      if (error.response?.status === 500) {
        Notify.create({ color: 'negative', message: 'Error en el servidor.', icon: 'error' })
      }

      return Promise.reject(error)
    }
  )

  // Hacemos que axios y api estén disponibles globalmente en Vue
  app.config.globalProperties.$axios = axios
  app.config.globalProperties.$api = api
})

// Exportamos la instancia para usarla en los stores de Pinia u otros archivos JS
export { api }
