import { defineStore } from 'pinia'
import { api } from 'boot/axios'
import { useAuthStore } from './auth'

export const usePosStore = defineStore('pos', {
  state: () => ({
    turno: null,
    cargandoTurno: false,
    ventasEnEspera: [],
    clienteSeleccionado: {}
  }),
  getters: {
    isTurnoAbierto: (state) => !!state.turno && state.turno.status === 'Abierto',
  },
  actions: {
    pausarVenta(items, total) {
      const nuevaPausa = {
        id: Date.now(),
        fecha: new Date().toLocaleTimeString(),
        items: [...items],
        total: total,
        count: items.lengtg
      }
      this.ventasEnEspera.unshift(nuevaPausa)

    },
    eliminarPausa(id) {
      this.ventasEnEspera = this.ventasEnEspera.filter(v => v.id !== id)
    },
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
      console.log("Abriendo turno con datos:", datos);
      const authStore = useAuthStore()
      const payload = {
        ...datos,
        sucursal_id: authStore.sucursalSeleccionada?.id,
      }
      console.log("Hola desde el store POS, datos para abrir turno:", payload);
      try {
        const res = await api.post('/api/pos/abrir-turno', payload)
        this.turno = res.data.turno
        return res.data
      } catch (error) {
        console.error('Error al abrir el turno:', error)
        throw error
      }
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
