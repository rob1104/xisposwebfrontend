import { defineStore } from 'pinia'
import { api } from 'src/boot/axios'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    roles: [],
    sucursales: [],
    sucursalSeleccionada: null,
    isLoggedIn: false,
  }),
  getters: {
    isAdmin: (state) => state.roles.includes('Administrador'),
    currentBranchName: (state) => state.sucursalSeleccionada ? state.sucursalSeleccionada.nombre: 'Administración global'
  },
  actions: {
    async login(credentials) {
      try {
        // 1. Obtener la "Cookie de CSRF" (Requerido por Sanctum)
        await api.get('/sanctum/csrf-cookie');
        // 2. Enviar credenciales al endpoint de Breeze
        const response = await api.post('/login', credentials);
        // 3. Guardar la información en el estado
        this.user = response.data.user;
        this.roles = response.data.user.roles;
        this.sucursales = response.data.sucursales;
        this.isLoggedIn = true;
        // 4. Lógica automática de sucursal:
        // Si solo tiene una sucursal, seleccionarla por defecto
        if(this.sucursales.length === 1) {
          this.sucursalSeleccionada = this.sucursales[0];
        }
        return response.data;
      }
      catch (error) {
        throw error;
      }
    },

    async logout() {
      try {
        await api.post('/logout');
        this.$reset();
      }
      catch (error) {
        console.error('Error al cerrar sesión:', error);
      }
    },

    setSucursal(sucursal) {
      this.sucursalSeleccionada = sucursal;
    }

  },
  persist: true
})
