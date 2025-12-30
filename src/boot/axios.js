import { defineBoot } from '#q-app/wrappers'
import axios from 'axios'
import { Notify } from 'quasar'
import { useAuthStore } from 'src/stores/auth'

let isHandlingUnauthorized = false

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

// Accedemos a 'router' directamente desde los argumentos de defineBoot
export default defineBoot(({ app, router }) => {

  api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Si es un error 401 (No autorizado)
    if (error.response && error.response.status === 401) {
      const auth = useAuthStore()

      // VERIFICACIÓN CLAVE: ¿El error viene de la ruta de login?
      const isLoginRequest = error.config.url.includes('/login')

      if (!isLoginRequest) {
        // Solo cerramos sesión y mandamos mensaje si NO estamos en el login
        auth.logout()
        Notify.create({
          color: 'negative',
          message: 'Su sesión ha caducado o no tiene permisos.',
          icon: 'timer_off'
        })
      }
    }
    return Promise.reject(error)
  })

  app.config.globalProperties.$axios = axios
  app.config.globalProperties.$api = api
})

export { api }
