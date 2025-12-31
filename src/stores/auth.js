import { defineStore } from 'pinia'
import { api } from 'src/boot/axios'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: JSON.parse(localStorage.getItem('user')) || null,
    roles: [],
    token: localStorage.getItem('token') || null,
    sucursales: [],
    sucursalSeleccionada: null,
    isLoggedIn: !!localStorage.getItem('token'),
  }),
  getters: {
    isAdmin: (state) => state.user?.role === 'Administrador',
    currentBranchName: (state) => state.sucursalSeleccionada ? state.sucursalSeleccionada.nombre: 'Administración global',
  },
  actions: {
    async login(credentials) {
      try {
        // Obligatorio para Sanctum: Obtener cookie CSRF
        await api.get('/sanctum/csrf-cookie')

        const response = await api.post('/login', credentials)

        console.log('Respuesta login:', response.data)

        // 1. Asignar datos al state (Ahora this.token sí existe)
        this.token = response.data.token
        this.user = response.data.user
        this.sucursales = response.data.sucursales || []
        this.roles = response.data.user.roles || []
        this.isLoggedIn = true

        // 2. Persistir manualmente para asegurar que el interceptor lo lea
        localStorage.setItem('token', this.token)
        localStorage.setItem('user', JSON.stringify(this.user))

        // 3. Configurar Axios para las siguientes peticiones inmediatamente
        api.defaults.headers.common['Authorization'] = `Bearer ${this.token}`

        return response
      } catch (error) {

        throw error
      }
    },

    async logout() {
      try {
        if(this.token) {
          await api.post('/logout')
        }
      } catch(error) {
        //console.error('Error durante logouut:', error)
      }
      finally {
        this.clearLocalAuth()
      }
    },

    setSucursal(sucursal) {
      this.sucursalSeleccionada = sucursal
    },
    clearLocalAuth() {
      this.user = null
      this.token = null
      this.roles = []
      this.sucursales = []
      this.sucursalSeleccionada = null
      this.isLoggedIn = false

      localStorage.removeItem('token')
      localStorage.removeItem('user')

      // Eliminamos el header para futuras peticiones
      delete api.defaults.headers.common['Authorization']
    }
  },
  persist: true
})
