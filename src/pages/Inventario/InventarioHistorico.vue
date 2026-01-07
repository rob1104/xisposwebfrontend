<template>
  <q-page class="q-pa-xl bg-grey-2">
    <div class="row items-center q-mb-xl">
      <q-avatar icon="history" color="primary" text-color="white" shadow-5 size="lg" />
      <div class="q-ml-md">
        <div class="text-h4 text-bold text-grey-9">Inventario Histórico</div>
        <div class="text-subtitle1 text-grey-7">Auditoría de existencias y trazabilidad retroactiva.</div>
      </div>
      <q-space />
      <div class="q-gutter-sm">
        <q-btn round flat color="red-8" icon="picture_as_pdf" @click="exportToPDF" size="lg">
          <q-tooltip>Exportar Informe PDF</q-tooltip>
        </q-btn>
        <q-btn round flat color="green-8" icon="description" @click="exportToExcel" size="lg">
          <q-tooltip>Descargar Excel Detallado</q-tooltip>
        </q-btn>
      </div>
    </div>

    <q-card flat class="q-pa-lg q-mb-xl shadow-2 border-radius-20 bg-white">
      <div class="row q-col-gutter-lg items-center">
        <div class="col-12 col-md-4" v-if="auth.roles[0] === 'Administrador'">
          <div class="text-caption text-bold text-primary q-mb-xs text-uppercase">Sede de Consulta</div>
          <q-select
            v-model="sucursalId"
            :options="sucursales"
            option-label="nombre"
            option-value="id"
            emit-value map-options
            outlined dense bg-color="grey-1"
            class="border-radius-10"
            @update:model-value="cargarHistorico"
          >
            <template v-slot:prepend><q-icon name="storefront" color="primary" /></template>
          </q-select>
        </div>

        <div class="col-12 col-md-4">
          <div class="text-caption text-bold text-primary q-mb-xs text-uppercase">Fecha de Inventario</div>
          <q-input outlined dense v-model="fechaConsulta" mask="date" bg-color="grey-1" class="border-radius-10">
            <template v-slot:append>
              <q-icon name="calendar_today" class="cursor-pointer" color="primary">
                <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                  <q-date v-model="fechaConsulta" @update:model-value="cargarHistorico" color="primary">
                    <div class="row items-center justify-end">
                      <q-btn v-close-popup label="Cerrar" color="primary" flat />
                    </div>
                  </q-date>
                </q-popup-proxy>
              </q-icon>
            </template>
          </q-input>
        </div>

        <div class="col-12 col-md-4">
          <div class="text-caption text-bold text-primary q-mb-xs text-uppercase">Búsqueda Rápida</div>
          <q-input v-model="filter" outlined dense placeholder="Producto o Código ..." bg-color="grey-1" class="border-radius-10">
            <template v-slot:append><q-icon name="search" /></template>
          </q-input>
        </div>
      </div>
    </q-card>

    <div class="row q-col-gutter-lg q-mb-xl" v-if="rows.length > 0">
      <div class="col-12 col-sm-4">
        <q-card flat class="kpi-card border-left-primary shadow-1">
          <q-card-section class="row items-center">
            <div class="col">
              <div class="text-caption text-grey-7 text-bold">TOTAL CÓDIGOS CON EXISTENCIA</div>
              <div class="text-h4 text-bold">{{ stats.itemsConStock }}</div>
            </div>
            <q-icon name="inventory_2" size="lg" color="blue-2" />
          </q-card-section>
        </q-card>
      </div>
      <div class="col-12 col-sm-4">
        <q-card flat class="kpi-card border-left-positive shadow-1">
          <q-card-section class="row items-center">
            <div class="col">
              <div class="text-caption text-grey-7 text-bold">VOLUMEN TOTAL UNIDADES</div>
              <div class="text-h4 text-bold text-positive">{{ Number(stats.totalUnidades) }}</div>
            </div>
            <q-icon name="analytics" size="lg" color="green-2" />
          </q-card-section>
        </q-card>
      </div>
      <div class="col-12 col-sm-4">
        <q-card flat class="kpi-card border-left-negative shadow-1">
          <q-card-section class="row items-center">
            <div class="col">
              <div class="text-caption text-grey-7 text-bold">PRODUCTOS AGOTADOS</div>
              <div class="text-h4 text-bold text-negative">{{ stats.sinStock }}</div>
            </div>
            <q-icon name="block" size="lg" color="red-2" />
          </q-card-section>
        </q-card>
      </div>
    </div>

    <q-card flat class="shadow-15 border-radius-20 overflow-hidden">
      <q-table
        :rows="rows"
        :columns="columns"
        :loading="loading"
        :filter="filter"
        flat
        class="premium-table"
        :pagination="{ rowsPerPage: 15 }"
      >
        <template v-slot:body-cell-stock="props">
          <q-td :props="props" class="text-center">
            <q-chip
              :color="props.value > 0 ? 'blue-1' : 'red-1'"
              :text-color="props.value > 0 ? 'blue-9' : 'red-9'"
              class="text-bold shadow-1 q-px-md"
              :icon="props.value > 0 ? 'check_circle' : 'warning'"
            >
              {{ Number(props.value) }}
            </q-chip>
          </q-td>
        </template>

        <template v-slot:body-cell-producto="props">
          <q-td :props="props">
            <div class="text-bold text-grey-9">{{ props.value }}</div>
            <div class="text-caption text-primary">{{ props.row.categoria }}</div>
          </q-td>
        </template>
      </q-table>
    </q-card>
  </q-page>
