import { defineStore } from 'pinia'
import { api } from 'src/boot/axios'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: JSON.parse(localStorage.getItem('user')) || null,
    roles: localStorage.getItem('roles') || null,
    token: localStorage.getItem('token') || null,
    sucursales: [],
    sucursalSeleccionada: null,
    isLoggedIn: !!localStorage.getItem('token'),
    permissions: JSON.parse(localStorage.getItem('permissions')) || []
  }),
  getters: {
    isAdmin: (state) => {
      return Array.isArray(state.roles) &&
             state.roles.length > 0 &&
             state.roles[0] === 'Administrador'
    },
    currentBranchName: (state) => state.sucursalSeleccionada ? state.sucursalSeleccionada.nombre: 'Administración global',
    can: (state) => (permissionName) => {
      if (!state.roles[0] || state.roles.length === 0) return false;
      // 1. SI ES ADMIN, SIEMPRE TRUE
      if (state.roles[0] && state.roles[0].includes('Administrador')) {
        return true;
      }

        // 2. Si no, verificamos el permiso específico
        return state.permissions?.includes(permissionName) || false;
      }
  },
  actions: {
    async login(credentials) {
      try {
        // Obligatorio para Sanctum: Obtener cookie CSRF
        await api.get('/sanctum/csrf-cookie')

        const response = await api.post('/login', credentials)



        // 1. Asignar datos al state (Ahora this.token sí existe)
        this.token = response.data.token
        this.user = response.data.user
        this.sucursales = response.data.sucursales || []
        this.roles = response.data.user.roles || []
        this.isLoggedIn = true

        // --- NUEVA LÓGICA: ASIGNAR SUCURSAL ACTIVA ---
        if (this.user.sucursal_activa_id && this.sucursales.length > 0) {
          // Buscamos el objeto completo de la sucursal que coincida con el ID activo
          const sucursalDefault = this.sucursales.find(s => s.id === this.user.sucursal_activa_id)

          if (sucursalDefault) {
            this.setSucursal(sucursalDefault) // Establecemos el objeto completo

            // Opcional: Persistir el ID en localStorage para el interceptor de axios.js
            localStorage.setItem('sucursalSeleccionada', sucursalDefault.id)
          }
        }
        // --------------------------------------------

        if (response.data.user?.permissions) {
          this.permissions = response.data.user.permissions.map(p => p.name)
        }

        // 2. Persistir manualmente para asegurar que el interceptor lo lea
        localStorage.setItem('token', this.token)
        localStorage.setItem('user', JSON.stringify(this.user))
        localStorage.setItem('permissions', JSON.stringify(this.permissions))

        // 3. Configurar Axios para las siguientes peticiones inmediatamente
        api.defaults.headers.common['Authorization'] = `Bearer ${this.token}`

        return response
      } catch (error) {

        console.log('Error durante login:', error.message)
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

    async fetchUser() {
      try {
        const { data } = await api.get('/api/user')
        this.user = data.user
        this.roles = data.roles ? data.roles.map(r => r.name || r) : []
        this.permissions = data.permissions ? data.permissions.map(p => p.name) : []
        localStorage.setItem('user', JSON.stringify(this.user))
        localStorage.setItem('permissions', JSON.stringify(this.permissions))
      } catch (e) {
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
