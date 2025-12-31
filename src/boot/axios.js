import { defineBoot } from '#q-app/wrappers'
import axios from 'axios'
import { Notify } from 'quasar'
import { useAuthStore } from 'src/stores/auth'

let isRefreshingToken = false
let failedQueue = []

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve(token)
    }
  })
  failedQueue = []
}

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

  // Interceptor de peticiones para asegurar CSRF token
  api.interceptors.request.use(
    async (config) => {
      // Para peticiones POST, PUT, PATCH, DELETE aseguramos tener el CSRF token
      if (['post', 'put', 'patch', 'delete'].includes(config.method)) {
        // Si no hay cookie XSRF-TOKEN, la obtenemos
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

  // Interceptor de respuestas
  api.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config

      // Error 401: No autorizado y 421: Sesión expirada
      if (error.response?.status === 401 || error.response?.status === 421) {

        // Si el error viene de Login o Logout, NO hacer nada
        const isAuthRequest = originalRequest.url?.includes('/login') ||
                            originalRequest.url?.includes('/logout')

        if (!isAuthRequest) {
          const auth = useAuthStore()
          // 1. Limpiamos solo localmente para evitar la petición circular
          auth.clearLocalAuth()

          // 2. Notificamos al usuario
          Notify.create({
            color: 'negative',
            message: 'Tu sesión ha caducado. Por favor, ingresa de nuevo.',
            icon: 'timer_off',
            position: 'bottom'
          })

          // 3. Redirigimos al Login solo si no estamos ahí
          if (router.currentRoute.value.path !== '/login') {
            router.push('/login')
          }
        }
        return Promise.reject(error)
      }

      // Error 419: CSRF token inválido
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

      // Error 403: Sin permisos
      if (error.response?.status === 403) {
        Notify.create({
          color: 'warning',
          message: 'No tienes permisos para realizar esta acción.',
          icon: 'block',
          position: 'bottom'
        })
      }

      // Error 422: Validación
      if (error.response?.status === 422) {
        const errors = error.response.data.errors
        if (errors) {
          const firstError = Object.values(errors)[0][0]
          Notify.create({
            color: 'orange',
            message: firstError,
            icon: 'warning',
            position: 'bottom'
          })
        }
      }

      // Error 500: Error del servidor
      if (error.response?.status === 500) {
        Notify.create({
          color: 'negative',
          message: 'Error en el servidor. Intenta nuevamente.',
          icon: 'error',
          position: 'bottom'
        })
      }

      return Promise.reject(error)
    }
  )

  app.config.globalProperties.$axios = axios
  app.config.globalProperties.$api = api
})

export { api }
