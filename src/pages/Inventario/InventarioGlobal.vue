<template>
  <q-page class="q-pa-lg bg-grey-2">
    <div class="row q-col-gutter-md q-mb-lg items-center">
      <div class="col-12 col-md-4">
        <div class="text-h5 text-bold text-primary">Inventario Global</div>
        <div class="text-caption text-grey-7">Stock consolidado de todas las sucursales.</div>
      </div>
      <q-space />
      <div class="col-12 col-md-5">
        <q-input
          v-model="filter"
          placeholder="Buscar producto, código o categoría..."
          outlined
          dense
          class="search-input bg-white shadow-1"
        >
          <template v-slot:append><q-icon name="search" /></template>
        </q-input>

          <q-btn-dropdown
              color="blue-9"
              icon="archive"
              label="Exportar"
              unelevated
              class="border-radius-10 shadow-3"
            >
              <q-list>
                <q-item clickable v-close-popup @click="exportToExcel">
                  <q-item-section avatar><q-icon name="description" color="green-8" /></q-item-section>
                  <q-item-section>Excel (.xlsx)</q-item-section>
                </q-item>
                <q-item clickable v-close-popup @click="exportToPDF">
                  <q-item-section avatar><q-icon name="picture_as_pdf" color="red-8" /></q-item-section>
                  <q-item-section>PDF (.pdf)</q-item-section>
                </q-item>
              </q-list>
            </q-btn-dropdown>
      </div>
    </div>

    <q-card class="shadow-10 border-radius-15 overflow-hidden">
      <q-table
        :rows="rows"
        :columns="columns"
        :filter="filter"
        row-key="id"
        flat
        class="main-table"
        :loading="loading"
        :pagination="{ rowsPerPage: 15 }"
      >
        <template v-slot:body-cell-nombre="props">
          <q-td :props="props">
            <div class="text-bold text-primary">{{ props.row.nombre }}</div>
            <div class="text-caption text-grey-6">{{ props.row.codigo_barras }}</div>
          </q-td>
        </template>

        <template v-slot:body-cell-categoria="props">
          <q-td :props="props" class="text-center">
            <q-chip
              dense
              color="red-10"
              text-color="white"
              class="text-bold"
            >
              {{ props.row.categoria || 'General' }}
            </q-chip>
          </q-td>
        </template>

        <template v-for="suc in sucursales" :key="suc.id" v-slot:[`body-cell-sucursal_${suc.id}`]="props">
          <q-td :props="props" class="text-right">
            <div :class="getStockClass(props.row[`sucursal_${suc.id}`])">
              {{ formatNumber(props.row[`sucursal_${suc.id}`]) }}
            </div>
          </q-td>
        </template>

        <template v-slot:body-cell-total="props">
          <q-td :props="props" class="text-right text-bold bg-blue-1">
            {{ formatNumber(props.row.total) }}
          </q-td>
        </template>
      </q-table>
    </q-card>
  </q-page>
</template>

