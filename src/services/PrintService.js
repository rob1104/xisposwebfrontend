import axios from 'axios'
import { useConfigStore } from 'src/stores/config'
import { useAuthStore } from 'src/stores/auth'
import { api } from 'src/boot/axios'



export const PrintService = {
  async imprimirTicketPruebaPython() {
    try {
      // Definimos datos de prueba genéricos para validar la impresora
      const datosPrueba = {
        folio: "TEST-0001",
        total: 150.00,
        productos: [
          { nombre: "Producto de Prueba A", precio: 100.00 },
          { nombre: "Producto de Prueba B", precio: 50.00 }
        ]
      }

      // Enviamos la petición al puente de Python (Flask)
      const response = await axios.post('http://localhost:5000/printtest', datosPrueba)

      return response.data
    } catch (error) {
      console.error("Error al conectar con el puente de impresión:", error)
      // Error amigable para el usuario final
      throw new Error("No se detectó el servidor de impresión. ¿Iniciaste el script de Python?")
    }
  },

  async imprimirTicketReal(venta, items, resumen, configticket, cliente, pagosEfectuados = []) {
    const configStore = useConfigStore()
    const auth = useAuthStore()
    const header_custom = configticket.header_lines || []
    const footer_custom = configticket.footer_lines || []

    try {
      const listaSeguraPagos = Array.isArray(pagosEfectuados) ? pagosEfectuados : [];
      const payload = {
        logo_url: configStore.logoUrl, // URL del logo definida en tu config
        empresa: {
          nombre: configStore.nombreTienda || 'MI EMPRESA S.A.',
          rfc: configStore.config?.rfc || 'XAXX010101000',
          direccion: configStore.config?.direccion || 'DIRECCION GENERAL',
          sucursal: auth.sucursalSeleccionada?.nombre || 'Matriz'
        },
        header_custom: header_custom,
        footer_custom: footer_custom,
        folio: venta.folio,
        fecha: new Date().toLocaleString(),
        cliente: cliente?.razon_social || 'PÚBLICO GENERAL',
        total: resumen.total,
        subtotal: resumen.subtotal,
        impuestos: resumen.impuestos,
        pagos_detalle: listaSeguraPagos.map(p => ({
          metodo: p.metodo_pago,
          monto: p.monto,
          tarjeta_ultimos_4: p.tarjeta_ultimos_4,
          referencia_pago: p.referencia_pago,
          moneda: p.moneda ||'MXN',
          monto_original: p.monto_original || p.monto,
          tipo_cambio_usado: p.tc_aplicado || p.tipo_cambio_usado || 1,
          nota: p.moneda_original === 'USD' ? `(${p.monto_original} USD a ${p.tc_aplicado || p.tipo_cambio_usado || 1})` : ''
        })),
        productos: items.map(item => ({
          nombre: item.nombre,
          cantidad: item.cantidad,
          precio: item.precio,
          subtotal: item.precio * item.cantidad
        }))
      }

      await axios.post('http://localhost:5000/print', payload)
    } catch (error) {
      console.error("Error de impresión profesional:", error)
      throw new Error("Venta guardada. Error al conectar con la impresora.")
    }
  },

  async reimprimirUltimoTicket(config) {
    try {
      // 1. Obtener datos de la última venta desde Laravel
      const { data: venta } = await api.get('/api/pos/ultimo-ticket')

      if (!venta) throw new Error("No se encontraron ventas recientes.")

        console.log(venta)

      const header_custom = venta.sucursal.ticket.header_lines || []
      const footer_custom = venta.sucursal.ticket.footer_lines || []

      // 2. Mapear los datos al formato que espera Python
      const payload = {
        logo_url: config.logoUrl,
        empresa: {
          nombre: config.nombreTienda || 'MI EMPRESA S.A.',
          rfc: config.config?.rfc || 'XAXX010101000',
          direccion: config.config?.direccion || 'DIRECCION GENERAL',
          sucursal: venta.sucursal?.nombre || 'Matriz'
        },
        header_custom: header_custom,
        footer_custom: footer_custom,
        folio: venta.folio,
        fecha: venta.created_at,
        cliente: venta.cliente?.razon_social || 'PÚBLICO GENERAL',
        subtotal: venta.subtotal,
        impuestos: venta.impuestos,
        total: venta.total,
        pagos_detalle: venta.pagos.map(p => ({
          metodo: p.metodo_pago,
          monto: p.monto,
          moneda: p.moneda,
          tarjeta_ultimos_4: p.tarjeta_ultimos_4,
          referencia_pago: p.referencia_pago,
          monto_original: p.monto_original,
          tipo_cambio_usado: p.tipo_cambio_usado
        })),
        productos: venta.detalles.map(d => ({
          cantidad: d.cantidad,
          nombre: d.producto.nombre,
          precio: d.precio_unitario,
          subtotal: d.total
        }))
      }

      // 3. Enviar al script de Python
      await axios.post('http://localhost:5000/print', payload)
      return true
    } catch (error) {
      console.error("Error al reimprimir:", error)
      throw error
    }
  },

  async imprimirMovimientoCaja(movimiento, turnoId, cajeroNombre) {
    try {
      const payload = {
        tipo: movimiento.tipo,
        monto: movimiento.monto,
        concepto: movimiento.concepto,
        turno: turnoId || '---',
        fecha: new Date().toLocaleString(),
        cajero: cajeroNombre || 'Desconocido',
        logo_url: "" // Opcional: puedes obtenerlo del configStore si es necesario
      };

      // Enviamos a la ruta específica creada en el print_bridge.pyw
      await axios.post('http://localhost:5000/print-movement', payload);
      return true;
    } catch (error) {
      console.error("Error al imprimir movimiento de caja:", error);
      throw new Error("Movimiento registrado, pero el puente de impresión no respondió.");
    }
  }
}
