import { defineStore } from 'pinia'
import { api } from 'boot/axios'

export const useConfigStore = defineStore('config', {
  state: () => ({
    nombreTienda: 'XisPOS',
    logoUrl: null,
    loading: false
  }),
  actions: {
    async loadConfig() {
      try {
        const data = await api.get('/api/config')
        this.nombreTienda = data.data.find(c => c.clave === 'nombre_tienda')?.valor || 'XisPOS';
        this.logoUrl = data.data.find(c => c.clave === 'logo_url')?.valor || null;
      } catch (error) {
        console.error("Error al cargar configuración visual: " + error.message);
      }
    }
  }
})