</template>

<script setup>
  import { ref, onMounted, computed } from 'vue'
  import { api } from 'boot/axios'
  import { useAuthStore } from 'stores/auth'
  import { useQuasar } from 'quasar'
  import ExcelJS from 'exceljs'
  import { saveAs } from 'file-saver'
  import jsPDF from 'jspdf'
  import autoTable from 'jspdf-autotable'

  const auth = useAuthStore()
  const $q = useQuasar()
  const filter = ref('')
  const fechaConsulta = ref(new Date().toISOString().slice(0, 10).replace(/-/g, '/'))
  const sucursalId = ref(auth.sucursalSeleccionada?.id)
  const sucursales = ref([])
  const rows = ref([])
  const loading = ref(false)

  // Cálculos automáticos para los KPIs
  const stats = computed(() => {
    return {
      itemsConStock: rows.value.filter(r => r.stock_al_dia > 0).length,
      totalUnidades: rows.value.reduce((acc, r) => acc + parseFloat(r.stock_al_dia), 0),
      sinStock: rows.value.filter(r => r.stock_al_dia <= 0).length
    }
  })

  const columns = [
    { name: 'producto', label: 'PRODUCTO', field: 'nombre', align: 'left', sortable: true },
    { name: 'codigo', label: 'CÓDIGO', field: 'codigo_barras', align: 'left', sortable: true },
    { name: 'stock', label: 'STOCK A LA FECHA', field: 'stock_al_dia', align: 'center', sortable: true },
    { name: 'ultimo_mov', label: 'ULTIMO MOVIMIENTO', field: 'ultimo_mov_fecha', align: 'right', format: val => val !== 'Sin movimientos' ? new Date(val).toLocaleString() : 'Sin actividad previa' }
  ]

  const cargarHistorico = async () => {
    if (!sucursalId.value) return
    loading.value = true
    try {
      const res = await api.get('/api/inventario/historico', {
        params: {
          fecha: fechaConsulta.value.replace(/\//g, '-'),
          sucursal_id: sucursalId.value
        }
      })
      rows.value = res.data
    } catch (e) {
      $q.notify({ color: 'negative', message: 'Error al consultar histórico', icon: 'report_problem' })
    } finally {
      loading.value = false
    }
  }

  const cargarSucursales = async () => {
    try {
      const res = await api.get('/api/sucursales')
      sucursales.value = res.data
    } catch (e) { console.error(e) }
  }

  onMounted(() => {
    cargarSucursales()
    if (sucursalId.value) cargarHistorico()
  })

  /**
 * EXPORTAR A EXCEL (Gerencial)
 */
const exportToExcel = async () => {
  const workbook = new ExcelJS.Workbook()
  const worksheet = workbook.addWorksheet('Inventario Histórico')
  const nombreSucursal = sucursales.value.find(s => s.id === sucursalId.value)?.nombre || 'General'

  // 1. Título y Metadatos
  worksheet.mergeCells('A1:D1')
  const titleCell = worksheet.getCell('A1')
  titleCell.value = 'INVENTARIO HISTÓRICO'
  titleCell.font = { name: 'Arial', size: 16, bold: true, color: { argb: '1976D2' } }
  titleCell.alignment = { vertical: 'middle', horizontal: 'center' }

  worksheet.addRow(['Sucursal:', nombreSucursal])
  worksheet.addRow(['Fecha de Inventario:', fechaConsulta.value])
  worksheet.addRow(['Generado el:', new Date().toLocaleString()])
  worksheet.addRow([]) // Espacio

  // 2. Sección de KPIs (Resumen Gerencial)
  worksheet.addRow(['RESUMEN DE EXISTENCIAS']).font = { bold: true }
  worksheet.addRow(['SKUs con Stock', stats.value.itemsConStock])
  worksheet.addRow(['Unidades Totales', Number(stats.value.totalUnidades)])
  worksheet.addRow(['Productos Agotados', stats.value.sinStock])
  worksheet.addRow([]) // Espacio

  // 3. Cabecera de Tabla
  const headerRow = worksheet.addRow(['PRODUCTO', 'SKU / CÓDIGO', 'EXISTENCIA', 'FECHA ÚLTIMO MOV.'])
  headerRow.eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '1976D2' } }
    cell.font = { color: { argb: 'FFFFFF' }, bold: true }
    cell.alignment = { horizontal: 'center' }
  })

  // 4. Datos
  rows.value.forEach(row => {
    const dataRow = worksheet.addRow([
      row.nombre,
      row.codigo_barras,
      Number(row.stock_al_dia), // Smart Decimal
      row.ultimo_mov_fecha !== 'Sin movimientos' ? new Date(row.ultimo_mov_fecha).toLocaleString() : 'N/A'
    ])

    // Color rojo si no hay stock
    if (Number(row.stock_al_dia) <= 0) {
      dataRow.getCell(3).font = { color: { argb: 'FF0000' }, bold: true }
    }
  })

  // Ajustar ancho de columnas
  worksheet.columns.forEach(col => { col.width = 25 })

  const buffer = await workbook.xlsx.writeBuffer()
  saveAs(new Blob([buffer]), `Inventario_Historico_${nombreSucursal.replace(/ /g, '_')}_${fechaConsulta.value.replace(/\//g, '-')}.xlsx`)
}

  /**
   * EXPORTAR A PDF (Ejecutivo)
   */
  const exportToPDF = () => {
    const doc = jsPDF({ orientation: 'landscape' })
    const nombreSucursal = sucursales.value.find(s => s.id === sucursalId.value)?.nombre || 'General'

    // Cabecera Elegante
    doc.setFontSize(20)
    doc.setTextColor(25, 118, 210)
    doc.text('INVENTARIO HISTÓRICO', 14, 20)

    doc.setFontSize(10)
    doc.setTextColor(100)
    doc.text(`Sucursal: ${nombreSucursal}`, 14, 28)
    doc.text(`Fecha de Inventario: ${fechaConsulta.value}`, 14, 33)
    doc.text(`Reporte emitido el: ${new Date().toLocaleString()}`, 14, 38)

    // Recuadro de KPIs (Resumen Visual)
    doc.setFillColor(248, 250, 252)
    doc.roundedRect(180, 15, 100, 25, 3, 3, 'F')
    doc.setFontSize(9)
    doc.setTextColor(50)
    doc.text(`Items con Existencia: ${stats.value.itemsConStock}`, 185, 22)
    doc.text(`Volumen de Unidades: ${Number(stats.value.totalUnidades)}`, 185, 28)
    doc.setTextColor(200, 0, 0)
    doc.text(`Productos Agotados: ${stats.value.sinStock}`, 185, 34)

    // Configuración de Tabla
    const columnsHead = ['PRODUCTO', 'CÓDIGO / SKU', 'EXISTENCIA A LA FECHA', 'ULTIMO REGISTRO']
    const body = rows.value.map(row => [
      row.nombre,
      row.codigo_barras,
      Number(row.stock_al_dia), // Smart Decimals
      row.ultimo_mov_fecha !== 'Sin movimientos' ? new Date(row.ultimo_mov_fecha).toLocaleString() : 'N/A'
    ])

    autoTable(doc, {
      startY: 45,
      head: [columnsHead],
      body: body,
      theme: 'grid',
      headStyles: { fillColor: [25, 118, 210], halign: 'center', fontSize: 10 },
      styles: { fontSize: 9, cellPadding: 3 },
      columnStyles: {
        2: { halign: 'center', fontStyle: 'bold' },
        3: { halign: 'right' }
      },
      didParseCell: function(data) {
        // Resaltar en rojo si no hay existencia
        if (data.column.index === 2 && data.cell.section === 'body') {
          if (Number(data.cell.raw) <= 0) {
            data.cell.styles.textColor = [200, 0, 0]
          }
        }
      }
    })

    doc.save(`Reporte_Historico_${nombreSucursal}_${fechaConsulta.value.replace(/\//g, '-')}.pdf`)
  }
</script>

<style lang="scss" scoped>
  .border-radius-20 { border-radius: 20px; }
  .border-radius-10 { border-radius: 10px; }
  .shadow-15 { box-shadow: 0 10px 40px rgba(0,0,0,0.1); }

  .kpi-card {
    background: white;
    border-radius: 15px;
    transition: all 0.3s ease;
    &:hover { transform: translateY(-5px); box-shadow: 0 5px 15px rgba(0,0,0,0.1); }
  }

  .border-left-primary { border-left: 5px solid $primary; }
  .border-left-positive { border-left: 5px solid $positive; }
  .border-left-negative { border-left: 5px solid $negative; }

  .premium-table {
    background: white;
    :deep(thead th) {
      background-color: #f8fafc;
      color: #475569;
      font-weight: bold;
      text-transform: uppercase;
      font-size: 0.75rem;
      letter-spacing: 0.05em;
      padding: 16px;
    }
    :deep(tbody tr:hover) {
      background-color: #f1f5f9 !important;
    }
  }
</style>
