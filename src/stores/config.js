import { defineStore } from 'pinia'
import { api } from 'boot/axios'

export const useConfigStore = defineStore('config', {
  state: () => ({
    nombreTienda: 'Cargando...',
    logoUrl: null,
    impresoraGeneralUrl: 'http://127.0.0.1:5000',
    impresoraCocinaUrl: 'http://127.0.0.1:5000',
    rawSettings: []
  }),
  actions: {
    async loadConfig() {
      try {
        const data = await api.get('/api/config')
        this.rawSettings = data.data
        this.nombreTienda = data.data.find(c => c.clave === 'nombre_tienda')?.valor || 'XisPOS';
        this.logoUrl = data.data.find(c => c.clave === 'logo_url')?.valor || null;
        this.impresoraGeneralUrl = data.data.find(c => c.clave === 'impresora_general_url')?.valor || 'http://127.0.0.1:5000';
        this.impresoraCocinaUrl = data.data.find(c => c.clave === 'impresora_cocina_url')?.valor || 'http://127.0.0.1:5000';
      } catch (error) {
        console.error("Error al cargar configuración visual: " + error.message);
      }
    }
  }
})