<script setup>
  import { ref, onMounted } from 'vue'
  import { api } from 'boot/axios'
  import ExcelJS from 'exceljs'
  import { saveAs } from 'file-saver'
  import jsPDF from 'jspdf'
  import autoTable from 'jspdf-autotable'

  const rows = ref([])
  const columns = ref([])
  const sucursales = ref([])
  const loading = ref(false)
  const filter = ref('')

  const loadData = async () => {
    loading.value = true
    try {
      // 1. Cargamos catálogo de sucursales para armar columnas
      const resSuc = await api.get('/api/sucursales')
      sucursales.value = resSuc.data

      // 2. Definimos columnas base
      const baseCols = [
        { name: 'nombre', label: 'PRODUCTO', align: 'left', field: 'nombre', sortable: true },
        { name: 'categoria', label: 'CATEGORÍA', align: 'center', field: 'categoria', sortable: true }
      ]

      // 3. Añadimos columnas dinámicas por sucursal
      const sucCols = sucursales.value.map(s => ({
        name: `sucursal_${s.id}`,
        label: s.nombre.toUpperCase(),
        align: 'right',
        field: `sucursal_${s.id}`,
        sortable: true
      }))

      columns.value = [...baseCols, ...sucCols, { name: 'total', label: 'STOCK TOTAL', align: 'right', field: 'total', sortable: true }]

      // 4. Cargamos el reporte consolidado del backend
      const resStock = await api.get('/api/inventario/reporte-consolidado')
      rows.value = resStock.data
    } finally {
      loading.value = false
    }
  }

  const getStockClass = (val) => {
    if (val <= 0) return 'text-negative text-bold'
    if (val < 10) return 'text-warning text-bold'
    return 'text-grey-9'
  }

  const formatNumber = (val) => Number(val).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 })

  const exportToExcel = async () => {
  const workbook = new ExcelJS.Workbook()
  const worksheet = workbook.addWorksheet('Inventario Consolidado')

  // 1. Definir columnas basadas en la configuración dinámica del reporte
  const headerRow = columns.value.map(col => col.label)
  worksheet.addRow(headerRow)

  // Estilo para la cabecera
  worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } }
  worksheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '1976D2' } }

  // 2. Agregar datos respetando el formato numérico inteligente
  rows.value.forEach(row => {
    const rowData = columns.value.map(col => {
      const val = row[col.field]
      // Si es una columna de sucursal o total, forzamos a número
      return col.name.startsWith('sucursal') || col.name === 'total' ? Number(val) : val
    })
    worksheet.addRow(rowData)
  })

  // Ajuste automático de columnas
  worksheet.columns.forEach(col => { col.width = 20 })

  const buffer = await workbook.xlsx.writeBuffer()
  saveAs(new Blob([buffer]), `Inventario_Global_${new Date().toISOString().slice(0,10)}.xlsx`)
}

  /**
   * EXPORTAR A PDF (ELEGANTE)
   */
  const exportToPDF = () => {
    try {
      const doc = jsPDF({ orientation: 'landscape' })
      const title = "REPORTE CONSOLIDADO DE INVENTARIO GLOBAL"
      const date = new Date().toLocaleString()

      // 1. Definimos las cabeceras (Lo que te faltaba definir)
      // Extraemos los labels de las columnas que definiste en loadData()
      const columnsHead = columns.value.map(col => col.label)

      // 2. Definimos el cuerpo de la tabla
      const rowsBody = rows.value.map(row =>
        columns.value.map(col => {
          const val = row[col.field]
          // Si es una columna de stock (sucursal o total), lo tratamos como número
          // para aplicar los "Smart Decimals" (quitar ceros innecesarios)
          if (col.name.startsWith('sucursal') || col.name === 'total') {
            return val !== undefined ? Number(val) : 0
          }
          return val || ''
        })
      )

      // 3. Diseño Estético del Documento
      doc.setFontSize(18)
      doc.setTextColor(25, 118, 210) // Azul Primario
      doc.text(title, 14, 20)

      doc.setFontSize(10)
      doc.setTextColor(100)
      doc.text(`Fecha de emisión: ${date}`, 14, 28)

      // 4. Generación de la Tabla
      autoTable(doc, {
        startY: 35,
        head: [columnsHead], // Aquí usamos la variable definida arriba
        body: rowsBody,    // Aquí usamos la variable definida arriba
        theme: 'grid',
        headStyles: {
          fillColor: [25, 118, 210],
          halign: 'center',
          fontSize: 9,
          fontStyle: 'bold'
        },
        styles: {
          fontSize: 8,
          cellPadding: 2
        },
        columnStyles: {
          0: { fontStyle: 'bold', cellWidth: 'auto' } // Nombre del producto
        },
        // Resaltado de stock crítico
        didParseCell: function(data) {
          if (data.section === 'body' && typeof data.cell.raw === 'number' && data.cell.raw <= 0) {
            data.cell.styles.textColor = [200, 0, 0]
            data.cell.styles.fontStyle = 'bold'
          }
        }
      })

      // 5. Descarga
      doc.save(`Inventario_Global_${new Date().toISOString().slice(0,10)}.pdf`)

    } catch (error) {
      console.error("Error al generar PDF:", error)
      $q.notify({
        color: 'negative',
        message: 'No se pudo generar el PDF. Revise la consola.',
        icon: 'report_problem'
      })
    }
  }

  onMounted(loadData)
</script>
