import { defineStore } from 'pinia'
import { api } from 'boot/axios'

export const usePosStore = defineStore('pos', {
  state: () => ({
    turno: null,
    cargandoTurno: false,
  }),
  getters: {
    isTurnoAbierto: (state) => !!state.turno && state.turno.status === 'Abierto',
  },
  actions: {
    async verificarTurno  () {
      this.cargandoTurno = true
      try {
        const res = await api.get('/api/pos/verificar-turno')
        this.turno = res.data.turno || null
      } catch (error) {
        console.error('Error al verificar el turno:', error)
        this.turno = null
      } finally {
        this.cargandoTurno = false
      }
    },
    async abrirTurno(datos) {
      const res = await api.post('/api/pos/abrir-turno', datos)
      this.turno = res.data.turno
    },
    async cerrarTurno(datosCorte) {
      try {
        const res = await api.post('/api/pos/cerrar-turno', datosCorte);
        localStorage.removeItem('turno_activo_id');
        return res.data;
      } catch (error) {
        console.error('Error al cerrar el turno:', error);
        throw error;
      }
    }
  },
  persist: true
})
